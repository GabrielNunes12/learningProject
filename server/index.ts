// Runs the API as one long-lived process: `npm run dev` (API only, Vite serves the site)
// or `npm start` (API + the built site from dist/). On Vercel, api/index.ts is used instead.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import { app, finishApp } from './app.ts';
import { databaseUrl, devOutbox, distDir, isProd, port, smtp } from './config.ts';
import { purgeExpired } from './security.ts';

if (existsSync(distDir)) {
  app.use(express.static(distDir, { index: 'index.html', maxAge: '1h' }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(distDir, 'index.html')));
}
finishApp(app);

setInterval(() => purgeExpired().catch((err) => console.error('purge failed', err)), 3_600_000).unref();

app.listen(port, () => {
  console.log(`ProjectLearn API on http://localhost:${port} (${isProd ? 'production' : 'development'})`);
  if (!databaseUrl) console.log('  WARNING: DATABASE_URL is not set, so sign-in and sync will fail. Run `npm run db:local` (see README).');
  if (!smtp) {
    console.log(
      devOutbox
        ? '  No SMTP configured: emails appear in the app at #/dev/mailbox and in this console.'
        : '  WARNING: no SMTP configured — emails are only printed to this console. Set SMTP_* in .env.',
    );
  }
});
