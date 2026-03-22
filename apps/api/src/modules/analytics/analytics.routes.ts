import type { FastifyPluginAsync } from 'fastify';
import { sql, eq, and, gte, desc } from 'drizzle-orm';
import { db } from '../../db';
import { lessonProgress, lessons, sections, enrollments } from '../../db/schema';

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/analytics/me/weekly  — last 7 days of study activity
  fastify.get('/me/weekly', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId   = (req.user as any).sub;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rows = await db.execute(sql`
      SELECT
        DATE(updated_at) AS day,
        SUM(watched_seconds) AS total_seconds,
        COUNT(*) AS lessons_watched
      FROM lesson_progress
      WHERE user_id = ${userId}
        AND updated_at >= ${sevenDaysAgo}
      GROUP BY DATE(updated_at)
      ORDER BY day ASC
    `);

    return { success: true, data: rows.rows };
  });

  // GET /api/v1/analytics/me/skills  — skill breakdown from completed courses
  fastify.get('/me/skills', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;

    // Get all completed enrollments with course tags
    const completed = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.userId, userId),
        sql`completed_at IS NOT NULL`,
      ),
      with: { course: { columns: { tags: true } } },
    });

    // Aggregate tag frequencies as skill proxy
    const tagCounts: Record<string, number> = {};
    for (const enrollment of completed) {
      for (const tag of enrollment.course?.tags ?? []) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }

    const skills = Object.entries(tagCounts)
      .map(([tag, count]) => ({ skill: tag, level: Math.min(100, count * 25) }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);

    return { success: true, data: skills };
  });

  // GET /api/v1/analytics/me/streak  — streak history
  fastify.get('/me/streak', { preHandler: [fastify.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;

    const rows = await db.execute(sql`
      SELECT DISTINCT DATE(updated_at) AS active_day
      FROM lesson_progress
      WHERE user_id = ${userId}
        AND updated_at >= NOW() - INTERVAL '90 days'
      ORDER BY active_day DESC
    `);

    return { success: true, data: rows.rows };
  });

  // GET /api/v1/analytics/courses/:courseId/overview  — instructor analytics
  fastify.get('/courses/:courseId/overview', { preHandler: [fastify.authenticate] }, async (req) => {
    const { courseId } = req.params as { courseId: string };

    const [enrollCount, completionCount, avgProgress] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) FROM enrollments WHERE course_id = ${courseId}`),
      db.execute(sql`SELECT COUNT(*) FROM enrollments WHERE course_id = ${courseId} AND completed_at IS NOT NULL`),
      db.execute(sql`
        SELECT AVG(
          (SELECT COUNT(*) FROM lesson_progress lp
           INNER JOIN lessons l ON lp.lesson_id = l.id
           INNER JOIN sections s ON l.section_id = s.id
           WHERE lp.user_id = e.user_id AND s.course_id = ${courseId} AND lp.completed = true)::float /
          NULLIF((SELECT COUNT(*) FROM lessons l2 INNER JOIN sections s2 ON l2.section_id = s2.id WHERE s2.course_id = ${courseId}), 0) * 100
        ) AS avg_progress
        FROM enrollments e WHERE e.course_id = ${courseId}
      `),
    ]);

    return {
      success: true,
      data: {
        enrollments:    Number((enrollCount.rows[0] as any)?.count ?? 0),
        completions:    Number((completionCount.rows[0] as any)?.count ?? 0),
        avgProgressPct: Math.round(Number((avgProgress.rows[0] as any)?.avg_progress ?? 0)),
      },
    };
  });
};
