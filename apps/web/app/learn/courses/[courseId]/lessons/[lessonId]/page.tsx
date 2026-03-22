'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, PlayCircle, FileText, HelpCircle, ChevronLeft, Menu, X } from 'lucide-react';
import { VideoPlayer } from '../../../../../components/video/video-player';
import { QuizEngine } from '../../../../../components/quiz/quiz-engine';
import { useCourse, useCourseProgress, useLessonProgress } from '../../../../../hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { keys } from '../../../../../hooks/use-api';

const LESSON_TYPE_ICONS: Record<string, any> = {
  video:   PlayCircle,
  quiz:    HelpCircle,
  article: FileText,
  lab:     FileText,
};

export default function LessonPage() {
  const params    = useParams();
  const courseId  = params.courseId as string;
  const lessonId  = params.lessonId as string;
  const qc        = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: course }   = useCourse(courseId);
  const { data: progress } = useCourseProgress(courseId);
  const { data: lpData }   = useLessonProgress(lessonId);

  const currentLesson = course?.sections
    ?.flatMap((s: any) => s.lessons)
    ?.find((l: any) => l.id === lessonId);

  const handleLessonComplete = () => {
    qc.invalidateQueries({ queryKey: keys.courseProgress(courseId) });
    qc.invalidateQueries({ queryKey: keys.lessonProgress(lessonId) });
  };

  if (!course) return null;

  const allLessons = course.sections?.flatMap((s: any) => s.lessons) ?? [];
  const currentIdx = allLessons.findIndex((l: any) => l.id === lessonId);
  const nextLesson = allLessons[currentIdx + 1];
  const prevLesson = allLessons[currentIdx - 1];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-brand-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72 xl:w-80' : 'w-0'} flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-y-auto transition-all duration-300`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <Link href={`/courses/${course.slug}`} className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 hover:text-brand-600">
            {course.title}
          </Link>
          {progress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{progress.completedLessons}/{progress.totalLessons} complete</span>
                <span>{progress.percentComplete}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentComplete}%` }} />
              </div>
            </div>
          )}
        </div>

        <nav className="py-2">
          {course.sections?.map((section: any) => (
            <div key={section.id}>
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {section.title}
              </p>
              {section.lessons?.map((lesson: any) => {
                const Icon    = LESSON_TYPE_ICONS[lesson.type] ?? PlayCircle;
                const active  = lesson.id === lessonId;
                return (
                  <Link key={lesson.id}
                    href={`/learn/courses/${courseId}/lessons/${lesson.id}`}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? 'bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}>
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                      lpData?.completed ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'
                    }`} />
                    <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                    <span className="line-clamp-2 leading-snug">{lesson.title}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-lg">
            {currentLesson?.title}
          </h1>
          <div className="flex items-center gap-2">
            {prevLesson && (
              <Link href={`/learn/courses/${courseId}/lessons/${prevLesson.id}`}
                className="btn-ghost text-xs px-2 py-1">← Prev</Link>
            )}
            {nextLesson && (
              <Link href={`/learn/courses/${courseId}/lessons/${nextLesson.id}`}
                className="btn-primary text-xs px-3 py-1.5">Next →</Link>
            )}
          </div>
        </div>

        {/* Lesson body */}
        <div className="max-w-4xl mx-auto p-6">
          {currentLesson?.type === 'video' && (
            <VideoPlayer lessonId={lessonId} onComplete={handleLessonComplete} />
          )}

          {currentLesson?.type === 'quiz' && (
            <QuizEngine
              quizId={lessonId}
              questions={[]} // loaded from API in real implementation
              onComplete={handleLessonComplete}
            />
          )}

          {currentLesson?.type === 'article' && currentLesson.articleContent && (
            <article className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: currentLesson.articleContent }} />
          )}

          {/* Next lesson prompt */}
          {nextLesson && (
            <div className="mt-8 p-5 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-0.5">Up next</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{nextLesson.title}</p>
              </div>
              <Link href={`/learn/courses/${courseId}/lessons/${nextLesson.id}`}
                className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0 ml-4">
                Continue <ChevronLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
