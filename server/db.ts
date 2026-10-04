import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { dataDir } from './config.ts';

mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, 'projectlearn.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id                INTEGER PRIMARY KEY,
    username          TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash     TEXT NOT NULL,
    email_verified_at INTEGER,
    created_at        INTEGER NOT NULL
  );

  -- Sessions, email-verification and password-reset tokens. Only a SHA-256 of each token is stored.
  CREATE TABLE IF NOT EXISTS tokens (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL CHECK (kind IN ('session', 'verify', 'reset')),
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS tokens_user ON tokens(user_id, kind);

  CREATE TABLE IF NOT EXISTS progress (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

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
