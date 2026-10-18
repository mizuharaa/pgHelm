# Slice 0 review history

Append-only dispositions and evidence. This log reports review coverage; approval of a design is not runtime proof or user authorization for Slice 1.

## 2026-10-18 — Setup

- Host/coordinator/builder: Codex. Scope: Slice 0 documents only.
- Independent architecture reviewer: Claude through installed Claudex Loop 2.1.0 runner, configured CLI model (no override requested).
- Source auditor: separate Codex subagent in `C:\Users\Khang\pw\pghelm-source-audit`.
- Claude worktree: `C:\Users\Khang\pw\pghelm-claude-qa`.
- Plan: `docs/slice-0.md`. Log: `docs/review-log.md`.
- Maximum plan rounds: 5. Future implementation repair rounds: 2; final inspection rounds: 2. Inspection is on.
- Baseline: `4a813ec` (documentation scope and build-entry Ponytail contract).
- Ponytail applies at every build/repair/review entry. No executable build hooks exist in Slice 0.
- User authorized repository creation, isolated agents, commits through implement skill, and Slice 0. Private GitHub repo created and linked. No authorization inferred for Slice 1.
- Model identity, result path, plan hash, findings, dispositions and final checks will be appended when observed. Raw CLI diagnostics stay outside Git.

## 2026-10-18 — Source audit and two-axis review of 2a787ae

User selected baseline `4a813ec291e19b7dc29b4832db0592f2e558a655`. Reviewed `git diff 4a813ec...2a787ae`; commit list: `2a787ae docs: propose PgQue worker architecture and Slice 1 proof gates`.

### Standards

Independent Codex source/standards agent in the source-audit worktree found no procedural scope violation or warranted code-smell finding. One material model inconsistency: the proposed job-to-shard FK takes KEY SHARE, which conflicts with the proposed FOR UPDATE coordination lock despite the assertion that dispatch takes no shard locks. Disposition: **accepted**; use FOR NO KEY UPDATE only while referenced shard keys remain immutable, document implicit FK locks, and require a two-connection compatibility test in Slice 3. This is a design correction, not a runtime-reproduced bug.

The source audit checked final definitions in pinned `sql/pgque.sql`: receive 5342–5383, normal subscription lock/reuse 5766/5802–5804, final ack 5906–5932, registration 1840–1876, snapshot selection 325–429, ticker thresholds 734–789, maintenance 5254–5310, rotation horizon/NOWAIT 909–946, separate step2 974–985, native retries 5417–5454, cooperative warnings 6664–6677. No DB tests executed.

### Spec

Independent Codex spec agent in `C:\Users\Khang\pw\pghelm-spec-audit` found all substantive Slice 0 deliverables present, no unauthorized scaffolding, and runtime claims appropriately unverified. Two reporting gaps in that snapshot: explicit command exit codes absent; observed Claude review evidence pending. Disposition: **accepted**; append executed probe results below and actual Claude result after completion. These findings do not authorize Slice 1.

Counts at reviewed snapshot: Standards 1 material model issue; Spec 2 reporting gaps. Findings are kept on separate axes. The code-review skill's issue-tracker setup is absent in this new repo; the supplied master prompt is the spec source. `/setup-matt-pocock-skills` can establish tracker integration for later ticket-based work; it is not needed to locate this spec.

Additional coordinator checks: Windows autocrlf changed installer bytes, so distinguish canonical LF Git-blob hash from local CRLF checkout hash. Also constrain engine order sequence to CACHE 1 NO CYCLE, allocated only inside serialized dispatch; cross-session sequence caching would otherwise break the proposed numeric progress ordering. Both corrections require review of the revised plan.

## 2026-10-18 — Executed final environment probes

Raw local evidence: `C:\Users\Khang\tmp\pghelm-slice0-probes.json`. All entries below were rerun and exit codes observed against documentation commit 2a787ae; no runtime application tests exist.

| Command | Exit | Observed output |
|---|---|---|
| `git --version` | 0 | git version 2.55.0.windows.3 |
| `gh --version` | 0 | gh version 2.100.0 (2026-09-03) |
| `node --version` | 0 | v24.21.0 |
| `pnpm --version` | 0 | 9.15.9 |
| `docker version --format '{{.Server.Version}}'` | 0 | 29.7.2 |
| `docker compose version` | 0 | Docker Compose version v5.5.1 |
| `psql --version` | 0 | psql (PostgreSQL) 18.6 |
| `python --version` | 0 | Python 3.14.7 |
| `git -C C:\Users\Khang\pgHelm diff --check 4a813ec...HEAD` | 0 | No whitespace errors |
| `git -C C:\Users\Khang\pgHelm status --short` | 0 | Empty at 2a787ae |
| `gh repo view mizuharaa/pgHelm --json url,isPrivate,defaultBranchRef` | 0 | private=true; main; https://github.com/mizuharaa/pgHelm |

Exploratory command corrections: initial `git rev-parse` from home correctly failed because home is not a repo; initial repo lookup correctly reported pgHelm absent. One diagnostic read used the artifact parent instead of its generated child directory and failed; corrected to `claudex-pz01_t4r`. One Python `-c` checksum probe hit Windows argument-quote stripping; rerun via literal stdin succeeded. None is an engine test failure or a claimed pass.

## 2026-10-18 — Claude round 1: REVISE

Runner result: `C:\Users\Khang\tmp\pghelm-claudex-review-1\claudex-pz01_t4r\result.json`. Completed, exit 0, verdict REVISE; observed model `claude-opus-5-5`, CLI 2.1.302; no requested model override and no permission denials. Session `4029ba4b-0a33-423d-8a8c-0a8193944c49`. Reviewed QA-worktree plan SHA256 `0044cbeec7e2577e0811b1d73f03f8330565f5ee44d8b131802ea58480c3c997d`, commit 2a787ae. Reviewer source coverage and limitations are preserved in the full response below.

Host dispositions, all accepted as corrections or focused tests:

| Finding | Disposition |
|---|---|
| F1 malformed installer/image digests | Corrected transcription errors; recorded canonical LF plus actual CRLF hash. Re-ran registry inspection, parsed exact digest, asserted 64 hex chars. Raw image metadata at `C:\Users\Khang\tmp\pghelm-postgres-image-inspect.txt`. |
| F2 FK KEY SHARE / FOR UPDATE conflict | Changed coordination to NO KEY UPDATE on immutable referenced keys; one shard per TX; added compatibility test and future multi-shard lock order. Independently accepted by Codex standards re-review. |
| F3 possible EvalPlanQual joined-tick error | Source-derived hypothesis, not established defect. Added separate-statement transaction advisory gate before receive; characterize bare API race and prove gated behavior in S1-08. No blanket retry of corruption errors. |
| F4 deterministic poison-batch stall | Explicit preclassification of existing and within-batch identities and jsonb-incompatible strings; quarantine expected malformed events; bounded same-batch deterministic failure halts visibly. Added Slice 2 cases. |
| F5 sequence caching | CACHE 1 NO CYCLE, forbid preallocation/reseed, metadata and reconnect/order tests. Independently accepted by standards re-review. |
| F6 maintenance admin power | Explicit trusted pgque_admin maintenance principal and separated credentials; documented least-privilege exception. Avoided adding four wrappers before demonstrated need. S1-10 checks actual powers. |
| F7 advisory locks don't span databases | Same-client single-transaction migrations; one fixture DB per suite/container; cross-database installer tests sequential; concurrent installer test same DB only. |
| F8 rotation silently skips conflict | Correct S1-09 to assert return 0/unchanged overdue rotation; separate lock-timeout test on queue-row waiting path. |
| F9 pending review/probe records | Explicit exit-code probe table and this observed review record now exist. |
| F10 acquisition scan stalls | Bounded candidate discovery uses NO KEY UPDATE SKIP LOCKED, fresh-time revalidation and one shard/TX; owned-shard transitions keep bounded waiting. |

Additional observed document check: Python stdin assertions exited 0 and printed `PASS: documentation-only tracked files; A-K sections; 10 Slice 1 gates; balanced code fences; local Markdown links resolve`. This establishes artifact structure only, not design correctness. Reviewer identified real hash transcription errors despite the underlying tool probes succeeding; source/provenance claims must be checked byte-for-byte.

### Full Claude round 1 response

```json
{
  "verdict": "REVISE",
  "summary": "I checked the plan against the pinned PgQue v0.2.2 checkout, and most of its PgQue claims match the source. These hold: receive/ack/finish_batch semantics, the 54000 overflow error, NULL disabling the ceiling, rejection of zero or negative limits, the empty-batch auto-finish, register_consumer_at starting at the latest tick, snapshot-based batch membership, maint() skipping step 2 and VACUUM, a separate maint_retry_events schedule, and the ticker's NOTIFY. The commit SHA also matches .git/shallow and the v0.2.2 tag.\n\nThe plan still needs revision. Both recorded pins are malformed. Several mechanisms the plan relies on behave differently from what it assumes:\n- FK locks conflict with the proposed shard row locks.\n- A second concurrent dispatcher can hit an EvalPlanQual recheck that raises an error.\n- A deterministic constraint failure can stall the batch for good.\n- The job-order sequence needs to be pinned to CACHE 1.\n- The maintenance role has full PgQue admin rights.\n- Advisory locks only apply within one database.\n- Rotation lock conflicts are skipped silently.\n\nNone of this is a fundamental flaw in the architecture; each item can be fixed in the document before approval.",
  "findings": [
    {
      "id": "F1-pin-digests-malformed",
      "severity": "high",
      "path": "docs/slice-0.md",
      "evidence": "Lines 17â€“18. The PgQue installer SHA256 `0e33130bâ€¦49c3772` is 63 hex characters (the regex `0e33130b[0-9a-f]{55}` matches, so 8+55=63). The postgres image digest `sha256:3645570câ€¦b038826` is 65 hex characters (`sha256:[0-9a-f]{64}` followed by a backtick does not match). A valid SHA-256 is exactly 64 characters, so neither value can be what was actually measured. The plan nonetheless says 'Hash measured on downloaded release checkout', and S1-01 ('installer hash match') and Testcontainers 'uses exact image digest' depend on these values. As written, Slice 1 would either fail or be 'fixed' by re-measuring whatever was downloaded, which defeats the point of a pin.",
      "fix": "Re-run Get-FileHash and `docker buildx imagetools inspect`, then paste the complete 64-character values. Add a format check (64 hex characters) to SHA256SUMS and to the config loader. Record the raw command output in review-log.md."
    },
    {
      "id": "F2-fk-keyshare-vs-shard-for-update",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "Section D says `job` will get a 'shard FK once shard schema exists', and ADR-002 says to 'Acquire `SELECT ... FOR UPDATE` on the shard' and that 'dispatch does not take shard locks'. In PostgreSQL, an FK INSERT runs an RI check that takes FOR KEY SHARE on the referenced shard row, and FOR UPDATE conflicts with FOR KEY SHARE. So the dispatch transaction, while holding the PgQue consumer lock, blocks behind any worker finalizing that shard. In the other direction, worker start/finish/renewal blocks until the whole multi-event dispatch transaction commits. If any transition locks more than one shard (an acquire of C shards, or a watchdog scan), it can deadlock against dispatch, which takes KEY SHARE in batch order rather than shard-ID order. This contradicts the stated lock order and lets a dispatch stall turn into lease-renewal failures.",
      "fix": "Use `SELECT ... FOR NO KEY UPDATE` (or plain UPDATE of non-key columns) for every shard transition. FOR NO KEY UPDATE does not conflict with FK KEY SHARE. Alternatively, drop the jobâ†’shard FK and validate shard_id with a CHECK against the fixed range. State that multi-shard transitions lock shards in ascending shard_id order. Add a Slice 3 test where dispatch inserts into a shard that a worker holds."
    },
    {
      "id": "F3-concurrent-dispatcher-epq-error",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "PgQue's next_batch_custom (pgque.sql:5727â€“5766) runs `SELECT ... FROM subscription s ... LEFT JOIN tick t1 ON t1.tick_id = s.sub_last_tick ... FOR UPDATE OF s` under READ COMMITTED. Take dispatcher D2 blocked behind D1, where D1 then acks (sub_last_tick Xâ†’Y) and commits. D2's EvalPlanQual recheck pairs the new s row with the already-fetched t1 row for tick X. The join condition fails, the left join null-extends, prev_tick_id is NULL, and the function raises 'PgQ corruption: Consumer â€¦ does not see tick' (line 5798â€“5799). That is source-derived reasoning and has not been run. If it holds, S1-08's expectation that the 'second sees correct batch' is wrong, and the plan's claim that a concurrent replica simply 'serializes' misses that the waiter gets an alarming error.",
      "fix": "Before calling receive, take `pg_advisory_xact_lock(<queue/consumer key>)` in the dispatch transaction. It is transaction-scoped, so there is no session-affinity problem, and receive's statement snapshot is then taken after the previous dispatcher has committed. Otherwise, document the error and classify it as retryable. Change S1-08 to assert one of exactly two allowed outcomes, with no duplicate sink rows in either case."
    },
    {
      "id": "F4-deterministic-poison-batch-stall",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "Section G allows 'Every source gets durable accepted/duplicate/quarantine disposition **or entire TX rolls back**'. If classification relies on constraint errors (a UNIQUE scope/key or job_id violation, two events with the same key in one batch inserted as one multi-row statement, a CHECK failure, invalid UTF-8 or a jsonb cast error), the rollback is deterministic. PgQue then redelivers the same batch (sub_last_tick did not move), and the consumer is stuck permanently. The plan only describes stall handling and an operator path for oversized batches.",
      "fix": "Require classification before any write: look up existing source and job identities, dedupe within the batch in memory, and parse or validate in the application before inserting. Constraint violations then act as assertions, not as the classifier. Alternatively, use a per-event savepoint that turns a deterministic error into a quarantine row. Alert when the same batch_id is retried N times. Add Slice 2 tests for duplicate keys within one batch and for invalid encoding."
    },
    {
      "id": "F5-ingest-seq-sequence-cache",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "ADR-002: 'One transaction commits before the next can allocate job orderâ€¦ usable for a progress cursor.' If ingest_seq comes from a sequence with CACHE > 1, each session (a reconnected dispatcher, an accidental replica) pre-reserves a block of numbers. Session S1 could cache 1â€“10, then S2 commits 11, then S1 later commits 4. A worker whose progress has passed 11 seeks `ingest_seq > progress` and silently skips job 4, i.e. loses work. The plan never pins the sequence's cache or says how the number is allocated.",
      "fix": "Require `CACHE 1` (and no CYCLE) on the ingest_seq sequence, plus a migration test that checks pg_sequences.cache_size = 1. Alternatively, allocate from a single counter row updated inside the dispatch transaction. Add an invariant test that ingest_seq commit order equals numeric order across a dispatcher reconnect."
    },
    {
      "id": "F6-maintenance-role-is-pgque-admin",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "pgque.sql:4824/4832 revokes EXECUTE from PUBLIC and grants every function only to pgque_admin. maint_rotate_tables_step2 and maint_retry_events are not SECURITY DEFINER ('need admin access'). The ticker/maintenance role therefore has to be pgque_admin, which inherits reader and writer, has ALL on every pgque table and sequence, and can publish, ack, unsubscribe or reposition the dispatcher's consumer, and modify subscription rows directly. S1-10 promises distinct least-privilege producer/consumer/maintenance roles, but the plan does not say that the maintenance role is effectively all-powerful over PgQue.",
      "fix": "Document that the maintenance role equals pgque_admin, or add narrow SECURITY DEFINER wrappers (fixed search_path, owned by the installer) for ticker(), maint(), maint_retry_events() and maint_rotate_tables_step2(), granted to a dedicated scheduler role without pgque_admin membership. Make S1-10 assert that the scheduler role cannot call send/ack/subscribe/unsubscribe or write to pgque.subscription."
    },
    {
      "id": "F7-advisory-lock-database-scoped",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Section K: 'transaction advisory lock for competing migration invocations', 'Each test gets an isolated database', and 'Serialize cluster-role installation where necessary'. Advisory lock tags include the database OID, so locks taken in different per-test databases never conflict. The PgQue installer's `create role pgque_*` (pgque.sql:4704â€“4715) runs cluster-wide, and concurrent installs can race on pg_authid. The plan also lets the installer run under a separate `psql` process, which would not hold the runner client's transaction advisory lock.",
      "fix": "Serialize role creation with a lock held in a fixed shared database (such as `postgres`), or pre-create the roles once per container before tests run in parallel. Require the installer to execute on the same client and transaction that holds the migration lock."
    },
    {
      "id": "F8-rotation-conflict-silently-skipped",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "S1-09 expects to 'force a test-only maintenance conflict and prove configured lock timeout yields visible failure'. maint_rotate_tables_step1 (pgque.sql:940â€“947) runs `lock table â€¦ nowait`/TRUNCATE and, on lock_not_available, returns 0 without error. Step 1 also returns 0 when a slow consumer is still on the old table (line 924â€“925). The main rotation conflict therefore never reaches lock_timeout and produces no visible failure.",
      "fix": "Rewrite S1-09 to expect a silent skip and to detect it through rotation-state monitoring (an alert on how far queue_switch_time + rotation_period has fallen behind). Keep lock_timeout assertions for the paths that really wait (the queue row FOR UPDATE and the tick DELETE)."
    },
    {
      "id": "F9-review-log-claim-unbacked",
      "severity": "low",
      "path": "docs/review-log.md",
      "evidence": "slice-0.md Section F says 'Fresh final probes record explicit exit codes in the review log', and Section J points to review-log.md for review status. review-log.md (lines 1â€“16) contains only setup notes; there are no probe commands, outputs, exit codes, plan hash or findings.",
      "fix": "Append the actual probe commands with their exit codes and the plan SHA256 to review-log.md before asking for approval, or reword Section F so it does not claim records that do not exist yet."
    },
    {
      "id": "F10-acquisition-scan-blocking",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "ADR-002 requires `SELECT ... FOR UPDATE` by shard ID with no time predicate, and the shard row says 'scan fixed shard set initially'. When several workers or watchdogs scan the 64 shards, each one waits in turn behind any shard row currently locked by finalization, recovery or (per F2) dispatch. That adds head-of-line latency for acquisition and recovery, which the bounded-pool claims in Slice 6 do not account for.",
      "fix": "For candidate discovery, use `FOR NO KEY UPDATE SKIP LOCKED` (scan, skip locked rows, then recheck with clock_timestamp() under the lock). Keep blocking locks only for transitions on a specific shard the worker already owns."
    }
  ],
  "coverage": [
    "Read the whole plan (docs/slice-0.md as supplied), plus AGENTS.md, README.md and docs/review-log.md in the review worktree.",
    "Confirmed the PgQue pin: C:\\Users\\Khang\\tmp\\pghelm-pgque-v0.2.2\\.git\\shallow and packed-refs (tag v0.2.2 points to dff3a906â€¦).",
    "Inspected pinned sql/pgque.sql: receive/ack/nack (5342â€“5477), next_batch_custom override (5657â€“5882), finish_batch override (5884â€“5934), register_consumer(_at) (1753â€“1879), batch_event_sql/get_batch_events (311â€“442, 2178â€“2214), ticker variants (655â€“824, 5127â€“5193), maint_retry_events/rotate step1/step2/maint_operations/tables_to_vacuum (826â€“1123), maint() (5254â€“5311), start() scheduling (4234â€“4314), ticker_loop (4140â€“4205), roles and grants (4700â€“4858), table DDL for tick/subscription (120â€“184), create_queue (1422â€“1511), dlq_replay (4982â€“5059), coop experimental comments (6658â€“6674), subscribe/unsubscribe wrappers (6964â€“6980).",
    "Checked the length and format of every hash and digest in the plan with regex.",
    "Confirmed the main checkout's origin remote in C:\\Users\\Khang\\pgHelm\\.git\\config.",
    "Confirmed that upstream LICENSE and NOTICE exist for the vendoring plan."
  ],
  "limitations": [
    "I could not run commands, so I did not recompute the installer SHA256, inspect the registry image digest, or check GitHub repo visibility. F1 rests only on value length and format.",
    "The EvalPlanQual outcome in F3 and the lock conflicts in F2 come from reading PostgreSQL semantics and the source; none of them was run against PG17.",
    "I did not look at the PgQue website docs, the external blog sources, or the upstream TypeScript client.",
    "No code, migrations or tests exist yet, so implementation-level findings are not possible. This review covers design and spec fidelity only.",
    "I did not review the cooperative-consumer code in depth beyond confirming it is marked experimental, since the plan excludes it from v1."
  ]
}
```

## 2026-10-18 - Claude round 2: REVISE; original ten findings closed

Result: `C:\Users\Khang\tmp\pghelm-claudex-review-2\claudex-fl7szk7v\result.json`. Exit 0; same session and observed model `claude-opus-5-5`. Reviewed commit 07dd8ef. Authoritative round-2 plan SHA256: `82d74599dff54cf51b8b852e615cca53cfa025b446c7d47f55bbd47e524ac0ff`.

R2-N1 accepted: PostgreSQL jsonb equality over original text is canonical; never JS reserialization. Savepoints quarantine expected conversion errors; exact-number and key-order/whitespace tests specified. Initial handler uses text; numeric schemas must declare exact-number handling.

R2-N2 accepted: earlier manually transcribed round-1 hash is erroneous historical text, superseded by this machine-copied binding. Authoritative round-1 plan SHA256: `0044cbeec7e2577e0811b1d73f03f8330565f5ee44d8b131802ea58480c3c97d`. Both actual result hashes pass a 64-hex assertion.

R2-N3 accepted: the earlier embedded round-1 response was incorrectly decoded with the Windows locale. Preserve it as historical evidence under this append-only log; the corrected authoritative JSON below supersedes that damaged copy. Both new responses are decoded explicitly as UTF-8 and serialized with ASCII escapes, preserving exact Unicode values.

R2-N4 accepted: Section I now includes a bytes-preserving Python subprocess hash command; Section F distinguishes checkout vs canonical hashes. Slice 1 plans .gitattributes with vendor/pgque/pgque.sql -text.

R2-N5 accepted: tests sharing a fixture DB run sequentially, use queue-specific ticker calls except explicit global tests, and stop background ticker/clients between tests. Test-internal connections remain deliberately concurrent for races.

### Corrected authoritative full Claude round 1 response

```json
{
  "verdict": "REVISE",
  "summary": "I checked the plan against the pinned PgQue v0.2.2 checkout, and most of its PgQue claims match the source. These hold: receive/ack/finish_batch semantics, the 54000 overflow error, NULL disabling the ceiling, rejection of zero or negative limits, the empty-batch auto-finish, register_consumer_at starting at the latest tick, snapshot-based batch membership, maint() skipping step 2 and VACUUM, a separate maint_retry_events schedule, and the ticker's NOTIFY. The commit SHA also matches .git/shallow and the v0.2.2 tag.\n\nThe plan still needs revision. Both recorded pins are malformed. Several mechanisms the plan relies on behave differently from what it assumes:\n- FK locks conflict with the proposed shard row locks.\n- A second concurrent dispatcher can hit an EvalPlanQual recheck that raises an error.\n- A deterministic constraint failure can stall the batch for good.\n- The job-order sequence needs to be pinned to CACHE 1.\n- The maintenance role has full PgQue admin rights.\n- Advisory locks only apply within one database.\n- Rotation lock conflicts are skipped silently.\n\nNone of this is a fundamental flaw in the architecture; each item can be fixed in the document before approval.",
  "findings": [
    {
      "id": "F1-pin-digests-malformed",
      "severity": "high",
      "path": "docs/slice-0.md",
      "evidence": "Lines 17\u201318. The PgQue installer SHA256 `0e33130b\u202649c3772` is 63 hex characters (the regex `0e33130b[0-9a-f]{55}` matches, so 8+55=63). The postgres image digest `sha256:3645570c\u2026b038826` is 65 hex characters (`sha256:[0-9a-f]{64}` followed by a backtick does not match). A valid SHA-256 is exactly 64 characters, so neither value can be what was actually measured. The plan nonetheless says 'Hash measured on downloaded release checkout', and S1-01 ('installer hash match') and Testcontainers 'uses exact image digest' depend on these values. As written, Slice 1 would either fail or be 'fixed' by re-measuring whatever was downloaded, which defeats the point of a pin.",
      "fix": "Re-run Get-FileHash and `docker buildx imagetools inspect`, then paste the complete 64-character values. Add a format check (64 hex characters) to SHA256SUMS and to the config loader. Record the raw command output in review-log.md."
    },
    {
      "id": "F2-fk-keyshare-vs-shard-for-update",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "Section D says `job` will get a 'shard FK once shard schema exists', and ADR-002 says to 'Acquire `SELECT ... FOR UPDATE` on the shard' and that 'dispatch does not take shard locks'. In PostgreSQL, an FK INSERT runs an RI check that takes FOR KEY SHARE on the referenced shard row, and FOR UPDATE conflicts with FOR KEY SHARE. So the dispatch transaction, while holding the PgQue consumer lock, blocks behind any worker finalizing that shard. In the other direction, worker start/finish/renewal blocks until the whole multi-event dispatch transaction commits. If any transition locks more than one shard (an acquire of C shards, or a watchdog scan), it can deadlock against dispatch, which takes KEY SHARE in batch order rather than shard-ID order. This contradicts the stated lock order and lets a dispatch stall turn into lease-renewal failures.",
      "fix": "Use `SELECT ... FOR NO KEY UPDATE` (or plain UPDATE of non-key columns) for every shard transition. FOR NO KEY UPDATE does not conflict with FK KEY SHARE. Alternatively, drop the job\u2192shard FK and validate shard_id with a CHECK against the fixed range. State that multi-shard transitions lock shards in ascending shard_id order. Add a Slice 3 test where dispatch inserts into a shard that a worker holds."
    },
    {
      "id": "F3-concurrent-dispatcher-epq-error",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "PgQue's next_batch_custom (pgque.sql:5727\u20135766) runs `SELECT ... FROM subscription s ... LEFT JOIN tick t1 ON t1.tick_id = s.sub_last_tick ... FOR UPDATE OF s` under READ COMMITTED. Take dispatcher D2 blocked behind D1, where D1 then acks (sub_last_tick X\u2192Y) and commits. D2's EvalPlanQual recheck pairs the new s row with the already-fetched t1 row for tick X. The join condition fails, the left join null-extends, prev_tick_id is NULL, and the function raises 'PgQ corruption: Consumer \u2026 does not see tick' (line 5798\u20135799). That is source-derived reasoning and has not been run. If it holds, S1-08's expectation that the 'second sees correct batch' is wrong, and the plan's claim that a concurrent replica simply 'serializes' misses that the waiter gets an alarming error.",
      "fix": "Before calling receive, take `pg_advisory_xact_lock(<queue/consumer key>)` in the dispatch transaction. It is transaction-scoped, so there is no session-affinity problem, and receive's statement snapshot is then taken after the previous dispatcher has committed. Otherwise, document the error and classify it as retryable. Change S1-08 to assert one of exactly two allowed outcomes, with no duplicate sink rows in either case."
    },
    {
      "id": "F4-deterministic-poison-batch-stall",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "Section G allows 'Every source gets durable accepted/duplicate/quarantine disposition **or entire TX rolls back**'. If classification relies on constraint errors (a UNIQUE scope/key or job_id violation, two events with the same key in one batch inserted as one multi-row statement, a CHECK failure, invalid UTF-8 or a jsonb cast error), the rollback is deterministic. PgQue then redelivers the same batch (sub_last_tick did not move), and the consumer is stuck permanently. The plan only describes stall handling and an operator path for oversized batches.",
      "fix": "Require classification before any write: look up existing source and job identities, dedupe within the batch in memory, and parse or validate in the application before inserting. Constraint violations then act as assertions, not as the classifier. Alternatively, use a per-event savepoint that turns a deterministic error into a quarantine row. Alert when the same batch_id is retried N times. Add Slice 2 tests for duplicate keys within one batch and for invalid encoding."
    },
    {
      "id": "F5-ingest-seq-sequence-cache",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "ADR-002: 'One transaction commits before the next can allocate job order\u2026 usable for a progress cursor.' If ingest_seq comes from a sequence with CACHE > 1, each session (a reconnected dispatcher, an accidental replica) pre-reserves a block of numbers. Session S1 could cache 1\u201310, then S2 commits 11, then S1 later commits 4. A worker whose progress has passed 11 seeks `ingest_seq > progress` and silently skips job 4, i.e. loses work. The plan never pins the sequence's cache or says how the number is allocated.",
      "fix": "Require `CACHE 1` (and no CYCLE) on the ingest_seq sequence, plus a migration test that checks pg_sequences.cache_size = 1. Alternatively, allocate from a single counter row updated inside the dispatch transaction. Add an invariant test that ingest_seq commit order equals numeric order across a dispatcher reconnect."
    },
    {
      "id": "F6-maintenance-role-is-pgque-admin",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "pgque.sql:4824/4832 revokes EXECUTE from PUBLIC and grants every function only to pgque_admin. maint_rotate_tables_step2 and maint_retry_events are not SECURITY DEFINER ('need admin access'). The ticker/maintenance role therefore has to be pgque_admin, which inherits reader and writer, has ALL on every pgque table and sequence, and can publish, ack, unsubscribe or reposition the dispatcher's consumer, and modify subscription rows directly. S1-10 promises distinct least-privilege producer/consumer/maintenance roles, but the plan does not say that the maintenance role is effectively all-powerful over PgQue.",
      "fix": "Document that the maintenance role equals pgque_admin, or add narrow SECURITY DEFINER wrappers (fixed search_path, owned by the installer) for ticker(), maint(), maint_retry_events() and maint_rotate_tables_step2(), granted to a dedicated scheduler role without pgque_admin membership. Make S1-10 assert that the scheduler role cannot call send/ack/subscribe/unsubscribe or write to pgque.subscription."
    },
    {
      "id": "F7-advisory-lock-database-scoped",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Section K: 'transaction advisory lock for competing migration invocations', 'Each test gets an isolated database', and 'Serialize cluster-role installation where necessary'. Advisory lock tags include the database OID, so locks taken in different per-test databases never conflict. The PgQue installer's `create role pgque_*` (pgque.sql:4704\u20134715) runs cluster-wide, and concurrent installs can race on pg_authid. The plan also lets the installer run under a separate `psql` process, which would not hold the runner client's transaction advisory lock.",
      "fix": "Serialize role creation with a lock held in a fixed shared database (such as `postgres`), or pre-create the roles once per container before tests run in parallel. Require the installer to execute on the same client and transaction that holds the migration lock."
    },
    {
      "id": "F8-rotation-conflict-silently-skipped",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "S1-09 expects to 'force a test-only maintenance conflict and prove configured lock timeout yields visible failure'. maint_rotate_tables_step1 (pgque.sql:940\u2013947) runs `lock table \u2026 nowait`/TRUNCATE and, on lock_not_available, returns 0 without error. Step 1 also returns 0 when a slow consumer is still on the old table (line 924\u2013925). The main rotation conflict therefore never reaches lock_timeout and produces no visible failure.",
      "fix": "Rewrite S1-09 to expect a silent skip and to detect it through rotation-state monitoring (an alert on how far queue_switch_time + rotation_period has fallen behind). Keep lock_timeout assertions for the paths that really wait (the queue row FOR UPDATE and the tick DELETE)."
    },
    {
      "id": "F9-review-log-claim-unbacked",
      "severity": "low",
      "path": "docs/review-log.md",
      "evidence": "slice-0.md Section F says 'Fresh final probes record explicit exit codes in the review log', and Section J points to review-log.md for review status. review-log.md (lines 1\u201316) contains only setup notes; there are no probe commands, outputs, exit codes, plan hash or findings.",
      "fix": "Append the actual probe commands with their exit codes and the plan SHA256 to review-log.md before asking for approval, or reword Section F so it does not claim records that do not exist yet."
    },
    {
      "id": "F10-acquisition-scan-blocking",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "ADR-002 requires `SELECT ... FOR UPDATE` by shard ID with no time predicate, and the shard row says 'scan fixed shard set initially'. When several workers or watchdogs scan the 64 shards, each one waits in turn behind any shard row currently locked by finalization, recovery or (per F2) dispatch. That adds head-of-line latency for acquisition and recovery, which the bounded-pool claims in Slice 6 do not account for.",
      "fix": "For candidate discovery, use `FOR NO KEY UPDATE SKIP LOCKED` (scan, skip locked rows, then recheck with clock_timestamp() under the lock). Keep blocking locks only for transitions on a specific shard the worker already owns."
    }
  ],
  "coverage": [
    "Read the whole plan (docs/slice-0.md as supplied), plus AGENTS.md, README.md and docs/review-log.md in the review worktree.",
    "Confirmed the PgQue pin: C:\\Users\\Khang\\tmp\\pghelm-pgque-v0.2.2\\.git\\shallow and packed-refs (tag v0.2.2 points to dff3a906\u2026).",
    "Inspected pinned sql/pgque.sql: receive/ack/nack (5342\u20135477), next_batch_custom override (5657\u20135882), finish_batch override (5884\u20135934), register_consumer(_at) (1753\u20131879), batch_event_sql/get_batch_events (311\u2013442, 2178\u20132214), ticker variants (655\u2013824, 5127\u20135193), maint_retry_events/rotate step1/step2/maint_operations/tables_to_vacuum (826\u20131123), maint() (5254\u20135311), start() scheduling (4234\u20134314), ticker_loop (4140\u20134205), roles and grants (4700\u20134858), table DDL for tick/subscription (120\u2013184), create_queue (1422\u20131511), dlq_replay (4982\u20135059), coop experimental comments (6658\u20136674), subscribe/unsubscribe wrappers (6964\u20136980).",
    "Checked the length and format of every hash and digest in the plan with regex.",
    "Confirmed the main checkout's origin remote in C:\\Users\\Khang\\pgHelm\\.git\\config.",
    "Confirmed that upstream LICENSE and NOTICE exist for the vendoring plan."
  ],
  "limitations": [
    "I could not run commands, so I did not recompute the installer SHA256, inspect the registry image digest, or check GitHub repo visibility. F1 rests only on value length and format.",
    "The EvalPlanQual outcome in F3 and the lock conflicts in F2 come from reading PostgreSQL semantics and the source; none of them was run against PG17.",
    "I did not look at the PgQue website docs, the external blog sources, or the upstream TypeScript client.",
    "No code, migrations or tests exist yet, so implementation-level findings are not possible. This review covers design and spec fidelity only.",
    "I did not review the cooperative-consumer code in depth beyond confirming it is marked experimental, since the plan excludes it from v1."
  ]
}
```

### Full Claude round 2 response

```json
{
  "verdict": "REVISE",
  "summary": "All ten round-1 findings are closed in this revision.\n- **F1:** each of the three digests on lines 17\u201318 is now exactly 64 hex characters. I could not recompute them myself.\n- **F2:** shard locks now use FOR NO KEY UPDATE with immutable shard keys, and there is a test for schema changes that would upgrade the lock mode.\n- **F3:** the plan now takes a separate-statement `pg_try_advisory_xact_lock` gate before receive, and S1-08 first characterizes the ungated race instead of assuming its outcome. PgQue itself uses no advisory locks, so the reserved key cannot collide with it. The underlying EvalPlanQual behavior is still unverified.\n- **F4:** events are classified before insert, with a halt after three failures on the same batch.\n- **F5:** the ingest sequence is CACHE 1 NO CYCLE.\n- **F6:** the maintenance login is documented as a trusted pgque_admin principal, with no least-privilege claim.\n- **F7:** installation runs on the same client inside the lock, and cross-database installs run one at a time.\n- **F8:** S1-09 now expects the NOWAIT skip to return 0.\n- **F9:** the probe table with exit codes is now in the review log.\n- **F10:** candidate discovery uses SKIP LOCKED, one shard per transaction.\n\nThe corrections introduced one medium defect: the new application-side envelope comparison has no defined equality rule, so two payloads that actually differ can be merged as duplicates. The other new findings are low: an error in the review-log provenance record, mojibake in the archived response, verification commands that still give only the checkout-dependent hash, and test isolation when tests share a fixture database. All are small edits to the documents.",
  "findings": [
    {
      "id": "R2-N1-lossy-envelope-equality",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "Section C (added for F4) says to 'parse/validate in the application, compare bounded existing-identity lookups' and that an 'equal canonical envelope maps to the same job', while a 'differing\u2026 payload is quarantined'. Nothing defines what equality means. If the comparison runs on JavaScript values from JSON.parse, numbers beyond 2^53 collapse together: payloads {\"amount\":9007199254740993} and {\"amount\":9007199254740992} compare equal, so a conflicting producer retry is linked as a verified duplicate instead of being quarantined. That breaks Invariant 2 without any error. The same thing happens if the stored jsonb is written by re-serializing the parsed object, which also loses precision. PostgreSQL jsonb, by contrast, compares numerics exactly and treats key order and whitespace as insignificant, so application and database equality can disagree in both directions.",
      "fix": "Define envelope equality as PostgreSQL jsonb equality. Pass the raw text as a parameter cast with `$n::jsonb` (never `JSON.stringify` of a parsed object) and compare it to the stored payload in SQL. Alternatively, require a lossless parser and canonicalizer in the application. Add a Slice 2 case where two envelopes differ only beyond 2^53, and another where they differ only in key order or whitespace."
    },
    {
      "id": "R2-N2-review-log-plan-hash-malformed",
      "severity": "low",
      "path": "docs/review-log.md",
      "evidence": "Line 58 records the reviewed plan as SHA256 `0044cbeec7e2577e0811b1d73f03f8330565f5ee44d8b131802ea58480c3c997d`. That is 65 hex characters: grep for ``SHA256 `[0-9a-f]{64}` `` finds nothing. The round-1 hash supplied to the reviewer was `\u20260c3c97d`. This is the same transcription error as F1, in the record meant to tie the review to the exact plan bytes. Line 75 itself says provenance must be checked byte for byte.",
      "fix": "Paste the round-1 plan SHA256 copied directly from the tool output, and record this round's hash (82d74599\u2026) the same way. Add the 64-hex check already proposed for SHA256SUMS to the document-structure check that printed PASS."
    },
    {
      "id": "R2-N3-archived-response-mojibake",
      "severity": "low",
      "path": "docs/review-log.md",
      "evidence": "The section 'Full Claude round 1 response' (lines 79\u2013171) contains `\u00e2\u20ac\u201c`, `\u00e2\u20ac\u00a6`, `\u00e2\u2020\u2019` and `X\u00e2\u2020\u2019Y` where the original had en dashes, ellipses and arrows. UTF-8 was decoded as CP1252 and then saved again, so the archive is not the exact response that was received, even though the log claims to include the 'full prior response'.",
      "fix": "Write the result.json content into the log as UTF-8 without transcoding (for example, in PowerShell use Get-Content -Encoding utf8 or copy the raw bytes), or link to the raw file with its SHA256 rather than re-embedding it."
    },
    {
      "id": "R2-N4-verification-commands-checkout-hash",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Line 17 makes the canonical pin the Git-blob LF hash (`1f96dde1\u2026`, from `git show HEAD:sql/pgque.sql`). Section F still lists only `Get-FileHash ...\\sql\\pgque.sql` with 'Exact hash listed above', and Section I's self-verification runs `(Get-FileHash ...pgque.sql).Hash` while expecting the 'exact PgQue pin/hash'. On disk that command returns the CRLF checkout hash. Its value depends on the reader's core.autocrlf setting, and it never reproduces the canonical pin that Slice 1 will vendor.",
      "fix": "Add the canonical-hash command to Sections F and I: hash the bytes of `git -C <checkout> show HEAD:sql/pgque.sql` without passing them through PowerShell string conversion, or use `git cat-file blob` piped to a file and then Get-FileHash. Label the Get-FileHash result as checkout-dependent. Slice 1 should add `.gitattributes` with `vendor/pgque/pgque.sql -text` so that the 'enforce LF' requirement holds in pgHelm's own Windows checkouts."
    },
    {
      "id": "R2-N5-shared-fixture-db-global-functions",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Section K now uses 'one migrated fixture database and per-test isolated queues' per suite. Several functions the tests use act on every queue at once. `pgque.ticker()` with no argument ticks all queues (pgque.sql:798\u2013823), and `maint_rotate_tables_step2()` updates every queue (983\u2013985). The dispatch gate is a single 'reserved pair of integer keys for this one pipeline'. If tests sharing a database run concurrently (for example, Vitest's concurrent mode), a global ticker() call from one test inserts ticks on another test's queue and moves the batch boundaries that S1-03/S1-05 rely on. Gated S1-08 tests could also contend on the same advisory key, and that contention would look like the gate's 'false/backoff' result.",
      "fix": "In tests, call `pgque.ticker(queue_name)` or `force_tick(queue_name)` for the test's own queue, and derive the dispatch gate key from the queue or pipeline name. Run tests that need the global ticker() or step2 sequentially, or in their own database. State that tests within a shared fixture database do not run concurrently unless they avoid these global functions."
    }
  ],
  "coverage": [
    "Read the revised plan (as supplied; hash 82d74599\u2026) and the current docs/review-log.md in full, including the host dispositions and the archived round-1 response.",
    "Checked digest formats with regex: the installer canonical hash, the installer CRLF hash and the image digest in slice-0.md are each exactly 64 hex characters; the review-log plan hash is 65.",
    "Checked each F1\u2013F10 disposition against the revised text: ADR-002 (gate, CACHE 1, NO KEY UPDATE, SKIP LOCKED), Section C (preclassification and the halt after three failures), ADR-003 (pgque_admin trust), Section K (same-client install, database scope of advisory locks, S1-08/S1-09/S1-10).",
    "Re-inspected the pinned pgque.sql: no advisory-lock use anywhere (so no key collision with the gate); the no-argument ticker() acts on all queues (798\u2013823); step2 updates all queues (983\u2013985); earlier inspections of next_batch_custom, finish_batch, rotation and grants are still valid."
  ],
  "limitations": [
    "I could not run commands, so I did not recompute the canonical LF hash, the CRLF hash or the registry image digest. Only their format was checked. The coordinator's raw evidence files under C:\\Users\\Khang\\tmp were not opened.",
    "F3's EvalPlanQual behavior, and whether the advisory gate prevents it, remain source-derived; S1-08 is the planned runtime check.",
    "Lock-mode compatibility (NO KEY UPDATE versus FK KEY SHARE) and SKIP LOCKED behavior are based on PostgreSQL documentation and have not been executed.",
    "No code, migrations or tests exist, so this is a design and spec review only. I did not re-examine external web sources."
  ]
}
```
