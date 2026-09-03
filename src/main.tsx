import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // <-- Add this import
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async'; // <-- IMPORT THIS

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider> {/* <-- WRAP APP HERE */}
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="vite-ui-theme"> {/* <-- THEME PROVIDER WRAPS APP */}
      <App />
    </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);

