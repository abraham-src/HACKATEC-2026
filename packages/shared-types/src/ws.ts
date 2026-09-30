import type { DeviceStatus, DrainStatus, RoleName } from './enums.js';

export const WS_CHANNELS = [
  'devices:status',
  'drain-readings',
  'incidents',
  'camera-events',
  'alerts',
  'heartbeats',
] as const;
export type WsChannel = (typeof WS_CHANNELS)[number];

/** Channels each role may subscribe to. Citizens only see public incident/alert feeds. */
export const WS_CHANNELS_BY_ROLE: Record<RoleName, readonly WsChannel[]> = {
  admin: WS_CHANNELS,
  operator: WS_CHANNELS,
  maintenance: WS_CHANNELS,
  citizen: ['incidents', 'alerts'],
};

/** Data message pushed by the server on a channel. */
export interface WsMessage<TData = unknown> {
  channel: WsChannel;
  event: string;
  data: TData;
  /** ISO-8601 UTC timestamp. */
  ts: string;
}

/** Control messages (connection lifecycle, acks, errors). They never carry `channel` data. */
export type WsControlMessage =
  | { type: 'welcome'; allowed_channels: WsChannel[]; ts: string }
  | { type: 'subscribed' | 'unsubscribed'; channel: WsChannel; ts: string }
  | { type: 'pong'; ts: string }
  | { type: 'error'; message: string; ts: string };

export type WsClientMessage =
  { subscribe: WsChannel } | { unsubscribe: WsChannel } | { ping: true };

// ── Channel payloads ──

export interface DeviceStatusEvent {
  device_code: string;
  status: DeviceStatus;
  previous_status: DeviceStatus;
  last_heartbeat: string | null;
  reason: string | null;
}

export interface HeartbeatEvent {
  device_code: string;
  status: DeviceStatus;
  received_at: string;
}

export interface DrainReadingEvent {
  device_code: string;
  value: number;
  recorded_at: string;
  synced: boolean;
  obstruction_level: number;
  drain_status: DrainStatus;
  /** >1 when a store-and-forward batch was delivered. */
  batch_size: number;
}
