# Development Guide

## Prerequisites

| Tool          | Version   | Install                              |
|---------------|-----------|--------------------------------------|
| Node.js       | 20+       | https://nodejs.org                   |
| Docker        | 24+       | https://docker.com                   |
| PostgreSQL    | 16        | via Docker (preferred)               |
| Redis         | 7         | via Docker (preferred)               |
| FFmpeg        | 6+        | `brew install ffmpeg` / apt           |

---

## First-time setup

```bash
# 1. Install all workspace dependencies
npm install

# 2. Copy and fill env vars
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
# Edit both files with your secrets

# 3. Start infrastructure
docker-compose up postgres redis -d

# 4. Generate and run DB migrations
cd apps/api
npm run db:generate   # generates migration files from schema
npm run db:migrate    # applies migrations to postgres

# 5. Seed sample data (3 users + 3 courses + full curriculum)
npm run db:seed

# 6. Start all services (from root)
cd ../..
npm run dev
```

**Services:**
- Frontend:     http://localhost:3000
- API:          http://localhost:4000
- Queue board:  http://localhost:3001
- DB Studio:    `cd apps/api && npm run db:studio`

---

## Seeded accounts

| Role       | Email                       | Password       |
|------------|-----------------------------|----------------|
| Admin      | admin@learnhub.dev          | admin123456    |
| Instructor | instructor@learnhub.dev     | instructor123  |
| Student    | student@learnhub.dev        | student123     |

---

## Key development workflows

### Adding a new API route

1. Create `src/modules/<name>/<name>.service.ts` — business logic
2. Create `src/modules/<name>/<name>.routes.ts` — Fastify routes
3. Register in `src/server.ts`:
   ```ts
   fastify.register(myRoutes, { prefix: '/api/v1/my-resource' });
   ```
4. Add TypeScript types to `packages/shared-types/index.ts`
5. Add React Query hook to `apps/web/hooks/use-api.ts`

### Adding a DB table

1. Add schema to `apps/api/src/db/schema/<table>.ts`
2. Export from `apps/api/src/db/schema/index.ts`
3. Generate migration: `npm run db:generate`
4. Apply: `npm run db:migrate`
5. Update types in `packages/shared-types/`

### Adding a background job

1. Define queue in `src/workers/queues.ts`
2. Create worker in `src/workers/<name>.worker.ts`
3. Import in `src/workers/index.ts`
4. Add job to queue from a service: `await myQueue.add('job-name', payload)`

### Frontend new page

1. Create `apps/web/app/<path>/page.tsx`
2. Use `useQuery` / `useMutation` from `hooks/use-api.ts`
3. Add route to Navbar if needed

---

## Database schema cheatsheet

```
users               — auth, profile, role (student/instructor/admin), plan, xp, streak
refresh_tokens      — bcrypt-hashed tokens with family rotation
courses             — published courses, slug, pricing, difficulty
sections            — ordered sections within a course
lessons             — video/quiz/article/lab lessons within sections
enrollments         — user ↔ course join with completion tracking
lesson_progress     — per-lesson watch position + completed flag
quizzes             — quiz config with passing score
quiz_questions      — questions with JSONB options including isCorrect
quiz_attempts       — user submissions with scores
certificates        — issued certs with verification code
subscriptions       — Stripe subscription state
orders              — one-time course purchases
notifications       — in-app notification feed
```

---

## Auth flow

```
Register/Login
    │
    ├─► Access token (15m JWT) — stored in memory (React state)
    │                            sent as Authorization: Bearer header
    └─► Refresh token (7d)     — stored as bcrypt hash in DB
                                 sent via httpOnly SameSite=Strict cookie

Auto-refresh (api-client.ts axios interceptor):
    1. API returns 401
    2. POST /api/v1/auth/refresh (cookie sent automatically)
    3. New access + refresh token pair issued (old revoked)
    4. Retry original request

Reuse attack detection:
    Tokens are grouped in "families". If a token that's already been
    rotated is used again → entire family revoked → user must re-login.
```

---

## Video pipeline

```
Instructor uploads:
    1. Frontend requests presigned S3 upload URL  POST /api/v1/videos/upload-url
    2. Browser uploads directly to S3             PUT <presignedUrl>
    3. Frontend confirms upload                   POST /api/v1/videos/confirm-upload
    4. API queues transcoding job                 BullMQ → video-transcode.worker.ts

Worker processes:
    1. Downloads raw video from S3
    2. FFmpeg transcodes to HLS (360p / 720p / 1080p)
    3. Uploads HLS segments + manifests to S3
    4. Updates lesson.hlsUrl + lesson.durationSeconds in DB

Student watches:
    1. Frontend calls GET /api/v1/videos/:lessonId/stream
    2. API checks enrollment, generates signed S3 URL (1hr expiry)
    3. HLS.js loads adaptive stream from CDN edge
    4. Progress tracker sends sendBeacon every 10s
```

---

## Progress tracking details

```typescript
// Client: ProgressTracker class (lib/progress-tracker.ts)
// - Buffers updates in memory
// - Flushes every 10s OR on:
//   - document.visibilityState === 'hidden'
//   - pagehide event (mobile)
//   - beforeunload event

// Server: GREATEST merge prevents progress regression
INSERT INTO lesson_progress (...) VALUES (...)
ON CONFLICT (user_id, lesson_id) DO UPDATE SET
  watched_seconds      = GREATEST(lesson_progress.watched_seconds, EXCLUDED.watched_seconds),
  last_position_seconds = GREATEST(lesson_progress.last_position_seconds, EXCLUDED.last_position_seconds),
  completed            = lesson_progress.completed OR EXCLUDED.completed

// Completion threshold: position / duration >= 0.90
// Certificate: queued async via BullMQ when ALL lessons complete
```

---

## Testing

```bash
# Unit tests
cd apps/api && npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test -- --watch
```

**What's tested:**
- Password hashing and verification
- Progress completion threshold logic
- Quiz scoring with edge cases (partial multi-select, extra answers)
- Cache key generation
- Integration test stubs (fill in with test DB)

---

## Environment variables reference

### API (`apps/api/.env`)

| Variable                | Required | Description                            |
|-------------------------|----------|----------------------------------------|
| DATABASE_URL            | ✅       | PostgreSQL connection string           |
| REDIS_URL               | ✅       | Redis connection string                |
| JWT_SECRET              | ✅       | Min 64 chars random string             |
| COOKIE_SECRET           | ✅       | Min 64 chars random string             |
| FRONTEND_URL            | ✅       | CORS origin (http://localhost:3000)    |
| AWS_ACCESS_KEY_ID       | Videos   | AWS credentials for S3                 |
| AWS_SECRET_ACCESS_KEY   | Videos   | AWS credentials for S3                 |
| AWS_REGION              | Videos   | e.g. ap-south-1                        |
| S3_BUCKET_NAME          | Videos   | S3 bucket for media                    |
| STRIPE_SECRET_KEY       | Payments | Stripe secret key (sk_test_...)        |
| STRIPE_WEBHOOK_SECRET   | Payments | Stripe webhook signing secret          |
| STRIPE_PRO_PRICE_ID     | Payments | Stripe price ID for Pro plan           |
| SMTP_HOST               | Emails   | SMTP server hostname                   |
| SMTP_USER               | Emails   | SMTP username                          |
| SMTP_PASS               | Emails   | SMTP password                          |
| SENTRY_DSN              | Optional | Sentry error tracking DSN              |

### Web (`apps/web/.env.local`)

| Variable              | Required | Description          |
|-----------------------|----------|----------------------|
| NEXT_PUBLIC_API_URL   | ✅       | API base URL         |

---

## Production checklist

- [ ] All env vars set (no .env.example values)
- [ ] JWT_SECRET and COOKIE_SECRET are 64+ random chars
- [ ] CORS FRONTEND_URL is the exact production domain
- [ ] Stripe webhook registered at `/api/v1/payments/webhook`
- [ ] S3 bucket policy configured (private, no public access)
- [ ] DB migration run before deploy (`npm run db:migrate`)
- [ ] Sentry DSN configured for error tracking
- [ ] Rate limiting tuned for expected traffic
- [ ] CDN (Cloudflare) configured in front of web + api
