import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WalletsPage } from '@/pages/WalletsPage';

vi.mock('@tonconnect/ui-react', () => ({
  useTonConnectUI: () => [{ connectWallet: vi.fn(), disconnect: vi.fn(), wallet: null }],
  useTonWallet: () => null,
}));

vi.mock('@/features/wallet/hooks', () => ({
  useWallets: () => ({
    isLoading: false,
    isError: false,
    data: {
      wallets: [
        {
          walletId: 'wallet-1',
          walletAddress: '0:abc',
          network: 'TON_NETWORK_MAINNET',
          state: 'WALLET_STATE_ACTIVE',
          tgUserId: 1,
        },
      ],
    },
  }),
  useWalletChallenge: () => ({ mutateAsync: vi.fn() }),
  useLinkWallet: () => ({ mutateAsync: vi.fn() }),
  useRevokeWallet: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useInvalidateWallets: () => vi.fn(),
}));

describe('WalletsPage', () => {
  it('renders wallets list', () => {
    render(<WalletsPage />);

    expect(screen.getByText('wallet-1')).toBeInTheDocument();
    expect(screen.getByText('Address: 0:abc')).toBeInTheDocument();
    expect(screen.getByText('Network: TON_NETWORK_MAINNET')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revoke wallet' })).toBeInTheDocument();
  });
});
