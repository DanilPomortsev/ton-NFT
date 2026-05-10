import { GetTicketsResponse, PrepareTicketRefundRequest, PrepareTicketRequest, PrepareTicketTransactionResponse } from '@/shared/api/generated';
import { ticketApi } from '@/shared/api/client';
import { debugLog } from '@/shared/lib/debug';

export const getTickets = async (ticketIds?: string[], lotteryIds?: string[]): Promise<GetTicketsResponse> => {
  debugLog('ticket-api', 'GET /ticket', { ticketIds, lotteryIds });

  return await ticketApi.getTicket({
    ticketIds,
    lotteryIds,
  });
};

export const prepareTicket = async (body: PrepareTicketRequest): Promise<PrepareTicketTransactionResponse> => {
  debugLog('ticket-api', 'POST /ticket/prepare', {
    walletId: body.walletId,
    lotteryId: body.lotteryId,
    idempotencyKey: body.idempotencyKey,
  });

  return await ticketApi.prepareTicket({ body });
};

export const prepareTicketRefund = async (body: PrepareTicketRefundRequest): Promise<PrepareTicketTransactionResponse> => {
  debugLog('ticket-api', 'POST /ticket/refund/prepare', {
    walletId: body.walletId,
    ticketId: body.ticketId,
    idempotencyKey: body.idempotencyKey,
  });

  return await ticketApi.prepareTicketRefund({ body });
};
