'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, BookOpen, Award, Zap } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api-client';
import { formatRelativeTime } from '../../lib/utils';

interface Notification {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  link?:     string;
  readAt?:   string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, any> = {
  enrollment:  BookOpen,
  certificate: Award,
  default:     Zap,
};

export function NotificationBell() {
  const [open,   setOpen]   = useState(false);
  const [items,  setItems]  = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        apiGet<Notification[]>('/api/v1/notifications'),
        apiGet<{ count: number }>('/api/v1/notifications/unread-count'),
      ]);
      setItems(notifs);
      setUnread(count.count);
    } catch {}
  };

  useEffect(() => { loadNotifications(); }, []);

  // Poll every 30s
  useEffect(() => {
    const t = setInterval(loadNotifications, 30_000);
    return () => clearInterval(t);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await apiPost('/api/v1/notifications/mark-all-read');
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnread(0);
  };

  const markRead = async (id: string) => {
    await apiPost(`/api/v1/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    setUnread((prev) => Math.max(0, prev - 1));
  };

  return (
    <div ref={panelRef} className="relative">
      <button onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-brand-800 transition-colors">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications {unread > 0 && <span className="ml-1 text-xs text-brand-500">({unread} new)</span>}
            </h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {items.map((notif) => {
                  const Icon = TYPE_ICONS[notif.type] ?? TYPE_ICONS.default;
                  const isUnread = !notif.readAt;
                  return (
                    <button key={notif.id} onClick={() => markRead(notif.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left transition-colors ${isUnread ? 'bg-brand-50/50 dark:bg-brand-900/20' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUnread ? 'bg-brand-100 dark:bg-brand-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Icon className={`w-4 h-4 ${isUnread ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                      </div>
                      {isUnread && <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
