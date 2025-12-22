import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { RootLayout } from '../layouts/RootLayout';
import { AdminPanel } from '../pages/AdminPanel';
import { ChannelPage } from '../pages/ChannelPage';
import { Clients } from '../pages/Clients';
import { DemoPage } from '../pages/DemoPage';
import { Home } from '../pages/Home';
import { InboxPage } from '../pages/InboxPage';
import { LandingPage } from '../pages/LandingPage';
import { Login } from '../pages/Login';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { PricingPage } from '../pages/PricingPage';
import { ProjectDetail } from '../pages/ProjectDetail';
import { Projects } from '../pages/Projects';
import { Register } from '../pages/Register';
import { TicketDetail } from '../pages/TicketDetail';

// Authentication enabled
const ENABLE_AUTH = true;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPageWrapper />,
  },
  {
    path: '/demo',
    element: <DemoPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/pricing',
    element: <PricingPage />,
  },
  {
    element: ENABLE_AUTH ? (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ) : (
      <RootLayout />
    ),
    children: [
      {
        path: 'dashboard',
        element: <Home />,
      },
      {
        path: 'project/:projectId',
        element: <ProjectDetail />,
      },
      {
        path: 'ticket/:ticketId',
        element: <TicketDetail />,
      },
      {
        path: 'inbox',
        element: <InboxPage />,
      },
      {
        path: 'saved',
        element: <PlaceholderPage />,
      },
      {
        path: 'tasks',
        element: <PlaceholderPage />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'calendar',
        element: <PlaceholderPage />,
      },
      {
        path: 'roadmaps',
        element: <PlaceholderPage />,
      },
      {
        path: 'engineering/:section',
        element: <PlaceholderPage />,
      },
      {
        path: 'design',
        element: <PlaceholderPage />,
      },
      {
        path: 'marketing',
        element: <PlaceholderPage />,
      },
      {
        path: 'settings',
        element: <PlaceholderPage />,
      },
      {
        path: 'help',
        element: <PlaceholderPage />,
      },
      {
        path: 'admin',
        element: <AdminPanel />,
      },

      {
        path: 'channels/:channelId',
        element: <ChannelPage />,
      },
      {
        path: 'clients',
        element: <Clients />,
      },
    ],
  },
]);

function LandingPageWrapper() {
  const { user, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}
