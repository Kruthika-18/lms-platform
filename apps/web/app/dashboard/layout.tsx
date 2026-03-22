'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Award,
  Settings, Flame, TrendingUp, ChevronRight,
  GraduationCap, Home
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { cn } from '../../lib/utils';

const NAV = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Overview'     },
  { href: '/dashboard/courses',      icon: BookOpen,        label: 'My Courses'   },
  { href: '/dashboard/certificates', icon: Award,           label: 'Certificates' },
  { href: '/dashboard/progress',     icon: TrendingUp,      label: 'Progress'     },
  { href: '/settings',               icon: Settings,        label: 'Settings'     },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-900">

      {/* Top navbar */}
      <header className="bg-white dark:bg-brand-900 border-b border-gray-100 dark:border-brand-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-brand-600">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            LearnHub
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/"        className="text-sm text-gray-500 hover:text-brand-600 flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Home</Link>
            <Link href="/courses" className="text-sm text-gray-500 hover:text-brand-600">Courses</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-brand-600">Pricing</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="card p-4 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.name?.[0] ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name ?? 'Learner'}
                </p>
                <div className="flex items-center gap-1 text-xs text-orange-500">
                  <Flame className="w-3 h-3" />
                  <span>{user?.streak ?? 0} day streak</span>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      active
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                    )}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                    {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}