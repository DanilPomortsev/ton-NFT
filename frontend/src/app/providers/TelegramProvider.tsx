import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { getTelegramWebApp, TelegramWebApp } from '@/shared/lib/telegram';
import { debugLog } from '@/shared/lib/debug';

type TelegramContextValue = {
  isTelegramRuntime: boolean;
  isInitialized: boolean;
  initData: string;
  webApp: TelegramWebApp | null;
};

const TelegramContext = createContext<TelegramContextValue | null>(null);

export const TelegramProvider = ({ children }: PropsWithChildren) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initData, setInitData] = useState('');
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    const tgWebApp = getTelegramWebApp();

    if (!tgWebApp) {
      debugLog('telegram-provider', 'Telegram WebApp SDK is unavailable');
      setIsInitialized(true);
      return;
    }

    debugLog('telegram-provider', 'Telegram WebApp SDK is available');
    tgWebApp.ready();
    tgWebApp.expand();

    setWebApp(tgWebApp);
    setInitData(tgWebApp.initData ?? '');
    debugLog('telegram-provider', 'initData captured', {
      initDataLength: (tgWebApp.initData ?? '').length,
    });
    setIsInitialized(true);
  }, []);

  const value = useMemo<TelegramContextValue>(
    () => ({
      isTelegramRuntime: webApp !== null,
      isInitialized,
      initData,
      webApp,
    }),
    [initData, isInitialized, webApp],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
};

export const useTelegram = () => {
  const value = useContext(TelegramContext);

  if (!value) {
    throw new Error('useTelegram must be used inside TelegramProvider');
  }

  return value;
};
