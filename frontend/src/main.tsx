import React from "react";
import ReactDOM from "react-dom/client";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { App } from "./App";
import "./styles.css";

function resolveManifestUrl() {
  const fromEnv = (import.meta.env.VITE_TONCONNECT_MANIFEST_URL || "").trim();
  // Use env only when it is an explicit HTTPS URL and not placeholder.
  if (fromEnv && fromEnv.startsWith("https://") && !fromEnv.includes("your-domain.com")) {
    return fromEnv;
  }
  // Stable public manifest fallback that always works for TonConnect.
  return "https://raw.githubusercontent.com/ton-org/blueprint/main/tonconnect/manifest.json";
}

const manifestUrl = resolveManifestUrl();
const twaReturnUrl =
  (import.meta.env.VITE_TWA_RETURN_URL || "").trim() ||
  ((window as any)?.Telegram?.WebApp ? window.location.href : "");

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={twaReturnUrl ? { twaReturnUrl } : undefined}
    >
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
);
