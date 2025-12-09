import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user, loading } = useAuth();
  
  // Check if subscription exists and is active or trialing
  // Note: user.subscription might be null initially while loading or if guest
  const isPro = 
    user?.subscription?.status === 'active' || 
    user?.subscription?.status === 'trialing';

  return {
    isPro,
    isLoading: loading,
    limits: {
      maxProjects: isPro ? Infinity : 2,
      maxClients: isPro ? Infinity : 0, 
      hasChat: isPro,
      hasAdvancedAnalytics: isPro,
    },
    plan: isPro ? 'Pro' : 'Gratis',
  };
};
