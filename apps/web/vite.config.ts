import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

// Vite proxies /api and /ws to the local API (same paths nginx uses in Docker),
// so the app never needs a hard-coded API origin. `vite preview` gets the same table,
// so the production bundle can be checked locally without nginx.
const proxy: Record<string, ProxyOptions> = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/ws': {
    target: 'ws://localhost:3000',
    ws: true,
  },
  // Simulator control panel (internal service), same path as nginx in Docker.
  '/simulator': {
    target: 'http://localhost:4000',
    rewrite: (path) => path.replace(/^\/simulator/, ''),
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
});
