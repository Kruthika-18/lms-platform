'use client';
import { useEffect, useState } from 'react';
import { Users, BookOpen, TrendingUp, DollarSign, Activity, Award, ArrowUpRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { apiGet } from '../../lib/api-client';

const ENROLLMENT_DATA = [
  { day: 'Mon', v: 142 }, { day: 'Tue', v: 189 }, { day: 'Wed', v: 167 },
  { day: 'Thu', v: 234 }, { day: 'Fri', v: 198 }, { day: 'Sat', v: 310 }, { day: 'Sun', v: 276 },
];
const REVENUE_DATA = [
  { m: 'Jan', v: 4200  }, { m: 'Feb', v: 5800  }, { m: 'Mar', v: 7100  },
  { m: 'Apr', v: 6400  }, { m: 'May', v: 9200  }, { m: 'Jun', v: 11800 },
  { m: 'Jul', v: 10500 }, { m: 'Aug', v: 13200 }, { m: 'Sep', v: 15400 },
  { m: 'Oct', v: 14100 }, { m: 'Nov', v: 17600 }, { m: 'Dec', v: 21000 },
];

export default function AdminOverviewPage() {
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = () => {
    setLoading(true);
    apiGet<any>('/api/v1/admin/stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(loadStats, []);

  const cards = [
    { label: 'Total users',      value: stats?.totalUsers?.toLocaleString() ?? '—',   icon: Users,      color: 'text-brand-600  bg-brand-50  dark:bg-brand-900/40',   change: '+12%' },
    { label: 'Active courses',   value: stats?.totalCourses ?? '—',                    icon: BookOpen,   color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/40', change: '+3'   },
    { label: 'Enrollments',      value: stats?.totalEnrollments?.toLocaleString() ?? '—', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/40', change: '+8%' },
    { label: 'Active today',     value: stats?.activeToday?.toLocaleString() ?? '—',  icon: Activity,   color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40', change: '+2%' },
    { label: 'Revenue (month)',  value: stats ? `$${(stats.revenueThisMonth / 100).toLocaleString()}` : '—', icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/40', change: '+18%' },
    { label: 'Completion rate',  value: stats ? `${stats.completionRate}%` : '—',     icon: Award,      color: 'text-rose-600   bg-rose-50   dark:bg-rose-900/40',   change: '+1%'  },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Platform Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Real-time metrics</p>
        </div>
        <button onClick={loadStats} disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                <ArrowUpRight className="w-3 h-3" />{change}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Enrollments — last 7 days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ENROLLMENT_DATA} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c4de4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6c4de4" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="v" name="Enrollments" stroke="#6c4de4" strokeWidth={2} fill="url(#eg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Revenue — last 12 months</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REVENUE_DATA} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }} />
              <Bar dataKey="v" name="Revenue" fill="#6c4de4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent activity</h2>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {[
            { event: 'New enrollment',    detail: 'User enrolled in Python for Data Science',       time: '2m ago',  color: 'bg-brand-500'   },
            { event: 'Certificate issued', detail: 'Certificate generated for ML Fundamentals',    time: '8m ago',  color: 'bg-amber-500'   },
            { event: 'New user',          detail: 'alex.johnson@example.com registered',            time: '14m ago', color: 'bg-emerald-500' },
            { event: 'Course published',  detail: 'Deep Learning with PyTorch is now live',         time: '1h ago',  color: 'bg-purple-500'  },
            { event: 'Payment',           detail: '$79 Pro subscription payment processed',          time: '2h ago',  color: 'bg-blue-500'    },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-900 dark:text-white">{item.event}: </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.detail}</span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
