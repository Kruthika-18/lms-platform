import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UserService } from './users.service';

const userService = new UserService();

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/users/me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;
    const profile = await userService.getProfile(userId);
    return { success: true, data: profile };
  });

  // PATCH /api/v1/users/me
  const updateSchema = z.object({
    name:  z.string().min(2).max(100).optional(),
    bio:   z.string().max(500).optional(),
    title: z.string().max(100).optional(),
  });

  fastify.patch('/me', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;
    const data   = updateSchema.parse(req.body);
    const updated = await userService.updateProfile(userId, data);
    return { success: true, data: updated };
  });

  // POST /api/v1/users/me/change-password
  const passwordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword:     z.string().min(8).max(128),
  });

  fastify.post('/me/change-password', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const userId = (req.user as any).sub;
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    await userService.changePassword(userId, currentPassword, newPassword);
    return reply.code(204).send();
  });

  // GET /api/v1/users/:id  — public profile
  fastify.get('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const profile = await userService.getProfile(id);
    // Only return public fields
    const { id: uid, name, bio, title, role, xp, streak, createdAt } = profile as any;
    return { success: true, data: { id: uid, name, bio, title, role, xp, streak, createdAt } };
  });
};
