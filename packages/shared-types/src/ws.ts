export const WS_CHANNELS = [
  'devices:status',
  'drain-readings',
  'incidents',
  'camera-events',
  'alerts',
  'heartbeats',
] as const;
export type WsChannel = (typeof WS_CHANNELS)[number];

export interface WsMessage<TData = unknown> {
  channel: WsChannel;
  event: string;
  data: TData;
  /** ISO-8601 UTC timestamp. */
  ts: string;
}

export type WsClientMessage = { subscribe: WsChannel } | { unsubscribe: WsChannel };
