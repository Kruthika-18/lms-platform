/**
 * Complete list of all API routes for reference.
 *
 * ─── Auth (/api/v1/auth) ──────────────────────────────────────
 * POST   /register              Register + issue tokens
 * POST   /login                 Login + issue tokens
 * POST   /refresh               Rotate refresh token
 * POST   /logout                Revoke refresh token
 * GET    /me                    Get current user  [auth]
 *
 * ─── Users (/api/v1/users) ──────────────────────────────────
 * GET    /me                    Get my profile    [auth]
 * PATCH  /me                    Update profile    [auth]
 * POST   /me/change-password    Change password   [auth]
 * GET    /:id                   Get public profile
 *
 * ─── Courses (/api/v1/courses) ──────────────────────────────
 * GET    /                      List published courses (search/filter)
 * GET    /:slug                 Get course by slug with curriculum
 * POST   /                      Create course     [auth: instructor]
 * PATCH  /:courseId             Update course     [auth: instructor]
 * DELETE /:courseId             Soft-delete       [auth: instructor]
 * POST   /:courseId/enroll      Enroll            [auth]
 * GET    /:courseId/progress    Course progress   [auth]
 * POST   /:courseId/sections    Add section       [auth: instructor]
 * POST   /sections/:id/lessons  Add lesson        [auth: instructor]
 *
 * ─── Progress (/api/v1/progress) ────────────────────────────
 * POST   /batch                 Batch upsert progress [auth]
 * GET    /lesson/:lessonId      Get lesson progress   [auth]
 * GET    /me                    All my progress       [auth]
 *
 * ─── Videos (/api/v1/videos) ────────────────────────────────
 * POST   /upload-url            Get S3 presigned upload URL [auth]
 * POST   /confirm-upload        Confirm upload + queue transcode [auth]
 * GET    /:lessonId/stream      Get signed streaming URL [auth]
 *
 * ─── Quizzes (/api/v1/quizzes) ──────────────────────────────
 * GET    /:quizId               Get quiz (answers hidden) [auth]
 * POST   /:quizId/submit        Submit attempt + get results [auth]
 * GET    /:quizId/best-attempt  Get best attempt [auth]
 *
 * ─── Payments (/api/v1/payments) ────────────────────────────
 * POST   /course-checkout       Stripe checkout for course [auth]
 * POST   /subscribe             Stripe subscription checkout [auth]
 * POST   /webhook               Stripe webhook (raw body)
 *
 * ─── Certificates (/api/v1/certificates) ────────────────────
 * GET    /                      My certificates [auth]
 * GET    /verify/:code          Public verification
 * GET    /:courseId             Get specific cert [auth]
 *
 * ─── Search (/api/v1/search) ────────────────────────────────
 * GET    /?q=query              Full-text course search
 * GET    /suggestions?q=prefix  Autocomplete suggestions
 *
 * ─── Notifications (/api/v1/notifications) ──────────────────
 * GET    /                      My notifications [auth]
 * GET    /unread-count          Unread count     [auth]
 * POST   /mark-all-read         Mark all read    [auth]
 * POST   /:id/read              Mark one read    [auth]
 *
 * ─── Analytics (/api/v1/analytics) ──────────────────────────
 * GET    /me/weekly             Weekly activity  [auth]
 * GET    /me/skills             Skill radar data [auth]
 * GET    /me/streak             Streak history   [auth]
 * GET    /courses/:id/overview  Course analytics [auth: instructor]
 *
 * ─── Admin (/api/v1/admin) ──────────────────────────────────
 * GET    /stats                 Dashboard stats  [auth: admin]
 * GET    /users                 List users       [auth: admin]
 * PATCH  /users/:id/role        Change role      [auth: admin]
 * DELETE /users/:id             Soft-delete user [auth: admin]
 * GET    /courses               All courses      [auth: admin]
 * PATCH  /courses/:id/publish   Publish toggle   [auth: admin]
 */
export {};
