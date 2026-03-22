'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Bell, Shield, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../lib/auth-store';
import { apiPatch, apiPost } from '../../lib/api-client';
import { Navbar } from '../../components/layout/navbar';

const profileSchema = z.object({
  name:  z.string().min(2).max(100),
  bio:   z.string().max(500).optional(),
  title: z.string().max(100).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

const TABS = [
  { id: 'profile',   label: 'Profile',      icon: User   },
  { id: 'security',  label: 'Security',     icon: Lock   },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm({ resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', bio: (user as any)?.bio ?? '', title: (user as any)?.title ?? '' },
  });

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const saveProfile = async (data: any) => {
    setSavingProfile(true);
    try {
      const updated = await apiPatch<any>('/api/v1/users/me', data);
      setUser(updated);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (data: any) => {
    setSavingPassword(true);
    try {
      await apiPost('/api/v1/users/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      });
      toast.success('Password changed — please sign in again on other devices');
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        <div className="flex gap-8">
          {/* Sidebar tabs */}
          <nav className="hidden md:block w-48 flex-shrink-0 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === id
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {activeTab === 'profile' && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <User className="w-4 h-4" /> Profile Information
                </h2>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <button className="text-xs text-brand-600 hover:underline mt-1">Change photo</button>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                  <div>
                    <label className="label-base">Full name</label>
                    <input {...profileForm.register('name')} className="input-base" />
                    {profileForm.formState.errors.name && (
                      <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label-base">Professional title</label>
                    <input {...profileForm.register('title')} placeholder="e.g. Data Scientist" className="input-base" />
                  </div>
                  <div>
                    <label className="label-base">Bio</label>
                    <textarea {...profileForm.register('bio')} rows={3}
                      placeholder="Tell the community a bit about yourself..."
                      className="input-base resize-none" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={savingProfile} className="btn-primary text-sm flex items-center gap-2">
                      {savingProfile
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Save className="w-4 h-4" />}
                      Save changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="card p-6">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Change Password
                  </h2>
                  <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
                    <div>
                      <label className="label-base">Current password</label>
                      <input {...passwordForm.register('currentPassword')} type="password" className="input-base" />
                    </div>
                    <div>
                      <label className="label-base">New password</label>
                      <input {...passwordForm.register('newPassword')} type="password" className="input-base" />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="label-base">Confirm new password</label>
                      <input {...passwordForm.register('confirmPassword')} type="password" className="input-base" />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                    <button type="submit" disabled={savingPassword} className="btn-primary text-sm">
                      Update password
                    </button>
                  </form>
                </div>

                {/* Danger zone */}
                <div className="card p-6 border-red-200 dark:border-red-900">
                  <h2 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Danger Zone
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Deleting your account is permanent. All your progress, certificates, and data will be removed.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Are you absolutely sure? This cannot be undone.')) {
                        toast.error('Contact support@learnhub.dev to delete your account');
                      }
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete account
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    { label: 'Course completion reminders', desc: 'Remind me to continue in-progress courses', defaultOn: true  },
                    { label: 'New certificate issued',      desc: 'Email when a certificate is ready',         defaultOn: true  },
                    { label: 'Weekly progress report',     desc: 'Summary of my learning activity',            defaultOn: false },
                    { label: 'New course announcements',   desc: 'Hear about new courses in my topics',        defaultOn: false },
                    { label: 'Marketing emails',           desc: 'Promotions and special offers',              defaultOn: false },
                  ].map(({ label, desc, defaultOn }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-brand-600 peer-checked:after:translate-x-5 after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all" />
                      </label>
                    </div>
                  ))}
                  <button className="btn-primary text-sm mt-2">Save preferences</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
