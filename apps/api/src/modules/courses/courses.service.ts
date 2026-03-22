import { eq, and, isNull, desc, ilike, sql, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { courses, sections, lessons, enrollments, lessonProgress } from '../../db/schema';
import { cache, cacheKeys } from '../../lib/redis';
import { Errors } from '../../lib/errors';
import { nanoid } from 'nanoid';

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + nanoid(6);
}

export class CourseService {
  // ─── List / Search ───────────────────────────────────────────
  async listPublished(opts: {
    cursor?: string;
    limit?: number;
    search?: string;
    difficulty?: string;
    tag?: string;
    isFree?: boolean;
  }) {
    const limit = Math.min(opts.limit ?? 20, 50);

    const result = await db.query.courses.findMany({
      where: and(
        eq(courses.isPublished, true),
        isNull(courses.deletedAt),
        opts.search ? ilike(courses.title, `%${opts.search}%`) : undefined,
        opts.difficulty ? eq(courses.difficulty, opts.difficulty as any) : undefined,
        opts.isFree !== undefined ? eq(courses.isFree, opts.isFree) : undefined,
      ),
      orderBy: [desc(courses.enrollmentCount)],
      limit: limit + 1,
      with: { instructor: { columns: { id: true, name: true, avatarUrl: true, title: true } } },
    });

    const hasMore = result.length > limit;
    const data = hasMore ? result.slice(0, limit) : result;
    return { data, hasMore, nextCursor: hasMore ? data[data.length - 1].id : undefined };
  }

  async getBySlug(slug: string, userId?: string) {
    const cacheKey = cacheKeys.courseBySlug(slug);
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const course = await db.query.courses.findFirst({
      where: and(eq(courses.slug, slug), isNull(courses.deletedAt)),
      with: {
        sections: {
          where: isNull(sections.deletedAt),
          orderBy: sections.position,
          with: {
            lessons: {
              where: isNull(lessons.deletedAt),
              orderBy: lessons.position,
            },
          },
        },
      },
    });
    if (!course) throw Errors.notFound('Course');

    await cache.set(cacheKey, course, 3600);
    return course;
  }

  async getById(id: string) {
    const cached = await cache.get<any>(cacheKeys.course(id));
    if (cached) return cached;

    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, id), isNull(courses.deletedAt)),
    });
    if (!course) throw Errors.notFound('Course');
    await cache.set(cacheKeys.course(id), course, 3600);
    return course;
  }

  // ─── Enrollment ──────────────────────────────────────────────
  async enroll(userId: string, courseId: string) {
    const course = await this.getById(courseId);

    const existing = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    });
    if (existing) throw Errors.alreadyEnrolled();

    if (!course.isFree && course.priceCents > 0) {
      throw Errors.paymentRequired();
    }

    const [enrollment] = await db.insert(enrollments).values({ userId, courseId }).returning();

    // Increment enrollment count (non-critical, fire and forget)
    db.update(courses)
      .set({ enrollmentCount: sql`${courses.enrollmentCount} + 1` })
      .where(eq(courses.id, courseId))
      .catch(() => {});

    await cache.del(cacheKeys.course(courseId), cacheKeys.courseBySlug(course.slug));
    return enrollment;
  }

  async getUserEnrollments(userId: string) {
    return db.query.enrollments.findMany({
      where: eq(enrollments.userId, userId),
      orderBy: [desc(enrollments.enrolledAt)],
      with: { course: true },
    });
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const key = cacheKeys.enrollment(userId, courseId);
    const cached = await cache.get<boolean>(key);
    if (cached !== null) return cached;

    const enrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    });
    const result = !!enrollment;
    await cache.set(key, result, 900);
    return result;
  }

  // ─── Course Progress ─────────────────────────────────────────
  async getCourseProgress(userId: string, courseId: string) {
    const key = cacheKeys.courseProgress(userId, courseId);
    const cached = await cache.get<any>(key);
    if (cached) return cached;

    const allLessons = await db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(and(eq(sections.courseId, courseId), isNull(lessons.deletedAt)));

    const lessonIds = allLessons.map((l) => l.id);
    if (!lessonIds.length) return { completedLessons: 0, totalLessons: 0, percentComplete: 0 };

    const completed = await db.query.lessonProgress.findMany({
      where: and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.completed, true),
        inArray(lessonProgress.lessonId, lessonIds),
      ),
    });

    const progress = {
      courseId,
      completedLessons: completed.length,
      totalLessons: lessonIds.length,
      percentComplete: Math.round((completed.length / lessonIds.length) * 100),
    };

    await cache.set(key, progress, 300);
    return progress;
  }

  // ─── Admin CRUD ──────────────────────────────────────────────
  async create(instructorId: string, data: {
    title: string; description: string; shortDescription: string;
    difficulty: string; priceCents: number; isFree: boolean; tags: string[];
  }) {
    const slug = slugify(data.title);
    const [course] = await db.insert(courses).values({
      ...data,
      slug,
      instructorId,
      difficulty: data.difficulty as any,
    }).returning();
    return course;
  }

  async update(id: string, instructorId: string, data: Partial<typeof courses.$inferInsert>) {
    const course = await this.getById(id);
    if (course.instructorId !== instructorId) throw Errors.forbidden();

    const [updated] = await db.update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    await cache.del(cacheKeys.course(id), cacheKeys.courseBySlug(course.slug));
    return updated;
  }

  async softDelete(id: string, instructorId: string) {
    const course = await this.getById(id);
    if (course.instructorId !== instructorId) throw Errors.forbidden();
    await db.update(courses).set({ deletedAt: new Date() }).where(eq(courses.id, id));
    await cache.del(cacheKeys.course(id), cacheKeys.courseBySlug(course.slug));
  }

  // ─── Sections & Lessons ──────────────────────────────────────
  async addSection(courseId: string, title: string, position: number) {
    const [section] = await db.insert(sections).values({ courseId, title, position }).returning();
    await cache.invalidatePattern(`course:*`);
    return section;
  }

  async addLesson(sectionId: string, data: Partial<typeof lessons.$inferInsert>) {
    const [lesson] = await db.insert(lessons).values({
      sectionId,
      title: data.title!,
      position: data.position ?? 0,
      type: data.type ?? 'video',
      durationSeconds: data.durationSeconds ?? 0,
      isPreview: data.isPreview ?? false,
    }).returning();
    await cache.invalidatePattern(`course:*`);
    return lesson;
  }

  async getLesson(lessonId: string) {
    const lesson = await db.query.lessons.findFirst({
      where: and(eq(lessons.id, lessonId), isNull(lessons.deletedAt)),
    });
    if (!lesson) throw Errors.notFound('Lesson');
    return lesson;
  }
}
