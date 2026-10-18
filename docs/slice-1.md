# Slice 1 — Development infrastructure and PgQue integration

Date: 2026-10-18. Scope: local synthetic development only. No execution inbox, worker leases, job handlers, watchdog, or benchmark result exists yet.

## A. What we built

A runnable TypeScript CLI installs and verifies pinned PgQue, provisions a new demo queue, runs a bounded ticker/maintenance loop, and exercises publish/receive/ack. A dedicated Docker Compose PostgreSQL 17.11 instance is healthy on localhost port 55432. Real PostgreSQL tests cover migration integrity, transaction rollback, concurrency, visibility, restart, overflow, permissions, and rotation. All 45 tests in the final local run passed; that count includes 32 integration cases and 13 unit cases, not 45 distributed-worker tests.

## B. Why we designed it this way

One package and explicit `pg` queries keep the transaction connection visible. PostgreSQL arbitrates migration and scheduler concurrency with transaction advisory locks; process-local flags are insufficient. Versioned SQL and a checksum ledger reject changed applied migrations and modified vendor bytes. We kept the application in TypeScript because this slice coordinates database operations; whether Node CPU/GC limits throughput is a future measurement, not an assumption of unlimited scale.

PgQue source behavior was tested instead of replaced. A bare concurrent receive/ack race reproducibly raises upstream `P0001`; tests now characterize its exact failure and prove the approved separate-statement advisory gate avoids it. No upstream SQL was patched.

## C. Architecture changes

```text
Local CLI migrate -> one-client migration transaction -> pinned PgQue + ledger
                  -> new-queue-only bootstrap; missing existing consumer fails

Synthetic producer COMMIT -> gated ticker COMMIT
                         -> receive + validate + ack COMMIT

Scheduler -> per-operation advisory gate -> ticker / maint / retry / step2
                                         each in its own committed transaction
```

These are foundation and test paths. The future dispatcher must still implement atomic inbox staging; smoke acknowledgment is not an execution engine.

## D. Database changes

`public.pghelm_migration` is the only pgHelm table: `name` primary key, `sha256` with a 64-lowercase-hex constraint, and `applied_at`. Its primary-key index supports exact migration identity checks. The entire pending migration set and ledger writes share one checked-out connection, advisory lock, and transaction; failure rolls all of them back. Each applied migration inserts once; reruns read the ledger without status updates. Its row count follows migration count, so it is not a per-job write path.

The unchanged vendored PgQue installer creates upstream schemas/functions/tables/roles, and CLI bootstrap creates a synthetic queue/subscription through public functions. PgQue owns their storage semantics. Test-only sink/probe tables exist exclusively in disposable containers. No proposed seven-table execution schema was installed. PgQue cursor/queue updates and event/index/WAL costs remain; no bloat reduction is claimed.

## E. File changes

- `package.json`, `pnpm-lock.yaml`, `.node-version`: exact runtime/package pins and commands.
- `tsconfig.json`, `tsconfig.build.json`, `eslint.config.js`, `vitest.config.ts`: strict type checking, lint, build, sequential fixture execution.
- `.gitignore`, `.gitattributes`, `.env.example`: local settings, ignored secrets/builds, canonical vendor bytes.
- `src/config.ts`, `src/db.ts`: validated local CLI configuration, bounded pools/timeouts, same-client transaction handling.
- `src/migrate.ts`, `migrations/0001-version.sql`: checksummed installation/ledger, PostgreSQL/PgQue version and autovacuum requirements.
- `src/cli.ts`, `src/ticker.ts`, `src/smoke.ts`: CLI lifecycle, serialized scheduler, guarded bootstrap, validated synthetic smoke.
- `vendor/pgque/pgque.sql`, `LICENSE`, `NOTICE`, `SHA256SUMS`: exact release installer and attribution/integrity files.
- `infra/compose.yaml`, `.github/workflows/ci.yml`: dedicated pinned database and CI gates.
- `tests/integration/migrations.test.ts`, `pgque.test.ts`, `lifecycle.test.ts`; `tests/unit/config.test.ts`, `vendor.test.ts`: executable evidence.
- `README.md`, `AGENTS.md`, `docs/slice-0.md`, `docs/review-log.md`, this report, and `docs/evidence/slice-1-*.json`: instructions, scope, review dispositions and observed results.

Runtime dependencies: `pg`, Zod, Pino. Development dependencies: TypeScript, Node/pg types, Vitest, Testcontainers PostgreSQL, ESLint and typescript-eslint. No workspace framework, ORM, SDK wrapper, Redis, UI, or tracing stack was added.

## F. Tests actually executed

Final local gates after regression repairs:

| Command | Observed result | Exit | Establishes |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | Existing pinned lockfile installs | 0 | Dependency reproducibility on this machine |
| `pnpm typecheck` | No diagnostics | 0 | Strict type checking |
| `pnpm lint` | No diagnostics | 0 | Configured lint rules |
| `pnpm build` | Emitted CLI/runtime JavaScript | 0 | Build succeeds |
| `pnpm run test --reporter=verbose --reporter=json --outputFile.json=test-results/final.json` | 5 files, **45/45 passed**, Vitest duration **35.84s** | 0 | Assertions described below; duration is not a benchmark |
| `pnpm db:migrate` | Migrations verified; queue/consumer preserved | 0 | Actual compiled CLI rerun |
| `pnpm smoke` | `sourceId=4005`, `received=1`, committed receive/ack log | 0 | Actual compiled end-to-end smoke; sequence gaps are expected |
| `docker compose ... exec -T postgres psql ...` | PostgreSQL 17.11, PgQue 0.2.2; fsync/synchronous_commit/full_page_writes/autovacuum all on | 0 | Runtime version/durability settings |
| `git diff --check` | No whitespace errors | 0 | Diff hygiene |

The initial full-test command used `pnpm test --outputFile.json=...`; pnpm rejected that flag before running tests (exit 1). Corrected both CI and the executed command to `pnpm run test ...`. The failure is retained in the command evidence.

Acceptance mapping: S1-01 migrations tests plus vendor integrity units; S1-02 through S1-08 PgQue integration cases, plus compiled CLI missing-consumer regression; S1-09 rotation/lock conflict and actual two-scheduler lifecycle cases; S1-10 distinct database login roles, timeout/pool reuse and local configuration tests. Controlled races observe PostgreSQL blocking relationships before releasing barriers. Backend termination tests reconnect to inspect rollback. No mocked lock tests substitute for PostgreSQL.

Raw machine-readable results are in `docs/evidence/slice-1-tests.json`; commands and observed output are in `docs/evidence/slice-1-commands.json`. Fresh independent Claude inspection status is recorded in `docs/review-log.md`. CI configuration exists; this local report does not imply a GitHub-hosted run passed.

## G. Failure audit

- **Upstream behavior demonstrated:** two bare consumer connections racing receive/ack can produce `P0001` missing-tick after the first commits. The losing transaction rolls back; a fresh transaction recovers. The explicit dispatch gate prevents that interleaving in tests. Future dispatcher integration is still required.
- **Fixed after failing regression:** CLI migration could recreate a lost consumer on an existing queue. It now errors without recreating the cursor.
- **Fixed after failing regression:** JSON parsing errors could expose malformed payload text. Smoke now emits a fixed error and leaves the batch replayable.
- **Fixed after failing regression:** default 1s operation lock timeout made a longer concurrent migration fail. Migration/bootstrap set local 15s lock and 30s statement budgets; waiting beyond those bounds still fails safely.
- **Fixed after failing regression:** queue configuration accepted names longer than PgQue's 57-byte maximum.
- **Installation issue fixed:** locally generated checksum manifest had CRLF bytes; canonical LF bytes match the checked-out Git artifact. Hash verification was not weakened.
- **Review claim rejected with source and test evidence:** `force_next_tick` does not insert a tick; its final pinned override only advances the event sequence and returns the existing tick ID.

All ten engine invariants remain obligations for later slices. This slice provides transaction primitives and PgQue behavior evidence, not stale-worker fencing, crash-safe job execution, safe execution retention, or scaling proof. No long held-xmin test or benchmark was run. The trusted local demo admin login is not a production role configuration. Cross-database concurrent installers remain unsupported because PgQue creates cluster-global roles.

## H. What you should understand

**Commit order differs from ID order:** A can allocate ID10 and pause while B commits ID11; the test consumes B and later consumes A. A numerical source-ID watermark would miss A.

**A transaction is a durable boundary:** test sink insertion and acknowledgment either both commit or both roll back. Successful empty receive must also commit because PgQue may have internally finished an empty window.

**Locks and snapshots interact:** the consumer race requires a separate lock-acquisition statement before receive. The next statement then obtains its snapshot after the application gate is held. Merely waiting somewhere inside receive is not equivalent.

## I. How to verify it yourself

From the repository, follow README's install/Compose/migrate/smoke commands. Then run:

```powershell
pnpm typecheck
pnpm lint
pnpm build
pnpm run test --reporter=verbose
```

Expect five passing files and 45 tests on the reviewed snapshot. Docker must be available; integration setup fails visibly otherwise. Existing development data stays in the named Compose volume. Tests create and stop their own containers; no `down -v` is required. A running ticker is optional for smoke because smoke explicitly ticks its queue.

## J. Current project status

- **Complete locally:** authorized Slice 1 infrastructure, CLI and required test paths.
- **Tested locally:** 45 assertions, typecheck/lint/build, pinned database runtime and compiled CLI smoke.
- **Review:** Codex QA findings repaired; Claude plan approved. Fresh code-inspection outcome is appended to the review log before final handoff.
- **Deferred:** execution inbox, distributed workers, fencing, retries, watchdog, metrics stack, benchmark harness/results, production deployment.
- **Approval gate:** stop before Slice 2; user review is still required.

## K. Next slice proposal

Slice 2 adds the approved durable inbox/receipt schema and transactional dispatcher: gate, receive complete batch, validate/quarantine each event, stage unique source identities, verify acknowledgment, commit. Expected paths: a new versioned SQL migration, `src/dispatcher.ts`, narrowly scoped validation/types, CLI dispatcher role, integration fault/replay tests and documentation. It must implement the source-generation binding, source-conflict checks, stable poison-batch identity and error-classification obligations in the revised architecture. No worker execution yet.

**STOP — Awaiting approval for the next slice.**
