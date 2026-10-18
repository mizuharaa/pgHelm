# Scope and approval

Current authorization: Slice 1 infrastructure and PgQue integration, approved by the user's Continue and explicit parallel-build instruction. Apply the acceptance criteria in docs/slice-0.md. Each subsequent slice still requires separate approval. No execution inbox or worker orchestration in Slice 1.

Read `docs/slice-0.md` before project work. Keep all ten invariants and the slice acceptance criteria visible in reviews. Never connect to PlayerOne databases or services; use synthetic local workloads.

# Build and review hooks

At every build entry, repair iteration, and pre-commit review, apply `ponytail:ponytail`: trace the affected flow, reuse existing code or platform features, then make the smallest complete change. Leave a runnable check for nontrivial logic. No implementation hooks or CI exist in Slice 0; this is the mandatory workflow contract for future hooks.

Apply `mattpocock-skills:implement` for authorized slices. Use explicit SQL, parameterized queries, short transactions, and real PostgreSQL concurrency tests. Report commands, observed outputs and exit codes; never label source inspection as a runtime test.

Claudex roles: Codex coordinates/builds; Claude independently reviews in a separate worktree. Keep diagnostics outside the repository. Repair warranted findings, rerun checks, and obtain fresh inspection of changed material. Commit authorized work. Stop after each slice with the A-K review report and await the user's approval.

Keep shell launches hidden. On Windows use an existing persistent PTY, or `exec_command` with `tty: true` and `login: false`; background processes need `CREATE_NO_WINDOW` or `Start-Process -WindowStyle Hidden`.
