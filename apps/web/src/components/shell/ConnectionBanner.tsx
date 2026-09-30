import { useEffect } from 'react';
import { API_BASE } from '../../lib/api';
import { useConnection } from '../../stores/connection';
import { TopBanner } from '../ui/Feedback';

/**
 * Distinguishes "this computer is offline" from "online but the server is down"
 * (spec §6.3 / §7.3). While the server is down it probes /health to recover.
 */
export function ConnectionBanner() {
  const browserOnline = useConnection((s) => s.browserOnline);
  const serverReachable = useConnection((s) => s.serverReachable);

  useEffect(() => {
    if (!browserOnline || serverReachable !== false) return;
    const timer = window.setInterval(() => {
      fetch(`${API_BASE}/health`)
        .then((r) => {
          if (r.ok) useConnection.getState().setServerReachable(true);
        })
        .catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [browserOnline, serverReachable]);

  if (!browserOnline)
    return <TopBanner tone="warn">Sin conexión — mostrando últimos datos</TopBanner>;
  if (serverReachable === false) {
    return <TopBanner tone="danger">Servidor no disponible, mostrando últimos datos</TopBanner>;
  }
  return null;
}
