import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum, index, uniqueIndex, real } from 'drizzle-orm/pg-core';
import { users } from './users';

export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);
export const lessonTypeEnum  = pgEnum('lesson_type', ['video', 'quiz', 'article', 'lab']);

export const courses = pgTable('courses', {
  id:               uuid('id').primaryKey().defaultRandom(),
  slug:             varchar('slug', { length: 255 }).notNull(),
  instructorId:     uuid('instructor_id').notNull().references(() => users.id),
  title:            varchar('title', { length: 500 }).notNull(),
  description:      text('description').notNull(),
  shortDescription: varchar('short_description', { length: 500 }).notNull(),
  thumbnailUrl:     text('thumbnail_url'),
  previewVideoUrl:  text('preview_video_url'),
  priceCents:       integer('price_cents').notNull().default(0),
  isFree:           boolean('is_free').notNull().default(false),
  isPublished:      boolean('is_published').notNull().default(false),
  difficulty:       difficultyEnum('difficulty').notNull().default('beginner'),
  tags:             text('tags').array().notNull().default([]),
  enrollmentCount:  integer('enrollment_count').notNull().default(0),
  rating:           real('rating').notNull().default(0),
  ratingCount:      integer('rating_count').notNull().default(0),
  publishedAt:      timestamp('published_at'),
  deletedAt:        timestamp('deleted_at'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  slugIdx:       uniqueIndex('courses_slug_idx').on(t.slug),
  publishedIdx:  index('courses_published_idx').on(t.isPublished, t.createdAt),
  instructorIdx: index('courses_instructor_idx').on(t.instructorId),
}));

export const sections = pgTable('sections', {
  id:        uuid('id').primaryKey().defaultRandom(),
  courseId:  uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title:     varchar('title', { length: 500 }).notNull(),
  position:  integer('position').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  courseIdx: index('sections_course_idx').on(t.courseId, t.position),
}));

export const lessons = pgTable('lessons', {
  id:              uuid('id').primaryKey().defaultRandom(),
  sectionId:       uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  title:           varchar('title', { length: 500 }).notNull(),
  position:        integer('position').notNull(),
  type:            lessonTypeEnum('type').notNull().default('video'),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  isPreview:       boolean('is_preview').notNull().default(false),
  videoUrl:        text('video_url'),
  videoKey:        text('video_key'), // S3 key
  hlsUrl:          text('hls_url'),   // transcoded HLS manifest
  articleContent:  text('article_content'),
  resources:       text('resources').array().default([]), // downloadable file URLs
  deletedAt:       timestamp('deleted_at'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  sectionIdx: index('lessons_section_idx').on(t.sectionId, t.position),
}));

export const enrollments = pgTable('enrollments', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId:    uuid('course_id').notNull().references(() => courses.id),
  enrolledAt:  timestamp('enrolled_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (t) => ({
  uniqueEnrollment: uniqueIndex('enrollments_unique_idx').on(t.userId, t.courseId),
  userIdx:          index('enrollments_user_idx').on(t.userId, t.enrolledAt),
  courseIdx:        index('enrollments_course_idx').on(t.courseId),
}));

export const courseRatings = pgTable('course_ratings', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id),
  courseId:  uuid('course_id').notNull().references(() => courses.id),
  rating:    integer('rating').notNull(), // 1-5
  review:    text('review'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  uniqueRating: uniqueIndex('ratings_unique_idx').on(t.userId, t.courseId),
}));
