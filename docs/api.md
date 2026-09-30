# API

Base URL:

- Directa: `http://localhost:3000`
- Vía web (nginx en Docker o Vite en desarrollo): `http://localhost:5173/api`

Los contratos de respuesta (DTO) están tipados en [`packages/shared-types/src/dto.ts`](../packages/shared-types/src/dto.ts).

## Convenciones

- JSON en `snake_case`. Fechas en ISO-8601 UTC.
- Listas simples: `{ "data": [...] }`. Listas paginadas: `{ "data": [...], "meta": { "page", "page_size", "total" } }`.
- `?format=geojson` en listados de puntos devuelve un `FeatureCollection` listo para MapLibre.
- Filtros múltiples separados por coma: `?status=pending,validated`.
- `bbox=minLng,minLat,maxLng,maxLat` en EPSG:4326.

### Errores

Todas las respuestas de error tienen la misma forma:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": [{ "path": "email", "message": "correo inválido" }]
  }
}
```

| HTTP | `code`                            | Cuándo                                              |
| ---- | --------------------------------- | --------------------------------------------------- |
| 400  | `VALIDATION_ERROR`, `BAD_REQUEST` | Entrada inválida                                    |
| 401  | `UNAUTHORIZED`                    | Sin token, token inválido o expirado                |
| 403  | `FORBIDDEN`                       | El rol no puede hacer esa acción                    |
| 404  | `NOT_FOUND`                       | Recurso o ruta inexistente                          |
| 409  | `CONFLICT`                        | Transición de estado inválida o edición concurrente |
| 429  | `RATE_LIMITED`                    | Demasiados intentos de login                        |
| 501  | `NOT_IMPLEMENTED`                 | Funcionalidad de una fase futura                    |

## Autenticación

- **Usuarios:** `Authorization: Bearer <access_token>`. El token de acceso dura 15 min.
- **Refresh:** dura 7 días, rota en cada uso y se guarda como cookie `simu_rt` (httpOnly, SameSite=Strict). Si alguien reutiliza un refresh ya rotado, se revocan todas las sesiones de ese usuario.
- **Dispositivos:** gateway y simulador envían `x-device-key: <DEVICE_INGEST_KEY>`. Solo sirve para heartbeats y lecturas.

### Permisos por rol

| Recurso                                       | admin | operator |        maintenance         | citizen |
| --------------------------------------------- | :---: | :------: | :------------------------: | :-----: |
| Dispositivos, cámaras, coladeras (lectura)    |   ✔   |    ✔     |             ✔              |    ✘    |
| Cambiar estado de dispositivo                 |   ✔   |    ✔     |             ✔              |    ✘    |
| Heartbeat y lecturas (o `x-device-key`)       |   ✔   |    ✔     |             ✘              |    ✘    |
| Incidencias (lectura) y crear reporte         |   ✔   |    ✔     |             ✔              |    ✔    |
| Editar, validar, rechazar, asignar incidencia |   ✔   |    ✔     |             ✘              |    ✘    |
| Iniciar y resolver incidencia                 |   ✔   |    ✔     | solo si está asignada a él |    ✘    |
| Bitácora de incidencia                        |   ✔   |    ✔     |             ✔              |    ✘    |
| Accesibilidad                                 |   ✔   |    ✔     |             ✔              |    ✔    |
| Reglas: ver / editar                          | ✔ / ✔ |  ✔ / ✘   |             ✘              |    ✘    |

## Endpoints

### Salud

`GET /health`: estado de la API, la base y PostGIS. Es público. Responde 503 si la base no responde.

### Auth

| Método | Ruta            | Cuerpo                        | Respuesta                                                         |
| ------ | --------------- | ----------------------------- | ----------------------------------------------------------------- |
| POST   | `/auth/login`   | `{ email, password }`         | `TokenResponse` y cookie. Límite de 10 intentos por minuto por IP |
| POST   | `/auth/refresh` | `{ refresh_token? }` o cookie | `TokenResponse` nuevo y cookie rotada                             |
| POST   | `/auth/logout`  | `{ refresh_token? }` o cookie | 204. Revoca el refresh y borra la cookie                          |
| GET    | `/auth/me`      | —                             | `AuthUserDto`                                                     |

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"operador@simu.local","password":"simu2026"}'
```

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "…",
    "name": "Operación Demo",
    "email": "operador@simu.local",
    "role": "operator",
    "status": "active"
  }
}
```

### Dispositivos

| Método | Ruta                                      | Notas                                                                                             |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/devices?type=&status=&format=`          | `type` y `status` aceptan varios valores                                                          |
| GET    | `/devices/:code`                          | `code` como `CAM-001`                                                                             |
| PATCH  | `/devices/:code/status`                   | `{ status, reason? }`. Emite `devices:status`                                                     |
| POST   | `/devices/:code/heartbeat`                | `{ status?: "online" \| "degraded", health? }`. Emite `heartbeats` y, si cambia, `devices:status` |
| GET    | `/cameras`, `/cameras/:code`              |                                                                                                   |
| GET    | `/drains`, `/drains/:code`                |                                                                                                   |
| GET    | `/drains/:code/readings?from=&to=&limit=` | Por defecto las últimas 24 h, orden ascendente                                                    |
| POST   | `/drains/:code/readings`                  | Una lectura o un lote `{ readings: [...] }` de hasta 500                                          |

Un dispositivo en `maintenance` conserva ese estado aunque lleguen heartbeats. Es un bloqueo manual.

Lectura desde el gateway:

```bash
curl -s -X POST http://localhost:3000/drains/DRAIN-001/readings \
  -H 'content-type: application/json' -H 'x-device-key: dev-only-device-key-change-me' \
  -d '{"device_code":"DRAIN-001","value":78,"unit":"percent","recorded_at":"2026-09-29T15:30:00Z"}'
```

```json
{
  "device_code": "DRAIN-001",
  "received": 1,
  "inserted": 1,
  "duplicates": 0,
  "drain": {
    "obstruction_level": 78,
    "status": "caution",
    "last_reading_at": "2026-09-29T15:30:00.000Z"
  }
}
```

Reglas de ingesta:

- **Idempotente.** La misma lectura enviada dos veces se guarda una sola vez. La segunda responde 200 con `duplicates: 1`.
- **Orden temporal.** Un lote atrasado de store-and-forward se guarda con `synced: false`, pero no sobrescribe el nivel actual si ya hay una lectura más nueva.
- **Validación.** El valor en `percent` va de 0 a 100. `recorded_at` no puede estar más de 5 min en el futuro. `device_code` debe coincidir con la ruta.

### Incidencias

| Método | Ruta                      | Notas                                                                                                                                                                                                    |
| ------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/incidents`              | Filtros `status`, `priority`, `type`, `bbox`, `assigned_to=me\|<uuid>`, `device_code`. Paginación `page` y `page_size` (máx. 200). `sort=-created_at\|created_at\|-priority\|priority`. `format=geojson` |
| GET    | `/incidents/:id`          |                                                                                                                                                                                                          |
| POST   | `/incidents`              | `CreateIncidentInput`. La ubicación debe estar en CDMX. Emite `incidents:created`                                                                                                                        |
| PATCH  | `/incidents/:id`          | `{ description?, priority?, type?, status?: "in_progress" \| "rejected", note? }`                                                                                                                        |
| POST   | `/incidents/:id/validate` | `{ note? }`                                                                                                                                                                                              |
| POST   | `/incidents/:id/assign`   | `{ user_id, note? }`. Solo a personal de mantenimiento activo                                                                                                                                            |
| POST   | `/incidents/:id/resolve`  | `{ note? }`                                                                                                                                                                                              |
| GET    | `/incidents/:id/events`   | Bitácora completa                                                                                                                                                                                        |

Una ciudadana o ciudadano no puede fijar prioridad ni confianza. Su reporte entra como `pending`, prioridad `medium` y `source: citizen_report`.

Flujo de estados:

```text
pending ─validate→ validated ─assign→ assigned ─start→ in_progress ─resolve→ resolved
pending ─assign→ assigned                    (valida automáticamente)
validated|assigned ─resolve→ resolved
pending|validated ─reject→ rejected
```

Para mantenimiento: PENDIENTE = `assigned`, EN ATENCIÓN = `in_progress`, RESUELTA = `resolved`. Una transición inválida devuelve 409 con `details.status` y `details.allowed_from`. Cada cambio escribe en la bitácora el id y el rol de quien lo hizo, nunca su nombre ni su correo, y emite `incidents:status_changed`.

### Accesibilidad

| Método | Ruta                                                                                    | Notas                                                                                             |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/accessibility/points?type=&status=&bbox=&format=`                                     | Las rampas incluyen `ramp.slope` y `ramp.width_m`                                                 |
| GET    | `/accessibility/routes?origin=lng,lat&destination=lng,lat&accessible=true&radius_m=300` | Rutas guardadas cuyos extremos están dentro de `radius_m` metros. Usa distancia real en geografía |
| POST   | `/accessibility/routes/alternative`                                                     | **501** hasta la Fase 8                                                                           |

### Reglas

| Método | Ruta         | Notas                                                                                                                                                    |
| ------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/rules`     | Ordenadas por `sort_order`                                                                                                                               |
| PATCH  | `/rules/:id` | `{ name?, description?, enabled?, sort_order?, conditions?, action? }`. El DSL se valida, ver [modelo-datos.md](modelo-datos.md#dsl-del-motor-de-reglas) |

## WebSocket

```text
ws://localhost:3000/ws?token=<access_token>
ws://localhost:5173/ws?token=<access_token>     (vía proxy)
```

El token se valida **antes** del upgrade. Sin token válido la respuesta es HTTP 401 y no se abre la conexión. El token nunca aparece en los logs. Cuando expira el access token, el cliente debe reconectarse con uno nuevo.

Mensajes del cliente:

```json
{ "subscribe": "drain-readings" }
{ "unsubscribe": "drain-readings" }
{ "ping": true }
```

Mensajes de control del servidor. Siempre traen `type`:

```json
{ "type": "welcome", "allowed_channels": ["devices:status", "..."], "ts": "…" }
{ "type": "subscribed", "channel": "drain-readings", "ts": "…" }
{ "type": "error", "message": "Tu rol no puede suscribirse a devices:status", "ts": "…" }
```

Mensajes de datos. Siempre traen `event` y nunca `type`:

```json
{
  "channel": "drain-readings",
  "event": "reading",
  "data": {
    "device_code": "DRAIN-001",
    "value": 88,
    "obstruction_level": 88,
    "drain_status": "alert",
    "recorded_at": "…",
    "synced": true,
    "batch_size": 1
  },
  "ts": "2026-09-29T15:30:00.123Z"
}
```

| Canal            | Eventos                                | Datos                                                    | Roles |
| ---------------- | -------------------------------------- | -------------------------------------------------------- | ----- |
| `devices:status` | `status_changed`                       | `DeviceStatusEvent`                                      | staff |
| `heartbeats`     | `received`                             | `HeartbeatEvent`                                         | staff |
| `drain-readings` | `reading`                              | `DrainReadingEvent`                                      | staff |
| `incidents`      | `created`, `updated`, `status_changed` | `IncidentDto`. `status_changed` agrega `previous_status` | todos |
| `camera-events`  | Fase 3                                 |                                                          | staff |
| `alerts`         | Fase 3                                 |                                                          | todos |

"staff" es admin, operator y maintenance. El servidor envía un ping cada 30 s y cierra las conexiones que no responden.

## Pendiente en fases siguientes

| Endpoint                                                                                     | Fase |
| -------------------------------------------------------------------------------------------- | ---- |
| `GET /events`, `POST /events/ingest`, `POST /ai/analyze`, canales `camera-events` y `alerts` | 3    |
| Marcado automático `offline` tras 90 s sin heartbeat                                         | 3    |
| `POST /accessibility/routes/alternative`                                                     | 8    |
| CRUD de usuarios                                                                             | 9    |
