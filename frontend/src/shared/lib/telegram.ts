export type TelegramWebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
};

export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
};
