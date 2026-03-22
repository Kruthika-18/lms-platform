import type { FastifyPluginAsync } from 'fastify';
import { PaymentService } from './payments.service';

const paymentService = new PaymentService();

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/payments/course-checkout
  fastify.post('/course-checkout', { preHandler: [fastify.authenticate] }, async (req) => {
    const { courseId, priceCents } = req.body as any;
    const userId = (req.user as any).sub;
    return paymentService.createCourseCheckout(userId, courseId, priceCents);
  });

  // POST /api/v1/payments/subscribe
  fastify.post('/subscribe', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;
    return paymentService.createSubscriptionCheckout(userId);
  });

  // POST /api/v1/payments/webhook  — raw body needed for Stripe signature
  fastify.post('/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const sig = req.headers['stripe-signature'] as string;
    const result = await paymentService.handleWebhook(
      (req as any).rawBody,
      sig,
    );
    return reply.send(result);
  });
};
