# API

Base URL:

- Directa: `http://localhost:3000`
- Vía web (nginx o Vite dev): `http://localhost:5173/api`

Este documento crece fase por fase. Aquí solo se describen los endpoints ya implementados. El contrato completo previsto está en la especificación del proyecto, sección 4.

## Implementado

### `GET /health`

Estado de la API, de la base de datos y de PostGIS. No requiere autenticación. Responde `200` si todo está bien y `503` si la base no responde.

```bash
curl -s http://localhost:3000/health
```

```json
{
  "service": "simu-api",
  "version": "0.1.0",
  "uptime_s": 42,
  "ts": "2026-09-29T21:30:00.000Z",
  "status": "ok",
  "db": "up",
  "postgis": "3.4.2"
}
```

## Contratos compartidos ya definidos

Están en `packages/shared-types` y los usan la API, el simulador y la web.

Mensaje WebSocket (`/ws`, Fase 2):

```json
{ "channel": "incidents", "event": "created", "data": {}, "ts": "2026-09-29T15:30:00Z" }
```

Canales: `devices:status`, `drain-readings`, `incidents`, `camera-events`, `alerts`, `heartbeats`.

Evento de cámara:

```json
{ "device_id": "CAM-001", "event_type": "WATER_ACCUMULATION", "confidence": 0.92, "location_id": "ZONE-001", "priority": "HIGH" }
```

Lectura de coladera. El gateway convierte la línea serial `DRAIN001,78` con `serialLineToDrainReading` a:

```json
{ "device_code": "DRAIN-001", "value": 78, "unit": "percent", "recorded_at": "2026-09-29T15:30:00Z" }
```
