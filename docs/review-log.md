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
