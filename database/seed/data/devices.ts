import type { Prisma } from '@prisma/client';
import type { DeviceType, ZoneCode } from '@simu/shared-types';

export interface DeviceSeed {
  code: string;
  type: DeviceType;
  name: string;
  lat: number;
  lng: number;
  zone: ZoneCode;
  metadata?: Prisma.InputJsonObject;
  camera?: { model: string; locationDescription: string };
  /** Current obstruction level (percent). A 24 h reading history is generated up to it. */
  drain?: { level: number };
}

export const ZONES: Record<ZoneCode, string> = {
  'ZONE-001': 'Roma Norte',
  'ZONE-002': 'Centro Histórico',
  'ZONE-003': 'Condesa',
  'ZONE-004': 'Coyoacán',
};

const CAMERA_MODEL = 'Ray-Ban Meta (app puente + servicio IA)';

/**
 * 11 devices: 4 cameras, 4 drains, 2 traffic lights, 1 gateway.
 * CAM-001 and DRAIN-001 sit on the same corner (Álvaro Obregón y Orizaba) so
 * the combined-risk scenario (drain 88% + camera detects water) is spatially coherent.
 */
export const DEVICES: readonly DeviceSeed[] = [
  {
    code: 'CAM-001',
    type: 'camera',
    name: 'Cámara Álvaro Obregón y Orizaba',
    lat: 19.4187,
    lng: -99.1597,
    zone: 'ZONE-001',
    camera: {
      model: CAMERA_MODEL,
      locationDescription: 'Av. Álvaro Obregón esq. Orizaba, Roma Norte, Cuauhtémoc',
    },
  },
  {
    code: 'CAM-002',
    type: 'camera',
    name: 'Cámara 5 de Mayo y Zócalo',
    lat: 19.4337,
    lng: -99.1345,
    zone: 'ZONE-002',
    camera: {
      model: CAMERA_MODEL,
      locationDescription: 'Av. 5 de Mayo esq. Monte de Piedad, Centro Histórico',
    },
  },
  {
    code: 'CAM-003',
    type: 'camera',
    name: 'Cámara Av. México · Parque México',
    lat: 19.4125,
    lng: -99.17,
    zone: 'ZONE-003',
    camera: {
      model: CAMERA_MODEL,
      locationDescription: 'Av. México frente a Parque México, Hipódromo Condesa',
    },
  },
  {
    code: 'CAM-004',
    type: 'camera',
    name: 'Cámara Jardín Centenario',
    lat: 19.3503,
    lng: -99.1625,
    zone: 'ZONE-004',
    camera: {
      model: CAMERA_MODEL,
      locationDescription: 'Jardín Centenario, Coyoacán',
    },
  },
  {
    code: 'DRAIN-001',
    type: 'drain',
    name: 'Coladera Álvaro Obregón y Orizaba',
    lat: 19.41855,
    lng: -99.15955,
    zone: 'ZONE-001',
    metadata: { sensor: 'HC-SR04', link: 'usb-serial', gateway: 'GW-001' },
    drain: { level: 35 },
  },
  {
    code: 'DRAIN-002',
    type: 'drain',
    name: 'Coladera 5 de Febrero y Venustiano Carranza',
    lat: 19.431,
    lng: -99.1337,
    zone: 'ZONE-002',
    metadata: { sensor: 'HC-SR04', link: 'usb-serial', gateway: 'GW-001' },
    drain: { level: 64 },
  },
  {
    code: 'DRAIN-003',
    type: 'drain',
    name: 'Coladera Av. Michoacán y Av. México',
    lat: 19.4107,
    lng: -99.1688,
    zone: 'ZONE-003',
    metadata: { sensor: 'HC-SR04', link: 'usb-serial', gateway: 'GW-001' },
    drain: { level: 12 },
  },
  {
    code: 'DRAIN-004',
    type: 'drain',
    name: 'Coladera Francisco Sosa y Centenario',
    lat: 19.3497,
    lng: -99.164,
    zone: 'ZONE-004',
    metadata: { sensor: 'HC-SR04', link: 'usb-serial', gateway: 'GW-001' },
    drain: { level: 48 },
  },
  {
    code: 'TL-001',
    type: 'traffic_light',
    name: 'Semáforo Insurgentes y Álvaro Obregón',
    lat: 19.4183,
    lng: -99.1628,
    zone: 'ZONE-001',
    metadata: { phases: 4, pedestrian_signal: true, audible_signal: true },
  },
  {
    code: 'TL-002',
    type: 'traffic_light',
    name: 'Semáforo Eje Central y Madero',
    lat: 19.4341,
    lng: -99.1412,
    zone: 'ZONE-002',
    metadata: { phases: 3, pedestrian_signal: true, audible_signal: false },
  },
  {
    code: 'GW-001',
    type: 'gateway',
    name: 'Gateway laptop Roma Norte',
    lat: 19.4186,
    lng: -99.1594,
    zone: 'ZONE-001',
    metadata: { role: 'store-and-forward', store: 'sqlite', inputs: ['usb-serial'] },
  },
];
