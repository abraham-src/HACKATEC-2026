import type { RoleName } from '@simu/shared-types';
import type { LucideIcon } from 'lucide-react';
import { CircleAlert, Cpu, LayoutDashboard, Map as MapIcon, SlidersHorizontal } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: readonly RoleName[];
  /** Opens outside the SPA router (e.g. the simulator panel). */
  external?: boolean;
}

const ALL: readonly RoleName[] = ['admin', 'operator', 'maintenance', 'citizen'];
export const STAFF: readonly RoleName[] = ['admin', 'operator', 'maintenance'];

/** Each view is added here in the phase that builds it. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
  { to: '/mapa', label: 'Mapa', icon: MapIcon, roles: ALL },
  { to: '/incidencias', label: 'Incidencias', icon: CircleAlert, roles: ALL },
  { to: '/dispositivos', label: 'Dispositivos', icon: Cpu, roles: STAFF },
  {
    to: '/simulator/control',
    label: 'Simulador de campo',
    icon: SlidersHorizontal,
    roles: ['admin', 'operator'],
    external: true,
  },
];
