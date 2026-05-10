import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toNano } from '@ton/core';

import { useInvalidateLotteries, useLotteries, usePrepareLottery, usePrepareLotteryFinalization } from '@/features/lottery/hooks';
import { useInvalidateTickets, usePrepareTicket, usePrepareTicketRefund, useTickets } from '@/features/ticket/hooks';
import { useWallets } from '@/features/wallet/hooks';
import { LotteryState, TicketState } from '@/shared/api/generated';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Loader } from '@/shared/ui/Loader';
import { debugError, debugLog } from '@/shared/lib/debug';
import { getErrorMessage, isTonConnectUncertainSendError, makeIdempotencyKey, mapTonNetworkToChainID } from '@/shared/lib/tonconnect';

type CreateStatus = 'idle' | 'preparing' | 'waiting_wallet' | 'submitted' | 'confirmed' | 'failed';
type TicketActionStatus = 'idle' | 'preparing' | 'waiting_wallet' | 'submitted' | 'confirmed' | 'failed';
type LotteryActionStatus = 'idle' | 'preparing' | 'waiting_wallet' | 'submitted' | 'confirmed' | 'failed';

const DEFAULT_END_AT_HOURS = 24;

const makeDefaultEndAt = () => {
  const date = new Date(Date.now() + DEFAULT_END_AT_HOURS * 60 * 60 * 1000);
  return date.toISOString().slice(0, 16);
};

const parseTicketPriceToNano = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Ticket price is required');
  }

  const nano = toNano(trimmed);
  const asNumber = Number(nano);
  if (!Number.isSafeInteger(asNumber) || asNumber <= 0) {
    throw new Error('Ticket price is out of supported range');
  }

  return asNumber;
};

export const LotteriesPage = () => {
  const walletsQuery = useWallets();
  const lotteriesQuery = useLotteries();
  const ticketsQuery = useTickets();
  const prepareLotteryMutation = usePrepareLottery();
  const prepareLotteryFinalizationMutation = usePrepareLotteryFinalization();
  const prepareTicketMutation = usePrepareTicket();
  const prepareTicketRefundMutation = usePrepareTicketRefund();
  const invalidateLotteries = useInvalidateLotteries();
  const invalidateTickets = useInvalidateTickets();
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();

  const [walletId, setWalletID] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState('0.1');
  const [endAt, setEndAt] = useState(makeDefaultEndAt());
  const [idempotencyKey, setIdempotencyKey] = useState(() => makeIdempotencyKey('lottery'));
  const [createStatus, setCreateStatus] = useState<CreateStatus>('idle');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [ticketActionKey, setTicketActionKey] = useState<string | null>(null);
  const [ticketActionStatus, setTicketActionStatus] = useState<TicketActionStatus>('idle');
  const [ticketActionError, setTicketActionError] = useState<string | null>(null);
  const [ticketActionSuccess, setTicketActionSuccess] = useState<string | null>(null);
  const [lotteryActionKey, setLotteryActionKey] = useState<string | null>(null);
  const [lotteryActionStatus, setLotteryActionStatus] = useState<LotteryActionStatus>('idle');
  const [lotteryActionError, setLotteryActionError] = useState<string | null>(null);
  const [lotteryActionSuccess, setLotteryActionSuccess] = useState<string | null>(null);
  const [actionIdempotencyKeys, setActionIdempotencyKeys] = useState<Record<string, string>>({});

  const wallets = walletsQuery.data?.wallets ?? [];
  const lotteries = lotteriesQuery.data?.lotteries ?? [];
  const tickets = ticketsQuery.data?.tickets ?? [];

  const selectedWallet = useMemo(() => wallets.find((item) => item.walletId === walletId) ?? null, [walletId, wallets]);
  const ownedTicketByLotteryId = useMemo(
    () =>
      tickets.reduce<Record<string, (typeof tickets)[number]>>((acc, ticket) => {
        if (!ticket.owned) {
          return acc;
        }

        const existing = acc[ticket.lotteryId];
        if (!existing) {
          acc[ticket.lotteryId] = ticket;
          return acc;
        }

        // Prefer actionable (not refunded/closed) ticket when several owned records exist.
        if (
          (existing.state === TicketState.TicketStateRefunded || existing.state === TicketState.TicketStateClosed) &&
          ticket.state !== TicketState.TicketStateRefunded &&
          ticket.state !== TicketState.TicketStateClosed
        ) {
          acc[ticket.lotteryId] = ticket;
        }

        return acc;
      }, {}),
    [tickets],
  );

  const isSubmitting = createStatus === 'preparing' || createStatus === 'waiting_wallet' || createStatus === 'submitted';

  const resetCreateFlow = () => {
    setCreateStatus('idle');
    setCreateError(null);
    setCreateSuccess(null);
    setIdempotencyKey(makeIdempotencyKey('lottery'));
  };

  const getActionIdempotencyKey = (key: string, prefix: string) => {
    const existing = actionIdempotencyKeys[key];
    if (existing) {
      return existing;
    }

    const next = makeIdempotencyKey(prefix);
    setActionIdempotencyKeys((current) => ({ ...current, [key]: next }));
    return next;
  };

  const clearActionIdempotencyKey = (key: string) => {
    setActionIdempotencyKeys((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const ensureSelectedWalletMatchesTonWallet = () => {
    if (!walletId) {
      throw new Error('Select a wallet first');
    }

    if (!selectedWallet) {
      throw new Error('Selected wallet is unavailable');
    }

    if (!tonWallet) {
      throw new Error('Connect TON wallet before signing a transaction');
    }

    if (selectedWallet.walletAddress !== tonWallet.account.address) {
      throw new Error('Selected backend wallet does not match the currently connected TON wallet');
    }

    return selectedWallet;
  };

  const handleWalletChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!isSubmitting) {
      resetCreateFlow();
    }

    setWalletID(event.target.value);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isSubmitting) {
      resetCreateFlow();
    }

    setName(event.target.value);
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isSubmitting) {
      resetCreateFlow();
    }

    setDescription(event.target.value);
  };

  const handleTicketPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isSubmitting) {
      resetCreateFlow();
    }

    setTicketPrice(event.target.value);
  };

  const handleEndAtChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isSubmitting) {
      resetCreateFlow();
    }

    setEndAt(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setCreateError(null);
      setCreateSuccess(null);

      if (!walletId) {
        throw new Error('Select a wallet for lottery creation');
      }

      if (!selectedWallet) {
        throw new Error('Selected wallet is unavailable');
      }

      if (!name.trim()) {
        throw new Error('Lottery name is required');
      }

      if (!endAt) {
        throw new Error('End date is required');
      }

      const parsedEndAt = new Date(endAt);
      if (Number.isNaN(parsedEndAt.getTime())) {
        throw new Error('Invalid end date');
      }

      if (parsedEndAt.getTime() <= Date.now()) {
        throw new Error('End date must be in the future');
      }

      const parsedTicketPrice = parseTicketPriceToNano(ticketPrice);
      const currentIdempotencyKey = idempotencyKey;

      setCreateStatus('preparing');

      const preparedLottery = await prepareLotteryMutation.mutateAsync({
        idempotencyKey: currentIdempotencyKey,
        walletId,
        name: name.trim(),
        description: description.trim() || undefined,
        ticketPrice: parsedTicketPrice,
        endAt: parsedEndAt,
      });

      debugLog('lottery-flow', 'prepare success', {
        lotteryId: preparedLottery.lotteryId,
        intentId: preparedLottery.intentId,
        network: preparedLottery.network,
        idempotencyKey: currentIdempotencyKey,
      });

      if (!tonWallet) {
        throw new Error('Connect TON wallet before creating a lottery');
      }

      if (selectedWallet.walletAddress !== tonWallet.account.address) {
        throw new Error('Selected backend wallet does not match the currently connected TON wallet');
      }

      setCreateStatus('waiting_wallet');

      const sendTransactionResult = await tonConnectUI.sendTransaction({
        validUntil: preparedLottery.tx.validUntil,
        network: mapTonNetworkToChainID(preparedLottery.network),
        messages: preparedLottery.tx.messages.map((message) => ({
          address: message.address,
          amount: message.amount,
          payload: message.payload,
        })),
      });

      setCreateStatus('submitted');
      await invalidateLotteries();
      setCreateStatus('confirmed');
      setCreateSuccess(`Lottery ${preparedLottery.lotteryId} submitted to wallet`);
      setDescription('');
      setName('');
      setTicketPrice('0.1');
      setEndAt(makeDefaultEndAt());
      setIdempotencyKey(makeIdempotencyKey('lottery'));
      debugLog('lottery-flow', 'sendTransaction success', {
        lotteryId: preparedLottery.lotteryId,
        intentId: preparedLottery.intentId,
        idempotencyKey: currentIdempotencyKey,
        sendTransactionResult,
      });
    } catch (error) {
      if (isTonConnectUncertainSendError(error)) {
        setCreateStatus('confirmed');
        setCreateError(null);
        setCreateSuccess('Wallet SDK did not return delivery confirmation. If you signed in Tonkeeper, transaction status will update via polling shortly.');
        await invalidateLotteries();
        debugError('lottery-flow', 'create lottery uncertain result', error);
        return;
      }

      setCreateStatus('failed');
      setCreateError(getErrorMessage(error));
      debugError('lottery-flow', 'create lottery failed', error);
    }
  };

  const handleBuyTicket = async (lotteryId: string) => {
    const actionKey = `buy:${lotteryId}`;

    try {
      setTicketActionError(null);
      setTicketActionSuccess(null);
      setTicketActionKey(actionKey);
      setTicketActionStatus('preparing');

      const currentWallet = ensureSelectedWalletMatchesTonWallet();
      const currentIdempotencyKey = getActionIdempotencyKey(actionKey, 'ticket-buy');
      const preparedTicket = await prepareTicketMutation.mutateAsync({
        idempotencyKey: currentIdempotencyKey,
        walletId: currentWallet.walletId,
        lotteryId,
      });

      debugLog('ticket-flow', 'prepare ticket success', {
        lotteryId,
        ticketId: preparedTicket.ticketId,
        intentId: preparedTicket.intentId,
        idempotencyKey: currentIdempotencyKey,
      });

      setTicketActionStatus('waiting_wallet');
      debugLog('ticket-flow', 'buy ticket sendTransaction call', {
        lotteryId,
        ticketId: preparedTicket.ticketId,
        walletAddress: currentWallet.walletAddress,
        network: currentWallet.network,
        messages: preparedTicket.tx.messages.length,
      });

      await tonConnectUI.sendTransaction({
        validUntil: preparedTicket.tx.validUntil,
        network: mapTonNetworkToChainID(currentWallet.network),
        messages: preparedTicket.tx.messages.map((message) => ({
          address: message.address,
          amount: message.amount,
          payload: message.payload,
        })),
      });

      setTicketActionStatus('submitted');
      await invalidateTickets();
      await invalidateLotteries();
      setTicketActionStatus('confirmed');
      setTicketActionSuccess(`Ticket ${preparedTicket.ticketId} submitted to wallet`);
      clearActionIdempotencyKey(actionKey);
    } catch (error) {
      if (isTonConnectUncertainSendError(error)) {
        setTicketActionStatus('submitted');
        setTicketActionError(null);
        setTicketActionSuccess('Wallet SDK did not return delivery confirmation. If ticket purchase was signed, status will update via polling shortly.');
        await invalidateTickets();
        await invalidateLotteries();
        debugError('ticket-flow', 'buy ticket uncertain result', error);
        return;
      }

      setTicketActionStatus('failed');
      setTicketActionError(getErrorMessage(error));
      debugError('ticket-flow', 'buy ticket failed', { lotteryId, error });
    } finally {
      setTicketActionKey(null);
    }
  };

  const handleRefundTicket = async (ticketId: string) => {
    const actionKey = `refund:${ticketId}`;

    try {
      setTicketActionError(null);
      setTicketActionSuccess(null);
      setTicketActionKey(actionKey);
      setTicketActionStatus('preparing');

      const currentWallet = ensureSelectedWalletMatchesTonWallet();
      const currentIdempotencyKey = getActionIdempotencyKey(actionKey, 'ticket-refund');
      const preparedRefund = await prepareTicketRefundMutation.mutateAsync({
        idempotencyKey: currentIdempotencyKey,
        walletId: currentWallet.walletId,
        ticketId,
      });

      debugLog('ticket-flow', 'prepare refund success', {
        ticketId,
        intentId: preparedRefund.intentId,
        idempotencyKey: currentIdempotencyKey,
      });

      setTicketActionStatus('waiting_wallet');
      debugLog('ticket-flow', 'refund ticket sendTransaction call', {
        ticketId,
        walletAddress: currentWallet.walletAddress,
        network: currentWallet.network,
        messages: preparedRefund.tx.messages.length,
      });

      await tonConnectUI.sendTransaction({
        validUntil: preparedRefund.tx.validUntil,
        network: mapTonNetworkToChainID(currentWallet.network),
        messages: preparedRefund.tx.messages.map((message) => ({
          address: message.address,
          amount: message.amount,
          payload: message.payload,
        })),
      });

      setTicketActionStatus('submitted');
      await invalidateTickets();
      await invalidateLotteries();
      setTicketActionStatus('confirmed');
      setTicketActionSuccess(`Refund for ticket ${ticketId} submitted to wallet`);
      clearActionIdempotencyKey(actionKey);
    } catch (error) {
      if (isTonConnectUncertainSendError(error)) {
        setTicketActionStatus('submitted');
        setTicketActionError(null);
        setTicketActionSuccess('Wallet SDK did not return delivery confirmation. If refund was signed, status will update via polling shortly.');
        await invalidateTickets();
        await invalidateLotteries();
        debugError('ticket-flow', 'refund ticket uncertain result', error);
        return;
      }

      setTicketActionStatus('failed');
      setTicketActionError(getErrorMessage(error));
      debugError('ticket-flow', 'refund ticket failed', { ticketId, error });
    } finally {
      setTicketActionKey(null);
    }
  };

  const handleFinalizeLottery = async (lotteryId: string) => {
    const actionKey = `finalize:${lotteryId}`;

    try {
      setLotteryActionError(null);
      setLotteryActionSuccess(null);
      setLotteryActionKey(actionKey);
      setLotteryActionStatus('preparing');

      const currentWallet = ensureSelectedWalletMatchesTonWallet();
      const currentIdempotencyKey = getActionIdempotencyKey(actionKey, 'lottery-finalize');
      const preparedFinalization = await prepareLotteryFinalizationMutation.mutateAsync({
        idempotencyKey: currentIdempotencyKey,
        walletId: currentWallet.walletId,
        lotteryId,
      });

      debugLog('lottery-flow', 'prepare finalization success', {
        lotteryId,
        intentId: preparedFinalization.intentId,
        idempotencyKey: currentIdempotencyKey,
      });

      setLotteryActionStatus('waiting_wallet');
      debugLog('lottery-flow', 'finalize lottery sendTransaction call', {
        lotteryId,
        walletAddress: currentWallet.walletAddress,
        network: preparedFinalization.network,
        messages: preparedFinalization.tx.messages.length,
      });

      await tonConnectUI.sendTransaction({
        validUntil: preparedFinalization.tx.validUntil,
        network: mapTonNetworkToChainID(preparedFinalization.network),
        messages: preparedFinalization.tx.messages.map((message) => ({
          address: message.address,
          amount: message.amount,
          payload: message.payload,
        })),
      });

      setLotteryActionStatus('submitted');
      await invalidateLotteries();
      setLotteryActionStatus('confirmed');
      setLotteryActionSuccess(`Finalization for lottery ${lotteryId} submitted to wallet`);
      clearActionIdempotencyKey(actionKey);
    } catch (error) {
      if (isTonConnectUncertainSendError(error)) {
        setLotteryActionStatus('submitted');
        setLotteryActionError(null);
        setLotteryActionSuccess('Wallet SDK did not return delivery confirmation. If finalization was signed, status will update via polling shortly.');
        await invalidateLotteries();
        debugError('lottery-flow', 'finalize lottery uncertain result', error);
        return;
      }

      setLotteryActionStatus('failed');
      setLotteryActionError(getErrorMessage(error));
      debugError('lottery-flow', 'finalize lottery failed', { lotteryId, error });
    } finally {
      setLotteryActionKey(null);
    }
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Lotteries</h2>
          <p className="section-copy">Create lotteries from a linked wallet, buy tickets, and refund owned tickets from the same screen.</p>
        </div>
        <div className="actions">
          <Button type="button" variant="secondary" onClick={() => void invalidateLotteries()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="lottery-grid">
        <form className="lottery-form-card" onSubmit={handleSubmit}>
          <h3>Create lottery</h3>
          <p className="form-hint">
            Choose one of your linked wallets. The backend prepares the transaction, then TonConnect asks the wallet to sign it.
          </p>

          <label className="form-field">
            <span>Wallet</span>
            <select value={walletId} onChange={handleWalletChange} disabled={isSubmitting || walletsQuery.isLoading}>
              <option value="">Select wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.walletId} value={wallet.walletId}>
                  {wallet.walletAddress} · {wallet.network}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Name</span>
            <input value={name} onChange={handleNameChange} placeholder="Friday jackpot" maxLength={128} />
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Optional description"
              rows={4}
              maxLength={1024}
            />
          </label>

          <label className="form-field">
            <span>Ticket price, TON</span>
            <input value={ticketPrice} onChange={handleTicketPriceChange} inputMode="decimal" placeholder="0.1" />
          </label>

          <label className="form-field">
            <span>End at</span>
            <input type="datetime-local" value={endAt} onChange={handleEndAtChange} />
          </label>

          <div className="form-note">
            <div>Connected wallet: {tonWallet?.account?.address ?? 'not connected'}</div>
            <div>Selected wallet address: {selectedWallet?.walletAddress ?? 'not selected'}</div>
            <div>Selected wallet network: {selectedWallet?.network ?? 'not selected'}</div>
            <div>Current create idempotency key: {idempotencyKey}</div>
          </div>

          <div className="actions">
            <Button type="submit" disabled={isSubmitting || wallets.length === 0 || walletsQuery.isLoading}>
              {isSubmitting ? 'Processing...' : 'Prepare & Sign'}
            </Button>
          </div>

          {createStatus !== 'idle' ? (
            <div className="status-banner">
              <strong>Create status:</strong> {createStatus}
              {createError ? <p>{createError}</p> : null}
              {createSuccess ? <p>{createSuccess}</p> : null}
            </div>
          ) : null}

          {lotteryActionError || lotteryActionSuccess ? (
            <div className="status-banner">
              <strong>Lottery action:</strong> {lotteryActionStatus}
              {lotteryActionStatus === 'waiting_wallet' ? <p>Waiting for wallet confirmation in Telegram Wallet…</p> : null}
              {lotteryActionError ? <p>{lotteryActionError}</p> : null}
              {lotteryActionSuccess ? <p>{lotteryActionSuccess}</p> : null}
            </div>
          ) : null}

          {ticketActionError || ticketActionSuccess ? (
            <div className="status-banner">
              <strong>Ticket action:</strong> {ticketActionStatus}
              {ticketActionStatus === 'waiting_wallet' ? <p>Waiting for wallet confirmation in Telegram Wallet…</p> : null}
              {ticketActionError ? <p>{ticketActionError}</p> : null}
              {ticketActionSuccess ? <p>{ticketActionSuccess}</p> : null}
            </div>
          ) : null}
        </form>

        <div className="lottery-list-card">
          <div className="list-card-header">
            <h3>All lotteries</h3>
            <span className="list-meta">Polling every 5 seconds</span>
          </div>

          {lotteriesQuery.isLoading ? <Loader label="Loading lotteries..." /> : null}

          {lotteriesQuery.isError ? (
            <ErrorState
              title="Failed to load lotteries"
              description={lotteriesQuery.error.message}
              action={{ label: 'Retry', onClick: () => void invalidateLotteries() }}
            />
          ) : null}

          {lotteriesQuery.data && lotteries.length === 0 ? (
            <EmptyState title="No lotteries yet" description="Create the first lottery from one of your linked wallets." />
          ) : null}

          {lotteries.length > 0 ? (
            <ul className="lottery-list">
              {lotteries.map((lottery) => {
                const ownedTicket = ownedTicketByLotteryId[lottery.lotteryId];
                const refundKey = ownedTicket ? `refund:${ownedTicket.ticketId}` : null;
                const buyKey = `buy:${lottery.lotteryId}`;
                const finalizeKey = `finalize:${lottery.lotteryId}`;
                const isOwnedTicketNonRefundable =
                  ownedTicket?.state === TicketState.TicketStateRefunded ||
                  ownedTicket?.state === TicketState.TicketStateClosed;
                const canBuyTicket =
                  lottery.state === LotteryState.LotteryStateActive &&
                  lottery.endAt.getTime() > Date.now();
                const canFinalizeLottery =
                  lottery.owned &&
                  lottery.state === LotteryState.LotteryStateActive &&
                  lottery.endAt.getTime() < Date.now();

                return (
                  <li key={lottery.lotteryId} className="lottery-card">
                    <div className="lottery-card-header">
                      <strong>{lottery.name}</strong>
                      <div className="pill-group">
                        <span className={`pill ${lottery.owned ? 'pill-owned' : 'pill-open'}`}>
                          {lottery.owned ? 'Created by you' : 'Open'}
                        </span>
                        {ownedTicket ? <span className="pill pill-ticket">Your ticket</span> : null}
                      </div>
                    </div>
                    <div className="lottery-meta">Lottery ID: {lottery.lotteryId}</div>
                    {lottery.description ? <p className="lottery-description">{lottery.description}</p> : null}
                    <div className="lottery-stats">
                      <span>State: {lottery.state}</span>
                      <span>Ticket price: {lottery.ticketPrice} nanoTON</span>
                      <span>Creator: {lottery.creatorTgUserId}</span>
                      <span>End at: {lottery.endAt.toLocaleString()}</span>
                    </div>
                    <div className="lottery-card-actions">
                      {canFinalizeLottery ? (
                        <Button type="button" variant="secondary" disabled={lotteryActionKey === finalizeKey} onClick={() => void handleFinalizeLottery(lottery.lotteryId)}>
                          {lotteryActionKey === finalizeKey ? 'Preparing finalization...' : 'Finalize lottery'}
                        </Button>
                      ) : null}

                      {ownedTicket && !isOwnedTicketNonRefundable ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={ticketActionKey === refundKey}
                          onClick={() => void handleRefundTicket(ownedTicket.ticketId)}
                        >
                          {ticketActionKey === refundKey ? 'Preparing refund...' : 'Refund ticket'}
                        </Button>
                      ) : null}

                      {(!ownedTicket || isOwnedTicketNonRefundable) && canBuyTicket ? (
                        <Button type="button" disabled={ticketActionKey === buyKey} onClick={() => void handleBuyTicket(lottery.lotteryId)}>
                          {ticketActionKey === buyKey ? 'Preparing ticket...' : 'Buy ticket'}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
};
