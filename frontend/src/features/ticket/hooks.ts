import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getTickets, prepareTicket, prepareTicketRefund } from '@/features/ticket/api';
import { PrepareTicketRefundRequest, PrepareTicketRequest } from '@/shared/api/generated';

const TICKETS_QUERY_KEY = ['tickets'];

export const useTickets = (lotteryIds?: string[]) =>
  useQuery({
    queryKey: [...TICKETS_QUERY_KEY, lotteryIds ?? []],
    queryFn: async () => await getTickets(undefined, lotteryIds),
    refetchInterval: 5000,
  });

export const usePrepareTicket = () =>
  useMutation({
    mutationFn: async (body: PrepareTicketRequest) => await prepareTicket(body),
  });

export const usePrepareTicketRefund = () =>
  useMutation({
    mutationFn: async (body: PrepareTicketRefundRequest) => await prepareTicketRefund(body),
  });

export const useInvalidateTickets = () => {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
  };
};
