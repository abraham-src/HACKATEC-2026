import type { AccessibilityPointType, AccessibilityStatus, RouteStatus, ZoneCode } from '@simu/shared-types';

export interface AccessibilityPointSeed {
  key: string;
  type: AccessibilityPointType;
  status: AccessibilityStatus;
  name: string;
  zone: ZoneCode;
  lat: number;
  lng: number;
  /** Only for ramps: slope (%) and width (m). */
  ramp?: { slope: number | null; widthM: number | null };
}

/**
 * 30 mock accessibility points on real streets of Roma Norte, Centro Histórico,
 * Condesa and Coyoacán. Coordinates are approximate (±15 m); source = seed_mock.
 */
export const ACCESSIBILITY_POINTS: readonly AccessibilityPointSeed[] = [
  // ── Roma Norte (ZONE-001) — scenario 5 happens here ──
  { key: 'roma-ramp-obregon-orizaba-ne', type: 'ramp', status: 'available', name: 'Rampa Álvaro Obregón y Orizaba, esquina NE', zone: 'ZONE-001', lat: 19.4188, lng: -99.1595, ramp: { slope: 6.0, widthM: 1.2 } },
  { key: 'roma-ramp-obregon-orizaba-so', type: 'ramp', status: 'available', name: 'Rampa Álvaro Obregón y Orizaba, esquina SO', zone: 'ZONE-001', lat: 19.4185, lng: -99.15995, ramp: { slope: 7.5, widthM: 1.1 } },
  { key: 'roma-cross-obregon-orizaba', type: 'crosswalk', status: 'available', name: 'Cruce peatonal Álvaro Obregón / Orizaba', zone: 'ZONE-001', lat: 19.41866, lng: -99.15972 },
  { key: 'roma-ramp-orizaba-colima', type: 'ramp', status: 'damaged', name: 'Rampa Orizaba y Colima, esquina NE (fracturada)', zone: 'ZONE-001', lat: 19.4201, lng: -99.1589, ramp: { slope: 11.0, widthM: 0.9 } },
  { key: 'roma-sidewalk-orizaba', type: 'sidewalk', status: 'available', name: 'Banqueta Orizaba entre Colima y Álvaro Obregón (poniente)', zone: 'ZONE-001', lat: 19.41945, lng: -99.15925 },
  { key: 'roma-cross-obregon-cordoba', type: 'crosswalk', status: 'available', name: 'Cruce peatonal Álvaro Obregón / Córdoba', zone: 'ZONE-001', lat: 19.419, lng: -99.1573 },
  { key: 'roma-ramp-obregon-cordoba-se', type: 'ramp', status: 'available', name: 'Rampa Álvaro Obregón y Córdoba, esquina SE', zone: 'ZONE-001', lat: 19.4189, lng: -99.15715, ramp: { slope: 5.5, widthM: 1.5 } },
  { key: 'roma-obstacle-obregon-works', type: 'obstacle', status: 'blocked', name: 'Obra en banqueta Álvaro Obregón entre Orizaba y Córdoba', zone: 'ZONE-001', lat: 19.4189, lng: -99.1585 },
  { key: 'roma-route-obregon-median', type: 'accessible_route', status: 'available', name: 'Camellón de Álvaro Obregón (ruta accesible)', zone: 'ZONE-001', lat: 19.41875, lng: -99.1586 },

  // ── Centro Histórico (ZONE-002) ──
  { key: 'centro-ramp-madero-eje', type: 'ramp', status: 'available', name: 'Rampa Madero y Eje Central, esquina SE', zone: 'ZONE-002', lat: 19.434, lng: -99.141, ramp: { slope: 6.5, widthM: 1.4 } },
  { key: 'centro-cross-eje-madero', type: 'crosswalk', status: 'available', name: 'Cruce peatonal Eje Central / Madero', zone: 'ZONE-002', lat: 19.4341, lng: -99.14115 },
  { key: 'centro-route-madero', type: 'accessible_route', status: 'available', name: 'Calle Madero peatonal (Eje Central → Zócalo)', zone: 'ZONE-002', lat: 19.4339, lng: -99.138 },
  { key: 'centro-ramp-madero-motolinia', type: 'ramp', status: 'available', name: 'Rampa Madero y Motolinía', zone: 'ZONE-002', lat: 19.43385, lng: -99.1369, ramp: { slope: 5.0, widthM: 1.6 } },
  { key: 'centro-sidewalk-5mayo', type: 'sidewalk', status: 'damaged', name: 'Banqueta 5 de Mayo norte entre Bolívar e Isabel la Católica', zone: 'ZONE-002', lat: 19.4348, lng: -99.1376 },
  { key: 'centro-cross-5mayo-montepiedad', type: 'crosswalk', status: 'available', name: 'Cruce peatonal 5 de Mayo / Monte de Piedad', zone: 'ZONE-002', lat: 19.4342, lng: -99.1347 },
  { key: 'centro-disabled-zocalo', type: 'temporarily_disabled', status: 'blocked', name: 'Rampa Plaza de la Constitución (cerrada por evento)', zone: 'ZONE-002', lat: 19.433, lng: -99.133 },
  { key: 'centro-ramp-pinosuarez', type: 'ramp', status: 'available', name: 'Rampa Pino Suárez y Venustiano Carranza', zone: 'ZONE-002', lat: 19.4308, lng: -99.1328, ramp: { slope: 7.0, widthM: 1.2 } },

  // ── Condesa (ZONE-003) ──
  { key: 'condesa-ramp-mexico-michoacan', type: 'ramp', status: 'available', name: 'Rampa Av. México y Michoacán, esquina NE', zone: 'ZONE-003', lat: 19.4108, lng: -99.1686, ramp: { slope: 6.0, widthM: 1.3 } },
  { key: 'condesa-cross-michoacan-mexico', type: 'crosswalk', status: 'available', name: 'Cruce peatonal Michoacán / Av. México', zone: 'ZONE-003', lat: 19.4107, lng: -99.16875 },
  { key: 'condesa-sidewalk-amsterdam', type: 'sidewalk', status: 'available', name: 'Banqueta Av. Amsterdam (tramo oriente)', zone: 'ZONE-003', lat: 19.414, lng: -99.168 },
  { key: 'condesa-obstacle-amsterdam-roots', type: 'obstacle', status: 'blocked', name: 'Raíces levantan banqueta en Av. Amsterdam', zone: 'ZONE-003', lat: 19.4146, lng: -99.1695 },
  { key: 'condesa-ramp-tamaulipas-michoacan', type: 'ramp', status: 'unknown', name: 'Rampa Tamaulipas y Michoacán', zone: 'ZONE-003', lat: 19.4101, lng: -99.1717, ramp: { slope: null, widthM: null } },
  { key: 'condesa-route-parque-mexico', type: 'accessible_route', status: 'available', name: 'Circuito interior Parque México', zone: 'ZONE-003', lat: 19.4119, lng: -99.1692 },
  { key: 'condesa-cross-sonora-mexico', type: 'crosswalk', status: 'available', name: 'Cruce peatonal Sonora / Av. México', zone: 'ZONE-003', lat: 19.4143, lng: -99.1703 },

  // ── Coyoacán (ZONE-004) ──
  { key: 'coyoacan-ramp-centenario', type: 'ramp', status: 'available', name: 'Rampa Jardín Centenario, acceso Carrillo Puerto', zone: 'ZONE-004', lat: 19.3501, lng: -99.1628, ramp: { slope: 6.0, widthM: 1.5 } },
  { key: 'coyoacan-cross-centenario-sosa', type: 'crosswalk', status: 'available', name: 'Cruce peatonal Centenario / Francisco Sosa', zone: 'ZONE-004', lat: 19.3498, lng: -99.1637 },
  { key: 'coyoacan-sidewalk-sosa', type: 'sidewalk', status: 'damaged', name: 'Banqueta Francisco Sosa (adoquín irregular)', zone: 'ZONE-004', lat: 19.3496, lng: -99.1652 },
  { key: 'coyoacan-disabled-hidalgo', type: 'temporarily_disabled', status: 'blocked', name: 'Rampa Plaza Hidalgo (tianguis dominical)', zone: 'ZONE-004', lat: 19.3496, lng: -99.1619 },
  { key: 'coyoacan-obstacle-allende', type: 'obstacle', status: 'blocked', name: 'Puesto semifijo sobre banqueta de Allende', zone: 'ZONE-004', lat: 19.3509, lng: -99.1615 },
  { key: 'coyoacan-ramp-allende-malintzin', type: 'ramp', status: 'available', name: 'Rampa Allende y Malintzin', zone: 'ZONE-004', lat: 19.3518, lng: -99.1612, ramp: { slope: 8.0, widthM: 1.0 } },
];

export interface AccessibleRouteSeed {
  key: string;
  name: string;
  status: RouteStatus;
  /** [lng, lat] vertices; first = origin, last = destination. */
  path: ReadonlyArray<readonly [number, number]>;
}

export const ACCESSIBLE_ROUTES: readonly AccessibleRouteSeed[] = [
  {
    key: 'route-roma-orizaba-cordoba',
    name: 'Orizaba (Colima) → Álvaro Obregón y Córdoba por camellón',
    status: 'active',
    path: [
      [-99.1589, 19.4201],
      [-99.15925, 19.41945],
      [-99.15972, 19.41866],
      [-99.1586, 19.41875],
      [-99.1573, 19.419],
    ],
  },
  {
    key: 'route-centro-madero',
    name: 'Eje Central → Zócalo por Madero peatonal',
    status: 'active',
    path: [
      [-99.14115, 19.4341],
      [-99.138, 19.4339],
      [-99.1369, 19.43385],
      [-99.1347, 19.4342],
    ],
  },
];
