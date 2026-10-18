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

## 2026-10-18 - Claude round 3: APPROVED (design only)

Result: `C:\Users\Khang\tmp\pghelm-claudex-review-3\claudex-_m_er8js\result.json`. Completed, exit 0; observed model `claude-opus-5-5`; same reviewer session. Reviewed commit `21a9481`. Authoritative reviewed plan SHA256: `fd07fd7b587ed46cc60179ffb0b04b3775cfc8d0dffa9fd9a545f8ffc0157311`.

All ten round-1 and five round-2 findings are closed. No unresolved material design defect reported. Three low-priority clarifications are accepted as mandatory inputs to the Slice 2 plan, not runtime-verified fixes:

- R3-N1: identify recurring poison batches by stable tick window or source-event set, not newly allocated batch_id. Test three rollbacks with changing batch IDs and stable halt key. The reviewer corrected its own round-1 suggestion.
- R3-N2: confirm an explicit expected-conversion SQLSTATE allowlist on PG17, including malformed JSON/Unicode, numeric range and deep nesting. Timeouts, serialization/deadlock, resource exhaustion and connection errors roll back the entire batch; never quarantine merely because infrastructure failed.
- R3-N3: validation savepoints contain only casts/comparisons/lookups. Release or roll back and release each savepoint before top-level receipt/job INSERTs; verify no subtransaction overflow at maximum batch size.

Rounds used: 3 of 5. Source audit and Standards/Spec reviews were independent read-only Codex agents in separate worktrees; final architecture review was Claude. No application build occurred, so no implementation inspection or runtime-test approval is claimed. The reviewed plan file remains unchanged after approval; only this evidence log is appended. Plan approval is bound to the QA worktree path/hash. A later implementation must validate approval in its chosen build checkout; user permission for Slice 1 is still required.

### Full Claude round 3 response

```json
{
  "verdict": "APPROVED",
  "summary": "Round-2 findings R2-N1 through R2-N5 are all closed.\n- **R2-N1:** Section C now defines envelope equality as PostgreSQL jsonb equality over the original text bound as `$n::jsonb`, and forbids storing or comparing a JS reserialization. Expected conversion errors are caught by per-event savepoints, and the tests cover differences beyond 2^53 and key-order/whitespace equivalence.\n- **R2-N2:** review-log.md lines 175 and 179 now record 64-hex plan hashes for round 2 (`82d74599\u2026`) and round 1 (`\u20260c3c97d`). The old 65-character value is explicitly kept as superseded history, which fits an append-only log.\n- **R2-N3:** the corrected round-1 copy and the new round-2 copy are ASCII-escaped JSON with no mojibake. The 14 non-ASCII lines that remain are the superseded historical copy.\n- **R2-N4:** Section F separates the checkout-dependent hash from the canonical one, and Section I adds a byte-preserving Python subprocess hash. Section K plans `vendor/pgque/pgque.sql -text` in .gitattributes. The three pins and Section I's expected value are each 64 hex characters.\n- **R2-N5:** tests that share a fixture database are explicitly sequential and use per-queue `ticker(queue_name)`.\n\nRound-1 F1\u2013F10 stay closed. F3's EvalPlanQual behavior is still unverified, by design, until S1-08.\n\nThe corrections introduced no material defects. I found three low-severity gaps in the new poison-batch and savepoint text, all one-sentence clarifications.\n- **Batch identity:** the halt after three same-batch failures should be keyed by tick window, not batch_id. My own round-1 fix suggested batch_id, which was wrong: PgQue assigns a new batch_id on every rolled-back retry.\n- **Expected errors:** the set of conversion errors that quarantine needs to be stated explicitly.\n- **Read-only savepoints:** savepoints should do no writes, to avoid subtransaction overflow.\n\nNone of these affects the architectural decision, so approval does not need another round. They can go into the Slice 2 plan.\n\nAll runtime properties remain UNVERIFIED, as the plan states. This approval covers the design only and does not authorize Slice 1. That decision is the user's.",
  "findings": [
    {
      "id": "R3-N1-same-batch-key-not-batch-id",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Section C says 'after three consecutive same-batch failures stop polling that pipeline'. A rolled-back dispatch never retries under the same batch_id: next_batch_custom allocates `batch_id := nextval('pgque.batch_id_seq')` (pgque.sql:5863), sequences are non-transactional, and the `sub_batch` UPDATE (5871\u20135879) is rolled back. Every retry of the same poison tick window therefore gets a new batch_id. If 'same batch' means batch_id (which my round-1 F4 fix wrongly suggested), the counter never reaches three. The pipeline then fails and backs off indefinitely without the intended halt. The window itself is stable: the next tick after `sub_last_tick` is chosen deterministically (5807\u20135824).",
      "fix": "Define batch identity as the tick window `(prev_tick_id, tick_id)` from `pgque.get_batch_info(batch_id)` (pgque.sql:2790\u20132840, granted to pgque_reader at 4770), read in the same transaction before rollback, or as a fingerprint of the received msg_id set. Use the same key to report the 54000 oversize stall. Add a Slice 2 test where a forced failure repeats three times and the halt fires despite three different batch_ids."
    },
    {
      "id": "R3-N2-expected-conversion-sqlstates-unspecified",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Section C: 'roll back that savepoint for expected input conversion errors (including unrepresentable strings and out-of-range numerics)\u2026 Unexpected DB failures still roll back the complete batch' and count toward the halt. Which errors count as expected is never listed. One example is deeply nested JSON: within the payload size bound, the jsonb parser raises stack-depth errors (SQLSTATE 54001) rather than 22P02. If 54001 is not on the allowlist, one trusted producer's legal-sized event halts the whole pipeline instead of being quarantined. A list that is too broad (for example, all class-22/54 codes, or 57014 statement timeout) would quarantine events because of transient database conditions.",
      "fix": "In Slice 2, state an explicit SQLSTATE allowlist for the savepoint, for example 22P02, 22P05, 22003 and 54001 (confirm against PG17 when running). Keep 57014, 40001/40P01, 53xxx and connection errors as whole-batch rollbacks. Add a deep-nesting case to the listed tests."
    },
    {
      "id": "R3-N3-savepoints-should-stay-read-only",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Section C adds 'a per-event savepoint around raw text-to-jsonb validation/comparison', then inserts the quarantine receipt. If any write (a job or receipt INSERT) runs inside a per-event savepoint, each such subtransaction is assigned an XID. A batch of more than 64 written subtransactions overflows the per-backend subxid cache (PGPROC_MAX_CACHED_SUBXIDS = 64), and while the transaction is open, other sessions' snapshots must check pg_subtrans. This is a well-known PostgreSQL performance cliff that a batch ceiling in the hundreds would hit on every dispatch. Read-only savepoints do not get an XID.",
      "fix": "State that per-event savepoints contain only read-only casts, comparisons and lookups. Run all INSERTs (job, accepted, duplicate or quarantine receipts) at the top level after RELEASE or ROLLBACK TO. In Slice 2, assert with pg_stat_activity/pg_stat_get_backend_subxact (PG16+) that subxact_overflowed stays false for a maximum-size batch."
    }
  ],
  "coverage": [
    "Read the revised plan in full (as supplied, SHA256 fd07fd7b\u2026) and checked every R2-N1..N5 disposition against the new text in Sections C, D (`job` row), F, I and K.",
    "Read docs/review-log.md lines 170\u2013340: the round-2 disposition section, the corrected round-1 archive and the round-2 archive. Regex confirmed the authoritative plan hashes on lines 175/179 are 64 hex characters. Non-ASCII content is limited to the superseded historical copy.",
    "Regex confirmed that all digests in slice-0.md (lines 17, 18, 325) are 64 hex characters, and that Section I's expected canonical value matches the pin-table value.",
    "Re-inspected the pinned pgque.sql: batch_id allocation and the sub_batch update in next_batch_custom (5807\u20135879), get_batch_info output and grants (2790\u20132840, 4770). These are the basis for R3-N1.",
    "Checked that round-1 F1\u2013F10 closures still hold in this revision (gate, CACHE 1, NO KEY UPDATE, SKIP LOCKED, pgque_admin trust, same-client install, S1-08/09/10)."
  ],
  "limitations": [
    "I could not run commands. I did not recompute the canonical or CRLF installer hashes or the image digest, run the Section I Python command, or open the coordinator's raw evidence or result.json files. Hash checks are format and consistency only.",
    "The jsonb equality, savepoint, SQLSTATE and subtransaction-overflow points come from PostgreSQL semantics and were not run on PG17. F3's EvalPlanQual behavior remains untested until S1-08.",
    "I did not compare the archived JSON byte for byte against the original result.json files. I relied on the coordinator's stated exact-equality assertion plus visual inspection.",
    "No code, schema or tests exist; this is a design and spec review only."
  ]
}
```

### Final artifact verification

Executed Python stdin assertions confirmed: result is APPROVED with exit 0; reviewed SHA256 is 64 hex characters and matches actual QA-worktree bytes; main and QA Git blobs of docs/slice-0.md are identical. Earlier structure checks confirmed Markdown-only tracked files, A-K sections, ten Slice 1 gates, balanced code fences and resolving local links. Source/image digests were checked against actual Git blob/checkout bytes and registry output. These are documentation/provenance checks, not PostgreSQL tests.

Git push of documentation through 21a9481 exited 0; GitHub API returned 21a9481cc854c8dafd0c21c62fbd394f1e2ad3ca. Final review-log commit and push are verified in the host handoff. No typecheck, lint, integration, chaos, or benchmark result exists in this slice.
Claudex runner check --host codex --repo C:\Users\Khang\pw\pghelm-claude-qa --plan docs/slice-0.md --approval C:\Users\Khang\tmp\pghelm-claudex-review-3\claudex-_m_er8js\result.json: exit 0, observed: Approval matches the current plan. Final document assertions also exited 0.


## Slice 1 plan transfer review, round 1

Host/builder Codex, independent reviewer Claude; requested default model, observed claude-opus-5-5. Baseline 8326969. User Continue and parallel-build instruction authorize Slice 1 only. Additional Codex QA is read-only. Plan rounds max 5; build fix rounds max 2; fresh final inspections max 2. Raw artifacts: `C:\Users\Khang\tmp\pghelm-slice1-plan-review\claudex-kyjb4k99\result.json`. Review was renewed because approval was originally bound to the QA worktree. Implementation preparation overlapped this review; no claim that the earlier path-bound approval covered main.

Full response:

```json
{
  "verdict": "REVISE",
  "summary": "The supplied plan is byte-for-byte the same text as C:\\Users\\Khang\\pgHelm\\docs\\slice-0.md. I re-checked its PgQue claims against the pinned v0.2.2 sql/pgque.sql and they hold:\n- receive wraps next_batch and get_batch_events and raises 54000 on the (limit+1)th row (5342\u20135387).\n- An empty batch is finished automatically.\n- ack calls finish_batch, which returns 1 or 0 (5884\u20135934).\n- The subscription row is locked FOR UPDATE (5766).\n- register_consumer_at starts a new consumer at the latest existing tick and leaves an existing registration where it is (1840\u20131877).\n- maint() skips step2 and vacuum (5273\u20135278).\n- receive, ack and subscribe are granted to the reader role, and send to the writer role.\n- The installer contains no psql meta-commands and no transaction control outside function bodies, so running it on the same client is feasible.\n\nThe design still has material gaps that earlier rounds did not cover:\n- **Concurrent tickers:** PgQue's ticker(queue) takes no lock, and nothing in the plan limits the ticker/maintenance role to one instance across application processes.\n- **Repeated source identity:** the plan does not say what happens when a (source_generation, msg_id) that already has a receipt arrives again, and nothing detects a dropped and recreated queue.\n- **Lost Start commit reply:** the Start-intent transaction has no defined handling when the COMMIT reply is lost, and its stated preconditions omit the active-attempt and eligibility checks.\n\nLower-severity items:\n- The plan does not say that the dispatcher must COMMIT when receive returns no rows.\n- autovacuum is relied on but never asserted.\n- MultiXact cost from the foreign-key KEY SHARE locks combined with shard row updates is not on the measurement list.\n- The Slice 2 obligations from round 3 live only in the review log, while the plan's own text still uses the superseded \"same-batch\" wording.\n- The worktree inventory in the plan is inaccurate.\n\nNone of these needs the architecture rebuilt; each needs plan text and a test before approval.",
  "findings": [
    {
      "id": "S0R4-01-concurrent-ticker-instances",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "ADR-003 puts a ticker role inside 'One application with independent dispatcher, worker, watchdog and ticker roles'. It defaults 'ticker=2' per process, says 'a per-process bound is not a cluster-global connection cap', and C lists 'Parallel worker processes', 'Multiple watchdogs' and 'gated replicas'. The only serialization rule given is 'No overlapping calls for a task', which is per process.\n\nPinned pgque.ticker(text) (694\u2013796) reads pgque.queue with no FOR UPDATE and no advisory lock. It inserts a tick using nextval(queue_tick_seq), and the tick table defaults tick_snapshot to pg_current_snapshot() (line 140). Within that INSERT the snapshot is taken at statement start, before nextval runs, so two tickers in different processes can interleave:\n1. T1 takes snapshot S_early.\n2. T2 takes S_late and gets tick 10.\n3. T1 gets tick 11.\n\nThe tick IDs are now in the opposite order to the snapshots. The consumer reads window 9\u219210 (S_late) and then 10\u219211 (S_early): batch_event_sql's xip branch (378\u2013430) adds txids without a pg_visible_in_snapshot(cur) check. Window 11\u219212 then re-includes events committed between S_early and S_late, so they are delivered twice. This is derived from the source and has not been run, but nothing in the plan rules it out. Upstream pg_cron start() (4258\u20134302) runs exactly one ticker job.",
      "fix": "State that the ticker and maintenance roles are a single active instance per database. Enforce it in the database, not only per process: wrap each ticker(), maint(), maint_retry_events() and step2 call in a pg_try_advisory_xact_lock on a reserved key separate from the dispatch and migration keys, or allow only one designated scheduler process. Add an S1 test that runs two scheduler processes concurrently and asserts that tick_id order matches snapshot order and that no msg_id is delivered twice. Also make the dispatcher tolerate a redelivered msg_id (see S0R4-02)."
    },
    {
      "id": "S0R4-02-existing-source-identity-and-queue-recreation",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "Section C defines dispositions only for 'A new source tuple (source_generation, msg_id)'. The ingress_event row in Section D has PK (source_generation,msg_id) and 'One insert per source event in dispatch TX, including duplicates'. The plan never says what happens when a msg_id that already has a receipt is received again.\n\nThat can happen in three ways:\n- Operator repositioning: register_consumer_at with a tick resets sub_last_tick (1846\u20131854) and is granted to pgque_reader (4794).\n- Duplicate delivery from concurrent tickers (S0R4-01).\n- A queue dropped and recreated while the configured source_generation is unchanged: the new queue gets a new queue_id and a new event sequence, so msg_ids restart.\n\nIf the implementation inserts a receipt, the PK violation rolls back the batch every time and the pipeline halts after three tries (permanent stall). If it treats 'receipt exists' as an already-handled replay and skips the event, the recreated queue's new, distinct events are acked without any job, which silently breaks Invariant 1. Source generation is 'fixed configuration' and nothing detects a recreated queue.",
      "fix": "Add an explicit fourth classification:\n- An existing (generation,msg_id) receipt with an equal raw_type and raw_payload is a verified source replay: insert no new receipt, and log/count it.\n- An existing receipt with a different raw_type or raw_payload is a source-identity conflict: halt and alert, never skip.\n\nPersist the binding between source_generation and PgQue identity (queue_name, queue_id, consumer co_id/sub_id) in pgHelm's schema. At startup, refuse to dispatch if pgque.queue.queue_id or the subscription no longer matches the recorded binding. Add Slice 2 tests for reposition replay, an identity conflict, and a drop/recreate run with a stale generation."
    },
    {
      "id": "S0R4-03-ambiguous-start-intent-and-preconditions",
      "severity": "medium",
      "path": "docs/slice-0.md",
      "evidence": "Section C's Start TX is 'lock shard -> fresh DB time + owner/epoch check -> select first job beyond progress -> append attempt intent + set head -> COMMIT', followed by the handler outside the transaction. The 'Never renew\u2026' paragraph after the timeline covers an ambiguous acquisition COMMIT and an ambiguous completion COMMIT, but not an ambiguous Start COMMIT. The Start preconditions also never require that no unresolved active attempt exists or that next_attempt_at <= clock_timestamp(), even though the shard row carries active_attempt_id and next_attempt_at.\n\nFailure scenario: the Start COMMIT reply is lost, and the worker still owns a valid lease and keeps renewing it.\n- If the worker retries Start and the transition only checks owner and epoch, it inserts attempt N+1 and overwrites active_attempt_id. Attempt N is left with no outcome, which breaks 'One engine result per start', and an extra budget unit is burned.\n- If the worker instead runs the handler although the COMMIT actually failed, the external effect happens with no attempt record and no budget consumed, and Finish is rejected.\n\nA watchdog cannot help in either case because the lease is valid. A Start that ignores next_attempt_at would also skip the retry backoff.",
      "fix": "Generate attempt_id on the client and make the Start transition idempotent on it. After an ambiguous COMMIT, read back attempt/shard.active_attempt_id by that attempt_id before running the handler or retrying Start. In the locked Start validation, require active_attempt_id IS NULL (or an already-recorded outcome) and next_attempt_at IS NULL OR <= clock_timestamp(). Add Slice 4 tests for a lost Start-commit reply in both outcomes, and for a Start attempted before next_attempt_at."
    },
    {
      "id": "S0R4-04-empty-receive-must-commit",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "pgque.receive auto-finishes an empty batch inside the caller's transaction (5380\u20135383), and it returns zero rows both when no batch is ready and when the batch was empty. The Section C dispatch flow only says 'require result=1 for a nonempty batch', and ADR-003 says 'sleep after empty polls'. The gate-failure path says to 'end the empty transaction' but does not say how. If an implementation rolls back on zero rows, the empty tick window is never finished. next_batch_custom (5807\u20135824) always picks the first tick after sub_last_tick, so the consumer stays on that empty window and later non-empty windows are never delivered. Idle-period ticks make empty windows common. S1-02 tests PgQue's auto-finish but not the dispatcher's commit behaviour.",
      "fix": "State that a dispatch transaction that got the gate and received zero rows must COMMIT; a ROLLBACK is allowed only on error or when the gate was not obtained. Add a Slice 2 dispatcher test: an empty tick window followed by a non-empty one must deliver the later events and advance sub_last_tick."
    },
    {
      "id": "S0R4-05-autovacuum-assumption-unasserted",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Section B notes that 'maint() deliberately skips rotation step 2 and VACUUM'. pgque.maint_tables_to_vacuum (1007\u20131010) returns nothing when autovacuum is on, and maint() skips 'vacuum' entries regardless (5277\u20135278). ADR-003 schedules no VACUUM. Every 100 ms tick and every dispatch updates pgque.subscription, pgque.queue and pgque.tick, and every renewal updates pgHelm's shard rows. Their bloat control therefore depends entirely on autovacuum, which the plan never requires or checks. If a deployment disables autovacuum, nothing vacuums these hot tables.",
      "fix": "Make autovacuum=on (and reasonable per-table autovacuum settings for shard and the PgQue hot tables, if needed) a startup assertion and an S1-09/S1-01 check. Alternatively, schedule explicit VACUUM of the tables returned by maint_tables_to_vacuum, outside any transaction, when autovacuum is off."
    },
    {
      "id": "S0R4-06-multixact-cost-unmeasured",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "ADR-002 deliberately pairs dispatch's FK KEY SHARE on shard rows with workers' FOR NO KEY UPDATE and UPDATEs on the same rows: renewal every 5 s, plus every Start and Finish. When a dispatch transaction holds KEY SHARE on a shard row that a worker updates, or the reverse, PostgreSQL stores a MultiXact in xmax. A batch that touches most shards, combined with continuous renewals, makes this routine. Risk 4 and Slice 6/7 measure 'tables/indexes/TOAST, coordinator churn, identity growth, maintenance and WAL' but not MultiXact member growth, SLRU contention or multixact freeze age.",
      "fix": "Add MultiXact metrics (pg_stat_slru for MultiXact, mxid_age(datminmxid/relminmxid) on shard) to the Slice 3 compatibility test and the Slice 6/7 measurements. Record as an ADR-002 alternative replacing the job\u2192shard FK with a CHECK on the fixed shard_id range, since shard rows are never deleted."
    },
    {
      "id": "S0R4-07-round3-obligations-only-in-log",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "docs/review-log.md (lines 345\u2013349) accepts R3-N1, R3-N2 and R3-N3 as 'mandatory inputs to the Slice 2 plan':\n- R3-N1: key poison-batch detection on the tick window, not batch_id.\n- R3-N2: an explicit SQLSTATE allowlist.\n- R3-N3: read-only savepoints.\n\nThe log also says 'The reviewed plan file remains unchanged.' Section C of the plan still says 'after three consecutive same-batch failures', which R3-N1 says is wrong because each retry gets a new batch_id from nextval (5863). AGENTS.md line 5 tells implementers to 'Read docs/slice-0.md before project work' and does not mention these log-only obligations. An implementer who follows the plan alone will build a halt counter that never fires.",
      "fix": "Fold R3-N1, R3-N2 and R3-N3 into the plan text (or a referenced Slice 2 obligations section) before user approval, then re-bind the review hash. Alternatively, have AGENTS.md and Section J explicitly require reading the review-log obligations."
    },
    {
      "id": "S0R4-08-worktree-inventory-inaccurate",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Sections A and E list only two worktrees: source-audit and Claude-QA at C:\\Users\\Khang\\pw\\pghelm-source-audit and C:\\Users\\Khang\\pw\\pghelm-claude-qa. The repository also has .git/worktrees/pghelm-spec-audit (gitdir C:/Users/Khang/pw/pghelm-spec-audit/.git, branch refs/heads/review/spec), and review-log.md line 30 says the spec agent used it. Section I's verification ('git worktree list') will show three worktrees, which does not match the documented setup inventory.",
      "fix": "List the spec-audit worktree and its branch in Sections A and E, or remove it if it is no longer needed and record that."
    }
  ],
  "coverage": [
    "Read the whole of C:\\Users\\Khang\\pgHelm\\docs\\slice-0.md and compared it with the supplied plan: the text is identical. I did not recompute the SHA256 because I cannot run commands.",
    "Read docs/review-log.md in full (setup, rounds 1\u20133, the R3 obligations, final verification), plus AGENTS.md and README.md.",
    "Listed the repository files and .git/worktrees, which showed a third worktree (pghelm-spec-audit) and the review branches.",
    "Pinned PgQue sql/pgque.sql read directly:\n- receive/ack/nack and their grants (5341\u20135477)\n- next_batch_custom override (5657\u20135882) and finish_batch (5884\u20135934)\n- next_batch(2) (2011\u20132034)\n- register_consumer/register_consumer_at (1753\u20131879)\n- batch_event_sql (311\u2013442)\n- ticker(text) and ticker() (694\u2013824)\n- external ticker (5127\u20135193)\n- rotate step1 tail and step2 (880\u2013988)\n- maint_tables_to_vacuum and maint_operations (990\u20131123)\n- start() pg_cron schedule (4234\u20134314)\n- role creation and grants (4699\u20134858)\n- maint() (5254\u20135311)\n- send overloads (6795\u20136834) and subscribe/unsubscribe (6964\u20136980)\n- tick table DDL (136\u2013143)",
    "Grepped the installer for transaction control, psql meta-commands, CONCURRENTLY, VACUUM and CREATE EXTENSION outside function bodies: none found, apart from a COMMIT inside the ticker_loop procedure body.",
    "Confirmed that sql/pgque-api/receive.sql (the plan's nack link target) exists in the pinned checkout."
  ],
  "limitations": [
    "I could not run commands. I did not recompute the plan SHA256, the canonical or CRLF installer hashes, or the image digest; I did not run Section I; and I did not query GitHub or Docker.",
    "S0R4-01 (inverted tick snapshots and duplicate delivery from concurrent tickers) and the MultiXact behaviour in S0R4-06 come from reading the source and PostgreSQL semantics. Neither was run against PG17.",
    "I did not open the coordinator's raw evidence files under C:\\Users\\Khang\\tmp (probe JSON, result.json files), the QA, spec-audit or source-audit worktree contents, or the external web sources.",
    "I did not re-review the cooperative-consumer code, DLQ replay or maint_retry_events internals beyond confirming the plan excludes them from v1.",
    "No application code, schema or tests exist, so this is a design and spec-fidelity review only. No test results are claimed."
  ]
}
```

Dispositions: 01 accepted scheduler transaction gate and replica tests; 02/03 accepted as mandatory Slice 2/4 protocol clarifications without implementing those slices; 04 accepted explicit empty-receive commit rule; 05 accepted autovacuum prerequisite; 06 accepted measurement requirement, retain FK until separately approved; 07 folded log-only obligations into plan; 08 corrected worktree inventory. Scheduler-inversion mechanism remains source-derived, not reproduced. All current plan clarifications are appended to docs/slice-0.md.


## Slice 1 plan transfer review, round 2

Raw result: `C:\Users\Khang\tmp\pghelm-slice1-plan-review-2\claudex-vg0wg1o1\result.json`. Verdict REVISE. All prior eight plan findings closed. Full response:

```json
{
  "verdict": "REVISE",
  "summary": "At plan level, all eight round-4 findings are closed by the \"Review clarifications accepted during Slice 1 preparation\" section. AGENTS.md now points implementers to that section and to the review log.\n- **S0R4-01 (concurrent tickers):** closed. Every scheduler operation now takes a per-operation try-lock on (1346848837,3) in a separate statement. src/ticker.ts:9-15 implements it, and lifecycle.test.ts covers the lock loser and two scheduler loops running together.\n- **S0R4-05 (autovacuum):** closed. runTicker refuses to start unless autovacuum=on (src/ticker.ts:24-25).\n- **S0R4-02, -03 and -04 (replay and source binding, ambiguous Start, empty-receive commit) and R3-N1..N3:** correctly recorded as Slice 2 and Slice 4 obligations. The Slice 1 smoke receive path already commits when receive returns zero rows.\n- **S0R4-06 (MultiXact):** accepted as a measurement obligation, with the FK kept for now.\n- **S0R4-07 (round-3 obligations only in the log):** closed through the clarifications section and the updated AGENTS.md.\n- **S0R4-08 (worktree inventory):** closed by the clarification that lists all three worktrees.\n\nI did not relitigate any of these.\n\nI also traced the Slice 1 code now in the working tree (src/, tests/) against the plan's Slice 1 obligations. One material defect remains: the `migrate` CLI command silently re-subscribes a missing consumer at every run, which contradicts the plan's missing-consumer rule. Lower-severity issues:\n- Smoke ticks the queue outside the new scheduler lock.\n- The default lock_timeout turns competing migrations into failures rather than serialized runs.\n- Sections J and the scope line still describe pre-authorization status.",
  "findings": [
    {
      "id": "S0R5-01-migrate-silently-recreates-consumer",
      "severity": "medium",
      "path": "src/cli.ts",
      "evidence": "src/cli.ts:19-25 makes `migrate` (the planned routine `pnpm db:migrate` step) always run `pgque.create_queue($1)` and then `pgque.subscribe($1,$2)` in a committed transaction. The code comment says 'normal startup must never recreate a lost cursor', but migrate runs on every deploy, and Slice 2+ will add migrations.\n\nIn the pinned SQL:\n- create_queue returns 0 when the queue already exists (1430\u20131431).\n- subscribe \u2192 register_consumer \u2192 register_consumer_at inserts a new subscription at the latest existing tick when none exists (1860\u20131876).\n\nIf the expected consumer was ever unregistered or lost, the next `migrate` silently recreates it at the current tick and skips every retained, un-dispatched event. The ticker's requireConsumer check then passes. This contradicts Section B ('treat accidental missing consumer as a startup error'), the Section G 'Consumer missing/recreated' row, the 'Critical handoff assessment' ('unsafe if \u2026 an unknown consumer is silently recreated') and S1-07. lifecycle.test.ts only tests requireConsumer and smoke, not the migrate path.",
      "fix": "Separate provisioning from migration: add an explicit `provision` command, or make migrate subscribe only when create_queue returned 1 (the queue was created in this same transaction). If the queue exists but the expected consumer is missing, fail with an operator-action error; recreating must require an explicit flag and be logged. Add an S1-07 test: provision, unsubscribe, rerun migrate, and assert that it fails and that get_consumer_info stays empty."
    },
    {
      "id": "S0R5-02-smoke-ticks-outside-scheduler-lock",
      "severity": "low",
      "path": "src/smoke.ts",
      "evidence": "The clarification requires that 'Scheduler replicas serialize every ticker/maintenance/retry/rotation-step2 call' and that 'No uncoordinated \u2026 external ticker may run alongside this scheduler'. src/smoke.ts:16 still calls `pgque.force_next_tick($1)` directly on the pool, outside schedulerCall's (1346848837,3) lock. force_next_tick inserts a tick through force_tick and ticker (pgque.sql 4688\u20134690). Running `pnpm smoke` against a dev database where `cli ticker` is active therefore produces exactly the uncoordinated concurrent ticking the new lock is meant to exclude. lifecycle.test.ts:39/71 does the same, but there it is test setup.",
      "fix": "Run force_next_tick through schedulerCall (or under the same separate-statement lock in its own transaction). Alternatively, state that smoke must not run while a scheduler is active, and enforce that by taking the lock."
    },
    {
      "id": "S0R5-03-migration-lock-timeout-not-serialize",
      "severity": "low",
      "path": "src/migrate.ts",
      "evidence": "S1-01 requires that 'competing migration starts serialize'. src/migrate.ts:33 uses a blocking `pg_advisory_xact_lock(1346848837, 1)`, but createPool (src/db.ts:10-18) sets session `lock_timeout=1000` by default, and the CLI uses that default. lock_timeout covers heavyweight-lock waits, including advisory locks. A second `migrate` started while the first is applying the multi-thousand-line PgQue installer (or any migration longer than 1 s) therefore fails with SQLSTATE 55P03 instead of waiting. The competing-migration test (migrations.test.ts:96-130) also depends on both waits finishing within 1 s, so it is timing-sensitive.",
      "fix": "In the migration transaction, `SET LOCAL lock_timeout` to a migration-specific bound (or 0, with an outer deadline) before taking the advisory lock. Alternatively, document that a competitor fails fast and change the S1-01 wording. Add a case where the lock holder exceeds the default lock_timeout."
    },
    {
      "id": "S0R5-04-stale-status-sections",
      "severity": "low",
      "path": "docs/slice-0.md",
      "evidence": "Line 3 says 'Slice 1 authorized', and AGENTS.md line 3 agrees. Line 4 still says 'No application, migrations, project containers \u2026 have been created', and Section J (line 332) still says 'Blocked: moving to Slice 1 awaits explicit user architectural approval'. Section E (line 202) still lists two worktrees, although the clarification lists three. The working tree now contains src/, migrations/, tests/, vendor/ and infra/. Someone reading Section J will get the wrong authorization state.",
      "fix": "Change line 4 and Section J to match the authorized Slice 1 state, or label them explicitly as the historical Slice 0 snapshot superseded by the header and clarifications. Align the Section E worktree list."
    }
  ],
  "coverage": [
    "Compared the supplied revision with C:\\Users\\Khang\\pgHelm\\docs\\slice-0.md by grepping the changed header, Section J, Section E and the clarifications section. I did not recompute the SHA256.",
    "Checked each of S0R4-01..08 against the new clarifications section, and read the updated AGENTS.md.",
    "Traced the Slice 1 implementation in the working tree:\n- src/ticker.ts: scheduler lock, autovacuum check, requireConsumer\n- src/migrate.ts: vendor hash and ledger checks, migration lock\n- src/db.ts: pool timeouts, transaction helper\n- src/config.ts\n- src/cli.ts: migrate bootstrap\n- src/smoke.ts: receive/ack and empty-result commit",
    "Read tests/integration/lifecycle.test.ts in full, and migrations.test.ts lines 90\u2013131 (the competing-migration test). Grepped the tests for lock keys, pools and concurrency.",
    "Pinned pgque.sql re-checked:\n- create_queue return values (1422\u20131440)\n- register_consumer_at new-registration path (1860\u20131876)\n- force_next_tick (4688\u20134690)\n- ticker(text) has no queue-row lock (694\u2013796)",
    "Earlier rounds' verification of the pinned PgQue source (receive/ack/next_batch/finish_batch, grants, maintenance) still applies and was not repeated."
  ],
  "limitations": [
    "I could not run commands or tests. Nothing here claims the Slice 1 tests pass, and the lock_timeout behaviour in S0R5-03 is inferred from PostgreSQL semantics and the code, not observed.",
    "The Slice 1 code appears to be an uncommitted build in progress. I reviewed the working tree as it was when read, and it may change.",
    "I did not read tests/integration/pgque.test.ts in full, the unit tests, migrations/0001-version.sql, vendor/pgque/SHA256SUMS bytes, infra/compose.yaml, .github/workflows/ci.yml, or package.json/lockfile versions. I did not open docs/slice-1.md because it is not present.",
    "The Slice 2/4 obligations (replay classification, source binding, ambiguous Start, SQLSTATE allowlist) are design commitments only. No schema exists to check them against."
  ]
}
```

Dispositions: S0R5-01 accepted and reproduced with the actual CLI: the test incorrectly resolved successfully after unsubscribe; subscribe now runs only on newly created queue and existing missing consumer fails. S0R5-02 rejected on pinned-source evidence: force_next_tick delegates to force_tick; final override lines5197-5233 only reads queue, advances event sequence with nextval/setval, and returns existing last tick. It never calls ticker or inserts tick. Added actual no-tick-insert characterization. S0R5-03 accepted; delayed lock-holder test reproduced55P03, migration/bootstrap now set local15s lock/30s statement bounds. S0R5-04 accepted historical labeling and authorization correction. Codex QA also reproduced payload text in JSON.parse error; fixed generic error with batch replay regression.


## Slice 1 plan transfer review, round 3

Raw result: `C:\Users\Khang\tmp\pghelm-slice1-plan-review-3\claudex-rnemoxnd\result.json`. Verdict APPROVED, observed model claude-opus-5-5, same review session `f6eb8e9d-5ba0-44bd-870c-cc49a69b5ebf`. Plan SHA256 `8972fa9d6eb5e980d924e141ba8d202ea9f4838f7c984b3ec442339ff566b4ca`. Runner check printed `Approval matches the current plan.` Full response:

```json
{
  "verdict": "APPROVED",
  "summary": "The round-5 dispositions hold, and I found no remaining material defect in the plan or in the traced Slice 1 bootstrap and migration paths.\n- **S0R5-01 (migrate silently re-subscribes):** closed. src/cli.ts:22-33 now runs bootstrap in its own transaction under the migration advisory lock (1346848837,1), with SET LOCAL lock_timeout 15s and statement_timeout 30s. It subscribes only when `pgque.create_queue` returns 1; per pinned pgque.sql 1430\u20131431, 1 means the queue was created and 0 means it already existed. An existing queue without the expected consumer now throws instead of recreating the cursor. That matches the new clarification and the Section B, Section G and S1-07 missing-consumer rule.\n- **S0R5-02 (smoke ticks outside the scheduler lock):** the rejection is correct. The final pinned `pgque.force_tick` override (5197\u20135238) only validates the queue, bumps `queue_event_seq` with nextval/setval and returns the existing last tick ID. It inserts no tick and does not call ticker(). force_next_tick only delegates to it (4688\u20134690). My earlier finding relied on the superseded description in create_queue's header comment, so it is withdrawn.\n- **S0R5-03 (migration lock timeout):** closed. src/migrate.ts:31-35 sets transaction-local 15s/30s bounds before the advisory lock, so competing migrations wait up to the documented bound and otherwise fail safely. The clarification records this.\n- **S0R5-04 (stale status sections):** closed. The scope line and Section J are now labelled as the historical Slice 0 snapshot. The authorization state matches AGENTS.md.\n\nThe S0R4 and R3 obligations stay as previously recorded later-slice design obligations; I did not relitigate them. Only Slice 1 is authorized. This approval covers the plan and the traced code paths. It is not runtime evidence, and Slice 1 exit still requires the observed S1-01..S1-10 results.",
  "findings": [],
  "coverage": [
    "Checked the revised plan's changed text (status header, historical-scope labelling, Section J, and the new CLI bootstrap/migration-timeout clarification) against the round-5 findings. I did not recompute the SHA256.",
    "Read src/cli.ts and src/migrate.ts in full as they are now in the working tree.",
    "Re-read the final pinned pgque.sql force_tick override (5194\u20135239) to test the S0R5-02 rejection, and re-used the earlier reads of force_next_tick delegation (4688\u20134690), create_queue return values (1422\u20131440) and register_consumer_at (1782\u20131879).",
    "Earlier rounds' review of src/ticker.ts (scheduler lock, autovacuum check), src/db.ts, src/smoke.ts (commit on zero rows), AGENTS.md and lifecycle.test.ts still applies; those files were not reported as changed in this round."
  ],
  "limitations": [
    "I could not run commands or tests. The host's reported CLI regression and lock-barrier reproductions are not independently observed, and no test-pass claim is made.",
    "I did not re-read the updated test files (lifecycle.test.ts and migrations.test.ts) or docs/review-log.md for this round's additions. The host says a separate fresh final code inspection will follow.",
    "Minor non-blocking observation: config.ts accepts queue names up to 63 characters, while pinned create_queue rejects names over 57 bytes. This fails loudly at bootstrap rather than silently.",
    "Later-slice obligations (replay classification, source binding, ambiguous Start, SQLSTATE allowlist, MultiXact measurement) are design commitments only. No schema exists to verify them yet."
  ]
}
```

The low queue-name ceiling observation was reproduced with a failing unit regression and fixed to57 ASCII bytes. Independent Codex QA closed its payload-log finding by inspection after the fixed error/replay test, and reported no remaining findings. Codex QA did not execute the application suite; primary and implementation lanes own the runtime evidence. Fresh Claude code inspection remains required.


## Slice 1 fresh code inspection ? APPROVED

Inspected `8326969..da7968d` in isolated `pghelm-claude-qa`; source was frozen during inspection. Codex authored code and tests; fresh Claude session `dc8cf902-9795-4481-8e1a-78f8d16fcc97`, observed claude-opus-5-5. Raw result: `C:\Users\Khang\tmp\pghelm-slice1-inspect-1\claudex-ecm4dqio\result.json`. No requested model override. Plan review used 3 of5 rounds, fresh inspection used1 of2; no inspection-driven code repair round was needed. The final45-test run executed the source subsequently committed asda7968d; only documentation/evidence was written before that commit.

Full response:

```json
{
  "verdict": "APPROVED",
  "summary": "I found no material correctness, spec-fidelity or security defect in the Slice 1 implementation. Four low-severity issues remain; none blocks the Slice 1 exit criteria, but F1 and F2 should be fixed before Slice 2.\n\nWhat I checked and found correct:\n- **Plan and files:** The plan text matches docs/slice-0.md, and the src/ files I read in this worktree match the diff.\n- **Prior findings:** All earlier dispositions hold.\n  - The CLI bootstrap subscribes only when `create_queue` returns 1, under the migration lock with the 15s lock / 30s statement bounds.\n  - The migration runner runs the installer and the ledger writes in one transaction on one client, after a lock taken in a separate statement. It checks the vendor manifest and bytes before opening a connection.\n  - Every scheduler call takes the try-lock on (1346848837, 3) in a separate statement and commits on its own. Step 2 runs in its own transaction, and startup refuses `autovacuum=off`.\n  - `force_next_tick` only bumps the event sequence; the final pinned `force_tick` override inserts no tick.\n- **Plan coverage:** The tests cover each S1-01..S1-10 criterion: commit inversion, rollback at each boundary, overflow raising 54000, backend termination, the empty-batch rollback/commit, the late subscriber, the bare P0001 race plus the gated recovery, NOWAIT rotation skip plus the queue-row lock timeout, and role separation.\n- **Test counts:** The reported 45 tests (32 integration, 13 unit) match the test sources.\n\nRemaining low-severity issues:\n- **F1:** The `transaction()` helper can report success when PostgreSQL actually rolled back. This is latent today, but matters once Slice 2 adds savepoints.\n- **F2:** Smoke reads from the configured consumer without taking the reserved dispatch gate.\n- **F3:** The Slice 1 report lists commands, such as `pnpm install --frozen-lockfile`, that have no recorded output in the evidence file.\n- **F4:** The lifecycle tests share one queue and depend on running in order.",
  "findings": [
    {
      "id": "S1R-01-commit-on-aborted-tx-reports-success",
      "severity": "low",
      "path": "src/db.ts",
      "evidence": "`transaction()` (src/db.ts:24-37) runs `await client.query('COMMIT')` and returns the result without checking the command tag.\n\nIf a statement inside `work` fails and the callback catches the error and returns normally, the transaction is in the aborted state. PostgreSQL then answers COMMIT with the command tag `ROLLBACK` and sends no ErrorResponse, so node-postgres does not throw. The helper returns as if the work committed.\n\nNo current caller swallows database errors:\n- smoke's try/catch wraps only JSON.parse and Zod.\n- schedulerCall and migrate do not catch.\n\nSo no Slice 1 path is affected. However, the approved Slice 2 design (per-event savepoints that catch conversion errors) is exactly the pattern where one missed `ROLLBACK TO SAVEPOINT` turns into a dispatcher that logs a staged and acked batch which was actually rolled back. The cursor would not advance and the batch would replay, so no data is lost, but the logs would say it succeeded.",
      "fix": "Capture the COMMIT result and throw unless `result.command === 'COMMIT'`, for example: `throw new Error('Transaction was rolled back by the server')`. Add a regression test in migrations.test.ts: inside `work`, catch a failing statement and return normally, then assert that `transaction()` rejects."
    },
    {
      "id": "S1R-02-smoke-receives-without-dispatch-gate",
      "severity": "low",
      "path": "src/smoke.ts",
      "evidence": "`smoke()` (src/smoke.ts:18-31) calls `pgque.receive` and `pgque.ack` on the configured CONSUMER_NAME without first taking `pg_try_advisory_xact_lock(1346848837, 2)` in a separate statement.\n\nThe plan says 'All pgHelm inbox writers obey this gate' and that an uncoordinated consumer of the same subscription must be prevented. README says bare concurrent receive/ack reproducibly raises P0001, and S1-08 demonstrates it.\n\nToday the only protection is the README note 'Run one smoke invocation at a time'. Two overlapping smoke runs (or smoke running beside the future dispatcher on the default `pghelm_demo_consumer`) can recreate the P0001 interleaving from S1-08. The losing transaction rolls back, so this is a liveness and diagnosability problem, not a correctness one.",
      "fix": "In smoke's transaction, take `SELECT pg_try_advisory_xact_lock(1346848837, 2)` as a separate statement before receive. If it returns false, commit or roll back the empty transaction and poll again. Alternatively, run smoke on a dedicated smoke-only consumer so it can never share the Slice 2 dispatch subscription."
    },
    {
      "id": "S1R-03-report-claims-unrecorded-command",
      "severity": "low",
      "path": "docs/slice-1.md",
      "evidence": "The Section F table (docs/slice-1.md:57) lists `pnpm install --frozen-lockfile` with exit 0 as an executed final gate.\n\ndocs/evidence/slice-1-commands.json records only:\n- typecheck, lint and build\n- the two test invocations\n- db:migrate and smoke\n- the psql settings query\n- `git diff --check`\n\nIt has no entry for the install, for `docker compose ... up -d --wait`, or for separate `test:unit` / `test:integration` runs.\n\nThe plan's exit criterion requires 'exact commands/output in report'. The install claim therefore cannot be traced to recorded evidence.",
      "fix": "Re-run `pnpm install --frozen-lockfile` (and optionally the compose bring-up) in the final verification harness and append the exit codes and output to slice-1-commands.json. Otherwise, remove the row from Section F or mark it as not recorded."
    },
    {
      "id": "S1R-04-lifecycle-tests-share-queue-state",
      "severity": "low",
      "path": "tests/integration/lifecycle.test.ts",
      "evidence": "The plan requires 'per-test isolated queues' within a fixture database. In lifecycle.test.ts, the smoke-repeat, restart and foreign-event tests all use the queue `lifecycle` and the consumer `consumer` created in beforeAll.\n\nThe last test publishes 'foreign-event' and leaves an open, unacknowledged batch from an autocommit receive. Any test added after it on that queue would fail or rely on that state.\n\nThe plan also asks infrastructure smoke tests to verify that only their own containers are cleaned up. The suites call `container.stop()` but never assert that cleanup.",
      "fix": "Create a fresh queue and consumer per test, for example with a randomUUID-suffixed helper like pgque.test.ts's `queue()`, wherever a test publishes or receives. Optionally assert after `stop()` that the container ID no longer exists and that the named Compose volume is untouched."
    }
  ],
  "coverage": [
    "Read the full plan text in the prompt; it matches docs/slice-0.md. Reviewed the change manifest and the full tracked diff.",
    "Read src/cli.ts, src/smoke.ts and src/ticker.ts directly in the worktree and confirmed they match the diff. Reviewed src/db.ts, src/config.ts and src/migrate.ts as shown in the diff.",
    "Traced shared-state writers:\n- Advisory keys 1/2/3 across the CLI bootstrap, migrate, schedulerCall, smoke and the tests.\n- pgque.ticker callers: scheduler, smoke, create_queue's internal tick, and the tests.\n- Subscription cursor writers: receive/ack in smoke and tests, subscribe in bootstrap and tests.",
    "Checked against the pinned installer in the diff:\n- create_queue return values and its internal ticker call\n- force_tick override (no tick insert)\n- ticker(text) has no queue lock\n- maint_rotate_tables_step1 NOWAIT/TRUNCATE and tick deletion\n- maint_rotate_tables_step2\n- maint() skips step2 and vacuum\n- receive's empty-batch finish and 54000 overflow\n- finish_batch return values\n- role grants",
    "Reviewed all three integration test files and both unit test files against S1-01..S1-10, plus the docs/slice-1.md test-count claims.",
    "Reviewed vitest.config.ts, tsconfig, eslint config, .gitattributes (vendor -text, eol=lf for migration checksums), compose.yaml (loopback binding, pinned digest, durability settings), the CI workflow, package.json pins and .env.example.",
    "Compared docs/slice-1.md Section F claims with docs/evidence/slice-1-commands.json and slice-1-tests.json."
  ],
  "limitations": [
    "I could not run commands or tests. No test pass is claimed here, and the 45/45 result comes only from the committed evidence files, which I did not independently reproduce.",
    "I did not recompute the SHA256 of vendor/pgque/pgque.sql, the plan, or the manifest, and did not confirm that the evidence run used the exact reviewed commit.",
    "I did not read pnpm-lock.yaml in depth for supply-chain integrity, and did not check whether the GitHub Actions run passes.",
    "S1R-01's node-postgres behaviour (COMMIT on an aborted transaction returns the ROLLBACK tag without throwing) comes from PostgreSQL protocol semantics and was not observed in this repository.",
    "I did not open the raw evidence files under C:\\Users\\Khang\\tmp or the other review worktrees."
  ]
}
```

Dispositions: S1R-01 accepted as mandatory before Slice2 savepoint/error-recovering callbacks; current callbacks all propagate SQL errors, so no Slice1 path is affected. S1R-02 accepted boundary: smoke is synthetic-only, one invocation at a time; Slice2 must use a separate dispatcher subscription and mandatory gate, never run smoke on it. S1R-03 resolved by attaching the already-observed frozen-lockfile install entry and raw output from the earlier verification harness (same unchanged package/lockfile); not a newly executed install. S1R-04 accepted test limitation: lifecycle cases share sequential queue state; create isolated queues before adding more cases in Slice2. Container stop calls ran, but explicit post-removal/volume-preservation assertions were not added.

After inspection only review/report/evidence documents were updated. Application code, tests, configuration and vendor remain identical to inspectedda7968d. No benchmark, production, or GitHub-hosted CI pass is implied.
