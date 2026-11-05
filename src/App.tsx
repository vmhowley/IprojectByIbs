import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { ConfirmHost } from './components/ui/ConfirmDialog';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './router';

import { ThemeProvider } from './contexts/ThemeContext';

// TEMPORARY: Disable auth for debugging
const ENABLE_AUTH = true;

// Toasts are small paper slips in the theme's ink.
const toastOptions = {
  duration: 4000,
  style: {
    background: 'var(--paper)',
    color: 'var(--ink)',
    border: '1px solid var(--rule)',
    borderRadius: '3px',
    boxShadow: 'var(--shadow-lift)',
    fontSize: '14px',
    padding: '10px 12px',
    maxWidth: '420px',
  },
  success: { iconTheme: { primary: 'var(--st-green)', secondary: 'var(--paper)' } },
  error: { iconTheme: { primary: 'var(--st-red)', secondary: 'var(--paper)' }, duration: 6000 },
};

function App() {
  return (
    <ThemeProvider>
      {ENABLE_AUTH ? (
        <AuthProvider>
          <Toaster position="bottom-right" toastOptions={toastOptions} />
          <ConfirmHost />
          <RouterProvider router={router} />
        </AuthProvider>
      ) : (
        <RouterProvider router={router} />
      )}
    </ThemeProvider>
  );
}

export default App;
