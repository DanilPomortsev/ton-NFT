import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { PropsWithChildren } from 'react';
import { debugLog } from '@/shared/lib/debug';

const getManifestUrl = () => {
  const envManifestUrl = import.meta.env.VITE_TONCONNECT_MANIFEST_URL;

  if (typeof window !== 'undefined') {
    const originManifestURL = `${window.location.origin}/tonconnect-manifest.json`;

    if (!envManifestUrl) {
      return originManifestURL;
    }

    const isLocalhostManifest =
      envManifestUrl.includes('localhost') || envManifestUrl.includes('127.0.0.1');
    const isPublicOrigin =
      !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

    // If app is opened via public host (e.g. ngrok) and env still points to localhost,
    // force manifest URL to current origin to avoid TonConnect handshake issues.
    if (isLocalhostManifest && isPublicOrigin) {
      return originManifestURL;
    }

    return envManifestUrl;
  }

  return envManifestUrl;
};

const getTwaReturnUrl = () => {
  return import.meta.env.VITE_TONCONNECT_TWA_RETURN_URL || undefined;
};

export const TonConnectProvider = ({ children }: PropsWithChildren) => {
  const manifestUrl = getManifestUrl();
  const twaReturnUrl = getTwaReturnUrl();

  debugLog('tonconnect-provider', 'init', {
    envManifestUrl: import.meta.env.VITE_TONCONNECT_MANIFEST_URL,
    manifestUrl,
    twaReturnUrl,
  });

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={twaReturnUrl ? { twaReturnUrl } : undefined}
    >
      {children}
    </TonConnectUIProvider>
  );
};
