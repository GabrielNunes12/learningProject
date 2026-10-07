import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built site run from any folder or sub-path.
// In development, /api calls are forwarded to the Node server (server/index.ts) on port 3001.
// API_PORT lets a second checkout run its own API next to another one (default 3001).
const API = `http://localhost:${process.env.API_PORT ?? 3001}`;

export default defineConfig({
  base: './',
  plugins: [react()],
  // Course content is bundled into the app; ~180 KB gzipped is fine.
  build: { chunkSizeWarningLimit: 1500 },
  server: {
    // /c/<id> is the shareable certificate link, served by the API (a card for social networks).
    proxy: { '/api': API, '^/c/[^/]+$': API },
    // The local Postgres (data/pg) writes constantly; Vercel's build output isn't source either.
    watch: { ignored: ['**/data/**', '**/.vercel/**'] },
  },
});
