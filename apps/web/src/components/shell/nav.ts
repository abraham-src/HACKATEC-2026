import type { RoleName } from '@simu/shared-types';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Map as MapIcon, SlidersHorizontal } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: readonly RoleName[];
  /** Opens outside the SPA router (e.g. the simulator panel). */
  external?: boolean;
}

const ALL: readonly RoleName[] = ['admin', 'operator', 'maintenance', 'citizen'];

/** Each view is added here in the phase that builds it. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
  { to: '/mapa', label: 'Mapa', icon: MapIcon, roles: ALL },
  {
    to: '/simulator/control',
    label: 'Simulador de campo',
    icon: SlidersHorizontal,
    roles: ['admin', 'operator'],
    external: true,
  },
];
