import type { FastifyPluginAsync } from 'fastify';
import { sql, count, eq, gte } from 'drizzle-orm';
import { db } from '../../db';
import { users, courses, enrollments, orders } from '../../db/schema';
import { cache, cacheKeys } from '../../lib/redis';
import { Errors } from '../../lib/errors';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.addHook('preHandler', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ success: false, error: 'UNAUTHORIZED', message: 'Invalid token' });
    }
    const user = req.user as any;
    if (user.role !== 'admin') {
      return reply.code(403).send({ success: false, error: 'FORBIDDEN', message: 'Admin only' });
    }
  });

  // GET /api/v1/admin/stats
  fastify.get('/stats', async () => {
    try {
      const cached = await cache.get(cacheKeys.dashboardStats());
      if (cached) return { success: true, data: cached };
    } catch {}

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
      [{ totalUsers }],
      [{ totalCourses }],
      [{ totalEnrollments }],
      [{ activeToday }],
      [{ revenue }],
    ] = await Promise.all([
      db.select({ totalUsers:       count() }).from(users),
      db.select({ totalCourses:     count() }).from(courses).where(eq(courses.isPublished, true)),
      db.select({ totalEnrollments: count() }).from(enrollments),
      db.select({ activeToday:      count() }).from(users).where(gte(users.lastActiveAt, today)),
      db.select({ revenue: sql<number>`COALESCE(SUM(amount_cents), 0)` }).from(orders)
        .where(sql`status = 'completed' AND created_at >= ${startOfMonth}`),
    ]);

    const completionRate = totalEnrollments > 0
      ? Math.round(
          (await db.select({ c: count() }).from(enrollments)
            .where(sql`completed_at IS NOT NULL`))[0].c / totalEnrollments * 100,
        )
      : 0;

    const stats = {
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeToday,
      revenueThisMonth: Number(revenue),
      completionRate,
    };

    try { await cache.set(cacheKeys.dashboardStats(), stats, 300); } catch {}
    return { success: true, data: stats };
  });

  // GET /api/v1/admin/users
  fastify.get('/users', async (req) => {
    const { page = '1', limit = '20', search } = req.query as any;
    const offset = (Number(page) - 1) * Number(limit);

    const rows = await db.query.users.findMany({
      columns:  { passwordHash: false },
      where:    search ? sql`name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'}` : undefined,
      limit:    Number(limit),
      offset,
      orderBy:  (t, { desc }) => [desc(t.createdAt)],
    });

    return { success: true, data: rows };
  });

  // PATCH /api/v1/admin/users/:id/role
  fastify.patch('/users/:id/role', async (req, reply) => {
    const { id }   = req.params as { id: string };
    const { role } = req.body  as { role: string };

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return reply.code(422).send({ success: false, error: 'VALIDATION_ERROR', message: 'Invalid role' });
    }

    await db.update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id));

    return { success: true, data: { id, role } };
  });

  // DELETE /api/v1/admin/users/:id
  fastify.delete('/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id));
    return reply.code(204).send();
  });

  // GET /api/v1/admin/courses
  fastify.get('/courses', async () => {
    const rows = await db.query.courses.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    return { success: true, data: rows };
  });

  // PATCH /api/v1/admin/courses/:id/publish
  fastify.patch('/courses/:id/publish', async (req) => {
    const { id }        = req.params as { id: string };
    const { published } = req.body   as { published: boolean };

    await db.update(courses).set({
      isPublished: published,
      publishedAt: published ? new Date() : null,
      updatedAt:   new Date(),
    }).where(eq(courses.id, id));

    try { await cache.invalidatePattern('course:*'); } catch {}
    return { success: true, data: { id, isPublished: published } };
  });
};