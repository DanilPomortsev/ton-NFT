import { useEffect, useMemo, useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { debugError, debugLog } from '@/shared/lib/debug';

type TgUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type StudentBadgeView = {
  hashCode: string;
  badge: string;
};

type UiLogLevel = 'info' | 'success' | 'error';

type UiLogEntry = {
  ts: string;
  level: UiLogLevel;
  stage: string;
  message: string;
  details?: unknown;
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

const API_BASE = import.meta.env.VITE_API_BASE || '';
const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || 'kQATdH_GVNjtgZ9npdgBV2RupyDLAgQ2O5rxHzhfN4Rm6gN0').trim();
const TON_RPC_ENDPOINT = import.meta.env.VITE_TON_RPC_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC';
const CLAIM_BADGE_OPCODE = 1990728166;

const mapTonNetworkToChainID = (network?: string): '-239' | '-3' => {
  if (network === '-239' || network?.toLowerCase() === 'mainnet') {
    return '-239';
  }
  return '-3';
};

export const HomePage = () => {
  const tonAddress = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [connectedAddress, setConnectedAddress] = useState('');
  const [hashCodeInput, setHashCodeInput] = useState('');
  const [studentBadges, setStudentBadges] = useState<StudentBadgeView[]>([]);
  const [log, setLog] = useState('Ready');
  const [traceLogs, setTraceLogs] = useState<UiLogEntry[]>([]);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'preparing' | 'waiting_wallet' | 'submitted' | 'failed'>('idle');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const address = wallet?.account?.address || tonAddress || connectedAddress;

  const pushLog = (level: UiLogLevel, stage: string, message: string, details?: unknown) => {
    const ts = new Date().toISOString();
    setLog(`[${stage}] ${message}`);
    setTraceLogs((prev) => [...prev.slice(-79), { ts, level, stage, message, details }]);

    if (level === 'error') {
      debugError(stage, message, details);
      return;
    }
    debugLog(stage, message, details);
  };

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

  useEffect(() => {
    pushLog('info', 'boot', 'HomePage initialized', {
      hasWallet: Boolean(wallet),
      tonAddress,
      connectedAddress,
      contractAddress: CONTRACT_ADDRESS,
      rpc: TON_RPC_ENDPOINT,
      apiBase: API_BASE || '(disabled for badges flow)',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function parseHashCodeToBigInt(raw: string): bigint {
    const normalized = raw.trim().toLowerCase().replace(/^0x/, '');
    if (!/^[0-9a-f]+$/.test(normalized)) {
      throw new Error('hashCode must be hex string');
    }
    return BigInt(`0x${normalized}`);
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

  async function parseStudentAddressOrThrow() {
    const candidates = [
      wallet?.account?.address,
      tonAddress,
      connectedAddress,
    ]
      .map((value) => (value || '').trim())
      .filter((value) => value.length > 0);

    if (candidates.length === 0) {
      throw new Error('Connect wallet first');
    }

    const { Address } = await import('@ton/core');
    for (const candidate of candidates) {
      try {
        return Address.parse(candidate);
      } catch {
        // Try next candidate.
      }
    }

    throw new Error(`Wallet address is invalid. Got: ${candidates.join(' | ')}`);
  }

  async function claimByHashCode() {
    if (!address) {
      throw new Error('Connect wallet first');
    }

    setClaimStatus('preparing');
    setClaimError(null);
    setClaimSuccess(null);
    pushLog('info', 'claim', 'Preparing claim payload', {
      hashCodeInput,
      walletAddress: address,
    });

    const [{ beginCell }, contractAddress] = await Promise.all([
      import('@ton/core'),
      parseAddressOrThrow(CONTRACT_ADDRESS, 'VITE_CONTRACT_ADDRESS'),
    ]);
    const codeHash = parseHashCodeToBigInt(hashCodeInput);
    const payloadBoc = beginCell()
      .storeUint(CLAIM_BADGE_OPCODE, 32)
      .storeUint(0, 64)
      .storeUint(codeHash, 256)
      .endCell()
      .toBoc()
      .toString('base64');

    const preparedClaimTx = {
      validUntil: Math.floor(Date.now() / 1000) + 300,
      network: mapTonNetworkToChainID(wallet?.account?.chain),
      messages: [
        {
          address: contractAddress.toString(),
          amount: '30000000',
          payload: payloadBoc,
        },
      ],
    };

    setLog('Sending transaction to ClaimBadge...');
    setClaimStatus('waiting_wallet');
    pushLog('info', 'claim', 'Sending transaction to wallet', {
      contractAddress: contractAddress.toString(),
      amount: '30000000',
      opcode: CLAIM_BADGE_OPCODE,
      network: preparedClaimTx.network,
    });
    await tonConnectUI.sendTransaction({
      validUntil: preparedClaimTx.validUntil,
      network: preparedClaimTx.network,
      messages: preparedClaimTx.messages.map((message) => ({
        address: message.address,
        amount: message.amount,
        payload: message.payload,
      })),
    });
    setClaimStatus('submitted');
    setClaimSuccess('Claim transaction submitted to wallet');
    pushLog('success', 'claim', 'ClaimBadge transaction submitted');
  }

  async function loadMyBadges() {
    if (!address) {
      throw new Error('Connect wallet first');
    }

    setLoadStatus('loading');
    setLoadError(null);
    pushLog('info', 'badges', 'Reading your hashCodes from contract');

    const [{ TonClient }, { TupleBuilder, beginCell, Dictionary, Cell }, contractAddress, studentAddress] = await Promise.all([
      import('@ton/ton'),
      import('@ton/core'),
      parseAddressOrThrow(CONTRACT_ADDRESS, 'VITE_CONTRACT_ADDRESS'),
      parseStudentAddressOrThrow(),
    ]);
    const [{ loadAttendanceBadge$Data }] = await Promise.all([import('./Attendance_AttendanceBadge')]);

    const client = new TonClient({ endpoint: TON_RPC_ENDPOINT });
    const argsAddress = new TupleBuilder();
    argsAddress.writeAddress(studentAddress);
    const preparedGetterCall: { label: string; method: string; args: any[] } = {
      label: 'address-arg',
      method: 'getAttendeesByStudent',
      args: argsAddress.build(),
    };

    function readDictCell(reader: any): any {
      if (!reader || typeof reader.remaining !== 'number' || reader.remaining <= 0) {
        return null;
      }
      const top = reader.peek?.();
      if (!top || !top.type) {
        throw new Error('Unexpected getter stack format');
      }
      if (top.type === 'null') {
        reader.readCellOpt();
        return null;
      }
      if (top.type === 'cell') {
        return reader.readCell();
      }
      if (top.type === 'tuple') {
        return readDictCell(reader.readTuple());
      }
      if (top.type === 'slice') {
        return reader.readCell();
      }
      throw new Error(`Unsupported getter result type: ${top.type}`);
    }

    const executePreparedGetterCalls = async () => {
      let values: bigint[] | null = null;
      const variantErrors: string[] = [];

      try {
        const result = await client.runMethod(contractAddress, preparedGetterCall.method, preparedGetterCall.args);
        const dictCell = readDictCell(result.stack);
        const dict = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(256), dictCell);
        values = [...dict.values()];
        pushLog('success', 'badges/getter', 'Getter call succeeded', {
          variant: preparedGetterCall.label,
          method: preparedGetterCall.method,
          count: values.length,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        variantErrors.push(`${preparedGetterCall.label}: ${message}`);
        pushLog('info', 'badges/getter', 'Getter variant failed', {
          variant: preparedGetterCall.label,
          method: preparedGetterCall.method,
          message,
        });
      }

      return { values, variantErrors };
    };

    const { values: getterValues, variantErrors } = await executePreparedGetterCalls();
    let values: bigint[] | null = getterValues;
    if (values === null) {
      pushLog('info', 'badges/fallback', 'All getter variants failed, reading contract storage', variantErrors);
      try {
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        let state: any = null;
        let lastStateError: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            state = await Promise.race([
              client.getContractState(contractAddress),
              new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout while reading contract state')), 12000)),
            ]);
            break;
          } catch (stateError) {
            lastStateError = stateError;
            pushLog('info', 'badges/fallback', 'State read attempt failed', { attempt, error: String(stateError) });
            if (attempt < 3) {
              await sleep(500 * attempt);
            }
          }
        }

        if (!state) {
          throw lastStateError || new Error('Cannot read contract state');
        }
        if (state.state !== 'active' || !state.data) {
          throw new Error('Contract is not active on selected network. Check VITE_CONTRACT_ADDRESS and VITE_TON_RPC_ENDPOINT');
        }

        let dataCell: any;
        if (typeof state.data === 'string') {
          dataCell = Cell.fromBoc(Buffer.from(state.data, 'base64'))[0];
        } else if (state.data instanceof Uint8Array) {
          dataCell = Cell.fromBoc(state.data)[0];
        } else if (Array.isArray(state.data)) {
          dataCell = state.data[0];
        } else {
          dataCell = state.data;
        }

        const data = loadAttendanceBadge$Data(dataCell.beginParse());
        values = [...data.records.values()]
          .filter((record) => record.student.equals(studentAddress))
          .map((record) => record.badge);
        pushLog('success', 'badges/fallback', 'Loaded badges from storage fallback', {
          totalRecords: data.records.size,
          matched: values.length,
        });
      } catch (fallbackError) {
        setLoadStatus('failed');
        throw fallbackError;
      }
    }

    const hashCodes = values.map((v) => `0x${v.toString(16).padStart(64, '0')}`);

    if (hashCodes.length === 0) {
      setStudentBadges([]);
      setLoadStatus('success');
      pushLog('info', 'badges', 'No badges claimed yet');
      return;
    }
    setStudentBadges(
      hashCodes.map((hashCode, index) => ({
        hashCode,
        badge: values[index].toString(),
      })),
    );
    setLoadStatus('success');
    pushLog('success', 'badges', `Loaded ${hashCodes.length} on-chain badges`);
  }

  async function handleClaimClick() {
    try {
      await claimByHashCode();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setClaimStatus('failed');
      setClaimError(message);
      pushLog('error', 'claim', message, e);
    }
  }

  async function handleLoadBadgesClick() {
    try {
      await loadMyBadges();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLoadStatus('failed');
      setLoadError(message);
      pushLog('error', 'badges', message, e);
    }
  }

  function clearTraceLogs() {
    setTraceLogs([]);
    setLog('Ready');
    pushLog('info', 'logs', 'Logs cleared');
  }

  async function copyTraceLogs() {
    const payload = traceLogs
      .map((entry) => {
        const details = entry.details === undefined ? '' : ` | ${JSON.stringify(entry.details)}`;
        return `[${entry.ts}] [${entry.level}] [${entry.stage}] ${entry.message}${details}`;
      })
      .join('\n');
    await navigator.clipboard.writeText(payload);
    pushLog('success', 'logs', 'Logs copied to clipboard', { lines: traceLogs.length });
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
      </div>

      <div className="card">
        <h3>Claim by hashCode</h3>
        <input
          value={hashCodeInput}
          onChange={(e) => setHashCodeInput(e.target.value)}
          placeholder="hashCode from teacher, hex (0x...)"
        />
        <button onClick={handleClaimClick}>Mint/Claim badge</button>
        <p>Status: {claimStatus}</p>
        {claimError ? <p>{claimError}</p> : null}
        {claimSuccess ? <p>{claimSuccess}</p> : null}
      </div>

      <div className="card">
        <h3>My badges</h3>
        <button onClick={handleLoadBadgesClick}>Load all my badges</button>
        <p>Status: {loadStatus}</p>
        {loadError ? <p>{loadError}</p> : null}
        {studentBadges.map((b) => (
          <div key={b.hashCode} style={{ borderTop: '1px solid #2c3f72', marginTop: 10, paddingTop: 10 }}>
            <div>hashCode: {b.hashCode}</div>
            <div>badge: {b.badge}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Log</h3>
        <pre>{log}</pre>
        <div className="log-controls">
          <button type="button" onClick={clearTraceLogs}>Clear logs</button>
          <button type="button" onClick={() => copyTraceLogs().catch((e) => pushLog('error', 'logs', 'Cannot copy logs', e))}>
            Copy logs
          </button>
        </div>
        <div className="trace-log">
          {traceLogs.length === 0 ? (
            <div className="trace-log-empty">No trace entries yet</div>
          ) : (
            traceLogs.slice().reverse().map((entry, index) => (
              <div key={`${entry.ts}-${entry.stage}-${index}`} className={`trace-item trace-${entry.level}`}>
                <div className="trace-meta">
                  <span>{entry.ts}</span>
                  <span>{entry.stage}</span>
                </div>
                <div>{entry.message}</div>
                {entry.details !== undefined ? <pre>{JSON.stringify(entry.details, null, 2)}</pre> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
