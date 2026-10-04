import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { appUrl, devOutbox, distDir, isProd, port, RESET_MINUTES, SESSION_DAYS, smtp, VERIFY_HOURS } from './config.ts';
import { db, publicUser, type UserRow } from './db.ts';
import { outbox, sendResetEmail, sendVerifyEmail } from './mail.ts';
import {
  hashPassword,
  issueToken,
  latestTokenAge,
  purgeExpired,
  rateLimited,
  revokeAll,
  revokeToken,
  userForToken,
  verifyPassword,
} from './security.ts';

const COOKIE = 'pl_session';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(express.json({ limit: '1mb' }));

// ---------- helpers ----------

class HttpError extends Error {
  status: number;
  code?: string;
  extra?: object;
  constructor(status: number, message: string, code?: string, extra?: object) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

function cookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function startSession(res: Response, userId: number) {
  const token = issueToken(userId, 'session', SESSION_DAYS * DAY);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: appUrl.startsWith('https://'),
    maxAge: SESSION_DAYS * DAY,
    path: '/',
  });
}

function currentUser(req: Request): UserRow | null {
  const token = cookies(req)[COOKIE];
  return token ? userForToken(token, 'session') : null;
}

function requireUser(req: Request): UserRow {
  const user = currentUser(req);
  if (!user) throw new HttpError(401, 'Please sign in.');
  return user;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const USERNAME = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkPassword(password: string, username: string) {
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.', 'password');
  if (password.length > 128) throw new HttpError(400, 'Password is too long (max 128).', 'password');
  if (password.toLowerCase() === username.toLowerCase()) throw new HttpError(400, "Password can't be your username.", 'password');
}

function limit(req: Request, name: string, max: number, windowMs: number) {
  if (rateLimited(`${name}:${req.ip}`, max, windowMs)) {
    throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
  }
}

// Basic CSRF defence: state-changing API calls must be JSON from our own origin.
app.use('/api', (req, _res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  if (!req.is('application/json')) return next(new HttpError(415, 'Expected JSON.'));
  const origin = req.headers.origin;
  if (origin) {
    const host = new URL(origin).host;
    if (host !== req.headers.host && host !== new URL(appUrl).host) return next(new HttpError(403, 'Cross-origin request blocked.'));
  }
  next();
});

// ---------- auth ----------

app.post('/api/auth/register', async (req, res) => {
  limit(req, 'register', 10, HOUR);
  const username = str(req.body.username);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!USERNAME.test(username)) throw new HttpError(400, 'Username: 3–20 letters, numbers or underscores.', 'username');
  if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, 'Please enter a valid email address.', 'email');
  checkPassword(password, username);
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) throw new HttpError(409, 'That username is taken.', 'username');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw new HttpError(409, 'An account with this email already exists. Try signing in.', 'email');
  }

  const hash = await hashPassword(password);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(username, email, hash, Date.now());
  const token = issueToken(Number(lastInsertRowid), 'verify', VERIFY_HOURS * HOUR);
  await sendVerifyEmail(email, username, token);
  res.status(201).json({ ok: true, email });
});

app.post('/api/auth/verify', (req, res) => {
  limit(req, 'verify', 30, HOUR);
  const token = str(req.body.token);
  const user = token ? userForToken(token, 'verify') : null;
  if (!user) throw new HttpError(400, 'This confirmation link is invalid or has expired. Request a new one.', 'token');
  db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').run(Date.now(), user.id);
  revokeAll(user.id, 'verify');
  startSession(res, user.id);
  res.json({ user: publicUser({ ...user, email_verified_at: Date.now() }) });
});

app.post('/api/auth/resend', async (req, res) => {
  limit(req, 'resend', 5, HOUR);
  const email = str(req.body.email).toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  // Same response whether or not the account exists, so this can't be used to probe emails.
  if (user && user.email_verified_at === null) {
    const age = latestTokenAge(user.id, 'verify');
    if (age === null || age > 60_000) {
      await sendVerifyEmail(user.email, user.username, issueToken(user.id, 'verify', VERIFY_HOURS * HOUR));
    }
  }
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  limit(req, 'login', 10, 15 * 60_000);
  const login = str(req.body.login);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login.toLowerCase()) as UserRow | undefined;
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, 'Wrong username/email or password.');
  }
  if (user.email_verified_at === null) {
    throw new HttpError(403, 'Please confirm your email first. Check your inbox for the link.', 'EMAIL_NOT_VERIFIED', { email: user.email });
  }
  startSession(res, user.id);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = cookies(req)[COOKIE];
  if (token) revokeToken(token);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = currentUser(req);
  res.json({ user: user ? publicUser(user) : null });
});

app.post('/api/auth/forgot', async (req, res) => {
  limit(req, 'forgot', 5, HOUR);
  const email = str(req.body.email).toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (user) {
    const age = latestTokenAge(user.id, 'reset');
    if (age === null || age > 60_000) {
      await sendResetEmail(user.email, user.username, issueToken(user.id, 'reset', RESET_MINUTES * 60_000));
    }
  }
  res.json({ ok: true });
});

app.post('/api/auth/reset', async (req, res) => {
  limit(req, 'reset', 10, HOUR);
  const token = str(req.body.token);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = token ? userForToken(token, 'reset') : null;
  if (!user) throw new HttpError(400, 'This reset link is invalid or has expired. Request a new one.', 'token');
  checkPassword(password, user.username);
  db.prepare('UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(
    await hashPassword(password),
    Date.now(), // the reset link proves they own the email
    user.id,
  );
  revokeAll(user.id, 'reset');
  revokeAll(user.id, 'session');
  res.json({ ok: true });
});

// ---------- account ----------

app.post('/api/account/password', async (req, res) => {
  const user = requireUser(req);
  limit(req, 'password', 10, HOUR);
  const current = typeof req.body.current === 'string' ? req.body.current : '';
  const next = typeof req.body.next === 'string' ? req.body.next : '';
  if (!(await verifyPassword(current, user.password_hash))) throw new HttpError(400, 'Current password is wrong.', 'current');
  checkPassword(next, user.username);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(next), user.id);
  revokeAll(user.id, 'session');
  startSession(res, user.id);
  res.json({ ok: true });
});

app.post('/api/account/delete', async (req, res) => {
  const user = requireUser(req);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!(await verifyPassword(password, user.password_hash))) throw new HttpError(400, 'Password is wrong.', 'password');
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

// ---------- progress sync ----------

app.get('/api/progress', (req, res) => {
  const user = requireUser(req);
  const row = db.prepare('SELECT data, updated_at FROM progress WHERE user_id = ?').get(user.id) as
    | { data: string; updated_at: number }
    | undefined;
  res.json({ data: row ? JSON.parse(row.data) : null, updatedAt: row?.updated_at ?? null });
});

app.put('/api/progress', (req, res) => {
  const user = requireUser(req);
  const data = req.body.data;
  if (typeof data !== 'object' || data === null || typeof data.cards !== 'object') throw new HttpError(400, 'Invalid progress data.');
  const now = Date.now();
  db.prepare(
    `INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).run(user.id, JSON.stringify(data), now);
  res.json({ ok: true, updatedAt: now });
});

// ---------- dev mailbox ----------

if (devOutbox) {
  app.get('/api/dev/outbox', (req, res) => {
    // Loopback only: this shows confirmation links, so never expose it to other machines.
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '')) {
      res.status(404).end();
      return;
    }
    res.json({ mails: outbox });
  });
}

// ---------- static site (production) ----------

if (existsSync(distDir)) {
  app.use(express.static(distDir, { index: 'index.html', maxAge: '1h' }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(distDir, 'index.html')));
}

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code, ...err.extra });
    return;
  }
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

purgeExpired();
setInterval(purgeExpired, HOUR).unref();

app.listen(port, () => {
  console.log(`ProjectLearn API on http://localhost:${port} (${isProd ? 'production' : 'development'})`);
  if (!smtp) {
    console.log(
      devOutbox
        ? '  No SMTP configured: emails appear in the app at #/dev/mailbox and in this console.'
        : '  WARNING: no SMTP configured — emails are only printed to this console. Set SMTP_* in .env.',
    );
  }
});
