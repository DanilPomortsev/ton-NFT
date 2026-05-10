import { useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

import { debugError, debugLog, isDebugEnabled } from '@/shared/lib/debug';

type TonConnectUIWithStatus = {
  onStatusChange?: (
    onWalletChanged: (wallet: unknown) => void,
    onError?: (error: unknown) => void,
  ) => (() => void) | void;
  onModalStateChange?: (onStateChanged: (state: unknown) => void) => (() => void) | void;
  wallet?: unknown;
};

export const TonConnectDebugObserver = () => {
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();

  useEffect(() => {
    if (!isDebugEnabled()) {
      return;
    }

    debugLog('tonconnect', 'observer mounted', {
      hasWalletFromHook: Boolean(tonWallet),
      hasWalletFromUI: Boolean((tonConnectUI as TonConnectUIWithStatus).wallet),
    });

    const uiWithStatus = tonConnectUI as unknown as TonConnectUIWithStatus;
    const unsubscribeStatus =
      uiWithStatus.onStatusChange?.(
        (wallet) => {
          debugLog('tonconnect', 'status changed', {
            hasWallet: Boolean(wallet),
            wallet,
          });
        },
        (error) => {
          debugError('tonconnect', 'status change error', error);
        },
      ) ?? undefined;

    const unsubscribeModal =
      uiWithStatus.onModalStateChange?.((state) => {
        debugLog('tonconnect', 'modal state changed', state);
      }) ?? undefined;

    return () => {
      if (typeof unsubscribeStatus === 'function') {
        unsubscribeStatus();
      }

      if (typeof unsubscribeModal === 'function') {
        unsubscribeModal();
      }
    };
  }, [tonConnectUI, tonWallet]);

  useEffect(() => {
    debugLog('tonconnect', 'wallet hook changed', {
      hasWallet: Boolean(tonWallet),
      wallet: tonWallet ?? null,
    });
  }, [tonWallet]);

  return null;
};
