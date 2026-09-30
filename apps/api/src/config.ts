import { z } from 'zod';

const emptyToUndefined = (v: unknown): unknown => (v === '' ? undefined : v);

const DURATION = /^(\d+)([smhd])$/;
const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86_400 } as const;

/** Parses "15m", "7d", "3600s", "12h" into seconds. */
export function parseDurationSeconds(value: string): number {
  const match = DURATION.exec(value);
  if (!match) throw new RangeError(`Duración inválida: ${value}`);
  const [, amount, unit] = match as unknown as [string, string, keyof typeof UNIT_SECONDS];
  return Number(amount) * UNIT_SECONDS[unit];
}

const duration = z
  .string()
  .regex(DURATION, 'usa el formato <n>[s|m|h|d], por ejemplo 15m o 7d')
  .transform(parseDurationSeconds);

const booleanString = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((v) => v === 'true' || v === '1');

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  /** Seconds. */
  JWT_ACCESS_TTL: duration.default('15m'),
  /** Seconds. */
  JWT_REFRESH_TTL: duration.default('7d'),
  /** Shared secret sent by gateways/simulator in the `x-device-key` header. */
  DEVICE_INGEST_KEY: z.string().min(16, 'DEVICE_INGEST_KEY debe tener al menos 16 caracteres'),
  /** Set to true when the web is served over HTTPS. */
  COOKIE_SECURE: booleanString,
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  AI_SERVICE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
});

export type Config = z.infer<typeof EnvSchema>;

/** Parses and validates the environment. Throws a readable error listing every problem. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${issues}`);
  }
  return parsed.data;
}
