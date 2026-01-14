import { useEffect } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { RootLayout } from '../layouts/RootLayout';
import NProgress from '../lib/nprogress';

import { AdminPanel } from '../pages/AdminPanel';
import { ChannelPage } from '../pages/ChannelPage';
import { Clients } from '../pages/Clients';
import { DemoPage } from '../pages/DemoPage';
import { DocumentationPage } from '../pages/DocumentationPage';
import { HelpPage } from '../pages/HelpPage';
import { Home } from '../pages/Home';
import { InboxPage } from '../pages/InboxPage';
import { LandingPage } from '../pages/LandingPage';
import { Login } from '../pages/Login';
import { MeetingDetail } from '../pages/MeetingDetail';
import { Meetings } from '../pages/Meetings';
import { NewMeeting } from '../pages/NewMeeting';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { PricingPage } from '../pages/PricingPage';
import { ProjectDetail } from '../pages/ProjectDetail';
import { Projects } from '../pages/Projects';
import { Register } from '../pages/Register';
import { SettingsPage } from '../pages/SettingsPage';
import { TasksPage } from '../pages/TasksPage';
import { TicketDetail } from '../pages/TicketDetail';
import { UpdatePassword } from '../pages/UpdatePassword';
import path from 'path';

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
    path: '/update-password',
    element: <UpdatePassword />,
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
        element: <TasksPage />,
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
        element: <SettingsPage />,
      },
      {
        path: 'help',
        element: <HelpPage />,
      },
      {
        path: 'docs',
        element: <DocumentationPage />,
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
      {
        path: 'meetings',
        element: <Meetings />,
      },
      {
        path: 'meetings/new',
        element: <NewMeeting />,
      },
      {
        path: 'meetings/:id',
        element: <MeetingDetail />,
      },
    ],
  },
]);

function LandingPageWrapper() {
  const { user, loading, initialized } = useAuth();

  useEffect(() => {
    if (loading || !initialized) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [loading, initialized]);

  if (loading || !initialized) {
    return null;
  }


  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}
