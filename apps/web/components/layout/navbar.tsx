'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Menu, X, GraduationCap, Zap } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { UserMenu } from './user-menu';
import { NotificationBell } from '../notifications/notification-bell';
import { cn } from '../../lib/utils';

const NAV_LINKS = [
  { href: '/courses',        label: 'Courses'        },
  { href: '/learning-paths', label: 'Learning Paths' },
  { href: '/pricing',        label: 'Pricing'        },
];

export function Navbar() {
  const pathname        = usePathname();
  const { user }        = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-brand-900/80 backdrop-blur-md border-b border-gray-100 dark:border-brand-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl text-brand-600">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            LearnHub
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-brand-800',
                )}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-brand-800 transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <>
                <NotificationBell />
                <UserMenu user={user} />
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
                <Link href="/auth/register" className="btn-primary text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Get started free
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-brand-800 animate-fade-up">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brand-800"
                onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-brand-800">
              {user ? (
                <Link href="/dashboard" className="btn-primary text-center text-sm" onClick={() => setOpen(false)}>
                  My Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="btn-secondary text-center text-sm" onClick={() => setOpen(false)}>Sign in</Link>
                  <Link href="/auth/register" className="btn-primary text-center text-sm" onClick={() => setOpen(false)}>Get started free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}