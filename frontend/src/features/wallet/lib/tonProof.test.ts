import { describe, expect, it } from 'vitest';

import { TonNetwork } from '@/shared/api/generated';
import { mapWalletToLinkRequest } from '@/features/wallet/lib/tonProof';

describe('mapWalletToLinkRequest', () => {
  it('maps ton proof and account data to backend payload', () => {
    const wallet = {
      account: {
        address: '0:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        chain: '-239',
        publicKey: '0x1234',
      },
      connectItems: {
        tonProof: {
          name: 'ton_proof',
          proof: {
            timestamp: 1,
            domain: {
              lengthBytes: 4,
              value: 'test',
            },
            payload: 'nonce',
            signature: 'sig',
            stateInit: 'state',
          },
        },
      },
    };

    const request = mapWalletToLinkRequest(wallet, 'challenge-id');

    expect(request.challengeId).toBe('challenge-id');
    expect(request.network).toBe(TonNetwork.TonNetworkMainnet);
    expect(request.walletAddress).toBe(wallet.account.address);
    expect(request.publicKey).toBe('1234');
    expect(request.walletStateInit).toBe('state');
    expect(request.tonProof.payload).toBe('nonce');
  });

  it('throws when wallet returns proof payload for another challenge', () => {
    const wallet = {
      account: {
        address: '0:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        chain: '-239',
        publicKey: '0x1234',
      },
      connectItems: {
        tonProof: {
          name: 'ton_proof',
          proof: {
            timestamp: 1,
            domain: {
              lengthBytes: 4,
              value: 'test',
            },
            payload: 'old-nonce',
            signature: 'sig',
            stateInit: 'state',
          },
        },
      },
    };

    expect(() => mapWalletToLinkRequest(wallet, 'challenge-id', 'new-nonce')).toThrow(
      'Wallet returned stale ton proof payload',
    );
  });
});
