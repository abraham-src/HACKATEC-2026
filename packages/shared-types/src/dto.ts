import type {
  AccessibilityPointType,
  AccessibilityStatus,
  DeviceStatus,
  DeviceType,
  DrainStatus,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  RoleName,
  RouteStatus,
  UserStatus,
} from './enums.js';
import type { GeoJsonLineString, LngLatTuple } from './geo.js';

/** All timestamps are ISO-8601 UTC strings. JSON objects are plain records. */
export type JsonObject = Record<string, unknown>;

// ───────────────────────────── Envelope ─────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ListResponse<T> {
  data: T[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; page_size: number; total: number };
}

// ───────────────────────────── Auth ─────────────────────────────

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: UserStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  /** Access-token lifetime in seconds. */
  expires_in: number;
  /** Also set as an httpOnly cookie; browsers should rely on the cookie. */
  refresh_token: string;
  user: AuthUserDto;
}

// ───────────────────────────── Devices ─────────────────────────────

export interface CameraInfoDto {
  model: string;
  location_description: string;
  stream_url: string | null;
  status: DeviceStatus;
}

export interface DrainInfoDto {
  obstruction_level: number;
  status: DrainStatus;
  last_reading_at: string | null;
}

export interface DeviceDto {
  id: string;
  device_code: string;
  type: DeviceType;
  name: string;
  latitude: number;
  longitude: number;
  status: DeviceStatus;
  last_heartbeat: string | null;
  metadata: JsonObject;
  camera: CameraInfoDto | null;
  drain: DrainInfoDto | null;
  created_at: string;
  updated_at: string;
}

export interface SensorReadingDto {
  id: string;
  device_code: string;
  value: number;
  unit: string;
  recorded_at: string;
  received_at: string;
  synced: boolean;
}

export interface ReadingInput {
  value: number;
  unit?: string;
  recorded_at: string;
  synced?: boolean;
  metadata?: JsonObject;
}

export interface ReadingIngestResult {
  device_code: string;
  received: number;
  inserted: number;
  duplicates: number;
  drain: DrainInfoDto;
}

export interface HeartbeatInput {
  status?: Extract<DeviceStatus, 'online' | 'degraded'>;
  health?: JsonObject;
}

export interface HeartbeatResult {
  device_code: string;
  status: DeviceStatus;
  received_at: string;
}

// ───────────────────────────── Incidents ─────────────────────────────

export interface IncidentDto {
  id: string;
  device_code: string | null;
  type: IncidentType;
  description: string;
  priority: IncidentPriority;
  confidence: number;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  validated_at: string | null;
  resolved_at: string | null;
  assigned_to: { id: string; name: string } | null;
  metadata: JsonObject;
}

export interface IncidentEventDto {
  id: string;
  incident_id: string;
  event_type: string;
  payload: JsonObject;
  created_at: string;
}

export interface CreateIncidentInput {
  type: IncidentType;
  description: string;
  latitude: number;
  longitude: number;
  priority?: IncidentPriority;
  confidence?: number;
  device_code?: string;
  metadata?: JsonObject;
}

// ───────────────────────────── Accessibility ─────────────────────────────

export interface AccessibilityPointDto {
  id: string;
  type: AccessibilityPointType;
  status: AccessibilityStatus;
  latitude: number;
  longitude: number;
  source: string;
  name: string | null;
  metadata: JsonObject;
  ramp: { slope: number | null; width_m: number | null } | null;
}

export interface AccessibleRouteDto {
  id: string;
  status: RouteStatus;
  name: string | null;
  origin: LngLatTuple;
  destination: LngLatTuple;
  path: GeoJsonLineString;
  length_m: number;
  created_at: string;
  metadata: JsonObject;
}

// ───────────────────────────── Rules ─────────────────────────────

export interface RuleDto {
  id: string;
  name: string;
  description: string;
  conditions: JsonObject;
  action: JsonObject;
  enabled: boolean;
  sort_order: number;
  updated_at: string;
}
