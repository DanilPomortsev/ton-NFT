import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SessionBootstrap } from '@/app/providers/SessionBootstrap';

vi.mock('@/app/providers/TelegramProvider', () => ({
  useTelegram: vi.fn(),
}));

vi.mock('@/features/auth/hooks', () => ({
  useAuthTelegramBootstrap: vi.fn(),
}));

import { useTelegram } from '@/app/providers/TelegramProvider';
import { useAuthTelegramBootstrap } from '@/features/auth/hooks';

describe('SessionBootstrap', () => {
  it('renders app outside Telegram runtime', () => {
    vi.mocked(useTelegram).mockReturnValue({
      isInitialized: true,
      isTelegramRuntime: false,
      initData: '',
      webApp: null,
    });

    vi.mocked(useAuthTelegramBootstrap).mockReturnValue({
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(
      <SessionBootstrap>
        <div>ready</div>
      </SessionBootstrap>,
    );

    expect(screen.getByText('ready')).toBeInTheDocument();
  });
});
