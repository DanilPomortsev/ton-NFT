import { authApi } from '@/shared/api/client';
import { AuthTelegramResponse } from '@/shared/api/generated';
import { debugLog } from '@/shared/lib/debug';

export const authTelegram = async (initData: string): Promise<AuthTelegramResponse> => {
  debugLog('auth-api', 'POST /auth/telegram', {
    initDataLength: initData.length,
  });

  return authApi.authTelegram({
    body: {
      initData,
    },
  });
};
