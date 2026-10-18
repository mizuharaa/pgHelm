import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { Pool } from 'pg';
import { transaction } from './db.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const vendorHash = '1f96dde1e57d0e97e6418a4e02b76fe2bf2e7688c5fbdc812160c57baba84030';
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

export async function migrate(pool: Pool, migrationDirectory?: string): Promise<void> {
  const directory = migrationDirectory ?? join(root, 'migrations');
  const migrations: { name: string; bytes: Buffer; sha256: string }[] = [];
  if (migrationDirectory === undefined) {
    const bytes = await readFile(join(root, 'vendor/pgque/pgque.sql'));
    const manifest = await readFile(join(root, 'vendor/pgque/SHA256SUMS'), 'utf8');
    if (!/^[a-f0-9]{64}  pgque\.sql\n$/.test(manifest) || manifest.slice(0, 64) !== vendorHash || digest(bytes) !== vendorHash) {
      throw new Error('Pinned PgQue installer checksum mismatch');
    }
    migrations.push({ name: '0000-pgque-v0.2.2.sql', bytes, sha256: vendorHash });
  }
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    if (!/^\d{4}-[a-z0-9-]+\.sql$/.test(name) || migrations.some((item) => item.name.slice(0, 4) === name.slice(0, 4))) {
      throw new Error(`Invalid or duplicate migration number: ${name}`);
    }
    const bytes = await readFile(join(directory, name));
    migrations.push({ name, bytes, sha256: digest(bytes) });
  }
  await transaction(pool, async (client) => {
    // Separate statement: a waiter reads the ledger only after the lock holder commits.
    await client.query('SELECT pg_advisory_xact_lock(1346848837, 1)');
    await client.query(`CREATE TABLE IF NOT EXISTS public.pghelm_migration (
      name text PRIMARY KEY, sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
      applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
    )`);
    const applied = (await client.query<{ name: string; sha256: string }>('SELECT name, sha256 FROM public.pghelm_migration ORDER BY name')).rows;
    for (const previous of applied) {
      if (migrations.find((item) => item.name === previous.name)?.sha256 !== previous.sha256) {
        throw new Error(`Applied migration checksum changed or file missing: ${previous.name}`);
      }
    }
    for (const migration of migrations) {
      if (applied.some((item) => item.name === migration.name)) continue;
      if (applied.some((item) => item.name > migration.name)) throw new Error(`Out-of-order migration: ${migration.name}`);
      await client.query(migration.bytes.toString('utf8'));
      await client.query('INSERT INTO public.pghelm_migration(name, sha256) VALUES ($1, $2)', [migration.name, migration.sha256]);
    }
  });
}
