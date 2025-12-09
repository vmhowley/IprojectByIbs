import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  
  // If auth is disabled or not initialized, return a default state
  if (context === undefined) {
    return {
      user: null,
      session: null,
      loading: false,
      initialized: true,
      login: async () => {},
      loginWithGoogle: async () => {},
      logout: async () => {},
      signUp: async () => {},
      updateProfile: async () => {},
    };
  }
  
  return context;
}
