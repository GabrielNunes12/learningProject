import { useSyncExternalStore } from 'react';
import { api } from './api';
import { clearLocal, emptyProgress, getProgress, hasProgress, mergeProgress, onUserChange, replaceProgress, type Progress } from './storage';

export interface User {
  id: number;
  username: string;
  email: string;
  verified: boolean;
  createdAt: number;
}

type SyncState = 'idle' | 'saving' | 'saved' | 'offline';
interface AuthState {
  /** undefined = still checking the session. */
  user: User | null | undefined;
  sync: SyncState;
  serverAvailable: boolean;
}

let state: AuthState = { user: undefined, sync: 'idle', serverAvailable: true };
const listeners = new Set<() => void>();
const update = (patch: Partial<AuthState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const useAuth = () => useSyncExternalStore(subscribe, () => state);

// Which account the progress in localStorage belongs to (null = guest).
const OWNER_KEY = 'projectlearn:owner';
const getOwner = () => {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
};
const setOwner = (id: number | null) => {
  try {
    if (id === null) localStorage.removeItem(OWNER_KEY);
    else localStorage.setItem(OWNER_KEY, String(id));
  } catch {
    /* ignore */
  }
};

/** After a sign-in: combine guest progress with the account's saved progress. */
async function adoptAccount(user: User) {
  const owner = getOwner();
  const { data } = await api<{ data: Progress | null }>('/progress');
  const server = data ? { ...emptyProgress(), ...data } : emptyProgress();
  const local = getProgress();
  // Guest progress is merged in; progress that belonged to another account is dropped.
  const merged = owner === String(user.id) || (owner === null && hasProgress(local)) ? mergeProgress(local, server) : server;
  replaceProgress(merged);
  setOwner(user.id);
  update({ user });
  await upload();
}

export async function initAuth() {
  try {
    const { user } = await api<{ user: User | null }>('/auth/me');
    if (user) await adoptAccount(user);
    else {
      if (getOwner() !== null) {
        // Session expired or signed out elsewhere: don't leave the account's data on screen.
        clearLocal();
        setOwner(null);
      }
      update({ user: null });
    }
  } catch {
    update({ user: null, serverAvailable: false });
  }
}

export async function signIn(login: string, password: string) {
  const { user } = await api<{ user: User }>('/auth/login', { login, password });
  await adoptAccount(user);
}

export async function completeVerification(token: string) {
  const { user } = await api<{ user: User }>('/auth/verify', { token });
  await adoptAccount(user);
}

export async function signOut() {
  await flush();
  await api('/auth/logout', {}).catch(() => {});
  clearLocal();
  setOwner(null);
  update({ user: null, sync: 'idle' });
}

export async function deleteAccount(password: string) {
  await api('/account/delete', { password });
  clearLocal();
  setOwner(null);
  update({ user: null, sync: 'idle' });
}

// ---------- progress sync ----------

let timer: ReturnType<typeof setTimeout> | null = null;

async function upload() {
  if (!state.user) return;
  timer = null;
  update({ sync: 'saving' });
  try {
    await api('/progress', { data: getProgress() }, 'PUT');
    update({ sync: 'saved' });
  } catch {
    update({ sync: 'offline' });
  }
}

/** Uploads progress right away (e.g. before asking the server for a certificate that depends on it). */
export async function syncNow() {
  if (timer) clearTimeout(timer);
  timer = null;
  await upload();
}

async function flush() {
  if (timer) {
    clearTimeout(timer);
    await upload();
  }
}

onUserChange(() => {
  if (!state.user) return;
  if (timer) clearTimeout(timer);
  update({ sync: 'saving' });
  timer = setTimeout(upload, 1500);
});

window.addEventListener('pagehide', () => {
  if (timer && state.user) {
    fetch('./api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: getProgress() }),
      keepalive: true,
    });
  }
});
