import { pino } from 'pino';
import { readConfig } from './config.js';
import { createPool, transaction } from './db.js';
import { migrate } from './migrate.js';
import { requireConsumer, runTicker } from './ticker.js';
import { smoke } from './smoke.js';

const logger = pino();
async function main() {
  const command = process.argv[2];
  if (!['migrate', 'ticker', 'smoke'].includes(command ?? '')) throw new Error('Usage: cli.js migrate|ticker|smoke');
  const config = readConfig();
  const pool = createPool(config.databaseUrl, { max: config.poolMax });
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    if (command === 'migrate') {
      await migrate(pool);
      // Subscribe only for a new queue; an existing queue with a missing cursor must fail closed.
      await transaction(pool, async (client) => {
        await client.query("SET LOCAL lock_timeout = '15s'");
        await client.query("SET LOCAL statement_timeout = '30s'");
        await client.query('SELECT pg_advisory_xact_lock(1346848837, 1)');
        const created = await client.query<{ created: number }>('SELECT pgque.create_queue($1) AS created', [config.queue]);
        if (created.rows[0]?.created === 1) {
          await client.query('SELECT pgque.subscribe($1, $2)', [config.queue, config.consumer]);
        } else {
          const existing = await client.query('SELECT 1 FROM pgque.get_consumer_info($1, $2)', [config.queue, config.consumer]);
          if (existing.rowCount !== 1) throw new Error('Existing queue has no expected consumer; refusing automatic cursor recreation');
        }
      });
      logger.info('Migrations verified; local queue and consumer provisioned');
    } else if (command === 'smoke') {
      logger.info(await smoke(pool, config.queue, config.consumer), 'Smoke publish/receive/ack committed');
    } else {
      await requireConsumer(pool, config.queue, config.consumer);
      logger.info('Ticker started');
      await runTicker(pool, controller.signal);
      logger.info('Ticker drained');
    }
  } finally {
    controller.abort();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    await pool.end();
  }
}
main().catch((error: unknown) => {
  logger.error({ message: error instanceof Error ? error.message : 'Unknown failure' }, 'Command failed');
  process.exitCode = 1;
});
