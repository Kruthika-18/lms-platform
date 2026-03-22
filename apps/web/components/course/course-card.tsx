import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, Star } from 'lucide-react';
import type { Course } from '@lms/types';

interface CourseCardProps {
  course: Course;
  progress?: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function CourseCard({ course, progress }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.slug}`}
      className="group block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800">

      {/* Instructor photo / thumbnail */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-800 dark:to-purple-900">
            <span className="text-6xl font-bold text-brand-300 dark:text-brand-600 font-display">
              {course.title[0]}
            </span>
          </div>
        )}

        {/* Share icon top right */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 dark:bg-gray-900/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>

        {/* Progress bar */}
        {typeof progress === 'number' && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
            <div className="h-full bg-brand-500 transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Badge row */}
        <div className="flex items-center gap-2 mb-2">
          {course.enrollmentCount > 5000 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              ⭐ BESTSELLER
            </span>
          )}
          {course.isFree && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              FREE
            </span>
          )}
          {course.tags?.[0] && !course.isFree && course.enrollmentCount <= 5000 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              🔥 TRENDING TOPIC
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-1 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          with {course.instructor?.name ?? 'LearnHub Team'}
        </p>

        {/* Rating row */}
        {course.rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {course.rating.toFixed(1)}/5
            </span>
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <Star key={star}
                  className={`w-4 h-4 ${star <= Math.round(course.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">({course.ratingCount?.toLocaleString()})</span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {course.totalDurationSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(course.totalDurationSeconds)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {course.enrollmentCount?.toLocaleString()}
            </span>
          </div>

          {/* Price */}
          {typeof progress === 'number' ? (
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {progress}% done
            </span>
          ) : (
            <span className={`text-sm font-bold ${course.isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
              {course.isFree ? 'Free' : `$${(course.priceCents / 100).toFixed(0)}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}