import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

/** Running as a Vercel serverless function (Vercel sets VERCEL=1). */
export const onVercel = Boolean(process.env.VERCEL);
export const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
// In development PORT usually belongs to the web dev server, so the API uses API_PORT.
// `npm start` (one process serving site + API) uses PORT.
export const port = Number(process.env.API_PORT ?? (isProd ? process.env.PORT : undefined) ?? 3001);
/** Public URL of the site, used for links in emails and to decide whether cookies are Secure. */
export const appUrl = (
  process.env.APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
  (isProd ? `http://localhost:${port}` : 'http://localhost:5173')
).replace(/\/$/, '');
/** Postgres connection string. On Vercel the Neon integration sets DATABASE_URL (POSTGRES_URL on older setups). */
export const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? '';
export const distDir = join(root, 'dist');

// Email: explicit SMTP_* settings win; otherwise the Resend integration on Vercel provides RESEND_API_KEY,
// which works as the password for Resend's SMTP endpoint (user "resend").
export const smtp = process.env.SMTP_HOST
  ? {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } : undefined,
    }
  : process.env.RESEND_API_KEY
    ? { host: 'smtp.resend.com', port: 465, secure: true, auth: { user: 'resend', pass: process.env.RESEND_API_KEY } }
    : null;
export const mailFrom = process.env.MAIL_FROM ?? 'ProjectLearn <no-reply@projectlearn.local>';

/** Without SMTP in development, emails are kept in memory and shown at /api/dev/outbox. */
export const devOutbox = !smtp && !isProd;

export const SESSION_DAYS = 30;
export const VERIFY_HOURS = 24;
export const RESET_MINUTES = 60;
