import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devProxyTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8080';
const defaultAllowedHosts = ['localhost', '127.0.0.1'];
const allowedHostsFromEnv = (process.env.VITE_ALLOWED_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter((host) => host.length > 0);
const allowedHosts = Array.from(new Set([...defaultAllowedHosts, ...allowedHostsFromEnv]));

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
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
});
