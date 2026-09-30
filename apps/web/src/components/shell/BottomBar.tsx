import { Activity } from 'lucide-react';
import type { FeedSeverity } from '../../lib/describe-event';
import { formatTime } from '../../lib/format';
import { useLive } from '../../stores/live';

export const SEVERITY_TEXT: Record<FeedSeverity, string> = {
  info: 'text-fg-muted',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-critical',
  critical: 'text-critical',
};

/** Live strip: latest events (fade in) and heartbeat counter. Expanded into a timeline in Phase 7. */
export function BottomBar() {
  const feed = useLive((s) => s.feed);
  const heartbeats = useLive((s) => s.heartbeatCount);
  const lastHeartbeat = useLive((s) => s.lastHeartbeatAt);

  return (
    <footer className="col-span-2 flex h-7 items-center gap-3 overflow-hidden border-t border-line bg-surface px-3 font-mono text-[11px]">
      <span className="flex shrink-0 items-center gap-1.5 uppercase tracking-wider text-fg-muted">
        <Activity size={12} strokeWidth={1.5} aria-hidden /> Eventos
      </span>
      <ol className="flex min-w-0 flex-1 items-center gap-5 overflow-hidden" aria-live="polite">
        {feed.length === 0 && <li className="text-fg-muted">Esperando eventos en vivo…</li>}
        {feed.slice(0, 4).map((item) => (
          <li
            key={item.id}
            className="flex shrink-0 animate-fade-in items-center gap-2 whitespace-nowrap"
          >
            <time className="text-fg-muted">{formatTime(item.ts)}</time>
            <span className="text-fg">{item.subject}</span>
            <span className={SEVERITY_TEXT[item.severity]}>{item.text}</span>
          </li>
        ))}
      </ol>
      <span className="shrink-0 text-fg-muted" title="Heartbeats recibidos en esta sesión">
        HB {heartbeats} · último {formatTime(lastHeartbeat)}
      </span>
    </footer>
  );
}
