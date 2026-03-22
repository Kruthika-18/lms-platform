import Link from 'next/link';
import { GraduationCap, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Big 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] font-display font-bold text-brand-100 dark:text-brand-800/50 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
          Page not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
            <Home className="w-4 h-4" /> Back to home
          </Link>
          <Link href="/courses" className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center">
            <Search className="w-4 h-4" /> Browse courses
          </Link>
        </div>
      </div>
    </div>
  );
}
