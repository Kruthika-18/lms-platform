import { sql, and, eq, isNull } from 'drizzle-orm';
import { db } from '../../db';
import { courses } from '../../db/schema';
import { cache } from '../../lib/redis';

export class SearchService {
  async searchCourses(query: string, limit = 10) {
    if (!query.trim()) return [];

    const cacheKey = `search:courses:${query.toLowerCase().trim().slice(0, 50)}`;
    const cached   = await cache.get<any[]>(cacheKey);
    if (cached)    return cached;

    // PostgreSQL full-text search with ts_rank
    const results = await db.execute(sql`
      SELECT
        id, slug, title, short_description, thumbnail_url,
        difficulty, is_free, price_cents, enrollment_count, rating,
        ts_rank(
          to_tsvector('english', title || ' ' || COALESCE(description, '')),
          plainto_tsquery('english', ${query})
        ) AS rank
      FROM courses
      WHERE
        is_published = true
        AND deleted_at IS NULL
        AND to_tsvector('english', title || ' ' || COALESCE(description, ''))
            @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC, enrollment_count DESC
      LIMIT ${limit}
    `);

    const data = results.rows as any[];
    await cache.set(cacheKey, data, 120); // 2 min cache
    return data;
  }

  async globalSearch(query: string) {
    const [courseResults] = await Promise.all([
      this.searchCourses(query, 5),
    ]);

    return {
      courses: courseResults,
    };
  }

  async suggestions(prefix: string) {
    if (prefix.length < 2) return [];

    const results = await db.execute(sql`
      SELECT DISTINCT title
      FROM courses
      WHERE is_published = true
        AND deleted_at IS NULL
        AND title ILIKE ${prefix + '%'}
      LIMIT 6
    `);

    return results.rows.map((r: any) => r.title);
  }
}
