'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Users, Star, Award, CheckCircle2, Play, Lock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useCourse, useEnroll } from '../../../hooks/use-api';
import { useAuthStore } from '../../../lib/auth-store';
import { toast } from 'sonner';

function formatDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CourseDetailPage() {
  const params = useParams();
  const slug   = params.slug as string;
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: course, isLoading } = useCourse(slug);
  const { mutateAsync: enroll, isPending } = useEnroll();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleEnroll = async () => {
    if (!user) { router.push('/auth/register'); return; }
    try {
      await enroll(course!.id);
      toast.success('Enrolled! Let\'s start learning 🚀');
      router.push(`/learn/courses/${slug}`);
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === 'ALREADY_ENROLLED') { router.push(`/learn/courses/${slug}`); return; }
      if (code === 'PAYMENT_REQUIRED') { router.push(`/pricing`); return; }
      toast.error('Could not enroll, please try again');
    }
  };

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
    <div className="skeleton h-8 w-2/3 rounded mb-4" />
    <div className="skeleton h-4 w-full rounded mb-2" />
    <div className="skeleton h-4 w-3/4 rounded" />
  </div>;

  if (!course) return <div className="text-center py-24 text-gray-400">Course not found</div>;

  const totalLessons = course.sections?.reduce((acc: number, s: any) => acc + (s.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-white dark:bg-brand-900">
      {/* Hero */}
      <div className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`badge-${course.difficulty}`}>{course.difficulty}</span>
                {course.isFree && <span className="badge-free">Free</span>}
                {course.tags?.map((t: string) => (
                  <span key={t} className="badge bg-white/10 text-gray-200">{t}</span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{course.title}</h1>
              <p className="text-gray-300 mb-6 text-lg">{course.shortDescription}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                {course.rating > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" /> {course.rating.toFixed(1)} ({course.ratingCount.toLocaleString()})
                  </span>
                )}
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.enrollmentCount.toLocaleString()} enrolled</span>
                {course.totalDurationSeconds > 0 && (
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDuration(course.totalDurationSeconds)}</span>
                )}
                <span className="flex items-center gap-1"><Play className="w-4 h-4" />{totalLessons} lessons</span>
              </div>
              {course.instructor && (
                <div className="flex items-center gap-3 mt-6">
                  <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
                    {course.instructor.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{course.instructor.name}</p>
                    <p className="text-xs text-gray-400">{course.instructor.title}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Enroll card */}
            <div className="lg:col-span-1">
              <div className="card overflow-hidden sticky top-20">
                <div className="relative aspect-video bg-gray-800">
                  {course.thumbnailUrl && (
                    <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                      <Play className="w-6 h-6 text-brand-600 ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {course.isFree ? 'Free' : `$${(course.priceCents / 100).toFixed(0)}`}
                  </div>
                  <button onClick={handleEnroll} disabled={isPending}
                    className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 mb-3">
                    {isPending
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Zap className="w-5 h-5" /> {course.isFree ? 'Enroll for free' : 'Buy & start learning'}</>}
                  </button>
                  <p className="text-xs text-center text-gray-400 mb-4">30-day money-back guarantee</p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {[
                      `${totalLessons} lessons`,
                      formatDuration(course.totalDurationSeconds) + ' of content',
                      'Certificate of completion',
                      'Lifetime access',
                    ].map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="section-heading mb-6">Course curriculum</h2>
        <div className="max-w-3xl space-y-2">
          {course.sections?.map((section: any) => (
            <div key={section.id} className="card overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{section.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {section.lessons?.length ?? 0} lessons
                  </p>
                </div>
                {expandedSections.has(section.id)
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {expandedSections.has(section.id) && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  {section.lessons?.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      {lesson.isPreview
                        ? <Play className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        : <Lock className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{lesson.title}</span>
                      {lesson.durationSeconds > 0 && (
                        <span className="text-xs text-gray-400">{formatDuration(lesson.durationSeconds)}</span>
                      )}
                      {lesson.isPreview && (
                        <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Preview</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
