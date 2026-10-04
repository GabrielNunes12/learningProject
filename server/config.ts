import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

export const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
// In development PORT usually belongs to the web dev server, so the API uses API_PORT.
// In production a host like Render/Railway sets PORT for the single process.
export const port = Number(process.env.API_PORT ?? (isProd ? process.env.PORT : undefined) ?? 3001);
/** Public URL of the site, used for links in emails. */
export const appUrl = (process.env.APP_URL ?? (isProd ? `http://localhost:${port}` : 'http://localhost:5173')).replace(/\/$/, '');
export const dataDir = process.env.DATA_DIR ?? join(root, 'data');
export const distDir = join(root, 'dist');

export const smtp = process.env.SMTP_HOST
  ? {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } : undefined,
    }
  : null;
export const mailFrom = process.env.MAIL_FROM ?? 'ProjectLearn <no-reply@projectlearn.local>';

/** Without SMTP in development, emails are kept in memory and shown at /api/dev/outbox. */
export const devOutbox = !smtp && !isProd;

export const SESSION_DAYS = 30;
export const VERIFY_HOURS = 24;
export const RESET_MINUTES = 60;
