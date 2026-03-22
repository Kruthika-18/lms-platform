import type { FastifyPluginAsync } from 'fastify';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { db } from '../../db';
import { notifications } from '../../db/schema';

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/notifications
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;
    const items  = await db.query.notifications.findMany({
      where:   eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit:   30,
    });
    return { success: true, data: items };
  });

  // GET /api/v1/notifications/unread-count
  fastify.get('/unread-count', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;
    const items  = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    });
    return { success: true, data: { count: items.length } };
  });

  // POST /api/v1/notifications/mark-all-read
  fastify.post('/mark-all-read', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const userId = (req.user as any).sub;
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return reply.code(204).send();
  });

  // POST /api/v1/notifications/:id/read
  fastify.post('/:id/read', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = (req.user as any).sub;
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return reply.code(204).send();
  });
};
