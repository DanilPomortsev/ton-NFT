import '@/polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { TelegramProvider } from '@/app/providers/TelegramProvider';
import { TonConnectProvider } from '@/app/providers/TonConnectProvider';
import { HomePage } from '@/pages/HomePage';
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
    <TelegramProvider>
      <TonConnectProvider>
        <HomePage />
      </TonConnectProvider>
    </TelegramProvider>
  </React.StrictMode>,
);
