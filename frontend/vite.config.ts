import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Сборка из `frontend/`: подхватываем и `frontend/.env`, и `.env` в корне репо + CI (Vercel). */
function resolveContractAddress(mode: string) {
  const local = loadEnv(mode, rootDir, '');
  const parent = loadEnv(mode, path.join(rootDir, '..'), '');
  return (
    local.VITE_CONTRACT_ADDRESS ||
    parent.VITE_CONTRACT_ADDRESS ||
    local.CONTRACT_ADDRESS ||
    parent.CONTRACT_ADDRESS ||
    process.env.VITE_CONTRACT_ADDRESS ||
    process.env.CONTRACT_ADDRESS ||
    ''
  ).trim();
}

function resolveTonRpcEndpoint(mode: string) {
  const local = loadEnv(mode, rootDir, '');
  const parent = loadEnv(mode, path.join(rootDir, '..'), '');
  return (
    local.VITE_TON_RPC_ENDPOINT ||
    parent.VITE_TON_RPC_ENDPOINT ||
    process.env.VITE_TON_RPC_ENDPOINT ||
    ''
  ).trim();
}

function resolveApiBase(mode: string) {
  const local = loadEnv(mode, rootDir, '');
  const parent = loadEnv(mode, path.join(rootDir, '..'), '');
  return (
    local.VITE_API_BASE ||
    parent.VITE_API_BASE ||
    process.env.VITE_API_BASE ||
    ''
  ).trim();
}

export default defineConfig(({ mode }) => {
  const contractAddress = resolveContractAddress(mode);
  const tonRpc = resolveTonRpcEndpoint(mode);
  const apiBase = resolveApiBase(mode);

  const devProxyTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8080';
  const defaultAllowedHosts = ['localhost', '127.0.0.1'];
  const allowedHostsFromEnv = (process.env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter((host) => host.length > 0);
  const allowedHosts = Array.from(new Set([...defaultAllowedHosts, ...allowedHostsFromEnv]));

  return {
    define: {
      global: 'globalThis',
      // Явно пробрасываем в клиент, чтобы работали корневой .env и имя CONTRACT_ADDRESS на CI.
      'import.meta.env.VITE_CONTRACT_ADDRESS': JSON.stringify(contractAddress),
      ...(tonRpc ? { 'import.meta.env.VITE_TON_RPC_ENDPOINT': JSON.stringify(tonRpc) } : {}),
      ...(apiBase ? { 'import.meta.env.VITE_API_BASE': JSON.stringify(apiBase) } : {}),
    },
    plugins: [react()],
    resolve: {
      alias: {
        // Абсолютный `/src` на Linux превращается в корень ФС и ломает билд (Vercel).
        '@': path.join(rootDir, 'src'),
        buffer: 'buffer/',
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts,
      proxy: {
        '/v1': devProxyTarget,
      },
    },
  };
});
