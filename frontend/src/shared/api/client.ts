import { AuthApi, Configuration, LotteryApi, TicketApi, WalletApi, Middleware } from '@/shared/api/generated';
import { debugError, debugLog } from '@/shared/lib/debug';

const SESSION_RELOAD_FLAG = '__ton_lottery_session_reload__';
const REQUEST_START_TS_KEY = '__request_started_at_ms__';

const requestDebugMiddleware: Middleware = {
  pre: async ({ url, init }) => {
    const startedAt = Date.now();
    (init as RequestInit & { [REQUEST_START_TS_KEY]?: number })[REQUEST_START_TS_KEY] = startedAt;

    debugLog('api-client', 'request', {
      method: init.method,
      url,
      credentials: init.credentials,
      hasBody: Boolean(init.body),
    });

    return { url, init };
  },
  post: async ({ url, init, response }) => {
    const startedAt = (init as RequestInit & { [REQUEST_START_TS_KEY]?: number })[REQUEST_START_TS_KEY] ?? Date.now();

    debugLog('api-client', 'response', {
      method: init.method,
      url,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });

    return response;
  },
  onError: async ({ url, init, error, response }) => {
    const startedAt = (init as RequestInit & { [REQUEST_START_TS_KEY]?: number })[REQUEST_START_TS_KEY] ?? Date.now();

    debugError('api-client', 'request failed', {
      method: init.method,
      url,
      durationMs: Date.now() - startedAt,
      responseStatus: response?.status,
      error,
    });

    return response;
  },
};

const sessionExpiredMiddleware: Middleware = {
  post: async ({ response }) => {
    if (response.status !== 401) {
      return response;
    }

    if (typeof window !== 'undefined') {
      const reloadAlreadyRequested = window.sessionStorage.getItem(SESSION_RELOAD_FLAG) === '1';

      if (!reloadAlreadyRequested) {
        window.sessionStorage.setItem(SESSION_RELOAD_FLAG, '1');
        window.location.reload();
      }
    }

    return response;
  },
};

const clearReloadFlagMiddleware: Middleware = {
  post: async ({ response }) => {
    if (typeof window !== 'undefined' && response.status >= 200 && response.status < 300) {
      window.sessionStorage.removeItem(SESSION_RELOAD_FLAG);
    }

    return response;
  },
};

const configuration = new Configuration({
  basePath: import.meta.env.VITE_API_BASE_URL,
  credentials: 'include',
  middleware: [requestDebugMiddleware, sessionExpiredMiddleware, clearReloadFlagMiddleware],
});

export const authApi = new AuthApi(configuration);
export const lotteryApi = new LotteryApi(configuration);
export const ticketApi = new TicketApi(configuration);
export const walletApi = new WalletApi(configuration);

export const __internal = {
  requestDebugMiddleware,
  sessionExpiredMiddleware,
  clearReloadFlagMiddleware,
};
