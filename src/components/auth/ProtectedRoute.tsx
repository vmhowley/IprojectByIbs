import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NProgress from '../../lib/nprogress';
import SplashScreen from '../layout/SplashScreen';


interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (loading || !initialized) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [loading, initialized]);

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return <SplashScreen />;
  }


  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}
