import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../lib/types';

interface AppState {
  // Auth
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // UI
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;

  // Actions — Auth
  login: (user: AuthUser, token: string, refreshToken: string) => void;
  logout: () => void;
  setToken: (token: string) => void;

  // Actions — UI
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarMobileOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      theme: 'light',
      sidebarCollapsed: false,
      sidebarMobileOpen: false,

      login: (user, token, refreshToken) => {
        set({ user, token, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      setToken: (token) => {
        set({ token });
      },

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        applyTheme(next);
      },

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setSidebarMobileOpen: (v) => set({ sidebarMobileOpen: v }),
    }),
    {
      name: 'electro-time',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state?: any) => {
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
