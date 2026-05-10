import { useQuery } from '@tanstack/react-query';

import { authTelegram } from '@/features/auth/api';
import { normalizeApiError } from '@/shared/api/errors';

export const AUTH_BOOTSTRAP_QUERY_KEY = ['auth', 'telegram-bootstrap'];

export const useAuthTelegramBootstrap = (initData: string, enabled: boolean) => {
  return useQuery({
    queryKey: AUTH_BOOTSTRAP_QUERY_KEY,
    queryFn: async () => {
      try {
        return await authTelegram(initData);
      } catch (error) {
        throw await normalizeApiError(error);
      }
    },
    enabled,
    retry: 0,
  });
};
