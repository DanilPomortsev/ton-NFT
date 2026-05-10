import { Address } from '@ton/core';

import { TonNetwork, WalletLinkRequest } from '@/shared/api/generated';
import { debugLog } from '@/shared/lib/debug';

type TonConnectAccount = {
  address?: string;
  chain?: string;
  publicKey?: string;
  walletStateInit?: string;
};

type TonProofPayload = {
  timestamp: number;
  domain: {
    lengthBytes: number;
    value: string;
  };
  payload: string;
  signature: string;
  stateInit?: string;
};

type TonProofConnectItem = {
  name: string;
  proof?: TonProofPayload;
  error?: {
    code: number;
    message?: string;
  };
};

type TonConnectWalletLike = {
  account?: TonConnectAccount;
  connectItems?: {
    tonProof?: TonProofConnectItem;
  };
};

const mapChainToNetwork = (chain: string | undefined): TonNetwork => {
  if (chain === '-3') {
    return TonNetwork.TonNetworkTestnet;
  }

  return TonNetwork.TonNetworkMainnet;
};

const ensureHexPublicKey = (value: string): string => {
  return value.startsWith('0x') ? value.slice(2) : value;
};

const toRawAddress = (address: string): string => {
  return Address.parse(address).toRawString();
};

export const mapWalletToLinkRequest = (
  wallet: TonConnectWalletLike,
  challengeId: string,
  expectedProofPayload?: string,
): WalletLinkRequest => {
  const account = wallet.account;
  const tonProofItem = wallet.connectItems?.tonProof;

  if (!account?.address) {
    throw new Error('Connected wallet address is missing');
  }

  if (!account.publicKey) {
    throw new Error('Connected wallet public key is missing');
  }

  if (!tonProofItem?.proof) {
    throw new Error('Wallet did not return ton proof payload');
  }

  if (expectedProofPayload && tonProofItem.proof.payload !== expectedProofPayload) {
    throw new Error('Wallet returned stale ton proof payload');
  }

  const walletStateInit = tonProofItem.proof.stateInit ?? account.walletStateInit;
  if (!walletStateInit) {
    throw new Error('Connected wallet stateInit is missing');
  }

  debugLog('ton-proof', 'mapping wallet to link request', {
    challengeId,
    chain: account.chain,
    walletAddress: account.address,
    hasProofStateInit: Boolean(tonProofItem.proof.stateInit),
    hasAccountStateInit: Boolean(account.walletStateInit),
    proofDomain: tonProofItem.proof.domain.value,
    proofTs: tonProofItem.proof.timestamp,
  });

  return {
    challengeId,
    network: mapChainToNetwork(account.chain),
    walletAddress: toRawAddress(account.address),
    tonProof: {
      timestamp: tonProofItem.proof.timestamp,
      domain: {
        lengthBytes: tonProofItem.proof.domain.lengthBytes,
        value: tonProofItem.proof.domain.value,
      },
      payload: tonProofItem.proof.payload,
      signature: tonProofItem.proof.signature,
    },
    walletStateInit,
    publicKey: ensureHexPublicKey(account.publicKey),
  };
};
