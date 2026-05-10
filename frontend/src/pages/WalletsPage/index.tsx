import { useMemo, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

import { useInvalidateWallets, useLinkWallet, useRevokeWallet, useWalletChallenge, useWallets } from '@/features/wallet/hooks';
import { mapWalletToLinkRequest } from '@/features/wallet/lib/tonProof';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Loader } from '@/shared/ui/Loader';
import { debugError, debugLog } from '@/shared/lib/debug';

type LinkStatus = 'idle' | 'preparing' | 'waiting_wallet' | 'submitted' | 'confirmed' | 'failed';

type TonConnectUIWithProofRequest = {
  setConnectRequestParameters?: (params: unknown) => void;
  openModal?: () => Promise<void> | void;
  onStatusChange?: (
    onWalletChanged: (wallet: unknown) => void,
    onError?: (error: unknown) => void,
  ) => (() => void) | void;
  onModalStateChange?: (onStateChanged: (state: unknown) => void) => (() => void) | void;
  getWallets?: () => Promise<unknown[]>;
};

type TonConnectWalletWithProof = {
  connectItems?: {
    tonProof?: {
      proof?: {
        payload?: string;
        signature?: string;
      };
    };
  };
};

const getTonProofPayload = (wallet: unknown): string | null => {
  if (typeof wallet !== 'object' || wallet === null) {
    return null;
  }

  const maybeWallet = wallet as TonConnectWalletWithProof;
  const proof = maybeWallet.connectItems?.tonProof?.proof;
  if (!proof?.payload || !proof?.signature) {
    return null;
  }

  return proof.payload;
};

const hasTonProofPayload = (wallet: unknown): boolean => {
  return Boolean(getTonProofPayload(wallet));
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const errWithCode = error as Error & { code?: string | number };
    return errWithCode.code ? `${error.message} (code: ${String(errWithCode.code)})` : error.message;
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return 'Wallet link failed';
    }
  }

  return 'Wallet link failed';
};

export const WalletsPage = () => {
  const walletsQuery = useWallets();
  const challengeMutation = useWalletChallenge();
  const linkMutation = useLinkWallet();
  const revokeMutation = useRevokeWallet();
  const invalidateWallets = useInvalidateWallets();

  const tonWallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const [linkStatus, setLinkStatus] = useState<LinkStatus>('idle');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const wallets = walletsQuery.data?.wallets ?? [];
  const tonConnectUIWithProof = tonConnectUI as unknown as TonConnectUIWithProofRequest;

  const isLinkInProgress = useMemo(
    () => ['preparing', 'waiting_wallet', 'submitted'].includes(linkStatus),
    [linkStatus],
  );

  const handleConnectAndLink = async () => {
    const flowId = `wallet-link-${Date.now()}`;

    try {
      debugLog('wallet-flow', `${flowId}: start`, {
        hasTonWallet: Boolean(tonWallet),
        tonWalletAddress: tonWallet?.account?.address,
      });

      setLinkError(null);
      setRevokeError(null);
      setLinkStatus('preparing');

      const challenge = await challengeMutation.mutateAsync();
      debugLog('wallet-flow', `${flowId}: challenge received`, {
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
      });

      setLinkStatus('waiting_wallet');
      if (tonConnectUI.wallet || tonWallet) {
        debugLog('wallet-flow', `${flowId}: disconnect existing wallet before proof connect`);
        await tonConnectUI.disconnect();
      }

      tonConnectUIWithProof.setConnectRequestParameters?.({
        state: 'ready',
        value: {
          tonProof: challenge.nonce,
        },
      });
      debugLog('wallet-flow', `${flowId}: connect request params set`, {
        tonProofLength: challenge.nonce.length,
      });

      const availableWallets = await tonConnectUIWithProof.getWallets?.();
      debugLog('wallet-flow', `${flowId}: available wallets`, {
        count: availableWallets?.length ?? 0,
      });

      const connectionPromise = new Promise<unknown>((resolve, reject) => {
        const startedAt = Date.now();
        let timeoutID: number | undefined;
        let unsubscribeStatus: (() => void) | undefined;
        let unsubscribeModal: (() => void) | undefined;
        let settled = false;

        const resolveOnce = (value: unknown) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          resolve(value);
        };

        const rejectOnce = (error: unknown) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          reject(error);
        };

        const cleanup = () => {
          if (timeoutID !== undefined) {
            window.clearTimeout(timeoutID);
          }
          if (unsubscribeStatus) {
            unsubscribeStatus();
          }
          if (unsubscribeModal) {
            unsubscribeModal();
          }
        };

        timeoutID = window.setTimeout(() => {
          rejectOnce(new Error(`Timeout waiting wallet connection after ${Date.now() - startedAt}ms`));
        }, 90_000);

        const maybeUnsubscribeStatus = tonConnectUIWithProof.onStatusChange?.(
          (wallet) => {
            if (!wallet) {
              return;
            }

            debugLog('wallet-flow', `${flowId}: onStatusChange connected`, {
              hasWallet: Boolean(wallet),
            });
            const proofPayload = getTonProofPayload(wallet);
            if (!proofPayload) {
              debugLog('wallet-flow', `${flowId}: onStatusChange wallet has no tonProof yet`);
              return;
            }

            if (proofPayload !== challenge.nonce) {
              debugLog('wallet-flow', `${flowId}: onStatusChange received stale tonProof payload`, {
                expectedNonceLength: challenge.nonce.length,
                receivedPayloadLength: proofPayload.length,
              });
              return;
            }

            resolveOnce(wallet);
          },
          (error) => {
            debugError('wallet-flow', `${flowId}: onStatusChange error`, error);
            rejectOnce(error);
          },
        );

        if (typeof maybeUnsubscribeStatus === 'function') {
          unsubscribeStatus = maybeUnsubscribeStatus;
        }

        const maybeUnsubscribeModal = tonConnectUIWithProof.onModalStateChange?.((state) => {
          debugLog('wallet-flow', `${flowId}: modal state in flow`, state);

          if (typeof state !== 'object' || state === null) {
            return;
          }

          const modalState = state as { status?: string; closeReason?: string | null };
          if (
            modalState.status === 'closed' &&
            modalState.closeReason &&
            modalState.closeReason !== 'wallet-selected'
          ) {
            rejectOnce(new Error(`TonConnect modal closed: ${modalState.closeReason}`));
          }
        });

        if (typeof maybeUnsubscribeModal === 'function') {
          unsubscribeModal = maybeUnsubscribeModal;
        }
      });
      debugLog('wallet-flow', `${flowId}: waiting for onStatusChange`);

      debugLog('wallet-flow', `${flowId}: openModal() call`);
      if (!tonConnectUIWithProof.openModal) {
        throw new Error('TonConnect openModal is not available in current runtime');
      }
      const openModalResult = tonConnectUIWithProof.openModal?.();
      debugLog('wallet-flow', `${flowId}: openModal() invoked`, {
        returnsPromise: openModalResult instanceof Promise,
      });
      if (openModalResult instanceof Promise) {
        openModalResult
          .then(() => {
            debugLog('wallet-flow', `${flowId}: openModal() resolved`);
          })
          .catch((error) => {
            debugError('wallet-flow', `${flowId}: openModal() rejected`, error);
          });
      }

      const connectedWallet = await connectionPromise;

      debugLog('wallet-flow', `${flowId}: wallet connect result`, {
        hasConnectedWallet: Boolean(connectedWallet),
        hasTonConnectWallet: Boolean(tonConnectUI.wallet),
        hasTonWalletHook: Boolean(tonWallet),
      });

      if (!connectedWallet) {
        throw new Error('TonConnect did not return a connected wallet');
      }

      setLinkStatus('submitted');
      const payload = mapWalletToLinkRequest(connectedWallet as never, challenge.challengeId, challenge.nonce);
      debugLog('wallet-flow', `${flowId}: link payload prepared`, {
        challengeId: payload.challengeId,
        network: payload.network,
        walletAddress: payload.walletAddress,
      });
      await linkMutation.mutateAsync(payload);

      setLinkStatus('confirmed');
      await invalidateWallets();
      debugLog('wallet-flow', `${flowId}: completed`);
    } catch (error) {
      setLinkStatus('failed');
      setLinkError(getErrorMessage(error));
      debugError('wallet-flow', `${flowId}: failed`, error);
    }
  };

  const handleRevokeWallet = async (walletId: string) => {
    try {
      setRevokeError(null);
      debugLog('wallet-flow', 'revoke start', { walletId });
      await revokeMutation.mutateAsync(walletId);
      await invalidateWallets();
      debugLog('wallet-flow', 'revoke completed', { walletId });
    } catch (error) {
      const message = getErrorMessage(error);
      setRevokeError(message);
      debugError('wallet-flow', 'revoke failed', { walletId, error });
    }
  };

  return (
    <section>
      <div className="section-header">
        <h2>Wallets</h2>
        <div className="actions">
          <Button type="button" onClick={handleConnectAndLink} disabled={isLinkInProgress}>
            Connect & Link wallet
          </Button>
        </div>
      </div>

      {linkStatus !== 'idle' ? (
        <div className="status-banner">
          <strong>Link status:</strong> {linkStatus}
          {linkError ? <p>{linkError}</p> : null}
        </div>
      ) : null}

      {revokeError ? (
        <div className="status-banner">
          <strong>Revoke status:</strong> failed
          <p>{revokeError}</p>
        </div>
      ) : null}

      {walletsQuery.isLoading ? <Loader label="Loading wallets..." /> : null}

      {walletsQuery.isError ? <ErrorState title="Failed to load wallets" description={walletsQuery.error.message} /> : null}

      {walletsQuery.data && wallets.length === 0 ? (
        <EmptyState title="No linked wallets" description="Connect and link a wallet to continue." />
      ) : null}

      {walletsQuery.data && wallets.length > 0 ? (
        <ul className="wallet-list">
          {wallets.map((wallet) => (
            <li key={wallet.walletId} className="wallet-card">
              <div>
                <strong>{wallet.walletId}</strong>
              </div>
              <div>Address: {wallet.walletAddress}</div>
              <div>Network: {wallet.network}</div>
              <div>State: {wallet.state}</div>
              <div>TgUserId: {wallet.tgUserId}</div>
              <Button
                type="button"
                variant="secondary"
                disabled={revokeMutation.isPending || isLinkInProgress}
                onClick={() => void handleRevokeWallet(wallet.walletId)}
              >
                {revokeMutation.isPending ? 'Revoking...' : 'Revoke wallet'}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};
