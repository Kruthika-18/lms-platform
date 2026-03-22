// ─── User & Auth ─────────────────────────────────────────────
export type UserRole = 'student' | 'instructor' | 'admin';
export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  plan: UserPlan;
  xp: number;
  streak: number;
  emailVerifiedAt?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

// ─── Courses ─────────────────────────────────────────────────
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  instructorId: string;
  instructor?: Instructor;
  priceCents: number;
  isFree: boolean;
  isPublished: boolean;
  difficulty: Difficulty;
  tags: string[];
  totalLessons: number;
  totalDurationSeconds: number;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  publishedAt?: string;
  createdAt: string;
}

export interface Instructor {
  id: string;
  name: string;
  avatarUrl?: string;
  bio: string;
  title: string;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export type LessonType = 'video' | 'quiz' | 'article' | 'lab';

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  position: number;
  type: LessonType;
  durationSeconds: number;
  isPreview: boolean;
  videoUrl?: string;
  articleContent?: string;
}

// ─── Progress ─────────────────────────────────────────────────
export interface LessonProgress {
  lessonId: string;
  watchedSeconds: number;
  durationSeconds: number;
  completed: boolean;
  lastPositionSeconds: number;
  updatedAt: string;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
  completedAt?: string;
}

export interface ProgressBatchItem {
  lessonId: string;
  positionSeconds: number;
  durationSeconds: number;
  ts: number;
}

// ─── Enrollment ───────────────────────────────────────────────
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  progress?: CourseProgress;
  enrolledAt: string;
  completedAt?: string;
}

// ─── Quiz ─────────────────────────────────────────────────────
export type QuestionType = 'single' | 'multiple' | 'code';

export interface QuizQuestion {
  id: string;
  quizId: string;
  text: string;
  type: QuestionType;
  options: QuizOption[];
  explanation?: string;
  points: number;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean; // only shown after submission
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  answers: Record<string, string[]>;
  completedAt: string;
}

// ─── Certificate ──────────────────────────────────────────────
export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  verificationCode: string;
  pdfUrl: string;
  issuedAt: string;
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

// ─── API Response wrapper ─────────────────────────────────────
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

// ─── Admin ────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeToday: number;
  revenueThisMonth: number;
  completionRate: number;
}
