'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api-client';
import type { Course, Enrollment, LessonProgress, CourseProgress, Certificate } from '@lms/types';

export const keys = {
  courses:        (opts?: object)        => ['courses', opts] as const,
  course:         (slug: string)         => ['course', slug] as const,
  enrollments:    ()                     => ['enrollments'] as const,
  enrollment:     (courseId: string)     => ['enrollment', courseId] as const,
  courseProgress: (courseId: string)     => ['progress', 'course', courseId] as const,
  lessonProgress: (lessonId: string)     => ['progress', 'lesson', lessonId] as const,
  certificates:   ()                     => ['certificates'] as const,
  me:             ()                     => ['me'] as const,
};

export function useCourses(opts: { search?: string; difficulty?: string; isFree?: boolean } = {}) {
  return useQuery({
    queryKey: keys.courses(opts),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(opts)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
      );
      const result = await apiGet<any>(`/api/v1/courses?${params}`);
      if (Array.isArray(result)) return { data: result, hasMore: false };
      if (result?.data) return result;
      return { data: [], hasMore: false };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: keys.course(slug),
    queryFn: async () => {
      try {
        const result = await apiGet<any>(`/api/v1/courses/${slug}`);
        if (!result) return null;
        return result;
      } catch { return null; }
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!slug,
  });
}

export function useEnrollments() {
  return useQuery({
    queryKey: keys.enrollments(),
    queryFn: async () => {
      try {
        const result = await apiGet<any>('/api/v1/enrollments');
        if (Array.isArray(result)) return result;
        return result?.data ?? [];
      } catch { return []; }
    },
  });
}

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => apiPost(`/api/v1/courses/${courseId}/enroll`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.enrollments() });
    },
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: keys.courseProgress(courseId),
    queryFn: async () => {
      try {
        const result = await apiGet<any>(`/api/v1/courses/${courseId}/progress`);
        return result?.data ?? result;
      } catch { return null; }
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useLessonProgress(lessonId: string) {
  return useQuery({
    queryKey: keys.lessonProgress(lessonId),
    queryFn: async () => {
      try {
        const result = await apiGet<any>(`/api/v1/progress/lesson/${lessonId}`);
        return result?.data ?? result;
      } catch { return null; }
    },
    enabled: !!lessonId,
  });
}

export function useCertificates() {
  return useQuery({
    queryKey: keys.certificates(),
    queryFn: async () => {
      try {
        const result = await apiGet<any>('/api/v1/certificates');
        if (Array.isArray(result)) return result;
        return result?.data ?? [];
      } catch { return []; }
    },
  });
}

export function useVideoStreamUrl(lessonId: string) {
  return useQuery({
    queryKey: ['video-stream', lessonId],
    queryFn: async () => {
      const result = await apiGet<any>(`/api/v1/videos/${lessonId}/stream`);
      return result?.data ?? result;
    },
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 50,
    gcTime:    1000 * 60 * 55,
  });
}

export function useMe() {
  return useQuery({
    queryKey: keys.me(),
    queryFn: async () => {
      try {
        const result = await apiGet<any>('/api/v1/auth/me');
        return result?.data ?? result;
      } catch { return null; }
    },
    retry: false,
  });
}