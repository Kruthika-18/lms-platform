import type { FastifyPluginAsync } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { certificates } from '../../db/schema';
import { Errors } from '../../lib/errors';

export const certificateRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/certificates  — my certificates
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;
    const certs  = await db.query.certificates.findMany({
      where: eq(certificates.userId, userId),
      with:  { course: { columns: { id: true, title: true, slug: true, thumbnailUrl: true } } },
      orderBy: (t, { desc }) => [desc(t.issuedAt)],
    });
    return { success: true, data: certs };
  });

  // GET /api/v1/certificates/verify/:code  — public verification
  fastify.get('/verify/:code', async (req, reply) => {
    const { code } = req.params as { code: string };
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.verificationCode, code),
      with: {
        user:   { columns: { id: true, name: true } },
        course: { columns: { id: true, title: true } },
      },
    });
    if (!cert) throw Errors.notFound('Certificate');
    return { success: true, data: cert };
  });

  // GET /api/v1/certificates/:courseId  — get specific certificate
  fastify.get('/:courseId', { preHandler: [fastify.authenticate] }, async (req) => {
    const { courseId } = req.params as { courseId: string };
    const userId       = (req.user as any).sub;

    const cert = await db.query.certificates.findFirst({
      where: and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)),
    });
    if (!cert) throw Errors.notFound('Certificate');
    return { success: true, data: cert };
  });
};
