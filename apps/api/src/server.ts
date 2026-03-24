import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import * as Sentry from '@sentry/node';

import authMiddleware from './middleware/auth.middleware';
import { authRoutes }         from './modules/auth/auth.routes';
import { courseRoutes }       from './modules/courses/courses.routes';
import { progressRoutes }     from './modules/progress/progress.routes';
import { videoRoutes }        from './modules/videos/videos.routes';
import { paymentRoutes }      from './modules/payments/payments.routes';
import { quizRoutes }         from './modules/quizzes/quizzes.routes';
import { certificateRoutes }  from './modules/certificates/certificates.routes';
import { adminRoutes }        from './modules/admin/admin.routes';
import { userRoutes }         from './modules/users/users.routes';
import { searchRoutes }       from './modules/search/search.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { analyticsRoutes }    from './modules/analytics/analytics.routes';
import { enrollmentRoutes }   from './modules/enrollments/enrollments.routes';
import { AppError }           from './lib/errors';

Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
  trustProxy: true,
});

async function bootstrap() {
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        imgSrc:     ["'self'", 'data:', '*.amazonaws.com'],
        mediaSrc:   ["'self'", '*.amazonaws.com'],
        connectSrc: ["'self'", '*'],
      },
    },
  });

  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(cookie, { secret: process.env.COOKIE_SECRET! });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign:   { algorithm: 'HS256' },
  });

  await fastify.register(rateLimit, {
    global:       true,
    max:          1000,
    timeWindow:   '1 minute',
    keyGenerator: (req) => (req.user as any)?.sub ?? req.ip,
  });

  await fastify.register(async (scope) => {
    await scope.register(rateLimit, { max: 100, timeWindow: '15 minutes' });
    scope.register(authRoutes, { prefix: '/api/v1/auth' });
  });

  await fastify.register(authMiddleware);

  fastify.register(courseRoutes,       { prefix: '/api/v1/courses'       });
  fastify.register(enrollmentRoutes,   { prefix: '/api/v1/enrollments'   });
  fastify.register(progressRoutes,     { prefix: '/api/v1/progress'      });
  fastify.register(videoRoutes,        { prefix: '/api/v1/videos'        });
  fastify.register(paymentRoutes,      { prefix: '/api/v1/payments'      });
  fastify.register(quizRoutes,         { prefix: '/api/v1/quizzes'       });
  fastify.register(certificateRoutes,  { prefix: '/api/v1/certificates'  });
  fastify.register(userRoutes,         { prefix: '/api/v1/users'         });
  fastify.register(searchRoutes,       { prefix: '/api/v1/search'        });
  fastify.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  fastify.register(analyticsRoutes,    { prefix: '/api/v1/analytics'     });
  fastify.register(adminRoutes,        { prefix: '/api/v1/admin'         });

  fastify.get('/health', async () => ({
    status: 'ok',
    ts:     Date.now(),
    env:    process.env.NODE_ENV,
  }));

  fastify.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error:   error.code,
        message: error.message,
      });
    }
    if (error.name === 'ZodError') {
      return reply.status(422).send({
        success: false,
        error:   'VALIDATION_ERROR',
        message: (error as any).errors?.[0]?.message ?? 'Validation failed',
      });
    }
    fastify.log.error(error);
    Sentry.captureException(error);
    reply.status(500).send({
      success: false,
      error:   'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  });

  const port = Number(process.env.PORT) || 10000;
  const host = process.env.HOST ?? '0.0.0.0';
  await fastify.listen({ port, host });
  console.info(`🚀 API running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
