import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user, loading } = useAuth();
  
  // Check if subscription exists and is active or trialing
  // We use the user's tier field for quick access
  const isPro = user?.subscription_tier === 'pro';

  return {
    isPro,
    isLoading: loading,
    limits: {
      maxProjects: isPro ? Infinity : 3,
      maxClients: isPro ? Infinity : 3, 
      maxMembers: isPro ? Infinity : 3,
      hasChat: isPro,
      hasAdvancedAnalytics: isPro,
    },
    plan: isPro ? 'Pro' : 'Gratis',
  };
};
