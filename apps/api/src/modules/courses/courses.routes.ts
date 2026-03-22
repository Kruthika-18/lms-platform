import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { CourseService } from './courses.service';

const courseService = new CourseService();

export const courseRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/courses
  fastify.get('/', async (req) => {
    const query = req.query as any;
    return courseService.listPublished({
      cursor:     query.cursor,
      limit:      query.limit ? Number(query.limit) : 20,
      search:     query.search,
      difficulty: query.difficulty,
      tag:        query.tag,
      isFree:     query.isFree === 'true' ? true : query.isFree === 'false' ? false : undefined,
    });
  });

  // GET /api/v1/courses/:slug
  fastify.get('/:slug', async (req) => {
    const { slug } = req.params as { slug: string };
    const userId = (req as any).user?.sub;
    return courseService.getBySlug(slug, userId);
  });

  // POST /api/v1/courses/:courseId/enroll
  fastify.post('/:courseId/enroll', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const userId = (req.user as any).sub;
    const enrollment = await courseService.enroll(userId, courseId);
    return reply.code(201).send({ success: true, data: enrollment });
  });

  // GET /api/v1/courses/:courseId/progress
  fastify.get('/:courseId/progress', { preHandler: [fastify.authenticate] }, async (req) => {
    const { courseId } = req.params as { courseId: string };
    const userId = (req.user as any).sub;
    return courseService.getCourseProgress(userId, courseId);
  });

  // ─── Instructor routes ────────────────────────────────────────
  const createSchema = z.object({
    title:            z.string().min(5).max(500),
    description:      z.string().min(20),
    shortDescription: z.string().min(10).max(500),
    difficulty:       z.enum(['beginner', 'intermediate', 'advanced']),
    priceCents:       z.number().int().min(0),
    isFree:           z.boolean(),
    tags:             z.array(z.string()).max(10),
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const body = createSchema.parse(req.body);
    const userId = (req.user as any).sub;
    const course = await courseService.create(userId, body);
    return reply.code(201).send({ success: true, data: course });
  });

  fastify.patch('/:courseId', { preHandler: [fastify.authenticate] }, async (req) => {
    const { courseId } = req.params as { courseId: string };
    const userId = (req.user as any).sub;
    const course = await courseService.update(courseId, userId, req.body as any);
    return { success: true, data: course };
  });

  fastify.delete('/:courseId', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const userId = (req.user as any).sub;
    await courseService.softDelete(courseId, userId);
    return reply.code(204).send();
  });

  // POST /api/v1/courses/:courseId/sections
  fastify.post('/:courseId/sections', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const { title, position } = req.body as { title: string; position: number };
    const section = await courseService.addSection(courseId, title, position);
    return reply.code(201).send({ success: true, data: section });
  });

  // POST /api/v1/courses/sections/:sectionId/lessons
  fastify.post('/sections/:sectionId/lessons', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { sectionId } = req.params as { sectionId: string };
    const lesson = await courseService.addLesson(sectionId, req.body as any);
    return reply.code(201).send({ success: true, data: lesson });
  });
};
