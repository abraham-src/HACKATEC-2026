import { ACCESSIBILITY_POINT_TYPES, ACCESSIBILITY_STATUSES } from '@simu/shared-types';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { notImplemented } from '../lib/errors.js';
import { toPointCollection } from '../lib/geojson.js';
import { bboxParam, csvEnum, lngLatParam, parse } from '../lib/validation.js';
import type { AuthGuards } from '../plugins/auth.js';
import * as accessibility from '../services/accessibility.js';
import type { ServiceContext } from '../services/context.js';

const PointsQuery = z.object({
  type: csvEnum(ACCESSIBILITY_POINT_TYPES),
  status: csvEnum(ACCESSIBILITY_STATUSES),
  bbox: bboxParam,
  format: z.enum(['json', 'geojson']).default('json'),
});

const RoutesQuery = z.object({
  origin: lngLatParam.optional(),
  destination: lngLatParam.optional(),
  accessible: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  radius_m: z.coerce.number().int().min(10).max(2000).default(300),
});

export function accessibilityRoutes(ctx: ServiceContext, guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    const anyUser = guards.requireUser();

    app.get('/accessibility/points', { preHandler: anyUser }, async (req) => {
      const q = parse(PointsQuery, req.query);
      const list = await accessibility.listPoints(ctx, {
        types: q.type,
        statuses: q.status,
        bbox: q.bbox,
      });
      return q.format === 'geojson' ? toPointCollection(list) : { data: list };
    });

    app.get('/accessibility/routes', { preHandler: anyUser }, async (req) => {
      const q = parse(RoutesQuery, req.query);
      return {
        data: await accessibility.listRoutes(ctx, {
          origin: q.origin,
          destination: q.destination,
          radiusM: q.radius_m,
          accessibleOnly: q.accessible,
        }),
      };
    });

    app.post('/accessibility/routes/alternative', { preHandler: anyUser }, async () => {
      throw notImplemented(
        'El cálculo de rutas alternativas que evitan incidencias se implementa en la Fase 8',
      );
    });
  };
}
