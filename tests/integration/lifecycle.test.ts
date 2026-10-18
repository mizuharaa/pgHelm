import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { setTimeout as delay } from 'node:timers/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import type { Pool } from 'pg';
import { createPool } from '../../src/db.js';
import { migrate } from '../../src/migrate.js';
import { requireConsumer, runTicker, schedulerCall } from '../../src/ticker.js';
import { smoke } from '../../src/smoke.js';

let container: StartedPostgreSqlContainer | undefined;
let pool: Pool;
const root = resolve(import.meta.dirname, '../..');
beforeAll(async () => {
  await promisify(execFile)(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json'], { cwd: root, windowsHide: true });
  container = await new PostgreSqlContainer('postgres:17-bookworm@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826').withDatabase('pghelm').start();
  pool = createPool(container.getConnectionUri(), { max: 2 });
  await migrate(pool);
  await pool.query("SELECT pgque.create_queue('lifecycle')");
  await pool.query("SELECT pgque.subscribe('lifecycle', 'consumer')");
});
afterAll(async () => { await pool?.end(); await container?.stop(); });

it('CLI migrate never recreates a missing existing consumer', async () => {
  const run = () => promisify(execFile)(process.execPath, [resolve(root, 'dist/cli.js'), 'migrate'], {
    cwd: root, windowsHide: true,
    env: { ...process.env, DATABASE_URL: container!.getConnectionUri(), QUEUE_NAME: 'cli_bootstrap', CONSUMER_NAME: 'consumer' },
  });
  await run();
  await pool.query("SELECT pgque.unsubscribe('cli_bootstrap', 'consumer')");
  await expect(run()).rejects.toMatchObject({ code: 1 });
  expect((await pool.query("SELECT * FROM pgque.get_consumer_info('cli_bootstrap', 'consumer')")).rowCount).toBe(0);
});

it('rejects missing consumer without silently recreating its cursor', async () => {
  await expect(requireConsumer(pool, 'lifecycle', 'missing')).rejects.toThrow(/consumer missing/i);
  await expect(smoke(pool, 'lifecycle', 'missing')).rejects.toThrow(/consumer missing/i);
  expect((await pool.query("SELECT * FROM pgque.get_consumer_info('lifecycle', 'missing')")).rowCount).toBe(0);
});

it('runs the actual smoke path repeatedly with committed receive and acknowledgment', async () => {
  const first = await smoke(pool, 'lifecycle', 'consumer');
  const second = await smoke(pool, 'lifecycle', 'consumer');
  expect(first.received).toBe(1);
  expect(second.received).toBe(1);
  expect(first.sourceId).not.toBe(second.sourceId);
});

it('ticks, drains, and restarts without replacing the existing subscription', async () => {
  const subscription = (await pool.query('SELECT sub_id, sub_last_tick FROM pgque.subscription')).rows;
  for (let restart = 0; restart < 2; restart++) {
    const initialTick = (await pool.query('SELECT max(tick_id)::text AS id FROM pgque.tick')).rows[0].id;
    await pool.query("SELECT pgque.force_next_tick('lifecycle')");
    const controller = new AbortController();
    const running = runTicker(pool, controller.signal);
    void running.catch(() => undefined);
    try {
      const deadline = Date.now() + 5_000;
      let advanced = false;
      while (Date.now() < deadline) {
        const currentTick = (await pool.query('SELECT max(tick_id)::text AS id FROM pgque.tick')).rows[0].id;
        if (currentTick !== initialTick) { advanced = true; break; }
        await delay(20);
      }
      expect(advanced).toBe(true);
    } finally {
      controller.abort();
      await running;
    }
    expect(pool.waitingCount).toBe(0);
    expect(pool.idleCount).toBe(pool.totalCount);
  }
  expect((await pool.query('SELECT sub_id, sub_last_tick FROM pgque.subscription')).rows).toEqual(subscription);
});

it('serializes scheduler replicas with a separate-statement transaction lock', async () => {
  const holder = await pool.connect();
  try {
    await holder.query('BEGIN');
    await holder.query('SELECT pg_advisory_xact_lock(1346848837, 3)');
    const before = (await holder.query('SELECT count(*)::int AS n FROM pgque.tick')).rows[0].n;
    expect(await schedulerCall(pool, 'SELECT pgque.ticker()')).toBe(false);
    expect((await holder.query('SELECT count(*)::int AS n FROM pgque.tick')).rows[0].n).toBe(before);
    await holder.query('COMMIT');
    await pool.query("SELECT pgque.force_next_tick('lifecycle')");
    expect(await schedulerCall(pool, 'SELECT pgque.ticker()')).toBe(true);
  } finally {
    await holder.query('ROLLBACK');
    holder.release();
  }
});

it('force_next_tick alone does not insert a tick', async () => {
  const before = (await pool.query('SELECT count(*)::int AS n FROM pgque.tick')).rows[0].n;
  await pool.query("SELECT pgque.force_next_tick('lifecycle')");
  expect((await pool.query('SELECT count(*)::int AS n FROM pgque.tick')).rows[0].n).toBe(before);
});

it('two scheduler loops complete rotation in separate transactions and preserve delivery', async () => {
  await pool.query("SELECT pgque.create_queue('scheduler_rotation')");
  await pool.query("SELECT pgque.set_queue_config('scheduler_rotation', 'rotation_period', '1 microsecond')");
  const before = (await pool.query("SELECT queue_cur_table AS n FROM pgque.queue WHERE queue_name = 'scheduler_rotation'")).rows[0].n;
  const controllers = [new AbortController(), new AbortController()];
  const running = controllers.map((controller) => runTicker(pool, controller.signal));
  for (const task of running) void task.catch(() => undefined);
  try {
    const deadline = Date.now() + 12_000;
    let completed = false;
    while (Date.now() < deadline) {
      const state = (await pool.query("SELECT queue_cur_table AS n, queue_switch_step1 AS s1, queue_switch_step2 AS s2 FROM pgque.queue WHERE queue_name = 'scheduler_rotation'")).rows[0];
      if (state.n !== before && state.s2 !== null) {
        expect(BigInt(state.s2)).toBeGreaterThan(BigInt(state.s1));
        completed = true;
        break;
      }
      await delay(20);
    }
    expect(completed).toBe(true);
    await pool.query("SELECT pgque.subscribe('scheduler_rotation', 'consumer')");
    expect((await smoke(pool, 'scheduler_rotation', 'consumer')).received).toBe(1);
    expect((await smoke(pool, 'scheduler_rotation', 'consumer')).received).toBe(1);
  } finally {
    controllers.forEach((controller) => controller.abort());
    await Promise.all(running);
  }
});

it('refuses to acknowledge non-smoke events on the synthetic demo subscription', async () => {
  const sourceId = (await pool.query("SELECT pgque.send('lifecycle', 'foreign-event'::text) AS id")).rows[0].id;
  await expect(smoke(pool, 'lifecycle', 'consumer')).rejects.toThrow('Malformed or non-smoke payload; batch not acknowledged');
  const events = await pool.query("SELECT * FROM pgque.receive('lifecycle', 'consumer', 1000)");
  expect(events.rows.map((row) => row.msg_id)).toContain(sourceId);
});
