import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import type { Pool } from 'pg';
import { pino } from 'pino';
import { transaction } from './db.js';

const logger = pino();

export async function schedulerCall(pool: Pool, sql: string, values: string[] = []): Promise<boolean> {
  return transaction(pool, async (client) => {
    const gate = await client.query<{ locked: boolean }>('SELECT pg_try_advisory_xact_lock(1346848837, 3) AS locked');
    if (!gate.rows[0]?.locked) return false;
    await client.query(sql, values);
    return true;
  });
}

export async function requireConsumer(pool: Pool, queue: string, consumer: string): Promise<void> {
  const result = await pool.query('SELECT 1 FROM pgque.get_consumer_info($1, $2)', [queue, consumer]);
  if (result.rowCount !== 1) throw new Error('Expected consumer missing; explicitly provision before enabling producers');
}

export async function runTicker(pool: Pool, signal: AbortSignal): Promise<void> {
  const settings = await pool.query("SELECT current_setting('autovacuum') AS autovacuum");
  if (settings.rows[0]?.autovacuum !== 'on') throw new Error('Ticker requires autovacuum=on');
  const tasks = [
    { name: 'ticker', sql: 'SELECT pgque.ticker()', interval: 100, next: 0 },
    { name: 'maintenance', sql: 'SELECT pgque.maint()', interval: 30_000, next: 0 },
    { name: 'retry', sql: 'SELECT pgque.maint_retry_events()', interval: 30_000, next: 0 },
    { name: 'rotation_step2', sql: 'SELECT pgque.maint_rotate_tables_step2()', interval: 10_000, next: 0 },
  ];
  while (!signal.aborted) {
    for (const task of tasks) {
      if (signal.aborted) return;
      if (performance.now() < task.next) continue;
      // One committed transaction per operation; step2 must see committed step1.
      await schedulerCall(pool, task.sql);
      task.next = performance.now() + task.interval;
      if (task.name === 'maintenance') {
        const overdue = await pool.query(`SELECT queue_name FROM pgque.get_queue_info()
          WHERE queue_switch_time + queue_rotation_period < clock_timestamp()`);
        if (overdue.rowCount) logger.warn({ queues: overdue.rows }, 'Rotation remains overdue; inspect consumer lag and locks');
      }
    }
    try { await delay(100, undefined, { signal }); }
    catch (error) { if (!signal.aborted) throw error; }
  }
}
