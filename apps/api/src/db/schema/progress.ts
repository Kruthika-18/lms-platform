import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses, lessons } from './courses';

// ─── Progress ────────────────────────────────────────────────
export const lessonProgress = pgTable('lesson_progress', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  userId:              uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId:            uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  watchedSeconds:      integer('watched_seconds').notNull().default(0),
  durationSeconds:     integer('duration_seconds').notNull().default(0),
  completed:           boolean('completed').notNull().default(false),
  lastPositionSeconds: integer('last_position_seconds').notNull().default(0),
  updatedAt:           timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniqueProgress: uniqueIndex('progress_unique_idx').on(t.userId, t.lessonId),
  userIdx:        index('progress_user_idx').on(t.userId, t.updatedAt),
}));

// ─── Quizzes ──────────────────────────────────────────────────
export const questionTypeEnum = pgEnum('question_type', ['single', 'multiple', 'code']);

export const quizzes = pgTable('quizzes', {
  id:           uuid('id').primaryKey().defaultRandom(),
  lessonId:     uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  title:        varchar('title', { length: 500 }).notNull(),
  passingScore: integer('passing_score').notNull().default(70), // percentage
  timeLimit:    integer('time_limit_seconds'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  quizId:      uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  text:        text('text').notNull(),
  type:        questionTypeEnum('type').notNull().default('single'),
  options:     jsonb('options').notNull().$type<Array<{ id: string; text: string; isCorrect: boolean }>>(),
  explanation: text('explanation'),
  points:      integer('points').notNull().default(1),
  position:    integer('position').notNull(),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  quizId:      uuid('quiz_id').notNull().references(() => quizzes.id),
  score:       integer('score').notNull(),
  maxScore:    integer('max_score').notNull(),
  passed:      boolean('passed').notNull(),
  answers:     jsonb('answers').notNull().$type<Record<string, string[]>>(),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
}, (t) => ({
  userIdx: index('attempts_user_idx').on(t.userId, t.completedAt),
}));

// ─── Certificates ─────────────────────────────────────────────
export const certificates = pgTable('certificates', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId:         uuid('course_id').notNull().references(() => courses.id),
  verificationCode: varchar('verification_code', { length: 50 }).notNull(),
  pdfUrl:           text('pdf_url'),
  issuedAt:         timestamp('issued_at').notNull().defaultNow(),
}, (t) => ({
  uniqueCert:          uniqueIndex('certs_unique_idx').on(t.userId, t.courseId),
  verificationCodeIdx: uniqueIndex('certs_code_idx').on(t.verificationCode),
}));

// ─── Payments ─────────────────────────────────────────────────
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'cancelled', 'trialing']);

export const subscriptions = pgTable('subscriptions', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  userId:                uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId:  varchar('stripe_subscription_id', { length: 255 }).notNull(),
  stripeCustomerId:      varchar('stripe_customer_id', { length: 255 }).notNull(),
  plan:                  varchar('plan', { length: 50 }).notNull(),
  status:                subscriptionStatusEnum('status').notNull(),
  currentPeriodEnd:      timestamp('current_period_end').notNull(),
  cancelledAt:           timestamp('cancelled_at'),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
  updatedAt:             timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  stripeIdIdx: uniqueIndex('subs_stripe_idx').on(t.stripeSubscriptionId),
  userIdx:     index('subs_user_idx').on(t.userId),
}));

export const orders = pgTable('orders', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id),
  courseId:        uuid('course_id').references(() => courses.id),
  amountCents:     integer('amount_cents').notNull(),
  currency:        varchar('currency', { length: 3 }).notNull().default('usd'),
  stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
  status:          varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
});

// ─── Notifications ────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:      varchar('type', { length: 100 }).notNull(),
  title:     varchar('title', { length: 500 }).notNull(),
  body:      text('body').notNull(),
  link:      text('link'),
  readAt:    timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  userIdx: index('notifs_user_idx').on(t.userId, t.createdAt),
}));
