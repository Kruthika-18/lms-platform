import type { FastifyPluginAsync } from 'fastify';
import { VideoService } from './videos.service';
import { CourseService } from '../courses/courses.service';

const videoService  = new VideoService();
const courseService = new CourseService();

export const videoRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/videos/upload-url  — instructor gets presigned URL
  fastify.post('/upload-url', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { lessonId, fileName, contentType } = req.body as any;
    const result = await videoService.getUploadUrl(lessonId, fileName, contentType);
    return reply.send({ success: true, data: result });
  });

  // POST /api/v1/videos/confirm-upload
  fastify.post('/confirm-upload', { preHandler: [fastify.authenticate] }, async (req) => {
    const { lessonId, s3Key } = req.body as any;
    const result = await videoService.confirmUpload(lessonId, s3Key);
    return { success: true, data: result };
  });

  // GET /api/v1/videos/:lessonId/stream
  fastify.get('/:lessonId/stream', { preHandler: [fastify.authenticate] }, async (req) => {
    const { lessonId } = req.params as { lessonId: string };
    const userId = (req.user as any).sub;

    // Get courseId from lesson for enrollment check
    const { db } = await import('../../db');
    const { lessons, sections } = await import('../../db/schema');
    const { eq } = await import('drizzle-orm');
    const row = await db
      .select({ courseId: sections.courseId })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    const isEnrolled = row[0] ? await courseService.isEnrolled(userId, row[0].courseId) : false;
    const result = await videoService.getStreamUrl(lessonId, userId, isEnrolled);
    return { success: true, data: result };
  });
};
