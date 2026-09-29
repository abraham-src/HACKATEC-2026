# Desarrollo

## Opción A: todo en Docker

```bash
cp .env.example .env
docker compose up --build
```

Después de cambiar código, reconstruye el servicio afectado:

```bash
docker compose up --build api
```

## Opción B: base de datos en Docker, apps en local (recarga en caliente)

Requiere Node.js 20.11 o superior.

```bash
cp .env.example .env
npm install
docker compose up -d postgres

npm run build:packages                 # shared-types y shared-utils
npm run prisma:generate -w @simu/api
npm run db:deploy                      # aplica migraciones
npm run db:seed                        # seeds idempotentes

npm run dev:api                        # http://localhost:3000
npm run dev:web                        # http://localhost:5173 (proxy /api y /ws)
npm run dev:simulator                  # http://localhost:4000
```

Si ya tienes un Postgres local ocupando el 5432, cambia `POSTGRES_PORT` y `DATABASE_URL` en `.env`.

## Calidad

```bash
npm run typecheck   # TypeScript estricto en todos los workspaces + seeds
npm run lint        # ESLint (flat config compartida en la raíz)
npm run format      # Prettier
npm test            # Vitest (shared-utils, api)
```

Reglas:

- Sin `any`. Si es inevitable, se justifica con un comentario en la misma línea.
- Toda entrada HTTP se valida con Zod.
- Acceso a datos con Prisma. SQL crudo solo para PostGIS y siempre parametrizado con `$queryRaw` o `$executeRaw` como *tagged template*. Nunca uses `$queryRawUnsafe` con datos de usuario.
- Sin secretos en el código: todo por `.env`.
- Nunca registres correos, nombres, tokens ni contraseñas en logs.

## Migraciones

El esquema usa columnas PostGIS generadas e índices GIST que Prisma no representa. Por eso **no** uses `prisma migrate dev` directamente.

1. Edita `database/schema.prisma`.
2. Genera la migración sin aplicarla:
   ```bash
   npm run db:migrate -w @simu/api -- --name add_something
   ```
3. Revisa el SQL en `database/migrations/<fecha>_add_something/`. Elimina cualquier `DROP` de columnas `geom`, de índices `*_geom_idx` o de la tabla `spatial_ref_sys` de PostGIS que Prisma haya propuesto por no reconocerlos.
4. Aplica con `npm run db:deploy` y haz commit del SQL.

Si agregas un valor a un enum, actualiza también `packages/shared-types/src/enums.ts`. La prueba de paridad fallará si no lo haces.

## Git

- Rama principal: `main`. Trabaja en ramas `feat/…`, `fix/…`, `chore/…`.
- Commits convencionales: `feat(api): …`, `fix(web): …`, `chore: …`, `docs: …`, `test: …`.
- Antes de abrir un PR: `npm run typecheck && npm run lint && npm test`.
- El PR describe qué cambia, cómo se probó y si requiere `docker compose down -v`, por ejemplo cuando cambian los seeds.

## Reiniciar datos

```bash
docker compose down -v && docker compose up --build
```
