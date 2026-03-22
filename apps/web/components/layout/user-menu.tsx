'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Award, Settings, LogOut, Crown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { useAuthStore } from '../../lib/auth-store';
import type { User } from '@lms/types';

export function UserMenu({ user }: { user: User }) {
  const router   = useRouter();
  const { logout } = useAuthStore();

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-brand-800 transition-colors focus:outline-none">
          <Avatar.Root className="w-8 h-8 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-800 flex-shrink-0">
            {user.avatarUrl && <Avatar.Image src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />}
            <Avatar.Fallback className="w-full h-full flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300">
              {initials}
            </Avatar.Fallback>
          </Avatar.Root>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block max-w-[120px] truncate">
            {user.name}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8}
          className="z-50 min-w-[200px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg p-1.5 animate-fade-up">
          {/* User info */}
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            {user.plan === 'pro' && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Crown className="w-3 h-3" /> Pro
              </span>
            )}
          </div>

          <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

          {[
            { href: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/dashboard/courses', icon: BookOpen,       label: 'My Courses' },
            { href: '/dashboard/certificates', icon: Award,    label: 'Certificates' },
            { href: '/settings',         icon: Settings,        label: 'Settings' },
          ].map(({ href, icon: Icon, label }) => (
            <DropdownMenu.Item key={href} asChild>
              <Link href={href}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/50 hover:text-brand-700 dark:hover:text-brand-300 rounded-lg cursor-pointer outline-none transition-colors">
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            </DropdownMenu.Item>
          ))}

          {user.role === 'admin' && (
            <DropdownMenu.Item asChild>
              <Link href="/admin"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer outline-none transition-colors">
                Admin Panel
              </Link>
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

          <DropdownMenu.Item
            onSelect={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer outline-none transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
