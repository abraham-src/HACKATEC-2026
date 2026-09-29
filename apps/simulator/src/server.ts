import type { HealthResponse } from '@simu/shared-types';
import Fastify from 'fastify';
import { loadConfig } from './config.js';

/**
 * Phase 1: process skeleton — config, health endpoint and API reachability probe.
 * Phase 4 adds the drain/camera emitters, SQLite store-and-forward and /control.
 */
const config = loadConfig();
const app = Fastify({ logger: { level: config.LOG_LEVEL } });

let apiReachable = false;
let lastApiCheck: string | null = null;

async function probeApi(): Promise<void> {
  try {
    const res = await fetch(new URL('/health', config.SIMULATOR_API_URL), {
      signal: AbortSignal.timeout(3000),
    });
    const body = (await res.json()) as HealthResponse;
    apiReachable = res.ok && body.status === 'ok';
  } catch {
    apiReachable = false;
  }
  lastApiCheck = new Date().toISOString();
}

app.get('/health', async () => ({
  status: 'ok',
  service: 'simu-simulator',
  api_url: config.SIMULATOR_API_URL,
  api_reachable: apiReachable,
  last_api_check: lastApiCheck,
  ts: new Date().toISOString(),
}));

const probeTimer = setInterval(() => void probeApi(), 10_000);

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'shutting down');
  clearInterval(probeTimer);
  await app.close();
  process.exit(0);
}
process.once('SIGINT', (s) => void shutdown(s));
process.once('SIGTERM', (s) => void shutdown(s));

await app.listen({ host: config.SIMULATOR_HOST, port: config.SIMULATOR_PORT });
await probeApi();
app.log.info({ apiReachable, api: config.SIMULATOR_API_URL }, 'initial API probe');
