import { useEffect } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { RootLayout } from '../layouts/RootLayout';
import NProgress from '../lib/nprogress';

import { AdminPanel } from '../pages/AdminPanel';
import { CalendarPage } from '../pages/CalendarPage';
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
import { MessagesPage } from '../pages/MessagesPage';
import { NewMeeting } from '../pages/NewMeeting';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { PricingPage } from '../pages/PricingPage';
import { ProjectDetail } from '../pages/ProjectDetail';
import { Projects } from '../pages/Projects';
import { Register } from '../pages/Register';
import { Roadmaps } from '../pages/Roadmaps';
import { SettingsPage } from '../pages/SettingsPage';
import SupportDashboard from '../pages/SupportDashboard';
import { TasksPage } from '../pages/TasksPage';
import { TicketDetail } from '../pages/TicketDetail';
import { UpdatePassword } from '../pages/UpdatePassword';

// Authentication enabled
const ENABLE_AUTH = true;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPageWrapper />,
    errorElement: <PlaceholderPage standalone />,
  },
  {
    path: '/demo',
    element: <DemoPage />,
    errorElement: <PlaceholderPage standalone />,
  },
  {
    path: '/login',
    element: <Login />,
    errorElement: <PlaceholderPage standalone />,
  },
  {
    path: '/register',
    element: <Register />,
    errorElement: <PlaceholderPage standalone />,
  },
  {
    path: '/update-password',
    element: <UpdatePassword />,
    errorElement: <PlaceholderPage standalone />,
  },
  {
    path: '/pricing',
    element: <PricingPage />,
    errorElement: <PlaceholderPage standalone />,
  },
  {
    element: ENABLE_AUTH ? (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ) : (
      <RootLayout />
    ),
    errorElement: <PlaceholderPage standalone />,
    children: [
      {
        // Errors inside a page render in the layout, so the menu stays usable.
        errorElement: <PlaceholderPage />,
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
            path: 'tasks',
            element: <TasksPage />,
          },
          {
            path: 'projects',
            element: <Projects />,
          },
          {
            path: 'calendar',
            element: <CalendarPage />,
          },
          {
            path: 'messages',
            element: <MessagesPage />,
          },
          {
            path: 'roadmaps',
            element: <Roadmaps />,
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
            path: 'documentation',
            element: <DocumentationPage />,
          },
          {
            path: 'admin',
            element: <AdminPanel />,
          },
          {
            path: 'admin/support',
            element: <SupportDashboard />,
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
          {
            path: '*',
            element: <PlaceholderPage />,
          },
        ],
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
