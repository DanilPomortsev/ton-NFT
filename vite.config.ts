import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(rootDir, 'frontend');

function envValue(mode: string, key: string): string {
  const root = loadEnv(mode, rootDir, '');
  const fe = loadEnv(mode, frontendDir, '');
  return (fe[key] || root[key] || process.env[key] || '').trim();
}

export default defineConfig(({ mode }) => {
  const contractAddress = envValue(mode, 'VITE_CONTRACT_ADDRESS') || envValue(mode, 'CONTRACT_ADDRESS');
  const tonRpc = envValue(mode, 'VITE_TON_RPC_ENDPOINT');
  const apiBase = envValue(mode, 'VITE_API_BASE');

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
      ...(contractAddress ? { 'import.meta.env.VITE_CONTRACT_ADDRESS': JSON.stringify(contractAddress) } : {}),
      ...(tonRpc ? { 'import.meta.env.VITE_TON_RPC_ENDPOINT': JSON.stringify(tonRpc) } : {}),
      ...(apiBase ? { 'import.meta.env.VITE_API_BASE': JSON.stringify(apiBase) } : {}),
    },
    resolve: {
      alias: {
        '@': path.join(frontendDir, 'src'),
        buffer: 'buffer/',
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5175,
      allowedHosts: ['localhost', '127.0.0.1', '.loca.lt'],
      proxy: {
        '/api': {
          target: process.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
