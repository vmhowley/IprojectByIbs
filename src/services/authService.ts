import { LoginCredentials, SignUpData, UserProfile } from '../types';
import { handleSupabaseResponse, supabase } from './api';

export const authService = {
  /**
   * Login with email and password
   */
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Sign up new user
   */
  async signUp(data: SignUpData): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Get current user with profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If error is "no rows", return null instead of throwing
        if (error.code === 'PGRST116') {
          console.warn('No profile found for user - they may need to be created in user_profiles table');
          return null;
        }
        throw new Error(error.message);
      }

      return profile;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return handleSupabaseResponse(
      supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
    );
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Request password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Update user password
   */
  async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw new Error(error.message);
    }
  },
};
