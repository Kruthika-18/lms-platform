'use client';
import Link from 'next/link';
import { BookOpen, Award, Flame, Star, ArrowRight, Play } from 'lucide-react';
import { useEnrollments, useCertificates } from '../../hooks/use-api';
import { useAuthStore } from '../../lib/auth-store';
import { CourseCard } from '../../components/course/course-card';

const ACHIEVEMENTS = [
  { id: 'first-lesson', label: 'First Lesson',   emoji: '🎯', xp: 50   },
  { id: 'week-streak',  label: '7-Day Streak',   emoji: '🔥', xp: 200  },
  { id: 'course-done',  label: 'First Graduate', emoji: '🎓', xp: 500  },
  { id: 'month-streak', label: 'Month Warrior',  emoji: '⚡', xp: 1000 },
  { id: 'five-certs',   label: '5 Certificates', emoji: '🏆', xp: 1500 },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: enrollments, isLoading } = useEnrollments();
  const { data: certs } = useCertificates();

  const inProgress = enrollments?.filter((e: any) => !e.completedAt) ?? [];
  const completed  = enrollments?.filter((e: any) => !!e.completedAt)  ?? [];

  const earned = new Set<string>();
  if ((enrollments?.length ?? 0) >= 1) earned.add('first-lesson');
  if ((user?.streak ?? 0) >= 7)        earned.add('week-streak');
  if ((certs?.length ?? 0) >= 1)       earned.add('course-done');
  if ((user?.streak ?? 0) >= 30)       earned.add('month-streak');
  if ((certs?.length ?? 0) >= 5)       earned.add('five-certs');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-1">
          Welcome back, {user?.name?.split(' ')[0] ?? 'Learner'} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Consistency beats intensity — keep your streak going!
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled',     value: enrollments?.length ?? 0, icon: BookOpen, c: 'text-brand-600 bg-brand-50' },
          { label: 'Certificates', value: certs?.length ?? 0,       icon: Award,    c: 'text-amber-600 bg-amber-50' },
          { label: 'Day streak',   value: `${user?.streak ?? 0}🔥`, icon: Flame,    c: 'text-orange-600 bg-orange-50' },
          { label: 'Total XP',     value: `${user?.xp ?? 0}⚡`,     icon: Star,     c: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, c }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${c}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {inProgress.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Continue learning</h2>
            <Link href="/dashboard/courses" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              All courses <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {inProgress.slice(0, 3).map((e: any) =>
              e.course ? <CourseCard key={e.id} course={e.course} progress={e.progress?.percentComplete} /> : null
            )}
          </div>
        </section>
      ) : !isLoading ? (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Start your first course</h3>
          <p className="text-sm text-gray-500 mb-5">Browse 200+ expert-led courses.</p>
          <Link href="/courses" className="btn-primary text-sm inline-flex items-center gap-2">
            <Play className="w-4 h-4" /> Browse courses
          </Link>
        </div>
      ) : null}

      <section>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Achievements</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const isEarned = earned.has(a.id);
            return (
              <div key={a.id}
                className={`card p-3 text-center ${isEarned ? 'ring-2 ring-brand-400/30' : 'opacity-40 grayscale'}`}>
                <div className="text-2xl mb-1.5">{a.emoji}</div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{a.label}</p>
                {isEarned && <p className="text-xs text-brand-500 mt-0.5">+{a.xp} XP</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}