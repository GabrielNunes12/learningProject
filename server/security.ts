import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { query, queryOne, type UserRow } from './db.ts';

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const N = 16384, R = 8, P = 1, KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltHex, hashHex] = stored.split('$');
  if (algo !== 'scrypt') return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: +n, r: +r, p: +p });
  return timingSafeEqual(actual, expected);
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export type TokenKind = 'session' | 'verify' | 'reset';

/** Creates a random token, stores its hash, and returns the raw token (shown to the user exactly once). */
export async function issueToken(userId: number, kind: TokenKind, ttlMs: number): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  await query('INSERT INTO tokens (token_hash, user_id, kind, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)', [
    sha256(token),
    userId,
    kind,
    now + ttlMs,
    now,
  ]);
  return token;
}

/** Returns the user a valid token belongs to, or null. */
export async function userForToken(token: string, kind: TokenKind): Promise<UserRow | null> {
  const row = await queryOne<UserRow>(
    `SELECT u.* FROM tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1 AND t.kind = $2 AND t.expires_at > $3`,
    [sha256(token), kind, Date.now()],
  );
  return row ?? null;
}

export async function revokeToken(token: string) {
  await query('DELETE FROM tokens WHERE token_hash = $1', [sha256(token)]);
}

export async function revokeAll(userId: number, kind: TokenKind) {
  await query('DELETE FROM tokens WHERE user_id = $1 AND kind = $2', [userId, kind]);
}

export async function latestTokenAge(userId: number, kind: TokenKind): Promise<number | null> {
  const row = await queryOne<{ t: number | null }>('SELECT MAX(created_at) AS t FROM tokens WHERE user_id = $1 AND kind = $2', [userId, kind]);
  return row?.t == null ? null : Date.now() - row.t;
}

/** Deletes expired tokens and finished rate-limit windows. */
export async function purgeExpired() {
  const now = Date.now();
  await query('DELETE FROM tokens WHERE expires_at <= $1', [now]);
  await query('DELETE FROM rate_limits WHERE reset_at <= $1', [now]);
}

/**
 * Fixed-window rate limiter stored in Postgres, so the limit holds across serverless instances
 * (an in-memory counter would reset on every cold start). One atomic upsert per check.
 */
export async function rateLimited(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const row = await queryOne<{ count: number }>(
    `INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, $2)
     ON CONFLICT (key) DO UPDATE SET
       count    = CASE WHEN rate_limits.reset_at <= $3 THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at <= $3 THEN $2 ELSE rate_limits.reset_at END
     RETURNING count`,
    [key, now + windowMs, now],
  );
  return (row?.count ?? 0) > max;
}
