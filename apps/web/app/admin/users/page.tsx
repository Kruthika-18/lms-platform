'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, MoreHorizontal, Shield, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGet, apiPatch, apiDelete, setAccessToken } from '../../../lib/api-client';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useDebounce } from '../../../hooks/use-debounce';

const ROLE_COLORS: Record<string, string> = {
  admin:      'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  instructor: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  student:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};
const PLAN_COLORS: Record<string, string> = {
  enterprise: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pro:        'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  free:       'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Restore token from localStorage
      const stored = localStorage.getItem('lms-auth');
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) setAccessToken(state.accessToken);
      }

      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const data = await apiGet<any>(`/api/v1/admin/users?${params}`);
      setUsers(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const changeRole = async (userId: string, role: string) => {
    try {
      await apiPatch(`/api/v1/admin/users/${userId}/role`, { role });
      toast.success(`Role updated to ${role}`);
      loadUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const suspendUser = async (userId: string) => {
    if (!confirm('Suspend this user? They will be soft-deleted.')) return;
    try {
      await apiDelete(`/api/v1/admin/users/${userId}`);
      toast.success('User suspended');
      loadUsers();
    } catch { toast.error('Failed to suspend user'); }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage platform users</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="input-base pl-9 text-sm" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              {['User', 'Role', 'Plan', 'XP', 'Streak', 'Joined', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-3 rounded w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-xs font-bold flex-shrink-0">
                        {user.name?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${ROLE_COLORS[user.role] ?? ''}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${PLAN_COLORS[user.plan] ?? ''}`}>{user.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.xp ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.streak ?? 0} 🔥</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
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
                          <p className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Change role</p>
                          {['student', 'instructor', 'admin'].map((role) => (
                            <DropdownMenu.Item key={role} onSelect={() => changeRole(user.id, role)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer outline-none transition-colors">
                              <Shield className="w-3.5 h-3.5 text-gray-400" />
                              Set as {role}
                              {user.role === role && <span className="ml-auto text-brand-500">✓</span>}
                            </DropdownMenu.Item>
                          ))}
                          <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                          <DropdownMenu.Item onSelect={() => suspendUser(user.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer outline-none transition-colors">
                            <UserX className="w-3.5 h-3.5" /> Suspend
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500">Page {page}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(page + 1)} disabled={users.length < 20}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}