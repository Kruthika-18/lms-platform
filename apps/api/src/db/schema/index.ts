export * from './users';
export * from './courses';
export * from './progress';

import { relations } from 'drizzle-orm';
import { users, refreshTokens } from './users';
import { courses, sections, lessons, enrollments, courseRatings } from './courses';
import { lessonProgress, certificates, subscriptions, orders, notifications, quizzes, quizAttempts, quizQuestions } from './progress';

// ─── User relations ───────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  courses:     many(courses),
  enrollments: many(enrollments),
}));

// ─── Course relations ─────────────────────────────────────────
export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor:  one(users, { fields: [courses.instructorId], references: [users.id] }),
  sections:    many(sections),
  enrollments: many(enrollments),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  course:  one(courses, { fields: [sections.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  section: one(sections, { fields: [lessons.sectionId], references: [sections.id] }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user:   one(users,   { fields: [enrollments.userId],   references: [users.id]   }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user:   one(users,   { fields: [certificates.userId],   references: [users.id]   }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}));