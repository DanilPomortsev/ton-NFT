import { useMemo, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

import { useInvalidateTickets, usePrepareTicketRefund, useTickets } from '@/features/ticket/hooks';
import { useWallets } from '@/features/wallet/hooks';
import { TicketState } from '@/shared/api/generated';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Loader } from '@/shared/ui/Loader';
import { debugError, debugLog } from '@/shared/lib/debug';
import { getErrorMessage, isTonConnectUncertainSendError, makeIdempotencyKey, mapTonNetworkToChainID } from '@/shared/lib/tonconnect';

export const TicketsPage = () => {
  const ticketsQuery = useTickets();
  const walletsQuery = useWallets();
  const prepareRefundMutation = usePrepareTicketRefund();
  const invalidateTickets = useInvalidateTickets();
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();

  const [walletId, setWalletId] = useState('');
  const [refundActionKey, setRefundActionKey] = useState<string | null>(null);
  const [refundStatus, setRefundStatus] = useState<'idle' | 'preparing' | 'waiting_wallet' | 'submitted' | 'confirmed' | 'failed'>('idle');
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);
  const [refundIdempotencyKeys, setRefundIdempotencyKeys] = useState<Record<string, string>>({});

  const wallets = walletsQuery.data?.wallets ?? [];
  const selectedWallet = useMemo(() => wallets.find((wallet) => wallet.walletId === walletId) ?? null, [walletId, wallets]);
  const ownedTickets = useMemo(() => (ticketsQuery.data?.tickets ?? []).filter((ticket) => ticket.owned), [ticketsQuery.data?.tickets]);

  const getRefundIdempotencyKey = (ticketId: string) => {
    const existing = refundIdempotencyKeys[ticketId];
    if (existing) {
      return existing;
    }

    const next = makeIdempotencyKey('ticket-refund');
    setRefundIdempotencyKeys((current) => ({ ...current, [ticketId]: next }));
    return next;
  };

  const clearRefundIdempotencyKey = (ticketId: string) => {
    setRefundIdempotencyKeys((current) => {
      if (!(ticketId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[ticketId];
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

  const handleRefundTicket = async (ticketId: string) => {
    try {
      setRefundError(null);
      setRefundSuccess(null);
      setRefundActionKey(ticketId);
      setRefundStatus('preparing');

      const currentWallet = ensureSelectedWalletMatchesTonWallet();
      const idempotencyKey = getRefundIdempotencyKey(ticketId);
      const preparedRefund = await prepareRefundMutation.mutateAsync({
        idempotencyKey,
        walletId: currentWallet.walletId,
        ticketId,
      });

      debugLog('ticket-flow', 'tickets page prepare refund success', {
        ticketId,
        intentId: preparedRefund.intentId,
        idempotencyKey,
      });

      setRefundStatus('waiting_wallet');
      debugLog('ticket-flow', 'tickets page sendTransaction call', {
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

      setRefundStatus('submitted');
      await invalidateTickets();
      setRefundStatus('confirmed');
      setRefundSuccess(`Refund for ticket ${ticketId} submitted to wallet`);
      clearRefundIdempotencyKey(ticketId);
    } catch (error) {
      if (isTonConnectUncertainSendError(error)) {
        setRefundStatus('failed');
        setRefundError('Wallet SDK did not confirm delivery. The refund transaction may still have been sent.');
        await invalidateTickets();
        debugError('ticket-flow', 'tickets page refund uncertain result', error);
        return;
      }

      setRefundStatus('failed');
      setRefundError(getErrorMessage(error));
      debugError('ticket-flow', 'tickets page refund failed', { ticketId, error });
    } finally {
      setRefundActionKey(null);
    }
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Tickets</h2>
          <p className="section-copy">Owned tickets are listed here. Refund uses the selected linked wallet and TonConnect.</p>
        </div>
        <div className="actions">
          <Button type="button" variant="secondary" onClick={() => void invalidateTickets()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="tickets-page">
        <div className="tickets-sidebar">
          <label className="form-field">
            <span>Wallet for refund</span>
            <select value={walletId} onChange={(event) => setWalletId(event.target.value)} disabled={walletsQuery.isLoading}>
              <option value="">Select wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.walletId} value={wallet.walletId}>
                  {wallet.walletAddress} · {wallet.network}
                </option>
              ))}
            </select>
          </label>

          <div className="form-note">
            <div>Connected wallet: {tonWallet?.account?.address ?? 'not connected'}</div>
            <div>Selected wallet address: {selectedWallet?.walletAddress ?? 'not selected'}</div>
            <div>Selected wallet network: {selectedWallet?.network ?? 'not selected'}</div>
          </div>

          {refundError || refundSuccess ? (
            <div className="status-banner">
              <strong>Refund status:</strong> {refundStatus}
              {refundStatus === 'waiting_wallet' ? <p>Waiting for wallet confirmation in Telegram Wallet…</p> : null}
              {refundError ? <p>{refundError}</p> : null}
              {refundSuccess ? <p>{refundSuccess}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="ticket-list-card">
          {ticketsQuery.isLoading ? <Loader label="Loading tickets..." /> : null}
          {ticketsQuery.isError ? <ErrorState title="Failed to load tickets" description={ticketsQuery.error.message} /> : null}
          {ticketsQuery.data && ownedTickets.length === 0 ? (
            <EmptyState title="No owned tickets" description="Buy a ticket from the Lotteries tab first." />
          ) : null}

          {ownedTickets.length > 0 ? (
            <ul className="ticket-list">
              {ownedTickets.map((ticket) => (
                <li key={ticket.ticketId} className="ticket-card">
                  <div className="ticket-card-header">
                    <strong>{ticket.ticketId}</strong>
                    <span className="pill pill-ticket">Owned</span>
                  </div>
                  <div className="lottery-meta">Lottery ID: {ticket.lotteryId}</div>
                  <div className="lottery-stats">
                    <span>State: {ticket.state}</span>
                    <span>Price: {ticket.price} nanoTON</span>
                    <span>Buyer TgUserId: {ticket.buyerTgUserId}</span>
                  </div>
                  <div className="lottery-card-actions">
                    {ticket.state === TicketState.TicketStateRefunded || ticket.state === TicketState.TicketStateClosed ? null : (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={refundActionKey === ticket.ticketId}
                        onClick={() => void handleRefundTicket(ticket.ticketId)}
                      >
                        {refundActionKey === ticket.ticketId ? 'Preparing refund...' : 'Refund ticket'}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
};
