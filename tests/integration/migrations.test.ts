import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Pool } from 'pg';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createPool, transaction } from '../../src/db.js';
import { migrate } from '../../src/migrate.js';

const image = 'postgres:17-bookworm@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826';
let container: StartedPostgreSqlContainer | undefined;
let pool: Pool;
let fixtureNumber = 0;

async function fixture() {
  const database = `fixture_${++fixtureNumber}`;
  await pool.query(`CREATE DATABASE ${database}`);
  const url = new URL(container!.getConnectionUri());
  url.pathname = database;
  const fixturePool = createPool(url.toString(), { max: 1 });
  const directory = await mkdtemp(join(tmpdir(), 'pghelm-migration-'));
  return {
    pool: fixturePool,
    directory,
    url: url.toString(),
    async close() {
      await fixturePool.end();
      await rm(directory, { recursive: true, force: true });
    },
  };
}

async function waitUntil(check: () => Promise<boolean>) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(20);
  }
  throw new Error('Expected PostgreSQL lock barrier was not reached within 5 seconds');
}

beforeAll(async () => {
  container = await new PostgreSqlContainer(image).withDatabase('migration_tests').start();
  pool = createPool(container.getConnectionUri());
}, 120_000);

afterAll(async () => {
  await pool?.end();
  await container?.stop();
});

describe.sequential('S1-01 pinned installation', () => {
  it('installs PgQue on PostgreSQL 17 and reruns without replacing the migration ledger', async () => {
    expect((await pool.query<{ server_version: string }>('SHOW server_version')).rows[0]?.server_version).toMatch(/^17\./);
    await migrate(pool);
    expect((await pool.query<{ version: string }>('SELECT pgque.version() AS version')).rows[0]?.version).toBe('0.2.2');
    const before = (await pool.query('SELECT name, sha256, applied_at FROM public.pghelm_migration ORDER BY name')).rows;
    expect(before.length).toBeGreaterThan(0);
    await migrate(pool);
    expect((await pool.query('SELECT name, sha256, applied_at FROM public.pghelm_migration ORDER BY name')).rows).toEqual(before);
  });

  it('rejects modified applied SQL without executing it', async () => {
    const f = await fixture();
    try {
      const file = join(f.directory, '0001-fixture.sql');
      await writeFile(file, 'CREATE TABLE checksum_probe(value integer);');
      await migrate(f.pool, f.directory);
      await writeFile(file, 'CREATE TABLE checksum_probe(value integer); INSERT INTO checksum_probe VALUES (1);');
      await expect(migrate(f.pool, f.directory)).rejects.toThrow(/checksum|changed|drift/i);
      expect((await f.pool.query('SELECT * FROM checksum_probe')).rowCount).toBe(0);
    } finally {
      await f.close();
    }
  });

  it('rolls back all SQL and the ledger when a migration fails, and permits corrected retry', async () => {
    const f = await fixture();
    try {
      await writeFile(join(f.directory, '0001-fixture.sql'), 'CREATE TABLE rollback_probe(value integer);');
      const second = join(f.directory, '0002-failure.sql');
      await writeFile(second, 'INSERT INTO rollback_probe VALUES (1); SELECT 1 / 0;');
      await expect(migrate(f.pool, f.directory)).rejects.toMatchObject({ code: '22012' });
      expect((await f.pool.query('SELECT to_regclass($1) AS name', ['public.rollback_probe'])).rows[0]?.name).toBeNull();
      expect((await f.pool.query('SELECT to_regclass($1) AS name', ['public.pghelm_migration'])).rows[0]?.name).toBeNull();
      await writeFile(second, 'INSERT INTO rollback_probe VALUES (1);');
      await migrate(f.pool, f.directory);
      expect((await f.pool.query('SELECT value FROM rollback_probe')).rows).toEqual([{ value: 1 }]);
      expect((await f.pool.query('SELECT * FROM public.pghelm_migration')).rowCount).toBe(2);
    } finally {
      await f.close();
    }
  });

  it('serializes competing migration transactions before inspecting or changing the ledger', async () => {
    const f = await fixture();
    const other = createPool(f.url, { max: 1 });
    const observer = createPool(f.url, { max: 1 });
    const pending: Promise<void>[] = [];
    try {
      await writeFile(join(f.directory, '0001-barrier.sql'), 'SELECT pg_advisory_xact_lock(880001); CREATE TABLE once_only(value integer); INSERT INTO once_only VALUES (1);');
      const firstPid = (await f.pool.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
      const secondPid = (await other.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
      // Advisory locks are database-scoped: hold the gate in the fixture database.
      const gate = await observer.connect();
      try {
        await gate.query('SELECT pg_advisory_lock(880001)');
        const first = migrate(f.pool, f.directory);
        void first.catch(() => undefined);
        pending.push(first);
        await waitUntil(async () => (await gate.query('SELECT cardinality(pg_blocking_pids($1)) > 0 AS blocked', [firstPid])).rows[0]?.blocked === true);
        const second = migrate(other, f.directory);
        void second.catch(() => undefined);
        pending.push(second);
        await waitUntil(async () => (await gate.query('SELECT $1::int = ANY(pg_blocking_pids($2)) AS blocked', [firstPid, secondPid])).rows[0]?.blocked === true);
        // A real lock barrier was observed above; exceed the normal 1s lock budget deliberately.
        await gate.query('SELECT pg_sleep(1.1)');
      } finally {
        await gate.query('SELECT pg_advisory_unlock(880001)');
        gate.release();
      }
      await Promise.all(pending);
      expect((await f.pool.query('SELECT value FROM once_only')).rows).toEqual([{ value: 1 }]);
      expect((await f.pool.query('SELECT * FROM public.pghelm_migration')).rowCount).toBe(1);
    } finally {
      await Promise.allSettled(pending);
      await other.end();
      await observer.end();
      await f.close();
    }
  });
});

describe.sequential('S1-10 transaction and role boundaries', () => {
  it('rolls back failed work and releases the sole pool connection in a usable state', async () => {
    const f = await fixture();
    try {
      await f.pool.query('CREATE TABLE transaction_probe(value integer)');
      await expect(transaction(f.pool, async (client) => {
        await client.query('INSERT INTO transaction_probe VALUES (1)');
        await client.query('SELECT 1 / 0');
      })).rejects.toMatchObject({ code: '22012' });
      expect((await f.pool.query('SELECT * FROM transaction_probe')).rowCount).toBe(0);
      expect(await transaction(f.pool, async (client) => {
        await client.query('INSERT INTO transaction_probe VALUES (2)');
        return 'committed';
      })).toBe('committed');
      expect((await f.pool.query('SELECT value FROM transaction_probe')).rows).toEqual([{ value: 2 }]);
    } finally {
      await f.close();
    }
  });

  it('enforces configured statement and lock timeouts and releases connections after cancellation', async () => {
    const f = await fixture();
    const limited = createPool(f.url, { max: 1, statementTimeoutMs: 1_000, lockTimeoutMs: 50 });
    const holder = await f.pool.connect();
    try {
      await expect(transaction(limited, (client) => client.query('SELECT pg_sleep(5)'))).rejects.toMatchObject({ code: '57014' });
      expect((await limited.query('SELECT 1 AS ok')).rows).toEqual([{ ok: 1 }]);
      await holder.query('CREATE TABLE lock_probe(value integer)');
      await holder.query('BEGIN');
      await holder.query('LOCK TABLE lock_probe IN ACCESS EXCLUSIVE MODE');
      await expect(transaction(limited, (client) => client.query('SELECT * FROM lock_probe'))).rejects.toMatchObject({ code: '55P03' });
      expect((await limited.query('SELECT 1 AS ok')).rows).toEqual([{ ok: 1 }]);
    } finally {
      await holder.query('ROLLBACK');
      holder.release();
      await limited.end();
      await f.close();
    }
  });

  it('separates producer and consumer privileges and records the administrative maintenance exception', async () => {
    await migrate(pool);
    await pool.query("CREATE ROLE test_producer LOGIN PASSWORD 'synthetic-only' IN ROLE pgque_writer");
    await pool.query("CREATE ROLE test_consumer LOGIN PASSWORD 'synthetic-only' IN ROLE pgque_reader");
    await pool.query("CREATE ROLE test_maintenance LOGIN PASSWORD 'synthetic-only' IN ROLE pgque_admin");
    await pool.query("SELECT pgque.create_queue('roles_queue')");
    const roles = ['test_producer', 'test_consumer', 'test_maintenance'].map((role) => {
      const url = new URL(container!.getConnectionUri());
      url.username = role;
      url.password = 'synthetic-only';
      return createPool(url.toString(), { max: 1 });
    });
    const [producer, consumer, maintenance] = roles as [Pool, Pool, Pool];
    try {
      expect((await producer.query("SELECT pgque.send('roles_queue', '{}'::text) AS id")).rows[0]?.id).toBeTruthy();
      await expect(producer.query('SELECT pgque.ack(0::bigint)')).rejects.toMatchObject({ code: '42501' });
      await expect(producer.query("SELECT pgque.subscribe('roles_queue', 'forbidden')")).rejects.toMatchObject({ code: '42501' });
      await expect(consumer.query("SELECT pgque.send('roles_queue', '{}'::text)")).rejects.toMatchObject({ code: '42501' });
      await consumer.query("SELECT pgque.subscribe('roles_queue', 'reader')");
      expect((await consumer.query('SELECT pgque.ack(0::bigint) AS ack')).rows[0]?.ack).toBe(0);
      await expect(consumer.query('SELECT pgque.maint()')).rejects.toMatchObject({ code: '42501' });
      await maintenance.query('SELECT pgque.ticker()');
      await maintenance.query('SELECT pgque.maint()');
      await maintenance.query('SELECT pgque.maint_retry_events()');
      await maintenance.query('SELECT pgque.maint_rotate_tables_step2()');
      expect((await maintenance.query("SELECT pg_has_role(current_user, 'pgque_reader', 'MEMBER') AS reader, pg_has_role(current_user, 'pgque_writer', 'MEMBER') AS writer")).rows).toEqual([{ reader: true, writer: true }]);
    } finally {
      await Promise.all(roles.map((role) => role.end()));
    }
  });
});
