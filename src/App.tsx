import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './router';

// TEMPORARY: Disable auth for debugging
const ENABLE_AUTH = true;

function App() {
  if (ENABLE_AUTH) {
    return (
      <AuthProvider>
        <Toaster position="top-right" />
        <RouterProvider router={router} />
      </AuthProvider>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;
