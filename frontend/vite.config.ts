import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "ton-core": "@ton/core"
    }
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