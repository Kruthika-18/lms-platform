import type { FastifyPluginAsync } from 'fastify';
import { SearchService } from './search.service';

const searchService = new SearchService();

export const searchRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/search?q=python
  fastify.get('/', async (req) => {
    const { q } = req.query as { q?: string };
    if (!q?.trim()) return { success: true, data: { courses: [] } };
    const results = await searchService.globalSearch(q.trim());
    return { success: true, data: results };
  });

  // GET /api/v1/search/suggestions?q=pyth
  fastify.get('/suggestions', async (req) => {
    const { q } = req.query as { q?: string };
    if (!q?.trim() || q.length < 2) return { success: true, data: [] };
    const suggestions = await searchService.suggestions(q.trim());
    return { success: true, data: suggestions };
  });
};
