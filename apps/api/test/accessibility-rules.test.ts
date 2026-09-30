import type { AccessibilityPointDto, AccessibleRouteDto, RuleDto } from '@simu/shared-types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  bearer,
  createTestApp,
  hasTestDb,
  tokensFor,
  type DemoRole,
  type TestContext,
} from './helpers.js';

describe.skipIf(!hasTestDb)('accessibility', () => {
  let t: TestContext;
  let tok: Record<DemoRole, string>;
  beforeAll(async () => {
    t = await createTestApp();
    tok = await tokensFor(t.app);
  });
  afterAll(async () => t?.close());

  const get = (url: string, role: DemoRole = 'citizen') =>
    t.app.inject({ method: 'GET', url, headers: bearer(tok[role]) });

  it('lists the 30 seeded points for any signed-in user', async () => {
    const res = await get('/accessibility/points');
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: AccessibilityPointDto[] }>().data).toHaveLength(30);
  });

  it('filters ramps and includes their slope and width', async () => {
    const res = await get('/accessibility/points?type=ramp');
    const ramps = res.json<{ data: AccessibilityPointDto[] }>().data;
    expect(ramps).toHaveLength(11);
    const ne = ramps.find((r) => r.name === 'Rampa Álvaro Obregón y Orizaba, esquina NE');
    expect(ne?.ramp).toEqual({ slope: 6, width_m: 1.2 });
  });

  it('filters by bbox (Coyoacán) and by status', async () => {
    const coyoacan = await get('/accessibility/points?bbox=-99.170,19.344,-99.156,19.354');
    expect(coyoacan.json<{ data: AccessibilityPointDto[] }>().data).toHaveLength(6);
    const blocked = await get('/accessibility/points?status=blocked');
    expect(blocked.json<{ data: AccessibilityPointDto[] }>().data).toHaveLength(5);
  });

  it('returns stored routes as GeoJSON with their length in meters', async () => {
    const res = await get('/accessibility/routes');
    const routes = res.json<{ data: AccessibleRouteDto[] }>().data;
    expect(routes).toHaveLength(2);
    for (const r of routes) {
      expect(r.path.type).toBe('LineString');
      expect(r.length_m).toBeGreaterThan(300);
    }
  });

  it('finds routes near an origin/destination using geography distance', async () => {
    const near = await get(
      '/accessibility/routes?origin=-99.1590,19.4200&destination=-99.1574,19.4189&radius_m=50',
    );
    const names = near.json<{ data: AccessibleRouteDto[] }>().data.map((r) => r.name);
    expect(names).toEqual(['Orizaba (Colima) → Álvaro Obregón y Córdoba por camellón']);

    const far = await get('/accessibility/routes?origin=-99.1627,19.3501&radius_m=50');
    expect(far.json<{ data: AccessibleRouteDto[] }>().data).toHaveLength(0);

    expect((await get('/accessibility/routes?origin=abc')).statusCode).toBe(400);
  });

  it('reports route alternatives as not implemented yet (Phase 8)', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/accessibility/routes/alternative',
      headers: bearer(tok.citizen),
    });
    expect(res.statusCode).toBe(501);
  });
});

describe.skipIf(!hasTestDb)('rules', () => {
  let t: TestContext;
  let tok: Record<DemoRole, string>;
  beforeAll(async () => {
    t = await createTestApp();
    tok = await tokensFor(t.app);
  });
  afterAll(async () => t?.close());

  it('lists the three rules in evaluation order', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/rules', headers: bearer(tok.operator) });
    const rules = res.json<{ data: RuleDto[] }>().data;
    expect(rules.map((r) => r.sort_order)).toEqual([10, 20, 30]);
    expect(rules[2]?.action).toMatchObject({ set_priority: 'critical' });
  });

  it('lets only admins edit rules', async () => {
    const [rule] = await t.prisma.rule.findMany({ orderBy: { sortOrder: 'asc' }, take: 1 });
    const url = `/rules/${rule?.id}`;
    for (const role of ['operator', 'maintenance', 'citizen'] as const) {
      const res = await t.app.inject({
        method: 'PATCH',
        url,
        headers: bearer(tok[role]),
        payload: { enabled: false },
      });
      expect(res.statusCode).toBe(403);
    }
    expect(
      (await t.app.inject({ method: 'GET', url: '/rules', headers: bearer(tok.citizen) }))
        .statusCode,
    ).toBe(403);

    const ok = await t.app.inject({
      method: 'PATCH',
      url,
      headers: bearer(tok.admin),
      payload: { enabled: false },
    });
    expect(ok.json<RuleDto>().enabled).toBe(false);
    await t.app.inject({
      method: 'PATCH',
      url,
      headers: bearer(tok.admin),
      payload: { enabled: true },
    });
  });

  it('validates the rules DSL', async () => {
    const [rule] = await t.prisma.rule.findMany({ take: 1 });
    const url = `/rules/${rule?.id}`;
    const badFact = await t.app.inject({
      method: 'PATCH',
      url,
      headers: bearer(tok.admin),
      payload: { conditions: { all: [{ fact: 'drain.temperature', op: 'gt', value: 80 }] } },
    });
    expect(badFact.statusCode).toBe(400);

    const badAction = await t.app.inject({
      method: 'PATCH',
      url,
      headers: bearer(tok.admin),
      payload: { action: { incident_type: 'flood_risk', set_priority: 'urgentísimo' } },
    });
    expect(badAction.statusCode).toBe(400);
  });
});
