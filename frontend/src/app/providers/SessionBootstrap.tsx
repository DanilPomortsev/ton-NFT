import { PropsWithChildren } from 'react';

import { useAuthTelegramBootstrap } from '@/features/auth/hooks';
import { useTelegram } from '@/app/providers/TelegramProvider';
import { Loader } from '@/shared/ui/Loader';
import { ErrorState } from '@/shared/ui/ErrorState';
import { debugError, debugLog } from '@/shared/lib/debug';

export const SessionBootstrap = ({ children }: PropsWithChildren) => {
  const { isInitialized, isTelegramRuntime, initData } = useTelegram();

  const shouldBootstrapAuth = isInitialized && initData.length > 0;
  const authQuery = useAuthTelegramBootstrap(initData, shouldBootstrapAuth);

  debugLog('session-bootstrap', 'state', {
    isInitialized,
    isTelegramRuntime,
    hasInitData: initData.length > 0,
    shouldBootstrapAuth,
    isLoading: authQuery.isLoading,
    isError: authQuery.isError,
  });

  if (!isInitialized) {
    return <Loader label="Initializing Telegram Mini App..." />;
  }

  if (isTelegramRuntime && !initData) {
    return <ErrorState title="Telegram initData is missing" description="Open this app from Telegram chat menu." />;
  }

  if (authQuery.isLoading) {
    return <Loader label="Authorizing session..." />;
  }

  if (authQuery.isError) {
    debugError('session-bootstrap', 'auth bootstrap failed', authQuery.error);

    return (
      <ErrorState
        title="Authorization failed"
        description={authQuery.error.message}
        action={{
          label: 'Retry',
          onClick: () => authQuery.refetch(),
        }}
      />
    );
  }

  return <>{children}</>;
};
