import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { toCatalog } from './src/content/catalog.ts';

// `import x from './topics/python.json?catalog'` gives the course without its step bodies (src/content/catalog.ts).
function courseCatalog(): Plugin {
  return {
    name: 'course-catalog',
    enforce: 'pre',
    load(id) {
      const [file, query = ''] = id.split('?');
      if (!new URLSearchParams(query).has('catalog')) return null;
      this.addWatchFile(file);
      let entry;
      try {
        entry = toCatalog(JSON.parse(readFileSync(file, 'utf8')));
      } catch (e) {
        this.error(`${file}: invalid JSON — ${(e as Error).message}`);
      }
      // JSON.parse of a string literal is faster to start up than an equally large object literal.
      return { code: `export default JSON.parse(${JSON.stringify(JSON.stringify(entry))});`, moduleType: 'js' };
    },
  };
}

// base './' lets the built site run from any folder or sub-path.
// In development, /api calls are forwarded to the Node server (server/index.ts) on port 3001.
export default defineConfig({
  base: './',
  plugins: [courseCatalog(), react()],
  // The main chunk carries only the course catalog; each course's lessons are a chunk of their own.
  build: { chunkSizeWarningLimit: 1500 },
  server: {
    // /c/<id> is the shareable certificate link, served by the API (a card for social networks).
    proxy: { '/api': 'http://localhost:3001', '^/c/[^/]+$': 'http://localhost:3001' },
    // The local Postgres (data/pg) writes constantly; Vercel's build output isn't source either.
    watch: { ignored: ['**/data/**', '**/.vercel/**'] },
  },
});
