'use client';
import { useEnrollments, useCertificates } from '../../../hooks/use-api';
import { useAuthStore } from '../../../lib/auth-store';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Trophy, Flame, BookOpen, Award, TrendingUp, Clock } from 'lucide-react';

// Mock weekly activity data — replace with real API
const WEEKLY_DATA = [
  { day: 'Mon', minutes: 45  },
  { day: 'Tue', minutes: 90  },
  { day: 'Wed', minutes: 30  },
  { day: 'Thu', minutes: 120 },
  { day: 'Fri', minutes: 75  },
  { day: 'Sat', minutes: 150 },
  { day: 'Sun', minutes: 60  },
];

const SKILL_DATA = [
  { skill: 'Python',       level: 80 },
  { skill: 'ML',           level: 60 },
  { skill: 'Statistics',   level: 55 },
  { skill: 'SQL',          level: 70 },
  { skill: 'Data Viz',     level: 65 },
  { skill: 'Deep Learning', level: 40 },
];

export default function ProgressPage() {
  const { user }  = useAuthStore();
  const { data: enrollments } = useEnrollments();
  const { data: certs }       = useCertificates();

  const totalMinutes = WEEKLY_DATA.reduce((a, d) => a + d.minutes, 0);
  const avgDaily     = Math.round(totalMinutes / 7);
  const completedCount = enrollments?.filter((e: any) => e.completedAt).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-1">My Progress</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track your learning journey and skill growth.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Courses done',   value: completedCount,          icon: Trophy, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'   },
          { label: 'Certs earned',   value: certs?.length ?? 0,      icon: Award,  color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
          { label: 'Avg min/day',    value: `${avgDaily}m`,          icon: Clock,  color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'       },
          { label: 'Current streak', value: `${user?.streak ?? 0}🔥`, icon: Flame, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly activity */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Weekly activity (minutes)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={WEEKLY_DATA} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v} min`, 'Study time']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="minutes" stroke="#6c4de4" strokeWidth={2.5}
                dot={{ fill: '#6c4de4', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {totalMinutes} total minutes this week · {avgDaily} min avg per day
          </p>
        </div>

        {/* Skill radar */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Skill profile
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={SKILL_DATA} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
              <Radar name="Skills" dataKey="level" stroke="#6c4de4" fill="#6c4de4" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Based on completed course topics
          </p>
        </div>
      </div>

      {/* XP level progress */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">XP & Level Progress</h2>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{user?.xp ?? 0} XP total</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {Math.floor((user?.xp ?? 0) / 1000) + 1}
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Level {Math.floor((user?.xp ?? 0) / 1000) + 1}</span>
              <span className="text-gray-500">{(user?.xp ?? 0) % 1000} / 1000 XP</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${((user?.xp ?? 0) % 1000) / 10}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {1000 - ((user?.xp ?? 0) % 1000)} XP until Level {Math.floor((user?.xp ?? 0) / 1000) + 2}
            </p>
          </div>
        </div>

        {/* XP sources */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
          {[
            { label: 'Lesson complete', xp: '+10 XP' },
            { label: 'Quiz passed',    xp: '+25 XP' },
            { label: 'Course done',    xp: '+200 XP' },
            { label: 'Daily streak',   xp: '+5 XP'  },
          ].map(({ label, xp }) => (
            <div key={label} className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{xp}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
