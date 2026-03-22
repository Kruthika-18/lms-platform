'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye, EyeOff, Trash2, ExternalLink, MoreHorizontal, Plus } from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '../../../lib/api-client';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useDebounce } from '../../../hooks/use-debounce';

const DIFF_COLORS: Record<string, string> = {
  beginner:     'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced:     'badge-advanced',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await apiGet<any[]>('/api/v1/admin/courses');
      setCourses(data);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCourses(); }, []);

  const filtered = debouncedSearch
    ? courses.filter((c) => c.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : courses;

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await apiPatch(`/api/v1/admin/courses/${id}/publish`, { published: !current });
      toast.success(!current ? 'Course published' : 'Course unpublished');
      loadCourses();
    } catch { toast.error('Failed to update course'); }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{courses.length} total courses</p>
        </div>
        <Link href="/instructor/create-course" className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New course
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..." className="input-base pl-9 text-sm" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              {['Course', 'Instructor', 'Level', 'Enrolled', 'Rating', 'Price', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-3 rounded w-16" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{course.title}</p>
                  <p className="text-xs text-gray-400 font-mono">{course.slug}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                  {course.instructor?.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${DIFF_COLORS[course.difficulty] ?? ''}`}>
                    {course.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {course.enrollmentCount?.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-amber-500 font-medium">
                  {course.rating > 0 ? `★ ${course.rating.toFixed(1)}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {course.isFree ? <span className="text-emerald-600 font-medium">Free</span> : `$${(course.priceCents / 100).toFixed(0)}`}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${course.isPublished ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                    {course.isPublished ? '● Live' : '○ Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content align="end" sideOffset={4}
                        className="z-50 min-w-[160px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg p-1 text-sm">
                        <DropdownMenu.Item asChild>
                          <Link href={`/courses/${course.slug}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer outline-none transition-colors">
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400" /> View course
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onSelect={() => togglePublish(course.id, course.isPublished)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer outline-none transition-colors">
                          {course.isPublished
                            ? <><EyeOff className="w-3.5 h-3.5 text-gray-400" /> Unpublish</>
                            : <><Eye className="w-3.5 h-3.5 text-gray-400" /> Publish</>}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
