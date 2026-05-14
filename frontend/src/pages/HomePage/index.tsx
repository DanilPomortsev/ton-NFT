import { useEffect, useMemo, useRef, useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

import { buildClaimByCodePayload } from '@/lib/badgeBoard';

type TgUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type StudentBadgeView = {
  /** On-chain badge id (ключ словаря из getter `badges`). */
  badgeId: string;
  hashCode?: string;
  badge?: string;
  /** Полный URL картинки на бэкенде: `/api/badge/on-chain/{badgeId}/image`. */
  imageUrl?: string | null;
  imageBase64?: string | null;
  imageLoadError?: boolean;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe?: {
          user?: TgUser;
        };
      };
    };
  }
}

/** Testnet BadgeBoard; при необходимости переопредели через `VITE_CONTRACT_ADDRESS`. */
const DEFAULT_BADGEBOARD_ADDRESS = 'kQCcYs0QZhNgP5dsbbUbmTdkXhk_rjCjljcguuL9qcchdtaE';

const CONTRACT_ADDRESS = (
  (import.meta.env.VITE_CONTRACT_ADDRESS && String(import.meta.env.VITE_CONTRACT_ADDRESS).trim()) ||
  DEFAULT_BADGEBOARD_ADDRESS
).trim();
const TON_RPC_ENDPOINT = import.meta.env.VITE_TON_RPC_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC';

/** База Kotlin API (без завершающего `/`). Пример: `https://….onrender.com` или `http://127.0.0.1:8080`. */
const API_BASE = String(import.meta.env.VITE_API_BASE || '')
  .trim()
  .replace(/\/$/, '');

function chainBadgeImageUrl(badgeId: string): string {
  const path = `/api/badge/on-chain/${encodeURIComponent(badgeId)}/image`;
  if (!API_BASE) {
    return path;
  }
  return `${API_BASE}${path}`;
}

/**
 * В TWA/WebView иногда приходит второй `error` после успешного `load` (abort/lazy/decode).
 * Не считаем бейдж «битым», если картинка уже успела отрисоваться.
 */
function ChainBadgeImage({
  badgeId,
  src,
  onBroken,
}: {
  badgeId: string;
  src: string;
  onBroken: (badgeId: string) => void;
}) {
  const loadedOk = useRef(false);

  return (
    <img
      src={src}
      alt={`badge ${badgeId}`}
      className="badge-image"
      decoding="async"
      onLoad={() => {
        loadedOk.current = true;
      }}
      onError={() => {
        if (loadedOk.current) {
          return;
        }
        onBroken(badgeId);
      }}
    />
  );
}

export const HomePage = () => {
  const tonAddress = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [connectedAddress, setConnectedAddress] = useState('');
  const [hashCodeInput, setHashCodeInput] = useState('');
  const [studentBadges, setStudentBadges] = useState<StudentBadgeView[]>([]);
  const [log, setLog] = useState('Ready');
  const address = connectedAddress || wallet?.account?.address || tonAddress;

  const tgUser = useMemo(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    return window.Telegram?.WebApp?.initDataUnsafe?.user;
  }, []);

  useEffect(() => {
    setConnectedAddress(wallet?.account?.address || tonAddress || '');
  }, [wallet, tonAddress]);

  useEffect(() => {
    tonConnectUI.connector.restoreConnection().catch(() => {
      // Ignore when there is no previous connection.
    });

    const unsubscribe = tonConnectUI.onStatusChange((nextWallet) => {
      setConnectedAddress(nextWallet?.account?.address || '');
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  function parseHashCodeInput(raw: string): bigint {
    const t = raw.trim();
    if (!t) {
      throw new Error('hashCode is required');
    }
    if (/^0x[0-9a-f]+$/i.test(t)) {
      return BigInt(t);
    }
    if (/^[0-9]+$/.test(t)) {
      return BigInt(t);
    }
    if (/^[0-9a-f]+$/i.test(t)) {
      return BigInt(`0x${t}`);
    }
    throw new Error('hashCode: use decimal (e.g. 424242) or hex with 0x prefix');
  }

  async function parseAddressOrThrow(value: string, label: string) {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error(`${label} is not configured`);
    }

    const { Address } = await import('@ton/core');
    try {
      return Address.parse(normalized);
    } catch {
      throw new Error(`${label} is invalid: ${normalized}`);
    }
  }

  async function claimByHashCode() {
    if (!address) {
      throw new Error('Connect wallet first');
    }
    const contractAddress = await parseAddressOrThrow(CONTRACT_ADDRESS, 'BadgeBoard contract');
    const hashCode = parseHashCodeInput(hashCodeInput);
    const body = buildClaimByCodePayload(hashCode);
    const payloadBoc = body.toBoc({ idx: false }).toString('base64');

    setLog('Sending ClaimByCode…');
    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: contractAddress.toString({ urlSafe: true, bounceable: true, testOnly: true }),
          amount: '60000000',
          payload: payloadBoc,
        },
      ],
    });
    setLog('ClaimByCode transaction submitted');
  }

  async function loadMyBadges() {
    if (!address) {
      throw new Error('Connect wallet first');
    }
    setLog('Reading badge ids from contract (getter badges)…');

    const [{ TonClient }, { Address, Dictionary, TupleBuilder }, contractAddress] = await Promise.all([
      import('@ton/ton'),
      import('@ton/core'),
      parseAddressOrThrow(CONTRACT_ADDRESS, 'BadgeBoard contract'),
    ]);

    const client = new TonClient({ endpoint: TON_RPC_ENDPOINT });
    const studentAddress = Address.parse(address);
    const args = new TupleBuilder();
    args.writeAddress(studentAddress);

    const { stack } = await client.callGetMethod(contractAddress, 'badges', args.build());
    const dictCell = stack.readCellOpt();
    const dict = dictCell
      ? Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool(), dictCell.beginParse())
      : Dictionary.empty(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool());

    const badgeIds = [...dict.keys()].filter((k) => dict.get(k)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    if (badgeIds.length === 0) {
      setStudentBadges([]);
      setLog('No badges on-chain yet for this wallet');
      return;
    }

    setStudentBadges(
      badgeIds.map((id) => {
        const idStr = id.toString();
        return {
          badgeId: idStr,
          badge: idStr,
          imageUrl: chainBadgeImageUrl(idStr),
          imageLoadError: false,
        };
      }),
    );
    setLog(
      `Loaded ${badgeIds.length} badge id(s) from chain (getter badges)` +
        (API_BASE ? '' : ' — задай VITE_API_BASE, иначе превью укажет на origin и может не открыться.'),
    );
  }

  return (
    <section>
      <h2>NFT Badges for Students</h2>

      <div className="card">
        <h3>User profile from bot</h3>
        <div className="profile">
          {tgUser?.photo_url ? <img src={tgUser.photo_url} alt="avatar" className="avatar" /> : null}
          <div>
            <div>
              {tgUser?.first_name} {tgUser?.last_name}
            </div>
            <div>@{tgUser?.username || 'unknown'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>TON Connect</h3>
        <TonConnectButton />
        <p>Wallet: {address || 'not connected'}</p>
        <p>Connection: {wallet ? 'connected' : 'not connected'}</p>
        <p>Contract: {CONTRACT_ADDRESS}</p>
      </div>

      <div className="card">
        <h3>Claim by code (BadgeBoard)</h3>
        <p className="hint">Введи тот же hashCode, который преподаватель записал в контракт (число или 0x…).</p>
        <input
          value={hashCodeInput}
          onChange={(e) => setHashCodeInput(e.target.value)}
          placeholder="hashCode (decimal or 0x hex)"
        />
        <button onClick={() => claimByHashCode().catch((e) => setLog(String(e?.message || e)))}>Claim badge</button>
      </div>

      <div className="card">
        <h3>My badges</h3>
        <p className="hint">
          Список id из контракта (<code>badges</code>); картинка с бэкенда по{' '}
          <code>/api/badge/on-chain/&lt;id&gt;/image</code> (тот же id, что при upload с{' '}
          <code>badgeIdOnChain</code>).
        </p>
        <button onClick={() => loadMyBadges().catch((e) => setLog(String(e?.message || e)))}>Load from chain</button>
        {studentBadges.map((b) => (
          <div key={b.badgeId} style={{ borderTop: '1px solid #2c3f72', marginTop: 10, paddingTop: 10 }}>
            <div>badgeId: {b.badgeId}</div>
            {b.hashCode ? <div>hashCode: {b.hashCode}</div> : null}
            {b.badge ? <div>label: {b.badge}</div> : null}
            {b.imageUrl && !b.imageLoadError ? (
              <ChainBadgeImage
                badgeId={b.badgeId}
                src={b.imageUrl}
                onBroken={(id) => {
                  setStudentBadges((prev) =>
                    prev.map((row) => (row.badgeId === id ? { ...row, imageLoadError: true } : row)),
                  );
                }}
              />
            ) : null}
            {b.imageUrl && b.imageLoadError ? (
              <div className="hint" style={{ marginTop: 6 }}>
                Нет картинки на бэкенде для id {b.badgeId} (404 или другой хост). Проверь upload с тем же{' '}
                <code>badgeIdOnChain</code> и <code>VITE_API_BASE</code>.
              </div>
            ) : null}
            {b.imageBase64 ? <img src={b.imageBase64} alt={b.badgeId} className="badge-image" /> : null}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Log</h3>
        <pre>{log}</pre>
      </div>
    </section>
  );
};
