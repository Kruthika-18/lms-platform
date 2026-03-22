import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ProgressService } from './progress.service';

const progressService = new ProgressService();

const batchSchema = z.object({
  items: z.array(z.object({
    lessonId:        z.string().uuid(),
    positionSeconds: z.number().min(0),
    durationSeconds: z.number().min(1),
    ts:              z.number(),
  })).min(1).max(100),
});

export const progressRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/progress/batch  — main endpoint called by sendBeacon
  fastify.post('/batch', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const userId = (req.user as any).sub;
    const body = batchSchema.parse(req.body);
    await progressService.batchUpsert(userId, body.items);
    return reply.code(204).send();
  });

  // GET /api/v1/progress/lesson/:lessonId
  fastify.get('/lesson/:lessonId', { preHandler: [fastify.authenticate] }, async (req) => {
    const { lessonId } = req.params as { lessonId: string };
    const userId = (req.user as any).sub;
    const progress = await progressService.getLessonProgress(userId, lessonId);
    return { success: true, data: progress ?? null };
  });

  // GET /api/v1/progress/me  — all user progress
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;
    const progress = await progressService.getUserProgress(userId);
    return { success: true, data: progress };
  });
};
