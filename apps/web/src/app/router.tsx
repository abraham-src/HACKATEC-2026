import { createBrowserRouter, Link } from 'react-router-dom';
import { AppShell } from '../components/shell/AppShell';
import { STAFF } from '../components/shell/nav';
import { RequireAuth } from '../components/shell/RequireAuth';
import { DashboardPage } from '../pages/DashboardPage';
import { DevicesPage } from '../pages/DevicesPage';
import { IncidentsPage } from '../pages/IncidentsPage';
import { LoginPage } from '../pages/LoginPage';
import { MapPage } from '../pages/MapPage';

function NotFound() {
  return (
    <div className="p-6">
      <p className="font-mono text-[12px] text-fg-muted">404 · Vista no encontrada</p>
      <Link to="/" className="mt-2 inline-block text-[#58a6ff] hover:underline">
        Volver al dashboard
      </Link>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'mapa', element: <MapPage /> },
      { path: 'incidencias', element: <IncidentsPage /> },
      {
        path: 'dispositivos',
        element: (
          <RequireAuth roles={STAFF}>
            <DevicesPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
