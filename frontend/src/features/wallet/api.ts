import { walletApi } from '@/shared/api/client';
import {
  GetWalletWalletStateEnum,
  GetWalletsResponse,
  WalletChallengeResponse,
  WalletLinkRequest,
  WalletLinkResponse,
  WalletRevokeResponse,
} from '@/shared/api/generated';
import { debugLog } from '@/shared/lib/debug';

export const getWallets = async (walletIds?: string[]): Promise<GetWalletsResponse> => {
  debugLog('wallet-api', 'GET /wallet', {
    walletIds,
    walletState: GetWalletWalletStateEnum.WalletStateActive,
  });

  return walletApi.getWallet({
    walletIds,
    walletState: GetWalletWalletStateEnum.WalletStateActive,
  });
};

export const getWalletChallenge = async (): Promise<WalletChallengeResponse> => {
  debugLog('wallet-api', 'GET /wallet/challenge');
  return walletApi.chanllengeWallet();
};

export const linkWallet = async (body: WalletLinkRequest): Promise<WalletLinkResponse> => {
  debugLog('wallet-api', 'POST /wallet/link', {
    challengeId: body.challengeId,
    network: body.network,
    walletAddress: body.walletAddress,
    domain: body.tonProof.domain.value,
    timestamp: body.tonProof.timestamp,
  });

  return walletApi.linkWallet({ body });
};

export const revokeWallet = async (walletId: string): Promise<WalletRevokeResponse> => {
  debugLog('wallet-api', 'POST /wallet/revoke', { walletId });

  return walletApi.revokeWallet({
    body: {
      walletId,
    },
  });
};
