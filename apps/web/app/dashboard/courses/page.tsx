'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Play, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { useEnrollments, useCourseProgress } from '../../../hooks/use-api';
import { formatDuration } from '../../../lib/utils';

function EnrollmentRow({ enrollment }: { enrollment: any }) {
  const { data: progress } = useCourseProgress(enrollment.courseId);
  const course = enrollment.course;
  if (!course) return null;

  const pct = progress?.percentComplete ?? 0;
  const done = !!enrollment.completedAt;

  return (
    <div className="card p-5 flex items-start gap-4">
      {/* Thumbnail */}
      <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        {course.thumbnailUrl ? (
          <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-brand-400" />
          </div>
        )}
        {done && (
          <div className="absolute inset-0 bg-emerald-600/80 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white truncate mb-1">{course.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {course.instructor?.name} · {course.difficulty}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-brand-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
            {pct}%
          </span>
        </div>

        {progress && (
          <p className="text-xs text-gray-400 mt-1">
            {progress.completedLessons} / {progress.totalLessons} lessons
          </p>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/courses/${course.slug}`}
        className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
          done
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50'
        }`}>
        {done ? <><CheckCircle2 className="w-3.5 h-3.5" /> Done</> : <><Play className="w-3.5 h-3.5" /> Continue</>}
      </Link>
    </div>
  );
}

export default function MyCourses() {
  const { data: enrollments, isLoading } = useEnrollments();

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 flex gap-4 animate-pulse">
          <div className="skeleton w-24 h-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-1.5 w-full rounded-full mt-3" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!enrollments?.length) return (
    <div className="card p-12 text-center">
      <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No courses yet</h3>
      <p className="text-sm text-gray-500 mb-5">Enroll in your first course to get started.</p>
      <Link href="/courses" className="btn-primary text-sm">Browse courses</Link>
    </div>
  );

  const inProgress = enrollments.filter((e: any) => !e.completedAt);
  const completed  = enrollments.filter((e: any) => !!e.completedAt);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-1">My Courses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
        </p>
      </div>

      {inProgress.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            In progress ({inProgress.length})
          </h2>
          <div className="space-y-3">
            {inProgress.map((e: any) => <EnrollmentRow key={e.id} enrollment={e} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Completed ({completed.length})
          </h2>
          <div className="space-y-3">
            {completed.map((e: any) => <EnrollmentRow key={e.id} enrollment={e} />)}
          </div>
        </section>
      )}
    </div>
  );
}
