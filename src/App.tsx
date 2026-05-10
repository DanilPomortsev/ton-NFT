import { useEffect, useMemo, useState } from "react";
import { TonConnectButton, useTonAddress, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

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
  imageUrl?: string | null;
  imageBase64?: string | null;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData?: string;
        initDataUnsafe?: {
          user?: TgUser;
        };
      };
    };
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || "";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "EQkQATdH_GVNjtgZ9npdgBV2RupyDLAgQ2O5rxHzhfN4Rm6gN0";
const TON_RPC_ENDPOINT =
  import.meta.env.VITE_TON_RPC_ENDPOINT || "https://testnet.toncenter.com/api/v2/jsonRPC";
const CLAIM_BADGE_OPCODE = 1990728166;

export function App() {
  const tonAddress = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [connectedAddress, setConnectedAddress] = useState("");
  const [hashCodeInput, setHashCodeInput] = useState("");
  const [studentBadges, setStudentBadges] = useState<StudentBadgeView[]>([]);
  const [notFoundHashes, setNotFoundHashes] = useState<string[]>([]);
  const [log, setLog] = useState("Ready");
  const address = connectedAddress || wallet?.account?.address || tonAddress;

  const tgUser = useMemo(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    return window.Telegram?.WebApp?.initDataUnsafe?.user;
  }, []);

  useEffect(() => {
    setConnectedAddress(wallet?.account?.address || tonAddress || "");
  }, [wallet, tonAddress]);

  useEffect(() => {
    tonConnectUI.connector.restoreConnection().catch(() => {
      // Connection may be absent on first app start; ignore.
    });

    const unsubscribe = tonConnectUI.onStatusChange((nextWallet) => {
      setConnectedAddress(nextWallet?.account?.address || "");
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  function parseHashCodeToBigInt(raw: string): bigint {
    const normalized = raw.trim().toLowerCase().replace(/^0x/, "");
    if (!/^[0-9a-f]+$/.test(normalized)) throw new Error("hashCode must be hex string");
    return BigInt(`0x${normalized}`);
  }

  async function claimByHashCode() {
    if (!address) throw new Error("Connect wallet first");
    const { beginCell } = await import("ton-core");
    const codeHash = parseHashCodeToBigInt(hashCodeInput);
    const payloadBoc = beginCell()
      .storeUint(CLAIM_BADGE_OPCODE, 32)
      .storeUint(0, 64)
      .storeUint(codeHash, 256)
      .endCell()
      .toBoc()
      .toString("base64");

    setLog("Sending minimal transaction to ClaimBadge...");
    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: CONTRACT_ADDRESS,
          amount: "30000000",
          payload: payloadBoc
        }
      ]
    });
    setLog("ClaimBadge transaction submitted");
  }

  async function loadMyBadges() {
    if (!address) throw new Error("Connect wallet first");
    setLog("Reading your hashCodes from contract getter...");

    const [{ TonClient }, { Address }, { AttendanceBadge }] = await Promise.all([
      import("@ton/ton"),
      import("ton-core"),
      import("../ton-contract/build/Attendance/Attendance_AttendanceBadge")
    ]);

    const client = new TonClient({ endpoint: TON_RPC_ENDPOINT });
    const contract = client.open(AttendanceBadge.fromAddress(Address.parse(CONTRACT_ADDRESS)));
    const dict = await contract.getGetAttendeesByStudent({
      $$type: "GetByStudent",
      student: Address.parse(address)
    });
    const hashCodes = [...dict.values()].map((v) => `0x${v.toString(16).padStart(64, "0")}`);

    if (hashCodes.length === 0) {
      setStudentBadges([]);
      setNotFoundHashes([]);
      setLog("No badges claimed yet");
      return;
    }

    setLog("Loading badge images from backend...");
    const res = await fetch(`${API_BASE}/api/student/badges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashCodes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load badges from backend");
    setStudentBadges((data.badges || []) as StudentBadgeView[]);
    setNotFoundHashes((data.notFound || []) as string[]);
    setLog(`Loaded ${data.badges?.length || 0} badge images`);
  }

  return (
    <main className="container">
      <h1>Proof-of-Attendance (TON)</h1>

      <section className="card">
        <h2>User profile from bot</h2>
        <div className="profile">
          {tgUser?.photo_url ? <img src={tgUser.photo_url} alt="avatar" className="avatar" /> : null}
          <div>
            <div>
              {tgUser?.first_name} {tgUser?.last_name}
            </div>
            <div>@{tgUser?.username || "unknown"}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>TON Connect</h2>
        <TonConnectButton />
        <p>Wallet: {address || "not connected"}</p>
        <p>Connection: {wallet ? "connected" : "not connected"}</p>
      </section>

      <section className="card">
        <h2>Claim by hashCode</h2>
        <input
          value={hashCodeInput}
          onChange={(e) => setHashCodeInput(e.target.value)}
          placeholder="hashCode from teacher, hex (0x...)"
        />
        <button onClick={() => claimByHashCode().catch((e) => setLog(e.message))}>Mint/Claim badge</button>
      </section>

      <section className="card">
        <h2>My badges</h2>
        <button onClick={() => loadMyBadges().catch((e) => setLog(e.message))}>Load all my badges</button>
        {studentBadges.map((b) => (
          <div key={b.hashCode} style={{ borderTop: "1px solid #2c3f72", marginTop: 10, paddingTop: 10 }}>
            <div>hashCode: {b.hashCode}</div>
            <div>badge: {b.badge}</div>
            {b.imageUrl ? <img src={b.imageUrl} alt={b.badge} className="badge-image" /> : null}
            {b.imageBase64 ? <img src={b.imageBase64} alt={b.badge} className="badge-image" /> : null}
          </div>
        ))}
        {notFoundHashes.length > 0 ? (
          <p>Images not found in backend for: {notFoundHashes.join(", ")}</p>
        ) : null}
      </section>

      <section className="card">
        <h3>Log</h3>
        <pre>{log}</pre>
      </section>
    </main>
  );
}
