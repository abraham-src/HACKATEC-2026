import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);
const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(apiDir, '../..');

/** Every application table (never _prisma_migrations or PostGIS's spatial_ref_sys). */
const TABLES = [
  'refresh_tokens',
  'incident_events',
  'incidents',
  'heartbeats',
  'sensor_readings',
  'cameras',
  'drains',
  'devices',
  'ramps',
  'accessibility_points',
  'accessible_routes',
  'rules',
  'users',
  'roles',
];

/**
 * Prepares TEST_DATABASE_URL: applies migrations, truncates all data and re-runs the
 * real seed, so every test run starts from the same known state.
 * Without TEST_DATABASE_URL the integration suites skip themselves.
 */
export default async function setup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    console.warn('[test] TEST_DATABASE_URL no definido: se omiten las pruebas de integración');
    return;
  }
  if (url === process.env.DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL no puede ser igual a DATABASE_URL (se truncaría la base de desarrollo)',
    );
  }

  const env = { ...process.env, DATABASE_URL: url };
  const prismaCli = require.resolve('prisma/build/index.js');
  const tsxCli = require.resolve('tsx/cli');

  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: apiDir,
    env,
    stdio: 'pipe',
  });

  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    // Static identifiers only; no user input reaches this statement.
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
  } finally {
    await prisma.$disconnect();
  }

  execFileSync(process.execPath, [tsxCli, path.join(repoRoot, 'database/seed/seed.ts')], {
    cwd: apiDir,
    env,
    stdio: 'pipe',
  });
}
