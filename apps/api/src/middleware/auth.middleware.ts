import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { redis } from '../lib/redis';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await req.jwtVerify<{ sub: string }>();

      // Check if user's tokens have been globally revoked (e.g., after password change)
      const blacklisted = await redis.get(`blacklist:user:${payload.sub}`);
      if (blacklisted) {
        return reply.code(401).send({ success: false, error: 'UNAUTHORIZED', message: 'Session invalidated' });
      }
    } catch {
      return reply.code(401).send({ success: false, error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    }
  });

  fastify.decorate('requireRole', (role: string) =>
    async (req: FastifyRequest, reply: FastifyReply) => {
      await fastify.authenticate(req, reply);
      const user = req.user as any;
      if (!user || user.role !== role) {
        return reply.code(403).send({ success: false, error: 'FORBIDDEN', message: 'Insufficient permissions' });
      }
    },
  );
};

export default fp(authPlugin);
