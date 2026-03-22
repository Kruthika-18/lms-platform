import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['student', 'instructor', 'admin']);
export const userPlanEnum = pgEnum('user_plan', ['free', 'pro', 'enterprise']);

export const users = pgTable('users', {
  id:              uuid('id').primaryKey().defaultRandom(),
  email:           varchar('email', { length: 255 }).notNull(),
  passwordHash:    varchar('password_hash', { length: 255 }),
  name:            varchar('name', { length: 255 }).notNull(),
  avatarUrl:       text('avatar_url'),
  bio:             text('bio'),
  title:           varchar('title', { length: 255 }),
  role:            userRoleEnum('role').notNull().default('student'),
  plan:            userPlanEnum('plan').notNull().default('free'),
  xp:              integer('xp').notNull().default(0),
  streak:          integer('streak').notNull().default(0),
  lastActiveAt:    timestamp('last_active_at'),
  emailVerifiedAt: timestamp('email_verified_at'),
  oauthProvider:   varchar('oauth_provider', { length: 50 }),
  oauthId:         varchar('oauth_id', { length: 255 }),
  deletedAt:       timestamp('deleted_at'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  emailIdx:        uniqueIndex('users_email_idx').on(t.email),
  oauthIdx:        index('users_oauth_idx').on(t.oauthProvider, t.oauthId),
}));

export const refreshTokens = pgTable('refresh_tokens', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash:      varchar('token_hash', { length: 255 }).notNull(),
  familyId:       uuid('family_id').notNull(),
  expiresAt:      timestamp('expires_at').notNull(),
  replacedBy:     uuid('replaced_by'),
  revokedAt:      timestamp('revoked_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  userIdx:        index('rt_user_idx').on(t.userId),
  hashIdx:        uniqueIndex('rt_hash_idx').on(t.tokenHash),
}));

export const emailVerifications = pgTable('email_verifications', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:      varchar('token', { length: 255 }).notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  usedAt:     timestamp('used_at'),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
});

export const passwordResets = pgTable('password_resets', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash:  varchar('token_hash', { length: 255 }).notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  usedAt:     timestamp('used_at'),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
});

