'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost, setAccessToken } from './api-client';
import type { User } from '@lms/types';

interface AuthState {
  user:        User | null;
  accessToken: string | null;
  isLoading:   boolean;
  login:       (email: string, password: string) => Promise<void>;
  register:    (email: string, password: string, name: string) => Promise<void>;
  logout:      () => Promise<void>;
  setUser:     (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      isLoading:   false,

      async login(email, password) {
        set({ isLoading: true });
        try {
          const data = await apiPost<{ accessToken: string; user: User }>(
            '/api/v1/auth/login',
            { email, password }
          );
          setAccessToken(data.accessToken);
          set({ user: data.user, accessToken: data.accessToken });
        } finally {
          set({ isLoading: false });
        }
      },

      async register(email, password, name) {
        set({ isLoading: true });
        try {
          const data = await apiPost<{ accessToken: string; user: User }>(
            '/api/v1/auth/register',
            { email, password, name }
          );
          setAccessToken(data.accessToken);
          set({ user: data.user, accessToken: data.accessToken });
        } finally {
          set({ isLoading: false });
        }
      },

      async logout() {
        await apiPost('/api/v1/auth/logout').catch(() => {});
        setAccessToken(null);
        set({ user: null, accessToken: null });
      },

      setUser(user) { set({ user }); },
    }),
    {
      name: 'lms-auth',
      partialize: (s) => ({
        user:        s.user,
        accessToken: s.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
        }
      },
    },
  ),
);