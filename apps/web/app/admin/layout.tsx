'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, BarChart3,
  Settings, Shield, DollarSign, Bell, ChevronRight, GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/auth-store';
import { useEffect } from 'react';

const NAV = [
  { href: '/admin',            icon: LayoutDashboard, label: 'Overview'    },
  { href: '/admin/users',      icon: Users,           label: 'Users'       },
  { href: '/admin/courses',    icon: BookOpen,        label: 'Courses'     },
  { href: '/admin/analytics',  icon: BarChart3,       label: 'Analytics'   },
  { href: '/admin/revenue',    icon: DollarSign,      label: 'Revenue'     },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Admin sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900 dark:bg-black text-white flex flex-col">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">LearnHub</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> Admin Panel
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to platform
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6">
          <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {NAV.find((n) => n.href === pathname)?.label ?? 'Admin'}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>Signed in as</span>
            <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
