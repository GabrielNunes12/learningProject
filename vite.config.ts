import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built site run from any folder or sub-path.
// In development, /api calls are forwarded to the Node server (server/index.ts) on port 3001.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Course content is bundled into the app; ~180 KB gzipped is fine.
  build: { chunkSizeWarningLimit: 1500 },
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
});
