import type { HealthResponse } from '@simu/shared-types';
import { useEffect, useState } from 'react';

type Probe =
  | { state: 'loading' }
  | { state: 'ok'; health: HealthResponse; checkedAt: Date }
  | { state: 'server-down'; checkedAt: Date; health?: HealthResponse }
  | { state: 'offline'; checkedAt: Date };

const POLL_MS = 10_000;

async function fetchHealth(): Promise<Probe> {
  const checkedAt = new Date();
  if (!navigator.onLine) return { state: 'offline', checkedAt };
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
    const health = (await res.json()) as HealthResponse;
    return res.ok ? { state: 'ok', health, checkedAt } : { state: 'server-down', health, checkedAt };
  } catch {
    return { state: 'server-down', checkedAt };
  }
}

const fmtTime = (d: Date): string =>
  d.toLocaleTimeString('es-MX', { hour12: false, timeZone: 'America/Mexico_City' });

function StatusChip({ ok, label }: { ok: boolean | null; label: string }) {
  const tone =
    ok === null
      ? 'border-line text-fg-muted'
      : ok
        ? 'border-ok/50 text-ok'
        : 'border-danger/60 text-critical';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-px font-mono text-[11px] uppercase ${tone}`}
    >
      <span
        className={`size-1.5 ${ok === null ? 'bg-fg-muted' : ok ? 'bg-ok' : 'bg-critical'}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function App() {
  const [probe, setProbe] = useState<Probe>({ state: 'loading' });

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const next = await fetchHealth();
      if (alive) setProbe(next);
    };
    void run();
    const timer = window.setInterval(() => void run(), POLL_MS);
    window.addEventListener('online', run);
    window.addEventListener('offline', run);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('online', run);
      window.removeEventListener('offline', run);
    };
  }, []);

  const health = probe.state === 'ok' || probe.state === 'server-down' ? probe.health : undefined;
  const rows: Array<{ service: string; ok: boolean | null; label: string; detail: string }> = [
    {
      service: 'API',
      ok: probe.state === 'loading' ? null : probe.state === 'ok',
      label: probe.state === 'loading' ? 'verificando' : probe.state === 'ok' ? 'en línea' : 'caída',
      detail: health ? `${health.service} v${health.version} · uptime ${health.uptime_s}s` : '—',
    },
    {
      service: 'PostgreSQL',
      ok: health ? health.db === 'up' : probe.state === 'loading' ? null : false,
      label: health ? (health.db === 'up' ? 'en línea' : 'caída') : 'sin dato',
      detail: health?.db === 'up' ? 'conexión Prisma OK' : '—',
    },
    {
      service: 'PostGIS',
      ok: health ? health.postgis !== null : probe.state === 'loading' ? null : false,
      label: health?.postgis ? 'activo' : 'sin dato',
      detail: health?.postgis ? `lib ${health.postgis}` : '—',
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {probe.state === 'offline' && (
        <div role="alert" className="border-b border-warn/40 bg-warn/10 px-4 py-1.5 text-warn">
          Sin conexión — mostrando últimos datos
        </div>
      )}
      {probe.state === 'server-down' && (
        <div role="alert" className="border-b border-danger/40 bg-danger/10 px-4 py-1.5 text-critical">
          Servidor no disponible, mostrando últimos datos
        </div>
      )}

      <header className="flex h-10 items-center justify-between border-b border-line bg-surface px-4">
        <span className="font-mono text-[13px] font-medium tracking-wide">SIMU · CDMX</span>
        <span className="font-mono text-[11px] text-fg-muted">
          {probe.state === 'loading' ? '—' : `verificado ${fmtTime(probe.checkedAt)}`}
        </span>
      </header>

      <main className="p-4">
        <h1 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
          Estado de servicios
        </h1>
        <table className="w-full max-w-3xl border border-line text-left">
          <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-fg-muted">
            <tr>
              <th className="border-b border-line px-3 py-1.5 font-medium">Servicio</th>
              <th className="border-b border-line px-3 py-1.5 font-medium">Estado</th>
              <th className="border-b border-line px-3 py-1.5 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.service} className="border-b border-line last:border-b-0">
                <td className="px-3 py-1.5">{r.service}</td>
                <td className="px-3 py-1.5">
                  {probe.state === 'loading' ? (
                    <span className="block h-3.5 w-20 animate-pulse bg-surface-2" />
                  ) : (
                    <StatusChip ok={r.ok} label={r.label} />
                  )}
                </td>
                <td className="px-3 py-1.5 font-mono text-[12px] text-fg-muted">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
