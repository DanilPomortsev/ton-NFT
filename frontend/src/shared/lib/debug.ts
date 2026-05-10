export type DebugEntry = {
  id: number;
  timestamp: string;
  level: 'debug' | 'error';
  scope: string;
  message: string;
  payload?: unknown;
};

const maxEntries = 200;
let nextEntryID = 1;
const entries: DebugEntry[] = [];
const listeners = new Set<(value: DebugEntry[]) => void>();

export const isDebugEnabled = () => {
  if (typeof import.meta === 'undefined') {
    return false;
  }

  const raw = import.meta.env.VITE_DEBUG;
  if (raw === 'false') {
    return false;
  }

  return true;
};

const notify = () => {
  const snapshot = [...entries];
  listeners.forEach((listener) => listener(snapshot));
};

const pushEntry = (entry: Omit<DebugEntry, 'id'>) => {
  entries.push({
    id: nextEntryID++,
    ...entry,
  });

  if (entries.length > maxEntries) {
    entries.splice(0, entries.length - maxEntries);
  }

  notify();
};

export const debugLog = (scope: string, message: string, payload?: unknown) => {
  if (!isDebugEnabled()) {
    return;
  }

  const timestamp = new Date().toISOString();
  pushEntry({
    timestamp,
    level: 'debug',
    scope,
    message,
    payload,
  });

  if (payload === undefined) {
    console.debug(`[${timestamp}] [${scope}] ${message}`);
    return;
  }

  console.debug(`[${timestamp}] [${scope}] ${message}`, payload);
};

export const debugError = (scope: string, message: string, error: unknown) => {
  if (!isDebugEnabled()) {
    return;
  }

  const normalizedError =
    error instanceof Error
      ? (() => {
          const extendedError = error as Error & { code?: string | number; cause?: unknown };
          return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: extendedError.code,
            cause: extendedError.cause,
          };
        })()
      : error;

  const timestamp = new Date().toISOString();
  pushEntry({
    timestamp,
    level: 'error',
    scope,
    message,
    payload: normalizedError,
  });
  console.error(`[${timestamp}] [${scope}] ${message}`, normalizedError);
};

export const getDebugEntries = (): DebugEntry[] => [...entries];

export const subscribeDebugEntries = (listener: (value: DebugEntry[]) => void) => {
  listeners.add(listener);
  listener(getDebugEntries());

  return () => {
    listeners.delete(listener);
  };
};
