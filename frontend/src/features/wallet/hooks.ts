import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getWalletChallenge, getWallets, linkWallet, revokeWallet } from '@/features/wallet/api';
import { normalizeApiError } from '@/shared/api/errors';
import { WalletLinkRequest } from '@/shared/api/generated';

export const WALLETS_QUERY_KEY = ['wallets'];

export const useWallets = () => {
  return useQuery({
    queryKey: WALLETS_QUERY_KEY,
    queryFn: async () => {
      try {
        return await getWallets();
      } catch (error) {
        throw await normalizeApiError(error);
      }
    },
  });
};

export const useWalletChallenge = () => {
  return useMutation({
    mutationFn: async () => {
      try {
        return await getWalletChallenge();
      } catch (error) {
        throw await normalizeApiError(error);
      }
    },
  });
};

export const useLinkWallet = () => {
  return useMutation({
    mutationFn: async (payload: WalletLinkRequest) => {
      try {
        return await linkWallet(payload);
      } catch (error) {
        throw await normalizeApiError(error);
      }
    },
  });
};

export const useRevokeWallet = () => {
  return useMutation({
    mutationFn: async (walletId: string) => {
      try {
        return await revokeWallet(walletId);
      } catch (error) {
        throw await normalizeApiError(error);
      }
    },
  });
};

export const useInvalidateWallets = () => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
};
