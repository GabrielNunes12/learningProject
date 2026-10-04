import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db, type UserRow } from './db.ts';

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
export function issueToken(userId: number, kind: TokenKind, ttlMs: number): string {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare('INSERT INTO tokens (token_hash, user_id, kind, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
    sha256(token),
    userId,
    kind,
    now + ttlMs,
    now,
  );
  return token;
}

/** Returns the user a valid token belongs to, or null. */
export function userForToken(token: string, kind: TokenKind): UserRow | null {
  const row = db
    .prepare(
      `SELECT u.* FROM tokens t JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ? AND t.kind = ? AND t.expires_at > ?`,
    )
    .get(sha256(token), kind, Date.now()) as UserRow | undefined;
  return row ?? null;
}

export function revokeToken(token: string) {
  db.prepare('DELETE FROM tokens WHERE token_hash = ?').run(sha256(token));
}

export function revokeAll(userId: number, kind: TokenKind) {
  db.prepare('DELETE FROM tokens WHERE user_id = ? AND kind = ?').run(userId, kind);
}

export function latestTokenAge(userId: number, kind: TokenKind): number | null {
  const row = db.prepare('SELECT MAX(created_at) AS t FROM tokens WHERE user_id = ? AND kind = ?').get(userId, kind) as { t: number | null };
  return row.t === null ? null : Date.now() - row.t;
}

export function purgeExpired() {
  db.prepare('DELETE FROM tokens WHERE expires_at <= ?').run(Date.now());
}

/** Tiny fixed-window rate limiter, in memory. */
const hits = new Map<string, { count: number; resetAt: number }>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  h.count++;
  return h.count > max;
}
