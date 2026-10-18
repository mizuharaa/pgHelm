import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { Pool } from 'pg';
import { z } from 'zod';
import { transaction } from './db.js';
import { requireConsumer, schedulerCall } from './ticker.js';

const smokeEnvelope = z.object({ jobId: z.uuid(), type: z.literal('smoke'), schemaVersion: z.literal(1) }).strict();

export async function smoke(pool: Pool, queue: string, consumer: string): Promise<{ sourceId: string; received: number }> {
  await requireConsumer(pool, queue, consumer);
  const payload = JSON.stringify({ jobId: randomUUID(), type: 'smoke', schemaVersion: 1 });
  const sent = await pool.query<{ id: string }>('SELECT pgque.send($1, $2::text) AS id', [queue, payload]);
  const sourceId = sent.rows[0]!.id;
  for (let poll = 0; poll < 20; poll++) {
    await pool.query('SELECT pgque.force_next_tick($1)', [queue]);
    await schedulerCall(pool, 'SELECT pgque.ticker($1)', [queue]);
    const received = await transaction(pool, async (client) => {
      const batch = await client.query<{ msg_id: string; batch_id: string; payload: string }>('SELECT * FROM pgque.receive($1, $2, $3)', [queue, consumer, 1_000]);
      if (batch.rows.length) {
        try {
          for (const event of batch.rows) smokeEnvelope.parse(JSON.parse(event.payload));
        } catch {
          // JSON parser errors can contain payload excerpts; never propagate them into logs.
          throw new Error('Malformed or non-smoke payload; batch not acknowledged');
        }
        const ack = await client.query<{ ack: number }>('SELECT pgque.ack($1::bigint) AS ack', [batch.rows[0]!.batch_id]);
        if (ack.rows[0]?.ack !== 1) throw new Error('Smoke batch acknowledgment was not accepted');
      }
      return batch.rows;
    });
    if (received.some((event) => event.msg_id === sourceId && event.payload === payload)) return { sourceId, received: received.length };
    await delay(100);
  }
  throw new Error('Smoke event was not observed within 20 polls');
}
