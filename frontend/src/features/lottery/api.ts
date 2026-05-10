import { lotteryApi } from '@/shared/api/client';
import {
  GetLotteriesResponse,
  PrepareLotteryFinalizationRequest,
  PrepareLotteryRequest,
  PrepareLotteryTransaction,
} from '@/shared/api/generated';
import { debugLog } from '@/shared/lib/debug';

export const getLotteries = async (lotteryIds?: string[]): Promise<GetLotteriesResponse> => {
  debugLog('lottery-api', 'GET /lottery', { lotteryIds });

  return lotteryApi.getLottery({
    lotteryIds,
  });
};

export const prepareLottery = async (body: PrepareLotteryRequest): Promise<PrepareLotteryTransaction> => {
  debugLog('lottery-api', 'POST /lottery/prepare', {
    walletId: body.walletId,
    name: body.name,
    ticketPrice: body.ticketPrice,
    endAt: body.endAt.toISOString(),
  });

  return lotteryApi.prepareLottery({ body });
};

export const prepareLotteryFinalization = async (body: PrepareLotteryFinalizationRequest): Promise<PrepareLotteryTransaction> => {
  debugLog('lottery-api', 'POST /lottery/finalization/prepare', {
    walletId: body.walletId,
    lotteryId: body.lotteryId,
    idempotencyKey: body.idempotencyKey,
  });

  return lotteryApi.prepareLotteryFinalizaion({ body });
};
