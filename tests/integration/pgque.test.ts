import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client, Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../src/migrate.js';

const image = 'postgres:17-bookworm@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826';
type Database = Pool | PoolClient | Client;
type Message = { msg_id: string; batch_id: string; payload: string; type: string };
type Position = { last_tick: string; current_batch: string | null; next_tick: string | null };
type Queue = { name: string; consumer: string };

describe.sequential('pinned PgQue transaction contract (real PostgreSQL 17)', () => {
  let container: StartedPostgreSqlContainer | undefined;
  let pool: Pool;

  beforeAll(async () => {
    container = await new PostgreSqlContainer(image).start();
    pool = new Pool({ connectionString: container.getConnectionUri(), max: 8, statement_timeout: 5_000 });
    await migrate(pool);
    // Synthetic handoff fixture, never a proposed engine schema; discarded with this test container.
    await pool.query('CREATE TABLE pghelm_test_sink (queue text NOT NULL, msg_id bigint NOT NULL, PRIMARY KEY (queue, msg_id))');
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  }, 30_000);

  async function queue(subscribe = true): Promise<Queue> {
    const name = `test_${randomUUID().replaceAll('-', '')}`;
    const consumer = `${name}_consumer`;
    await pool.query('SELECT pgque.create_queue($1)', [name]);
    if (subscribe) await pool.query('SELECT pgque.subscribe($1, $2)', [name, consumer]);
    return { name, consumer };
  }

  async function send(q: Queue, payload: string, db: Database = pool): Promise<string> {
    const result = await db.query<{ id: string }>('SELECT pgque.send($1::text, $2::text) AS id', [q.name, payload]);
    return result.rows[0]!.id;
  }

  async function tick(q: Queue, db: Database = pool): Promise<string> {
    await db.query('SELECT pgque.force_tick($1)', [q.name]);
    const result = await db.query<{ id: string }>('SELECT pgque.ticker($1) AS id', [q.name]);
    expect(result.rows[0]!.id).not.toBeNull();
    return result.rows[0]!.id;
  }

  async function receive(q: Queue, db: Database = pool, limit = 100): Promise<Message[]> {
    return (await db.query<Message>('SELECT * FROM pgque.receive($1, $2, $3)', [q.name, q.consumer, limit])).rows;
  }

  async function ack(messages: Message[], db: Database): Promise<void> {
    expect(messages.length).toBeGreaterThan(0);
    expect(new Set(messages.map((message) => message.batch_id)).size).toBe(1);
    const result = await db.query<{ result: number }>('SELECT pgque.ack($1) AS result', [messages[0]!.batch_id]);
    expect(result.rows[0]!.result).toBe(1);
  }

  async function position(q: Queue, db: Database = pool): Promise<Position> {
    const result = await db.query<Position>(
      'SELECT last_tick, current_batch, next_tick FROM pgque.get_consumer_info($1, $2)',
      [q.name, q.consumer],
    );
    expect(result.rows).toHaveLength(1);
    return result.rows[0]!;
  }

  async function stage(q: Queue, messages: Message[], db: Database): Promise<void> {
    for (const message of messages) {
      await db.query('INSERT INTO pghelm_test_sink (queue, msg_id) VALUES ($1, $2)', [q.name, message.msg_id]);
    }
  }

  async function sink(q: Queue): Promise<string[]> {
    return (await pool.query<{ msg_id: string }>('SELECT msg_id FROM pghelm_test_sink WHERE queue = $1 ORDER BY msg_id', [q.name]))
      .rows.map((row) => row.msg_id);
  }

  async function backendPid(db: Database): Promise<number> {
    return (await db.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!.pid;
  }

  async function waitForBlock(waiting: number, blocking: number): Promise<void> {
    const deadline = performance.now() + 3_000;
    while (performance.now() < deadline) {
      const result = await pool.query<{ blocked: boolean }>(
        "SELECT wait_event_type = 'Lock' AND $2::int = ANY(pg_blocking_pids(pid)) AS blocked FROM pg_stat_activity WHERE pid = $1",
        [waiting, blocking],
      );
      if (result.rows[0]?.blocked) return;
      await delay(10);
    }
    throw new Error(`Backend ${waiting} never visibly blocked on ${blocking}`);
  }

  it('S1-02 commits the complete batch and distinguishes an already-closed batch', async () => {
    const q = await queue();
    const expected = [await send(q, 'first'), await send(q, 'second')];
    const tickId = await tick(q);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const messages = await receive(q, client);
      expect(messages.map((message) => message.msg_id).sort()).toEqual(expected.sort());
      expect(messages.map((message) => message.payload).sort()).toEqual(['first', 'second']);
      await stage(q, messages, client);
      await ack(messages, client);
      await client.query('COMMIT');
      expect(await sink(q)).toEqual(expected);
      expect(await position(q)).toEqual({ last_tick: tickId, current_batch: null, next_tick: null });
      expect(await receive(q)).toEqual([]);
      const repeated = await pool.query<{ result: number }>('SELECT pgque.ack($1) AS result', [messages[0]!.batch_id]);
      expect(repeated.rows[0]!.result).toBe(0);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('S1-03 preserves a lower event ID that commits after a higher one', async () => {
    const q = await queue();
    const producerA = await pool.connect();
    const consumer = await pool.connect();
    try {
      await producerA.query('BEGIN');
      const earlyId = await send(q, 'A commits last', producerA);
      const lateId = await send(q, 'B commits first');
      expect(BigInt(earlyId)).toBeLessThan(BigInt(lateId));
      await tick(q);
      await consumer.query('BEGIN');
      const first = await receive(q, consumer);
      expect(first.map((message) => message.msg_id)).toEqual([lateId]);
      await ack(first, consumer);
      await consumer.query('COMMIT');
      await producerA.query('COMMIT');
      await tick(q);
      await consumer.query('BEGIN');
      const second = await receive(q, consumer);
      expect(second.map((message) => message.msg_id)).toEqual([earlyId]);
      await ack(second, consumer);
      await consumer.query('COMMIT');
      expect(await receive(q)).toEqual([]);
    } finally {
      await producerA.query('ROLLBACK');
      await consumer.query('ROLLBACK');
      producerA.release();
      consumer.release();
    }
  });

  it('S1-03 a producer transaction cannot make its own event visible by ticking before commit', async () => {
    const q = await queue();
    const producer = await pool.connect();
    try {
      await producer.query('BEGIN');
      const id = await send(q, 'requires a subsequent snapshot', producer);
      const earlyTick = await tick(q, producer);
      await producer.query('COMMIT');
      expect(await receive(q)).toEqual([]);
      expect((await position(q)).last_tick).toBe(earlyTick);
      await tick(q);
      const messages = await receive(q);
      expect(messages.map((message) => message.msg_id)).toEqual([id]);
      await ack(messages, pool);
    } finally {
      await producer.query('ROLLBACK');
      producer.release();
    }
  });

  it.each(['receive', 'stage', 'ack'] as const)('S1-04 rollback after %s preserves cursor and removes sink writes', async (boundary) => {
    const q = await queue();
    const id = await send(q, 'rollback');
    await tick(q);
    const before = await position(q);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const messages = await receive(q, client);
      expect(messages.map((message) => message.msg_id)).toEqual([id]);
      if (boundary !== 'receive') await stage(q, messages, client);
      if (boundary === 'ack') await ack(messages, client);
      await client.query('ROLLBACK');
      expect(await sink(q)).toEqual([]);
      expect(await position(q)).toEqual(before);
      // A separate backend must see the whole batch and can atomically commit its sink and ack.
      const restarted = await pool.connect();
      try {
        await restarted.query('BEGIN');
        const replay = await receive(q, restarted);
        expect(replay.map((message) => message.msg_id)).toEqual([id]);
        await stage(q, replay, restarted);
        await ack(replay, restarted);
        await restarted.query('COMMIT');
      } finally {
        await restarted.query('ROLLBACK');
        restarted.release();
      }
      expect(await sink(q)).toEqual([id]);
      expect(await receive(q)).toEqual([]);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('S1-05 overflow aborts the complete receive instead of paginating', async () => {
    const q = await queue();
    const ids = [await send(q, 'one'), await send(q, 'two'), await send(q, 'three')];
    await tick(q);
    const before = await position(q);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      expect(await receive(q, client, 3)).toHaveLength(3);
      await client.query('ROLLBACK');
      for (let repeat = 0; repeat < 2; repeat++) {
        await client.query('BEGIN');
        await expect(receive(q, client, 2)).rejects.toMatchObject({ code: '54000' });
        await expect(client.query('SELECT 1')).rejects.toMatchObject({ code: '25P02' });
        await client.query('ROLLBACK');
        expect(await position(q)).toEqual(before);
        expect(await sink(q)).toEqual([]);
      }
      await expect(receive(q, pool, 0)).rejects.toThrow('max_return must be >= 1');
      await expect(receive(q, pool, -1)).rejects.toThrow('max_return must be >= 1');
      await client.query('BEGIN');
      const complete = await receive(q, client, 3);
      expect(complete.map((message) => message.msg_id).sort()).toEqual(ids.sort());
      await stage(q, complete, client);
      await ack(complete, client);
      await client.query('COMMIT');
      expect(await sink(q)).toEqual(ids);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('S1-06 reuses a committed open batch after consumer connection restart', async () => {
    const q = await queue();
    const id = await send(q, 'restart');
    await tick(q);
    const stopped = new Client({ connectionString: container!.getConnectionUri() });
    await stopped.connect();
    let original: Message[];
    try {
      await stopped.query('BEGIN');
      original = await receive(q, stopped);
      await stopped.query('COMMIT');
    } finally {
      await stopped.end();
    }
    const restarted = await pool.connect();
    try {
      await restarted.query('BEGIN');
      const replay = await receive(q, restarted);
      expect(replay).toEqual(original);
      expect(replay.map((message) => message.msg_id)).toEqual([id]);
      await ack(replay, restarted);
      await restarted.query('COMMIT');
      expect(await receive(q)).toEqual([]);
    } finally {
      await restarted.query('ROLLBACK');
      restarted.release();
    }
  });

  it.each(['receive', 'ack'] as const)('S1-06 backend death after uncommitted %s rolls back handoff', async (boundary) => {
    const q = await queue();
    const id = await send(q, 'terminated connection');
    await tick(q);
    const before = await position(q);
    const victim = new Client({ connectionString: container!.getConnectionUri(), statement_timeout: 5_000 });
    // Terminating this dedicated test backend intentionally emits an idle-client error.
    victim.on('error', () => undefined);
    await victim.connect();
    try {
      const pid = await backendPid(victim);
      await victim.query('BEGIN');
      const messages = await receive(q, victim);
      await stage(q, messages, victim);
      if (boundary === 'ack') await ack(messages, victim);
      const killed = await pool.query<{ stopped: boolean }>('SELECT pg_terminate_backend($1, 3000) AS stopped', [pid]);
      expect(killed.rows[0]!.stopped).toBe(true);
      expect(await position(q)).toEqual(before);
      expect(await sink(q)).toEqual([]);
      const replay = await receive(q);
      expect(replay.map((message) => message.msg_id)).toEqual([id]);
      await ack(replay, pool);
    } finally {
      await victim.end();
    }
  });

  it('S1-06 empty batch auto-ack rolls back and then advances only on commit', async () => {
    const q = await queue();
    const before = await position(q);
    const tickId = await tick(q);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      expect(await receive(q, client)).toEqual([]);
      expect((await position(q, client)).last_tick).toBe(tickId);
      expect(await position(q)).toEqual(before);
      await client.query('ROLLBACK');
      expect(await position(q)).toEqual(before);
      await client.query('BEGIN');
      expect(await receive(q, client)).toEqual([]);
      await client.query('COMMIT');
      expect(await position(q)).toEqual({ last_tick: tickId, current_batch: null, next_tick: null });
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('S1-07 registration starts at the latest existing tick, including unticked pre-subscribe events', async () => {
    const q = await queue(false);
    const historical = await send(q, 'already ticked');
    const startTick = await tick(q);
    const unticked = await send(q, 'committed before subscription, after tick');
    const registration = await pool.query<{ result: number }>('SELECT pgque.subscribe($1, $2) AS result', [q.name, q.consumer]);
    expect(registration.rows[0]!.result).toBe(1);
    expect((await position(q)).last_tick).toBe(startTick);
    const later = await send(q, 'after subscription');
    await tick(q);
    const messages = await receive(q);
    expect(messages.map((message) => message.msg_id).sort()).toEqual([unticked, later].sort());
    expect(messages.map((message) => message.msg_id)).not.toContain(historical);
    const open = await position(q);
    const repeat = await pool.query<{ result: number }>('SELECT pgque.subscribe($1, $2) AS result', [q.name, q.consumer]);
    expect(repeat.rows[0]!.result).toBe(0);
    expect(await position(q)).toEqual(open);
    await ack(messages, pool);
  });

  it.each(['COMMIT', 'ROLLBACK'] as const)('S1-08 characterizes bare receive after concurrent %s, then recovers safely', async (ending) => {
    const q = await queue();
    const id = await send(q, 'contended');
    const tickId = await tick(q);
    const first = await pool.connect();
    const second = await pool.connect();
    try {
      const firstPid = await backendPid(first);
      const secondPid = await backendPid(second);
      await first.query('BEGIN');
      const firstMessages = await receive(q, first);
      expect(firstMessages.map((message) => message.msg_id)).toEqual([id]);
      await stage(q, firstMessages, first);
      await ack(firstMessages, first);
      await second.query('BEGIN');
      const pending = receive(q, second).then(
        (messages) => ({ messages, error: undefined }),
        (error: unknown) => ({ messages: undefined, error }),
      );
      await waitForBlock(secondPid, firstPid);
      await first.query(ending);
      const result = await pending;
      if (ending === 'COMMIT') {
        // Pinned v0.2.2 returns P0001 after this joined subscription/tick lock wait.
        expect(result.error).toMatchObject({
          code: 'P0001',
          message: `PgQ corruption: Consumer ${q.consumer} on queue ${q.name} does not see tick <NULL>`,
        });
        expect(result.messages).toBeUndefined();
        await expect(second.query('SELECT 1')).rejects.toMatchObject({ code: '25P02' });
        await second.query('ROLLBACK');
        expect(await sink(q)).toEqual([id]);
        expect(await position(q)).toEqual({ last_tick: tickId, current_batch: null, next_tick: null });
        await second.query('BEGIN');
        expect(await receive(q, second)).toEqual([]);
      } else {
        expect(result.error).toBeUndefined();
        const messages = result.messages!;
        expect(messages.map((message) => message.msg_id)).toEqual([id]);
        await stage(q, messages, second);
        await ack(messages, second);
      }
      await second.query('COMMIT');
      expect(await sink(q)).toEqual([id]);
      expect(await position(q)).toEqual({ last_tick: tickId, current_batch: null, next_tick: null });
      expect(await receive(q)).toEqual([]);
    } finally {
      await first.query('ROLLBACK');
      await second.query('ROLLBACK');
      first.release();
      second.release();
    }
  });

  it.each(['COMMIT', 'ROLLBACK'] as const)('S1-08 separate advisory gate rejects the contender before receive; owner %s releases it', async (ending) => {
    const q = await queue();
    const id = await send(q, 'gated handoff');
    const tickId = await tick(q);
    const first = await pool.connect();
    const second = await pool.connect();
    const gate = 'SELECT pg_try_advisory_xact_lock(1346848837, 2) AS acquired';
    try {
      await first.query('BEGIN');
      expect((await first.query<{ acquired: boolean }>(gate)).rows[0]!.acquired).toBe(true);
      const messages = await receive(q, first);
      expect(messages.map((message) => message.msg_id)).toEqual([id]);
      await stage(q, messages, first);
      await ack(messages, first);

      await second.query('BEGIN');
      expect((await second.query<{ acquired: boolean }>(gate)).rows[0]!.acquired).toBe(false);
      // Losing transactions end without calling receive, so they never enter PgQue's lock-wait join.
      await second.query('ROLLBACK');
      await first.query(ending);

      await second.query('BEGIN');
      expect((await second.query<{ acquired: boolean }>(gate)).rows[0]!.acquired).toBe(true);
      // A new SQL statement obtains a fresh READ COMMITTED snapshot after gate acquisition.
      const replay = await receive(q, second);
      if (ending === 'COMMIT') {
        expect(replay).toEqual([]);
      } else {
        expect(replay.map((message) => message.msg_id)).toEqual([id]);
        await stage(q, replay, second);
        await ack(replay, second);
      }
      await second.query('COMMIT');
      expect(await sink(q)).toEqual([id]);
      expect(await position(q)).toEqual({ last_tick: tickId, current_batch: null, next_tick: null });
      expect(await receive(q)).toEqual([]);
    } finally {
      await first.query('ROLLBACK');
      await second.query('ROLLBACK');
      first.release();
      second.release();
    }
  });

  it('S1-09 rotation preserves lagging work, skips NOWAIT conflicts, bounds lock waits, and commits step 2 separately', async () => {
    const q = await queue();
    const id = await send(q, 'retained until acknowledged');
    await tick(q);
    await pool.query("SELECT pgque.set_queue_config($1, 'rotation_period', '1 microsecond')", [q.name]);
    async function rotationState(db: Database = pool) {
      // Inspection only: all changes to PgQue state use its public functions.
      const result = await db.query<{ table: number; step1: string; step2: string | null; due: boolean }>(
        'SELECT queue_cur_table AS table, queue_switch_step1 AS step1, queue_switch_step2 AS step2, queue_switch_time + queue_rotation_period < clock_timestamp() AS due FROM pgque.queue WHERE queue_name = $1',
        [q.name],
      );
      return result.rows[0]!;
    }
    const before = await rotationState();
    expect(before.due).toBe(true);
    await pool.query('SELECT pgque.maint()');
    expect(await rotationState()).toEqual(before);
    const retained = await receive(q);
    expect(retained.map((message) => message.msg_id)).toEqual([id]);
    await ack(retained, pool);

    const blocker = await pool.connect();
    const maintenance = await pool.connect();
    try {
      const nextTable = await pool.query<{ quoted_table: string }>(
        "SELECT pgque.quote_fqname(queue_data_pfx || '_' || ((queue_cur_table + 1) % queue_ntables)::text) AS quoted_table FROM pgque.queue WHERE queue_name = $1",
        [q.name],
      );
      await blocker.query('BEGIN');
      // Only this server-quoted identifier is interpolated; an ordinary reader blocks TRUNCATE's exclusive lock.
      await blocker.query(`LOCK TABLE ${nextTable.rows[0]!.quoted_table} IN ACCESS SHARE MODE`);
      const skipped = await maintenance.query<{ result: number }>(
        'SELECT pgque.maint_rotate_tables_step1($1) AS result',
        [q.name],
      );
      expect(skipped.rows[0]!.result).toBe(0);
      expect(await rotationState()).toEqual(before);
      // Releasing this conflict allows the successful rotation below; no private metadata is changed.
      await blocker.query('ROLLBACK');

      const blockerPid = await backendPid(blocker);
      const maintenancePid = await backendPid(maintenance);
      await blocker.query('BEGIN');
      // Test-only lock injection on a disposable queue; no private rows are modified.
      await blocker.query('SELECT queue_id FROM pgque.queue WHERE queue_name = $1 FOR UPDATE', [q.name]);
      await maintenance.query('BEGIN');
      await maintenance.query("SET LOCAL lock_timeout = '1s'");
      const blockedMaintenance = maintenance.query('SELECT pgque.maint()').then(
        () => undefined,
        (error: unknown) => error,
      );
      await waitForBlock(maintenancePid, blockerPid);
      expect(await blockedMaintenance).toMatchObject({ code: '55P03' });
      await maintenance.query('ROLLBACK');
      await blocker.query('ROLLBACK');
      expect(await rotationState()).toEqual(before);

      await maintenance.query('BEGIN');
      const firstTx = (await maintenance.query<{ id: string }>('SELECT pg_current_xact_id() AS id')).rows[0]!.id;
      await maintenance.query('SELECT pgque.maint()');
      const rotating = await rotationState(maintenance);
      expect(rotating.table).not.toBe(before.table);
      expect(rotating.step1).toBe(firstTx);
      expect(rotating.step2).toBeNull();
      // Other connections still see the previous routing metadata until step 1 commits.
      expect((await rotationState()).table).toBe(before.table);
      await maintenance.query('COMMIT');
      expect((await rotationState()).step2).toBeNull();

      await blocker.query('BEGIN');
      const secondTx = (await blocker.query<{ id: string }>('SELECT pg_current_xact_id() AS id')).rows[0]!.id;
      expect(BigInt(secondTx)).toBeGreaterThan(BigInt(firstTx));
      await blocker.query('SELECT pgque.maint_rotate_tables_step2()');
      await blocker.query('COMMIT');
      expect((await rotationState()).step2).toBe(secondTx);
      const later = await send(q, 'published after rotation');
      await tick(q);
      const messages = await receive(q);
      expect(messages.map((message) => message.msg_id)).toEqual([later]);
      await ack(messages, pool);
    } finally {
      await blocker.query('ROLLBACK');
      await maintenance.query('ROLLBACK');
      blocker.release();
      maintenance.release();
    }
  });
});
