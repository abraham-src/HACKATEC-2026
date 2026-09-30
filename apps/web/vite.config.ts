import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In dev, Vite proxies /api and /ws to the local API (same paths nginx uses in Docker),
// so the app never needs a hard-coded API origin.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
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
    },
  },
});
