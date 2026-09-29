import { z } from 'zod';

const EnvSchema = z.object({
  SIMULATOR_HOST: z.string().default('0.0.0.0'),
  SIMULATOR_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  SIMULATOR_API_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type SimulatorConfig = z.infer<typeof EnvSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SimulatorConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuración del simulador inválida:\n${issues}`);
  }
  return parsed.data;
}
