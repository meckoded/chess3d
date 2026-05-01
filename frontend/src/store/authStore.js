import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      login: (user, token) => {
        localStorage.setItem('chess3d_token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('chess3d_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      getToken: () => get().token,

      // 🎨 Theme
      theme: 'dark',
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.classList.toggle('dark', next === 'dark');
          return { theme: next };
        }),
    }),
    {
      name: 'chess3d-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      }),
    }
  )
);

export default useAuthStore;
