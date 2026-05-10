import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { __internal } from '@/shared/api/client';

describe('api client middleware', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: vi.fn(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('sets one-shot reload flag on 401 response', async () => {
    const response = new Response(null, { status: 401 });

    await __internal.sessionExpiredMiddleware.post?.({
      fetch: fetch,
      url: '/wallet',
      init: {},
      response,
    });

    expect(sessionStorage.getItem('__ton_lottery_session_reload__')).toBe('1');
  });

  it('clears reload flag on successful response', async () => {
    sessionStorage.setItem('__ton_lottery_session_reload__', '1');

    const response = new Response(null, { status: 200 });

    await __internal.clearReloadFlagMiddleware.post?.({
      fetch: fetch,
      url: '/wallet',
      init: {},
      response,
    });

    expect(sessionStorage.getItem('__ton_lottery_session_reload__')).toBeNull();
  });
});
