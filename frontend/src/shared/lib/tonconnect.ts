import { TonNetwork } from '@/shared/api/generated';

export const makeIdempotencyKey = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
};

export const isTonConnectUncertainSendError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('Transaction was not sent');
};

export const mapTonNetworkToChainID = (network: TonNetwork): '-239' | '-3' => {
  if (network === TonNetwork.TonNetworkMainnet) {
    return '-239';
  }

  return '-3';
};
