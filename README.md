# SIMU · CDMX

Sistema Inteligente de Monitoreo Urbano para la Ciudad de México. Integra cámaras con visión artificial, coladeras inteligentes (Arduino + sensor ultrasónico), información geoespacial y un motor de reglas para detectar y administrar incidencias de movilidad, seguridad, infraestructura y accesibilidad.

Esta entrega funciona **solo con datos simulados**: no requiere hardware ni el servicio de IA real.

> **Estado:** Fase 3 de 11. La API está completa: login, roles, dispositivos, incidencias, accesibilidad, WebSocket, motor de reglas, ingesta store-and-forward, IA con mock y monitor de heartbeats. La interfaz web llega en la Fase 5. Plan completo en [docs/arquitectura.md](docs/arquitectura.md#plan-de-fases).

Sin Docker en Windows: ver [docs/desarrollo.md](docs/desarrollo.md#opción-c-windows-sin-docker).

## Requisitos

| Herramienta                                    | Versión                          |
| ---------------------------------------------- | -------------------------------- |
| Docker Desktop / Docker Engine                 | 24+ con Docker Compose **2.20+** |
| Git                                            | 2.40+                            |
| Node.js (solo para desarrollo fuera de Docker) | 20.11+                           |

## Arranque rápido

```bash
git clone https://github.com/abraham-src/HACKATEC-2026.git
cd HACKATEC-2026
cp .env.example .env
docker compose up --build
```

El primer arranque tarda unos minutos: instala dependencias, compila, aplica migraciones y carga seeds.

| Servicio             | URL                                     | Notas                                   |
| -------------------- | --------------------------------------- | --------------------------------------- |
| Web                  | http://localhost:5173                   | nginx; proxya `/api` y `/ws` a la API   |
| API                  | http://localhost:3000/health            | Fastify                                 |
| PostgreSQL + PostGIS | `localhost:5432`                        | usuario/clave en `.env`                 |
| Simulador            | http://localhost:5173/simulator/control | panel de control vía el proxy de la web |
| IA (opcional)        | interno, puerto 8000                    | `docker compose --profile ai up`        |

### Verificar la Fase 1

```bash
# Todos los servicios "running" / "healthy"
docker compose ps

# API + base de datos + PostGIS
curl http://localhost:3000/health
curl http://localhost:5173/api/health      # mismo endpoint, vía nginx

# Migración aplicada y seeds cargados
docker compose exec postgres psql -U simu -d simu -c "SELECT migration_name, finished_at FROM _prisma_migrations;"
docker compose exec postgres psql -U simu -d simu -c "SELECT device_code, type, status, ST_AsText(geom) FROM devices ORDER BY device_code;"
docker compose exec postgres psql -U simu -d simu -c "SELECT type, count(*) FROM accessibility_points GROUP BY type ORDER BY type;"

# Log del seed (conteos)
docker compose logs api | grep "\[seed\]"
```

Resultado esperado del seed: `roles=4 users=4 devices=11 readings=192 accessibility_points=30 ramps=11 routes=2 incidents=5 rules=3`.

## Credenciales demo

Todas usan la contraseña definida en `SEED_DEMO_PASSWORD` (por defecto `simu2026`).

| Rol         | Correo                   |
| ----------- | ------------------------ |
| admin       | admin@simu.local         |
| operator    | operador@simu.local      |
| maintenance | mantenimiento@simu.local |
| citizen     | ciudadano@simu.local     |

### Probar la API

```bash
# Login: devuelve access_token (15 min) y refresh_token
curl -s -X POST http://localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"operador@simu.local","password":"simu2026"}'

# Con el token
TOKEN=<access_token>
curl -s http://localhost:3000/devices -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/incidents?status=pending,validated&sort=-priority" -H "Authorization: Bearer $TOKEN"

# Lectura de coladera como la envía el gateway
curl -s -X POST http://localhost:3000/drains/DRAIN-001/readings \
  -H 'content-type: application/json' -H 'x-device-key: dev-only-device-key-change-me' \
  -d "{\"value\":88,\"recorded_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
```

Todos los endpoints, los permisos por rol y el protocolo WebSocket están en [docs/api.md](docs/api.md).

## Estructura del repositorio

```text
HACKATEC-2026/
├── apps/
│   ├── web/            React 18 + Vite + TS + Tailwind
│   ├── api/            Node 20 + Fastify + Prisma
│   ├── simulator/      Simulador de Arduino + cámara (store-and-forward en Fase 4)
│   └── ai-service/     FastAPI; mock de POST /ai/analyze (perfil "ai")
├── packages/
│   ├── shared-types/   Enums, DTOs y contratos WS compartidos
│   └── shared-utils/   Geo, umbrales de coladera, parser serial Arduino
├── database/
│   ├── schema.prisma   Esquema completo
│   ├── migrations/     Migraciones Prisma (SQL con PostGIS)
│   ├── seed/           Seed idempotente en TypeScript
│   └── gis/            GeoJSON mock (zonas, riesgo de inundación)
├── docker/             Dockerfiles, compose, nginx, init-db.sql
├── docs/               Documentación interna (español)
└── compose.yaml        Punto de entrada: incluye docker/docker-compose.yml
```

## Simulador de campo

El simulador reemplaza al hardware en la demo. Arranca solo con `docker compose up`, o con `npm run dev:simulator` sin Docker, y hace esto:

- **Coladeras.** DRAIN-001 a DRAIN-004 envían una lectura cada 5 s en el formato serial del Arduino (`DRAIN001,78`). El gateway la convierte a JSON.
- **Cámaras.** CAM-001 a CAM-004 reportan detecciones con confianza aleatoria. La mayoría queda debajo del umbral de 0.6.
- **Heartbeats.** Los 11 dispositivos envían uno cada 30 s.
- **Store-and-forward.** Todo se guarda primero en SQLite (`simu-gateway.db`) y un worker lo envía a `POST /events/ingest`. Si falla, reintenta con backoff exponencial de 1 s a 60 s. Al arrancar envía lo que quedó pendiente.

### Panel de control

Abre **http://localhost:5173/simulator/control**. Desde ahí puedes:

- Cortar Internet durante X segundos y restablecerlo.
- Fijar el nivel de cualquier coladera, por ejemplo DRAIN-001 = 88 %.
- Enviar una detección de cualquier cámara, por ejemplo CAM-001 = WATER_ACCUMULATION u OBSTACLE.
- Activar lluvia por zona y reportar un dispositivo como DEGRADED.
- Ejecutar los 6 escenarios de demo con un botón.
- Reiniciar el estado.

El panel muestra en vivo los pendientes en SQLite, las fallas consecutivas, el próximo reintento y una bitácora.

Los mismos controles existen como REST: `POST /control/internet`, `/control/drain`, `/control/camera`, `/control/weather`, `/control/health`, `/control/scenario/:id` y `/control/reset`. El panel no tiene autenticación porque es una herramienta interna de demo: no lo expongas a Internet.

### Escenarios de demo

| #   | Escenario                 | Qué pasa                                                                                                  |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Operación normal          | Niveles habituales, sin lluvia, todo en línea                                                             |
| 2   | Coladera obstruyéndose    | DRAIN-001 pasa por 42 %, 71 % y 88 %, y el motor emite ALERTA                                             |
| 3   | Cámara detecta incidencia | CAM-001 detecta un obstáculo y aparece como incidencia en vivo                                            |
| 4   | Riesgo combinado          | 88 %, lluvia y agua detectada elevan la incidencia a RIESGO CRÍTICO                                       |
| 5   | Accesibilidad             | CAM-001 detecta un bloqueo sobre la ruta accesible. La ruta alternativa llega en la Fase 8                |
| 6   | Pérdida de conectividad   | 100 s sin Internet: se acumula en SQLite, los dispositivos pasan a OFFLINE y todo se sincroniza al volver |

## Comandos frecuentes

```bash
docker compose up --build        # levantar todo
docker compose logs -f api       # logs de la API
docker compose down              # detener (conserva datos)
docker compose down -v           # detener y BORRAR la base de datos
docker compose --profile ai up   # incluir el servicio de IA
```

Desarrollo local sin Docker para la app: ver [docs/desarrollo.md](docs/desarrollo.md).

## Documentación

- [Arquitectura](docs/arquitectura.md)
- [Modelo de datos](docs/modelo-datos.md)
- [API](docs/api.md)
- [Desarrollo y contribución](docs/desarrollo.md)

## Licencia

[MIT](LICENSE)
