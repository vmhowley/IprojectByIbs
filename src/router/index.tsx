import { createBrowserRouter } from 'react-router-dom';
import { Home } from '../pages/Home';
import { ProjectDetail } from '../pages/ProjectDetail';
import { TicketDetail } from '../pages/TicketDetail';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { RootLayout } from '../layouts/RootLayout';
import { Projects } from '../pages/Projects';
import { ContactUs } from '../pages/ContactUs';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
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
        element: <ContactUs />,
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
    ],
  },
]);
