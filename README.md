# pgHelm

PostgreSQL Distributed Worker Engine: an execution and coordination layer being built over PgQue.

**Status: Slice 1 local PgQue integration. Distributed workers, execution inbox, recovery, and benchmarks are not implemented yet.**

Work proceeds one slice at a time, with explicit user approval before the next slice. See [the architecture review](docs/slice-0.md) and [review history](docs/review-log.md).

## Run the synthetic local demo

Requirements: Node 24.21.0, pnpm 9.15.9, and Docker with Linux containers. The image is PostgreSQL 17.11 pinned by digest; PgQue v0.2.2 is vendored at commit `dff3a906276068ad2433312bbc7c95a577deff53` with checksum/license/notice. One package, explicit SQL, no ORM or external broker.

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
docker compose -f infra/compose.yaml -p pghelm up -d --wait
pnpm db:migrate
pnpm smoke
pnpm ticker
```

Smoke prints the published source ID and confirms committed receive/ack. Run one smoke invocation at a time; it is only for the synthetic demo queue/consumer and refuses foreign payloads without logging their contents. Ctrl+C drains the current scheduler operation and closes its pool. `db:migrate` provisions the consumer only when creating a new queue; an existing queue missing its expected consumer fails closed. Ordinary startup also refuses a missing consumer.

The development database binds only to `127.0.0.1:55432`, uses database `pghelm`, and keeps its data in the Compose volume. The included password is for local synthetic use only. The CLI refuses remote hosts, other database names, and URL query overrides. Its demo login is a trusted administrator; integration tests separately verify PgQue writer/reader/admin boundaries. This is not a production privilege configuration.

## Verify

```powershell
pnpm typecheck
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
```

Integration suites create dedicated pinned PostgreSQL containers and stop only those containers afterward. They ignore development/production connection URLs. Cases sharing a database run sequentially; races use explicitly coordinated connections. Tests cover commit-order inversion, rollback, batch overflow, restart, migration locking, timeouts, permissions, and scheduler lifecycle. Test durations are not throughput benchmarks.

## Operational boundaries

- Migration advisory key: `(1346848837, 1)`; reserved dispatcher key: `(1346848837, 2)`; scheduler key: `(1346848837, 3)`.
- Run only pgHelm-coordinated tickers/maintenance against this database. Each operation takes a transaction-scoped scheduler lock before its next SQL statement; another scheduler skips a busy slot. Do not also enable PgQue's pg_cron ticker.
- Scheduler intervals: ticker 100 ms, maintenance/retry 30 s, rotation step2 10 s. Calls never overlap within a process; each commits separately. These intervals do not promise a latency percentile.
- Autovacuum must remain enabled. Overdue rotation is logged; inspect subscriber lag and table locks. Maintenance errors stop the scheduler with a nonzero exit instead of silently continuing.
- PgQue v0.2.2's bare concurrent receive/ack path can raise a missing-tick `P0001` error. Our tests reproduce it and demonstrate a separate-statement advisory gate; the future dispatcher must use that gate.
- Database migrations are trusted, reviewed SQL, run transactionally with checksum validation. Do not put transaction-control statements in migration files. A changed or missing applied migration fails closed. Migration/bootstrap lock waits are bounded at 15s, statements at 30s; timeout rolls back and requires an explicit retry. Normal operations use 1s/5s bounds.

No worker throughput, crash-recovery time, storage improvement, or scale claim is established by Slice 1. The repository will record those measurements after the execution and recovery slices.
