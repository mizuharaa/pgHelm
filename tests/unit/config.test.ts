import { describe, expect, it } from 'vitest';
import { readConfig, validateLocalDatabaseUrl } from '../../src/config.js';

describe('local-only configuration', () => {
  it('accepts the dedicated development database and bounded defaults', () => {
    expect(readConfig({ DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/pghelm' })).toMatchObject({
      queue: 'pghelm_demo', consumer: 'pghelm_demo_consumer', poolMax: 4,
    });
  });
  it.each([
    'postgresql://u:p@remote.example/pghelm',
    'postgresql://u:p@localhost/production',
    'postgresql://u:p@localhost/pghelm?host=remote.example',
    'postgresql://u:p@localhost/pghelm?options=-c%20statement_timeout=0',
    'https://localhost/pghelm',
    'postgresql://localhost/pghelm',
  ])('rejects unsafe connection input %s', (value) => {
    expect(() => validateLocalDatabaseUrl(value)).toThrow();
  });
  it('requires explicit connection configuration and rejects invalid bounds', () => {
    expect(() => readConfig({})).toThrow();
    expect(() => readConfig({ DATABASE_URL: 'postgresql://u:p@localhost/pghelm', POOL_MAX: '0' })).toThrow();
  });
  it('enforces the pinned PgQue 57-byte queue-name ceiling', () => {
    const env = { DATABASE_URL: 'postgresql://u:p@localhost/pghelm', QUEUE_NAME: 'q'.repeat(57) };
    expect(readConfig(env).queue).toHaveLength(57);
    expect(() => readConfig({ ...env, QUEUE_NAME: 'q'.repeat(58) })).toThrow();
  });
});
