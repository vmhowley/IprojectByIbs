import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { subscriptionService } from '../services/subscriptionService';
import { AuthContextType, AuthState, LoginCredentials, SignUpData, UserProfile } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // 1. Get initial session
        const session = await authService.getSession();

        if (mounted) {
          if (session?.user) {
            try {
              // Load profile first to ensure we have the correct role
              const profile = await authService.getCurrentUser();

              if (profile) {
                // Initialize immediately with profile (subscription null initially)
                setState({
                  user: { ...profile, subscription: null },
                  session,
                  loading: false,
                  initialized: true,
                });

                // Fetch subscription in background and update state when ready
                subscriptionService.getSubscription(session.user.id).then(sub => {
                  if (mounted) {
                    setState(prev => ({
                      ...prev,
                      user: prev.user ? { ...prev.user, subscription: sub } : null
                    }));
                  }
                });
              } else {
                // Fallback if no profile exists yet
                setState({
                  user: {
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                    role: 'user',
                    created_at: session.user.created_at,
                    updated_at: session.user.updated_at || new Date().toISOString(),
                  },
                  session,
                  loading: false,
                  initialized: true,
                });
              }
            } catch (err) {
              console.error('Profile load error:', err);
              // Fallback on error
              setState({
                user: {
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                  role: 'user',
                  created_at: session.user.created_at,
                  updated_at: session.user.updated_at || new Date().toISOString(),
                },
                session,
                loading: false,
                initialized: true,
              });
            }

          } else {
            setState({
              user: null,
              session: null,
              loading: false,
              initialized: true,
            });
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          setState({
            user: null,
            session: null,
            loading: false,
            initialized: true,
          });
        }
      }
    }

    init();

    // 2. Listen for changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setState(prev => ({
              ...prev,
              user: prev.user || { // Keep existing or create new
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                role: 'user',
                created_at: session.user.created_at,
                updated_at: session.user.updated_at || new Date().toISOString(),
              },
              session,
              loading: false,
              initialized: true,
            }));

            // Refresh profile on sign in
            if (event === 'SIGNED_IN') {
              authService.getCurrentUser().then(profile => {
                if (mounted && profile) {
                  setState(prev => ({
                    ...prev,
                    user: { ...profile, subscription: prev.user?.subscription }
                  }));
                }
              });
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            loading: false,
            initialized: true,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(credentials: LoginCredentials) {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await authService.login(credentials);
      // Auth state change listener will update the state
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }

  async function loginWithGoogle() {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await authService.loginWithGoogle();
      // Redirect will happen, no need to update state
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }

  async function logout() {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await authService.logout();
      // Auth state change listener will update the state
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }

  async function signUp(data: SignUpData) {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await authService.signUp(data);
      // Auth state change listener will update the state
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!state.user) {
      throw new Error('No user logged in');
    }

    setState(prev => ({ ...prev, loading: true }));
    try {
      const updatedProfile = await authService.updateUserProfile(state.user.id, updates);
      setState(prev => ({
        ...prev,
        user: updatedProfile,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    loginWithGoogle,
    logout,
    signUp,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };

