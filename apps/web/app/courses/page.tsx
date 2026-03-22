'use client';
import { Navbar } from '../../components/layout/navbar';
import { CourseGrid } from '../../components/course/course-grid';

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-brand-900">
        <div className="bg-white dark:bg-brand-900 border-b border-gray-100 dark:border-brand-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
              All Courses
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              200+ expert-led courses in AI, Data Science, and Software Engineering
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <CourseGrid />
        </div>
      </main>
    </>
  );
}