import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(rootDir, "frontend", "src"),
      buffer: "buffer/",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5175,  // поменял с 5173 на 5175 для согласованности
    allowedHosts: [
      'shy-schools-knock.loca.lt',
      'https://shy-schools-knock.loca.lt/',
      '.loca.lt',  // разрешить все localtunnel домены
      'localhost'
    ],
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});