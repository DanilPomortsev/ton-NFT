import '@/polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from '@/app/App';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { TelegramProvider } from '@/app/providers/TelegramProvider';
import { TonConnectProvider } from '@/app/providers/TonConnectProvider';
import { debugError, debugLog } from '@/shared/lib/debug';

import './styles.css';

debugLog('app', 'bootstrap start', {
  href: typeof window !== 'undefined' ? window.location.href : '',
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
});

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    debugError('window', 'error event', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    debugError('window', 'unhandledrejection', event.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryProvider>
      <TelegramProvider>
        <TonConnectProvider>
          <App />
        </TonConnectProvider>
      </TelegramProvider>
    </QueryProvider>
  </React.StrictMode>,
);
