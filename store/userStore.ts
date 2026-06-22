import { create } from 'zustand';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';
import { Role } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  roleId?: string;
  role?: Role;
}

interface UserStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  _init: () => () => void; // returns unsubscribe fn
  fetchUserRole: (userId: string) => Promise<Role | null>;
}

interface UserRow {
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role_id: string | null;
}

const getFallbackName = (user: SupabaseUser) =>
  user.user_metadata?.full_name ??
  user.user_metadata?.name ??
  user.email?.split('@')[0] ??
  'Người dùng';

const mapAuthUser = (user: SupabaseUser, userRow?: UserRow | null, role?: Role | null): AuthUser => ({
  id: user.id,
  email: userRow?.email?.trim() || user.email || '',
  displayName: userRow?.display_name?.trim() || getFallbackName(user),
  avatarUrl: userRow?.avatar_url?.trim() || user.user_metadata?.avatar_url,
  roleId: userRow?.role_id || undefined,
  role,
});

const getUserProfile = async (
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserRow | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('email, display_name, avatar_url, role_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return data;
};

const getUserRole = async (
  supabase: ReturnType<typeof createClient>,
  roleId: string
): Promise<Role | null> => {
  if (!roleId) return null;

  const { data, error } = await supabase
    .from('roles')
    .select('id, name, description, created_at, updated_at')
    .eq('id', roleId)
    .maybeSingle();

  if (error) return null;
  return data as Role;
};

export const useUserStore = create<UserStore>((set) => {
  const handleSession = async (
    supabase: ReturnType<typeof createClient>,
    user: SupabaseUser
  ) => {
    try {
      const userRow = await getUserProfile(supabase, user.id);
      let role: Role | null = null;
      if (userRow?.role_id) {
        role = await getUserRole(supabase, userRow.role_id);
      }
      set({
        user: mapAuthUser(user, userRow, role),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      set({
        user: mapAuthUser(user, null, null),
        isAuthenticated: true,
        isLoading: false,
      });
    }
  };

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,

    loginWithGoogle: async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    },

    logout: async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false });
    },

    fetchUserRole: async (userId: string) => {
      const supabase = createClient();
      const userRow = await getUserProfile(supabase, userId);
      if (!userRow?.role_id) return null;
      return getUserRole(supabase, userRow.role_id);
    },

    _init: () => {
      const supabase = createClient();

      // Initial session check - crucial for OAuth callback flow
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          handleSession(supabase, user);
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            await handleSession(supabase, session.user);
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        }
      );

      return () => subscription.unsubscribe();
    },
  };
});
