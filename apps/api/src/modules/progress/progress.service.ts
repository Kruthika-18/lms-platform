import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import { lessonProgress, lessons, sections, enrollments, courses, certificates } from '../../db/schema';
import { cache, cacheKeys } from '../../lib/redis';
import { certificateQueue } from '../../workers/queues';
import type { ProgressBatchItem } from '@lms/types';

export class ProgressService {
  // ─── Batch upsert progress ────────────────────────────────────
  // Uses GREATEST to ensure we never regress progress (late packets, multi-device)
  async batchUpsert(userId: string, items: ProgressBatchItem[]) {
    if (!items.length) return;

    await db.transaction(async (tx) => {
      for (const item of items) {
        const isCompleted = item.positionSeconds / Math.max(item.durationSeconds, 1) >= 0.9;

        await tx
          .insert(lessonProgress)
          .values({
            userId,
            lessonId:            item.lessonId,
            watchedSeconds:      Math.floor(item.positionSeconds),
            durationSeconds:     item.durationSeconds,
            completed:           isCompleted,
            lastPositionSeconds: Math.floor(item.positionSeconds),
          })
          .onConflictDoUpdate({
            target: [lessonProgress.userId, lessonProgress.lessonId],
            set: {
              // GREATEST ensures progress never goes backward
              watchedSeconds:      sql`GREATEST(lesson_progress.watched_seconds, EXCLUDED.watched_seconds)`,
              lastPositionSeconds: sql`GREATEST(lesson_progress.last_position_seconds, EXCLUDED.last_position_seconds)`,
              completed:           sql`lesson_progress.completed OR EXCLUDED.completed`,
              durationSeconds:     sql`EXCLUDED.duration_seconds`,
              updatedAt:           new Date(),
            },
          });
      }
    });

    // Invalidate course progress cache for affected courses
    const lessonIds = items.map((i) => i.lessonId);
    this.invalidateProgressCaches(userId, lessonIds).catch(() => {});

    // Check course completions async
    this.checkCourseCompletions(userId, items).catch(() => {});
  }

  async getLessonProgress(userId: string, lessonId: string) {
    return db.query.lessonProgress.findFirst({
      where: and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId),
      ),
    });
  }

  async getUserProgress(userId: string) {
    return db.query.lessonProgress.findMany({
      where: eq(lessonProgress.userId, userId),
    });
  }

  // ─── Check and issue certificates ────────────────────────────
  private async checkCourseCompletions(userId: string, items: ProgressBatchItem[]) {
    // Find which courses these lessons belong to
    const lessonIds = items.map((i) => i.lessonId);
    const lessonRows = await db
      .select({ lessonId: lessons.id, courseId: sections.courseId })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(sql`${lessons.id} = ANY(${lessonIds})`);

    const courseIds = [...new Set(lessonRows.map((r) => r.courseId))];

    for (const courseId of courseIds) {
      await this.maybeIssueCertificate(userId, courseId);
    }
  }

  private async maybeIssueCertificate(userId: string, courseId: string) {
    // Is user enrolled?
    const enrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    });
    if (!enrollment || enrollment.completedAt) return;

    // Get all lessons for the course
    const allLessons = await db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(eq(sections.courseId, courseId));

    if (!allLessons.length) return;

    // Get completed lessons
    const completedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.completed, true),
          sql`${lessonProgress.lessonId} = ANY(${allLessons.map((l) => l.id)})`,
        ),
      );

    const pct = Number(completedCount[0].count) / allLessons.length;
    if (pct < 1.0) return;

    // Mark enrollment complete
    await db.update(enrollments)
      .set({ completedAt: new Date() })
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

    // Queue certificate generation
    await certificateQueue.add('generate', { userId, courseId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    // Invalidate caches
    await cache.del(cacheKeys.courseProgress(userId, courseId));
  }

  private async invalidateProgressCaches(userId: string, lessonIds: string[]) {
    const lessonRows = await db
      .select({ courseId: sections.courseId })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(sql`${lessons.id} = ANY(${lessonIds})`);

    const courseIds = [...new Set(lessonRows.map((r) => r.courseId))];
    const keys = courseIds.map((cid) => cacheKeys.courseProgress(userId, cid));
    if (keys.length) await cache.del(...keys);
  }
}
