import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getLotteries, prepareLottery, prepareLotteryFinalization } from '@/features/lottery/api';
import { normalizeApiError } from '@/shared/api/errors';
import { PrepareLotteryFinalizationRequest, PrepareLotteryRequest } from '@/shared/api/generated';

export const LOTTERIES_QUERY_KEY = ['lotteries'];

export const useLotteries = () => {
  return useQuery({
    queryKey: LOTTERIES_QUERY_KEY,
    queryFn: async () => {
      try {
        return await getLotteries();
      } catch (error) {
        throw await normalizeApiError(error);
      }
    },
    refetchInterval: 5_000,
  });
};

export const usePrepareLottery = () => {
  return useMutation({
    mutationFn: async (payload: PrepareLotteryRequest) => {
      try {
        return await prepareLottery(payload);
      } catch (error) {
        throw await normalizeApiError(error);
      }
    },
  });
};

export const usePrepareLotteryFinalization = () => {
  return useMutation({
    mutationFn: async (payload: PrepareLotteryFinalizationRequest) => {
      try {
        return await prepareLotteryFinalization(payload);
      } catch (error) {
        throw await normalizeApiError(error);
      }
    },
  });
};

export const useInvalidateLotteries = () => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: LOTTERIES_QUERY_KEY });
};
