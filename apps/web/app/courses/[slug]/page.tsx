'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock, Users, Star, Award, CheckCircle2, Play, Lock,
  ChevronDown, ChevronUp, Zap, BookOpen, Globe, Infinity
} from 'lucide-react';
import { useCourse, useEnroll, useCourseProgress } from '../../../hooks/use-api';
import { useAuthStore } from '../../../lib/auth-store';
import { Navbar } from '../../../components/layout/navbar';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

function formatDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CourseSlugPage() {
  const params = useParams();
  const slug   = params.slug as string;
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: course, isLoading } = useCourse(slug);
  const { mutateAsync: enroll, isPending } = useEnroll();
  const { data: progress } = useCourseProgress(course?.id ?? '');

  const [expanded, setExpanded] = useState<Set<string>>(new Set([/* open first section */]));

  const toggleSection = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleEnroll = async () => {
    if (!user) { router.push('/auth/register'); return; }
    if (progress) { router.push(`/learn/courses/${course!.id}`); return; }
    try {
      await enroll(course!.id);
      toast.success('Enrolled! Start learning now 🚀');
      router.push(`/learn/courses/${course!.id}`);
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === 'ALREADY_ENROLLED') { router.push(`/learn/courses/${course!.id}`); return; }
      if (code === 'PAYMENT_REQUIRED') { router.push('/pricing'); return; }
      toast.error('Enrollment failed, please try again');
    }
  };

  if (isLoading) return (
    <>
      <Navbar />
      <div className="animate-pulse max-w-7xl mx-auto px-4 py-12 space-y-4">
        <div className="skeleton h-10 w-2/3 rounded-xl" />
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
      </div>
    </>
  );

  if (!course) return (
    <>
      <Navbar />
      <div className="text-center py-32 text-gray-400">Course not found</div>
    </>
  );

  const allLessons  = course.sections?.flatMap((s: any) => s.lessons ?? []) ?? [];
  const totalLessons = allLessons.length;
  const previewCount = allLessons.filter((l: any) => l.isPreview).length;
  const isEnrolled   = !!progress;

  const INCLUDES = [
    { icon: Clock,    text: formatDuration(course.totalDurationSeconds ?? 0) + ' on-demand video' },
    { icon: BookOpen, text: `${totalLessons} lessons across ${course.sections?.length ?? 0} sections` },
    { icon: Globe,    text: 'Full lifetime access'    },
    { icon: Award,    text: 'Certificate of completion' },
    { icon: Infinity, text: 'Access on all devices'   },
  ];

  return (
    <>
      <Navbar />

      {/* Hero strip */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <nav className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                <Link href="/courses" className="hover:text-white">Courses</Link>
                <span>/</span>
                {course.tags?.[0] && <><Link href={`/courses?tag=${course.tags[0]}`} className="hover:text-white capitalize">{course.tags[0]}</Link><span>/</span></>}
                <span className="text-gray-300 truncate">{course.title}</span>
              </nav>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge-${course.difficulty}`}>{course.difficulty}</span>
                {course.isFree && <span className="badge-free">Free</span>}
                {course.tags?.slice(0,3).map((t: string) => (
                  <span key={t} className="badge bg-white/10 text-gray-200 text-xs">{t}</span>
                ))}
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-4">
                {course.title}
              </h1>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">{course.shortDescription}</p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {course.rating > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    {course.rating.toFixed(1)}
                    <span className="text-gray-400 font-normal">({course.ratingCount?.toLocaleString()} reviews)</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Users className="w-4 h-4" />
                  {course.enrollmentCount?.toLocaleString()} students
                </span>
                {course.totalDurationSeconds > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Clock className="w-4 h-4" />
                    {formatDuration(course.totalDurationSeconds)}
                  </span>
                )}
              </div>

              {/* Instructor */}
              {course.instructor && (
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center font-bold text-white">
                    {course.instructor.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{course.instructor.name}</p>
                    {course.instructor.title && (
                      <p className="text-xs text-gray-400">{course.instructor.title}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enroll card – sticky on desktop */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl overflow-hidden shadow-2xl sticky top-24">
                {/* Preview thumbnail */}
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                  {course.thumbnailUrl ? (
                    <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-200 to-purple-200 dark:from-brand-700 dark:to-purple-700" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                      <Play className="w-6 h-6 text-brand-700 ml-0.5" />
                    </div>
                  </div>
                  {previewCount > 0 && (
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded-full">
                        {previewCount} free preview lessons
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold">
                      {course.isFree ? 'Free' : `$${(course.priceCents / 100).toFixed(0)}`}
                    </span>
                    {!course.isFree && (
                      <span className="text-sm text-gray-400 line-through">
                        ${Math.round(course.priceCents / 100 * 1.5).toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <button onClick={handleEnroll} disabled={isPending}
                    className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 mb-3">
                    {isPending
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : isEnrolled
                        ? <><Play className="w-5 h-5" /> Continue learning</>
                        : <><Zap className="w-5 h-5" /> {course.isFree ? 'Enroll for free' : 'Buy now'}</>}
                  </button>

                  {!course.isFree && (
                    <p className="text-xs text-center text-gray-400 mb-4">
                      30-day money-back guarantee
                    </p>
                  )}

                  {/* What's included */}
                  <ul className="space-y-2.5">
                    {INCLUDES.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                        <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {text}
                      </li>
                    ))}
                  </ul>

                  {/* Progress bar if enrolled */}
                  {isEnrolled && progress && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>Your progress</span>
                        <span className="font-medium text-brand-600 dark:text-brand-400">
                          {progress.percentComplete}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${progress.percentComplete}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {progress.completedLessons} / {progress.totalLessons} lessons done
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">

            {/* What you'll learn */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">What you'll learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-5 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
                {[
                  'Core concepts from scratch',
                  'Real-world project experience',
                  'Industry best practices',
                  'Hands-on coding exercises',
                  'Problem-solving techniques',
                  'Portfolio-ready projects',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Course curriculum</h2>
                <span className="text-sm text-gray-500">
                  {totalLessons} lessons · {formatDuration(course.totalDurationSeconds ?? 0)}
                </span>
              </div>

              <div className="space-y-2">
                {course.sections?.map((section: any, idx: number) => {
                  const isOpen = expanded.has(section.id);
                  const sectionDuration = section.lessons?.reduce(
                    (acc: number, l: any) => acc + (l.durationSeconds ?? 0), 0
                  ) ?? 0;

                  return (
                    <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <button onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-xs font-bold text-gray-400 w-6">S{idx + 1}</span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{section.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {section.lessons?.length ?? 0} lessons
                              {sectionDuration > 0 && ` · ${formatDuration(sectionDuration)}`}
                            </p>
                          </div>
                        </div>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {section.lessons?.map((lesson: any) => (
                            <div key={lesson.id}
                              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                              {lesson.isPreview || isEnrolled
                                ? <Play className="w-4 h-4 text-brand-500 flex-shrink-0" />
                                : <Lock className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                              <span className={cn(
                                'text-sm flex-1',
                                lesson.isPreview || isEnrolled
                                  ? 'text-gray-700 dark:text-gray-300'
                                  : 'text-gray-500 dark:text-gray-500',
                              )}>
                                {lesson.title}
                              </span>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {lesson.durationSeconds > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {formatDuration(lesson.durationSeconds)}
                                  </span>
                                )}
                                {lesson.isPreview && !isEnrolled && (
                                  <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                                    Preview
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* About instructor */}
            {course.instructor && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your instructor</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300 text-2xl font-bold flex-shrink-0">
                    {course.instructor.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{course.instructor.name}</h3>
                    {course.instructor.title && (
                      <p className="text-sm text-brand-600 dark:text-brand-400 mb-2">{course.instructor.title}</p>
                    )}
                    {course.instructor.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{course.instructor.bio}</p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right column (desktop) — empty or recommendations */}
          <div className="hidden lg:block" />
        </div>
      </main>
    </>
  );
}
