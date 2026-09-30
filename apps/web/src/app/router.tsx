import type { RoleName } from '@simu/shared-types';
import type { ReactNode } from 'react';
import { createBrowserRouter, Link } from 'react-router-dom';
import { AppShell } from '../components/shell/AppShell';
import { ADMIN, STAFF } from '../components/shell/nav';
import { RequireAuth } from '../components/shell/RequireAuth';
import { AccessibilityPage } from '../pages/AccessibilityPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DevicesPage } from '../pages/DevicesPage';
import { IncidentsPage } from '../pages/IncidentsPage';
import { LoginPage } from '../pages/LoginPage';
import { LogsPage } from '../pages/LogsPage';
import { MaintenancePage } from '../pages/MaintenancePage';
import { MapPage } from '../pages/MapPage';
import { RulesPage } from '../pages/RulesPage';
import { UsersPage } from '../pages/UsersPage';

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

const only = (roles: readonly RoleName[], element: ReactNode) => (
  <RequireAuth roles={roles}>{element}</RequireAuth>
);

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
      { path: 'accesibilidad', element: <AccessibilityPage /> },
      { path: 'mantenimiento', element: only(STAFF, <MaintenancePage />) },
      { path: 'dispositivos', element: only(STAFF, <DevicesPage />) },
      { path: 'eventos', element: only(STAFF, <LogsPage />) },
      { path: 'reglas', element: only(ADMIN, <RulesPage />) },
      { path: 'usuarios', element: only(ADMIN, <UsersPage />) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
