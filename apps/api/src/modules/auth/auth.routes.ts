import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'lms_refresh';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 60 * 60 * 24 * 7,
};

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8).max(128),
  name:     z.string().min(2).max(100),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify);

  // POST /api/v1/auth/register
  fastify.post('/register', async (req, reply) => {
    try {
      const body = registerSchema.parse(req.body);
      const user = await authService.register(body.email, body.password, body.name);
      const { accessToken, rawRefreshToken } = await authService.issueTokens(user.id);
      reply.setCookie(COOKIE_NAME, rawRefreshToken, COOKIE_OPTS);
      return reply.code(201).send({
        success: true,
        data: {
          accessToken,
          user: {
            id:    user.id,
            email: user.email,
            name:  user.name,
            role:  user.role,
            plan:  user.plan,
          },
        },
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return reply.code(422).send({ success: false, error: 'VALIDATION_ERROR', message: err.errors[0]?.message });
      }
      if (err.code === 'CONFLICT') {
        return reply.code(409).send({ success: false, error: 'CONFLICT', message: err.message });
      }
      throw err;
    }
  });

  // POST /api/v1/auth/login
  fastify.post('/login', async (req, reply) => {
    try {
      const body = loginSchema.parse(req.body);
      const user = await authService.login(body.email, body.password);
      const { accessToken, rawRefreshToken } = await authService.issueTokens(user.id);
      reply.setCookie(COOKIE_NAME, rawRefreshToken, COOKIE_OPTS);
      return reply.send({
        success: true,
        data: {
          accessToken,
          user: {
            id:    user.id,
            email: user.email,
            name:  user.name,
            role:  user.role,
            plan:  user.plan,
          },
        },
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return reply.code(422).send({ success: false, error: 'VALIDATION_ERROR', message: err.errors[0]?.message });
      }
      if (err.statusCode === 401) {
        return reply.code(401).send({ success: false, error: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }
      throw err;
    }
  });

  // POST /api/v1/auth/refresh
  fastify.post('/refresh', async (req, reply) => {
    try {
      const rawToken = req.cookies[COOKIE_NAME];
      if (!rawToken) {
        return reply.code(401).send({ success: false, error: 'UNAUTHORIZED', message: 'No refresh token' });
      }
      const { accessToken, rawRefreshToken } = await authService.rotateRefreshToken(rawToken);
      reply.setCookie(COOKIE_NAME, rawRefreshToken, COOKIE_OPTS);
      return reply.send({ success: true, data: { accessToken } });
    } catch {
      return reply.code(401).send({ success: false, error: 'UNAUTHORIZED', message: 'Invalid refresh token' });
    }
  });

  // POST /api/v1/auth/logout
  fastify.post('/logout', async (req, reply) => {
    try {
      const rawToken = req.cookies[COOKIE_NAME];
      if (rawToken) await authService.revokeRefreshToken(rawToken);
    } catch {}
    reply.clearCookie(COOKIE_NAME, { path: '/api/v1/auth' });
    return reply.send({ success: true, data: null });
  });

 // GET /api/v1/auth/me
  fastify.get('/me', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ success: false, error: 'UNAUTHORIZED', message: 'Invalid token' });
    }
    const user = await db.query.users.findFirst({
      where: eq(users.id, (req.user as any).sub),
      columns: { passwordHash: false },
    });
    if (!user) {
      return reply.code(404).send({ success: false, error: 'NOT_FOUND', message: 'User not found' });
    }
    return reply.send({ success: true, data: user });
  });
};