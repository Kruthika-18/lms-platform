import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { QuizService } from './quizzes.service';

const quizService = new QuizService();

export const quizRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/quizzes/:quizId
  fastify.get('/:quizId', { preHandler: [fastify.authenticate] }, async (req) => {
    const { quizId } = req.params as { quizId: string };
    const quiz = await quizService.getQuiz(quizId, true);
    return { success: true, data: quiz };
  });

  // POST /api/v1/quizzes/:quizId/submit
  const submitSchema = z.object({
    answers: z.record(z.string(), z.array(z.string())),
  });

  fastify.post('/:quizId/submit', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { quizId } = req.params as { quizId: string };
    const userId     = (req.user as any).sub;
    const { answers } = submitSchema.parse(req.body);

    const result = await quizService.submitAttempt(userId, quizId, answers);
    return reply.send({ success: true, data: result });
  });

  // GET /api/v1/quizzes/:quizId/best-attempt
  fastify.get('/:quizId/best-attempt', { preHandler: [fastify.authenticate] }, async (req) => {
    const { quizId } = req.params as { quizId: string };
    const userId     = (req.user as any).sub;
    const attempt    = await quizService.getBestAttempt(userId, quizId);
    return { success: true, data: attempt };
  });
};
