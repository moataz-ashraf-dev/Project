import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider';
import AppErrorBoundary from './components/AppErrorBoundary';
import './index.css';
import './styles/premium.css';
import './styles/overlays.css';
import './styles/theme.css';
import './styles/dashboard.css';
import './styles/footer.css';
import './styles/leaderboard.css';
import './styles/streak.css';
import './styles/app-shell.css';
import { configureMobileShell } from './lib/mobile';

void configureMobileShell();

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    void navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.scope.startsWith(window.location.origin + '/')) {
            void registration.unregister();
          }
        });
      })
      .catch(() => undefined);
  } else if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
