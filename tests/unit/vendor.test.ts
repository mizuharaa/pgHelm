import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

beforeAll(async () => {
  await promisify(execFile)(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json'], {
    cwd: root, windowsHide: true,
  });
}, 30_000);

describe('pinned installer file integrity', () => {
  it.each(['unmodified', 'installer bytes', 'malformed manifest', 'wrong manifest digest'])(
    'checks %s before acquiring a database connection', async (mutation) => {
      const temporaryRoot = await mkdtemp(join(tmpdir(), 'pghelm-vendor-'));
      const pool = new Pool();
      const connect = vi.spyOn(pool, 'connect').mockImplementation(() => {
        throw new Error('database boundary reached');
      });
      try {
        await mkdir(join(temporaryRoot, 'dist'));
        await mkdir(join(temporaryRoot, 'vendor/pgque'), { recursive: true });
        await mkdir(join(temporaryRoot, 'migrations'));
        await writeFile(join(temporaryRoot, 'package.json'), '{"type":"module"}');
        await symlink(join(root, 'node_modules'), join(temporaryRoot, 'node_modules'), 'junction');
        for (const name of ['db.js', 'migrate.js']) {
          await copyFile(join(root, 'dist', name), join(temporaryRoot, 'dist', name));
        }
        for (const name of ['pgque.sql', 'SHA256SUMS']) {
          await copyFile(join(root, 'vendor/pgque', name), join(temporaryRoot, 'vendor/pgque', name));
        }
        const manifestPath = join(temporaryRoot, 'vendor/pgque/SHA256SUMS');
        if (mutation === 'installer bytes') {
          const installerPath = join(temporaryRoot, 'vendor/pgque/pgque.sql');
          await writeFile(installerPath, `${await readFile(installerPath, 'utf8')}\n-- changed\n`);
        } else if (mutation === 'malformed manifest') {
          const manifest = await readFile(manifestPath, 'utf8');
          await writeFile(manifestPath, manifest.slice(1));
        } else if (mutation === 'wrong manifest digest') {
          await writeFile(manifestPath, `${'0'.repeat(64)}  pgque.sql\n`);
        }
        const moduleUrl = pathToFileURL(join(temporaryRoot, 'dist/migrate.js')).href;
        const { migrate } = await import(/* @vite-ignore */ moduleUrl) as typeof import('../../src/migrate.js');
        await expect(migrate(pool)).rejects.toThrow(mutation === 'unmodified'
          ? 'database boundary reached'
          : 'Pinned PgQue installer checksum mismatch');
        expect(connect).toHaveBeenCalledTimes(mutation === 'unmodified' ? 1 : 0);
      } finally {
        connect.mockRestore();
        await pool.end();
        await rm(temporaryRoot, { recursive: true, force: true });
      }
    },
  );
});
