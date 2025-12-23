import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Snowfall } from 'react-snowfall';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Snowfall style={{ position: 'fixed' }} />
  </StrictMode>
);
