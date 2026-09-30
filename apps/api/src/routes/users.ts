import type { FastifyPluginAsync } from 'fastify';
import type { AuthGuards } from '../plugins/auth.js';
import type { ServiceContext } from '../services/context.js';

export interface AssigneeDto {
  id: string;
  name: string;
}

export function userRoutes(ctx: ServiceContext, guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    /**
     * Active maintenance staff an incident can be assigned to. Returns id + name only
     * (operators need no email or other personal data to assign work).
     */
    app.get(
      '/users/assignees',
      { preHandler: guards.requireUser('admin', 'operator') },
      async () => {
        const rows = await ctx.prisma.user.findMany({
          where: { status: 'active', role: { name: 'maintenance' } },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
        return { data: rows satisfies AssigneeDto[] };
      },
    );
  };
}
