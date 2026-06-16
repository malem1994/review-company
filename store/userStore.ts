import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { userService } from '../services/api';

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const user = await userService.login(email, password);
        set({ user, isAuthenticated: true });
      },

      logout: async () => {
        await userService.logout();
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: !!user })
    }),
    {
      name: 'user-storage'
    }
  )
);
