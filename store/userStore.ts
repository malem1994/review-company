import { create } from 'zustand';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

interface UserStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  _init: () => () => void; // returns unsubscribe fn
}

interface ProfileRow {
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const getFallbackName = (user: SupabaseUser) =>
  user.user_metadata?.full_name ??
  user.user_metadata?.name ??
  user.email?.split('@')[0] ??
  'Người dùng';

const mapAuthUser = (user: SupabaseUser, profile?: ProfileRow | null): AuthUser => ({
  id: user.id,
  email: profile?.email?.trim() || user.email || '',
  displayName: profile?.display_name?.trim() || getFallbackName(user),
  avatarUrl: profile?.avatar_url?.trim() || user.user_metadata?.avatar_url,
});

const getUserProfile = async (
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return data;
};

export const useUserStore = create<UserStore>((set) => ({
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

  _init: () => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        if (user) {
          (async () => {
            try {
              const profile = await getUserProfile(supabase, user.id);
              set({
                user: mapAuthUser(user, profile),
                isAuthenticated: true,
                isLoading: false,
              });
            } catch (error) {
              console.error('Failed to fetch user profile:', error);
              // Still set user with fallback data from Supabase user
              set({
                user: mapAuthUser(user, null),
                isAuthenticated: true,
                isLoading: false,
              });
            }
          })();
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  },
}));
