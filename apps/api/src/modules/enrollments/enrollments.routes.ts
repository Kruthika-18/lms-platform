import type { FastifyPluginAsync } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import { enrollments, courses } from '../../db/schema';

export const enrollmentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/enrollments  — my enrollments with course + progress
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;

    const rows = await db.query.enrollments.findMany({
      where:   eq(enrollments.userId, userId),
      orderBy: [desc(enrollments.enrolledAt)],
      with: {
        course: {
          with: {
            instructor: {
              columns: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return { success: true, data: rows };
  });

  // GET /api/v1/enrollments/:courseId  — specific enrollment
  fastify.get('/:courseId', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const userId       = (req.user as any).sub;

    const enrollment = await db.query.enrollments.findFirst({
      where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.courseId, courseId)),
    });

    if (!enrollment) return reply.code(404).send({ success: false, error: 'NOT_FOUND', message: 'Not enrolled' });
    return { success: true, data: enrollment };
  });
};
