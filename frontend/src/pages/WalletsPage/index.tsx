import { TonConnectButton, useTonAddress, useTonWallet } from '@tonconnect/ui-react';

export const WalletsPage = () => {
  const tonAddress = useTonAddress();
  const tonWallet = useTonWallet();
  const connectedAddress = tonWallet?.account?.address || tonAddress;

  return (
    <section>
      <div className="section-header">
        <h2>Wallets</h2>
        <div className="actions">
          <TonConnectButton />
        </div>
      </div>

      <div className="status-banner">
        <strong>Connection:</strong> {connectedAddress ? 'connected' : 'not connected'}
        <p>Address: {connectedAddress || '—'}</p>
      </div>
    </section>
  );
};
