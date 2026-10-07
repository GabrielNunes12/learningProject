// The API as an Express app. server/index.ts runs it locally (and serves the built site);
// api/index.ts exposes it as a Vercel serverless function.
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { appUrl, devOutbox, onVercel, RESET_MINUTES, SESSION_DAYS, VERIFY_HOURS } from './config.ts';
import { publicUser, query, queryOne, UNIQUE_VIOLATION, type UserRow } from './db.ts';
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

export const app = express();
app.disable('x-powered-by');
// Behind Vercel's edge, req.ip must come from X-Forwarded-For (Vercel overwrites it with the real client address).
app.set('trust proxy', onVercel ? true : 'loopback');
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

async function startSession(res: Response, userId: number) {
  const token = await issueToken(userId, 'session', SESSION_DAYS * DAY);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: appUrl.startsWith('https://'),
    maxAge: SESSION_DAYS * DAY,
    path: '/',
  });
}

async function currentUser(req: Request): Promise<UserRow | null> {
  const token = cookies(req)[COOKIE];
  return token ? userForToken(token, 'session') : null;
}

async function requireUser(req: Request): Promise<UserRow> {
  const user = await currentUser(req);
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

async function limit(req: Request, name: string, max: number, windowMs: number) {
  if (await rateLimited(`${name}:${req.ip}`, max, windowMs)) {
    throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
  }
}

// Expired tokens and rate-limit windows are cleaned up now and then by whichever instance is serving.
// (A long-running local server also runs this hourly; serverless instances don't live that long.)
let lastPurge = 0;
app.use('/api', (_req, _res, next) => {
  if (Date.now() - lastPurge > HOUR) {
    lastPurge = Date.now();
    purgeExpired().catch((err) => console.error('purge failed', err));
  }
  next();
});

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
  await limit(req, 'register', 10, HOUR);
  const username = str(req.body.username);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!USERNAME.test(username)) throw new HttpError(400, 'Username: 3–20 letters, numbers or underscores.', 'username');
  if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, 'Please enter a valid email address.', 'email');
  checkPassword(password, username);
  if (await queryOne('SELECT 1 FROM users WHERE lower(username) = lower($1)', [username])) {
    throw new HttpError(409, 'That username is taken.', 'username');
  }
  if (await queryOne('SELECT 1 FROM users WHERE lower(email) = $1', [email])) {
    throw new HttpError(409, 'An account with this email already exists. Try signing in.', 'email');
  }

  const hash = await hashPassword(password);
  let id: number;
  try {
    const row = await queryOne<{ id: number }>(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, hash, Date.now()],
    );
    id = row!.id;
  } catch (err) {
    // Two sign-ups raced for the same name or email between the checks above and this insert.
    if ((err as { code?: string }).code === UNIQUE_VIOLATION) throw new HttpError(409, 'That username or email was just taken.', 'username');
    throw err;
  }
  await sendVerifyEmail(email, username, await issueToken(id, 'verify', VERIFY_HOURS * HOUR));
  res.status(201).json({ ok: true, email });
});

app.post('/api/auth/verify', async (req, res) => {
  await limit(req, 'verify', 30, HOUR);
  const token = str(req.body.token);
  const user = token ? await userForToken(token, 'verify') : null;
  if (!user) throw new HttpError(400, 'This confirmation link is invalid or has expired. Request a new one.', 'token');
  const now = Date.now();
  await query('UPDATE users SET email_verified_at = $1 WHERE id = $2', [now, user.id]);
  await revokeAll(user.id, 'verify');
  await startSession(res, user.id);
  res.json({ user: publicUser({ ...user, email_verified_at: now }) });
});

app.post('/api/auth/resend', async (req, res) => {
  await limit(req, 'resend', 5, HOUR);
  const email = str(req.body.email).toLowerCase();
  const user = await queryOne<UserRow>('SELECT * FROM users WHERE lower(email) = $1', [email]);
  // Same response whether or not the account exists, so this can't be used to probe emails.
  if (user && user.email_verified_at === null) {
    const age = await latestTokenAge(user.id, 'verify');
    if (age === null || age > 60_000) {
      await sendVerifyEmail(user.email, user.username, await issueToken(user.id, 'verify', VERIFY_HOURS * HOUR));
    }
  }
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  await limit(req, 'login', 10, 15 * 60_000);
  const login = str(req.body.login);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await queryOne<UserRow>('SELECT * FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1)', [login]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, 'Wrong username/email or password.');
  }
  if (user.email_verified_at === null) {
    throw new HttpError(403, 'Please confirm your email first. Check your inbox for the link.', 'EMAIL_NOT_VERIFIED', { email: user.email });
  }
  await startSession(res, user.id);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', async (req, res) => {
  const token = cookies(req)[COOKIE];
  if (token) await revokeToken(token);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  const user = await currentUser(req);
  res.json({ user: user ? publicUser(user) : null });
});

app.post('/api/auth/forgot', async (req, res) => {
  await limit(req, 'forgot', 5, HOUR);
  const email = str(req.body.email).toLowerCase();
  const user = await queryOne<UserRow>('SELECT * FROM users WHERE lower(email) = $1', [email]);
  if (user) {
    const age = await latestTokenAge(user.id, 'reset');
    if (age === null || age > 60_000) {
      await sendResetEmail(user.email, user.username, await issueToken(user.id, 'reset', RESET_MINUTES * 60_000));
    }
  }
  res.json({ ok: true });
});

app.post('/api/auth/reset', async (req, res) => {
  await limit(req, 'reset', 10, HOUR);
  const token = str(req.body.token);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = token ? await userForToken(token, 'reset') : null;
  if (!user) throw new HttpError(400, 'This reset link is invalid or has expired. Request a new one.', 'token');
  checkPassword(password, user.username);
  await query('UPDATE users SET password_hash = $1, email_verified_at = COALESCE(email_verified_at, $2) WHERE id = $3', [
    await hashPassword(password),
    Date.now(), // the reset link proves they own the email
    user.id,
  ]);
  await revokeAll(user.id, 'reset');
  await revokeAll(user.id, 'session');
  res.json({ ok: true });
});

// ---------- account ----------

app.post('/api/account/password', async (req, res) => {
  const user = await requireUser(req);
  await limit(req, 'password', 10, HOUR);
  const current = typeof req.body.current === 'string' ? req.body.current : '';
  const next = typeof req.body.next === 'string' ? req.body.next : '';
  if (!(await verifyPassword(current, user.password_hash))) throw new HttpError(400, 'Current password is wrong.', 'current');
  checkPassword(next, user.username);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(next), user.id]);
  await revokeAll(user.id, 'session');
  await startSession(res, user.id);
  res.json({ ok: true });
});

app.post('/api/account/delete', async (req, res) => {
  const user = await requireUser(req);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!(await verifyPassword(password, user.password_hash))) throw new HttpError(400, 'Password is wrong.', 'password');
  await query('DELETE FROM users WHERE id = $1', [user.id]);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

// ---------- progress sync ----------

app.get('/api/progress', async (req, res) => {
  const user = await requireUser(req);
  const row = await queryOne<{ data: unknown; updated_at: number }>('SELECT data, updated_at FROM progress WHERE user_id = $1', [user.id]);
  res.json({ data: row?.data ?? null, updatedAt: row?.updated_at ?? null });
});

app.put('/api/progress', async (req, res) => {
  const user = await requireUser(req);
  const data = req.body.data;
  if (typeof data !== 'object' || data === null || typeof data.cards !== 'object') throw new HttpError(400, 'Invalid progress data.');
  const now = Date.now();
  await query(
    `INSERT INTO progress (user_id, data, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    [user.id, JSON.stringify(data), now],
  );
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

/** Adds the API 404 and the error handler. Call last, after anything else the host mounts (e.g. the static site). */
export function finishApp(a: Express): Express {
  a.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));
  a.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
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
  return a;
}
