import { Pool, type PoolClient } from 'pg';
import { pino } from 'pino';

const logger = pino();

export function createPool(connectionString: string, options: {
  max?: number; statementTimeoutMs?: number; lockTimeoutMs?: number;
} = {}): Pool {
  const max = options.max ?? 4;
  const statement = options.statementTimeoutMs ?? 5_000;
  const lock = options.lockTimeoutMs ?? 1_000;
  if (![max, statement, lock].every((value) => Number.isSafeInteger(value) && value > 0) || max > 16) {
    throw new Error('Pool and timeout settings must be positive bounded integers');
  }
  const pool = new Pool({
    connectionString, max, connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000, application_name: 'pghelm',
    options: `-c statement_timeout=${statement} -c lock_timeout=${lock} -c idle_in_transaction_session_timeout=10000`,
  });
  pool.on('error', (error) => logger.error({ message: error.message }, 'Idle database connection failed'));
  return pool;
}

export async function transaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { discard = true; }
    throw error;
  } finally {
    client.release(discard);
  }
}
