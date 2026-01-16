import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './router';

import { ThemeProvider } from './contexts/ThemeContext';

// TEMPORARY: Disable auth for debugging
const ENABLE_AUTH = true;

function App() {
  return (
    <ThemeProvider>
      {ENABLE_AUTH ? (
        <AuthProvider>
          <Toaster position="top-right" />
          <RouterProvider router={router} />
        </AuthProvider>
      ) : (
        <RouterProvider router={router} />
      )}
    </ThemeProvider>
  );
}

export default App;
