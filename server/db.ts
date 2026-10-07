import pg from 'pg';
import { databaseUrl, onVercel } from './config.ts';

// BIGINT columns hold millisecond timestamps and ids, all well inside Number's safe range; pg returns them as strings by default.
pg.types.setTypeParser(pg.types.builtins.INT8, Number);

// Serverless instances each hold their own pool, so keep it small there; Neon's pooled URL fans in the rest.
const pool = new pg.Pool({ connectionString: databaseUrl, max: onVercel ? 3 : 10, idleTimeoutMillis: 10_000 });

// The advisory lock stops two cold starts from creating the same tables at once.
const SCHEMA = `
  BEGIN;
  SELECT pg_advisory_xact_lock(7240311);

  CREATE TABLE IF NOT EXISTS users (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username          TEXT NOT NULL,
    email             TEXT NOT NULL,
    password_hash     TEXT NOT NULL,
    email_verified_at BIGINT,
    created_at        BIGINT NOT NULL
  );
  -- Usernames and emails are unique regardless of case.
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_ci ON users (lower(username));
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_ci ON users (lower(email));

  -- Sessions, email-verification and password-reset tokens. Only a SHA-256 of each token is stored.
  CREATE TABLE IF NOT EXISTS tokens (
    token_hash TEXT PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL CHECK (kind IN ('session', 'verify', 'reset')),
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS tokens_user ON tokens (user_id, kind);

  CREATE TABLE IF NOT EXISTS progress (
    user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       JSONB NOT NULL,
    updated_at BIGINT NOT NULL
  );

  -- Fixed-window rate limits, shared by every server instance.
  CREATE TABLE IF NOT EXISTS rate_limits (
    key      TEXT PRIMARY KEY,
    count    INTEGER NOT NULL,
    reset_at BIGINT NOT NULL
  );

  -- Course certificates. One per learner and course; re-issuing updates the name and hours but keeps the id.
  CREATE TABLE IF NOT EXISTS certificates (
    id           TEXT PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id    TEXT NOT NULL,
    course_title TEXT NOT NULL,
    color        TEXT NOT NULL,
    name         TEXT NOT NULL,
    minutes      INTEGER NOT NULL,
    lessons      INTEGER NOT NULL,
    issued_at    BIGINT NOT NULL,
    updated_at   BIGINT NOT NULL,
    UNIQUE (user_id, course_id)
  );

  COMMIT;
`;

let ready: Promise<void> | null = null;

/** Creates the tables on first use in each process (cheap no-ops once they exist). */
function ensureSchema(): Promise<void> {
  if (!databaseUrl) {
    return Promise.reject(new Error('DATABASE_URL is not set. See "Database" in README.md.'));
  }
  ready ??= pool.query(SCHEMA).then(
    () => undefined,
    (err) => {
      ready = null; // let the next request retry
      throw err;
    },
  );
  return ready;
}

/** Runs one statement and returns its rows. Use $1, $2… placeholders. */
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

/** First row of a statement, or undefined. */
export async function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await query<T>(sql, params))[0];
}

/** Postgres error code for a unique-constraint violation (e.g. two sign-ups racing for one username). */
export const UNIQUE_VIOLATION = '23505';

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  email_verified_at: number | null;
  created_at: number;
}

export const publicUser = (u: UserRow) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  verified: u.email_verified_at !== null,
  createdAt: u.created_at,
});
