import { useSyncExternalStore } from 'react';

// Progress lives in localStorage and, when signed in, is synced to the server (see lib/auth.ts).

export interface Card {
  /** Leitner box 1..MAX_BOX. Higher = better known = longer wait before review. */
  box: number;
  due: number;
  seen: number;
  right: number;
  /** Recent results, oldest first: "1" right, "0" wrong (at most HIST_LEN). */
  hist?: string;
  /** When it was last answered (ms). */
  last?: number;
}

export const HIST_LEN = 12;

/** A learner's own knowledge map of one course (the 3-layer canvas). */
export interface KnowledgeMap {
  /** Furthest layer reached: 1 = recalled what I know, 2 = added what I didn't, 3 = connected the dots. */
  layer: 1 | 2 | 3;
  /** Concepts recalled from memory in layer 1 (course concept ids). */
  recalled: string[];
  /** Positions of every node on the canvas: course concept ids and own note ids. */
  pos: Record<string, { x: number; y: number }>;
  /** The learner's own nodes that didn't match a course concept. */
  notes: { id: string; text: string }[];
  /** Links the learner drew between nodes. */
  links: { from: string; to: string; label?: string }[];
  /** Expert links found at the last check, out of the total. */
  score?: { found: number; total: number };
  /** Furthest layer reached per scope ("*" for the whole course, or a unit id); `layer` is the furthest across all scopes. */
  scopes?: Record<string, 1 | 2 | 3>;
  /** Concepts marked "I know this now" in layer 2, kept apart from `recalled` so the recall score stays honest. */
  learned?: string[];
  /** Expert links revealed as hints, by pair key. */
  hinted?: string[];
  updatedAt: number;
}

/** A keyword on a thinking sheet. Positions are in sheet units (SHEET_W × SHEET_H). */
export interface SheetChip {
  id: string;
  text: string;
  x: number;
  y: number;
  /** Index of the pile (column) it sits in; undefined while still in the tray. */
  pile?: number;
  /** Set in "Make it again" when an old keyword turned out wrong and was corrected. */
  fixedFrom?: string;
}

/** One pen stroke, as flat [x0, y0, x1, y1, ...] in sheet units (simplified, rounded). */
export interface SheetStroke {
  points: number[];
}

/** What is on the paper at one moment: keywords, piles and ink. */
export interface SheetDraft {
  chips: SheetChip[];
  strokes: SheetStroke[];
  /** Pile names, one per column. */
  piles: string[];
  at: number;
}

/** A redo from memory ("Make it again"). */
export interface SheetAgain {
  at: number;
  /** Keywords written from a blank page, before seeing the old sheet. */
  recalled: string[];
  /** Old keywords and anchors remembered, out of how many. */
  remembered: number;
  total: number;
  /** Old keywords the learner corrected. */
  fixed: number;
}

/**
 * Thinking on paper for one lesson (key "course/lesson") or one review/practice/quiz session
 * (key "session/<kind>/<time>"). Make it wrong → `wrong`, make it shorter → `anchors`,
 * make it again → `again` (the latest clean redo replaces `clean`).
 */
export interface Sheet {
  key: string;
  course?: string;
  lesson?: string;
  title: string;
  wrong?: SheetDraft;
  anchors?: string[];
  clean?: SheetDraft;
  again: SheetAgain[];
  /** When the next "make it again" is due; undefined for session sheets (they are not redone). */
  due?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Progress {
  completed: Record<string, number>;
  cards: Record<string, Card>;
  xp: number;
  /** XP earned per local date (YYYY-MM-DD). */
  xpByDay: Record<string, number>;
  /** Local dates with any activity, for the streak. */
  days: string[];
  quizBest: Record<string, number>;
  /** Last lesson opened, for "Continue learning". */
  last: { course: string; lesson: string; at: number } | null;
  dailyGoal: number;
  /** Knowledge maps by course id. */
  maps: Record<string, KnowledgeMap>;
  /** Thinking sheets by key ("course/lesson" or "session/<kind>/<time>"). */
  sheets: Record<string, Sheet>;
  /** Local dates on which a thinking phase was completed (the thinking streak). */
  thinkDays: string[];
  /** Active study time per course id, in ms (lessons, sessions and the knowledge map; idle time doesn't count). */
  studyMs: Record<string, number>;
  /** Bumped on every change; used to resolve sync conflicts. */
  updatedAt: number;
}

const KEY = 'projectlearn:progress:v1';
const DAY = 86_400_000;
export const MAX_BOX = 6;
/** Days until the next review, indexed by box. Box 1 = review again right away. */
export const INTERVAL_DAYS = [0, 0, 1, 3, 7, 16, 35];
/** Cards at this box or above count as "mastered". */
export const MASTERED_BOX = 4;
export const GOAL_OPTIONS = [20, 50, 100, 200];

export const emptyProgress = (): Progress => ({
  completed: {},
  cards: {},
  xp: 0,
  xpByDay: {},
  days: [],
  quizBest: {},
  last: null,
  dailyGoal: 50,
  maps: {},
  sheets: {},
  thinkDays: [],
  studyMs: {},
  updatedAt: 0,
});

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const saved = JSON.parse(raw);
    // Progress saved before per-day XP existed: credit it to the last active day.
    if (!saved.xpByDay && saved.xp > 0 && saved.days?.length) saved.xpByDay = { [saved.days[saved.days.length - 1]]: saved.xp };
    return { ...emptyProgress(), ...saved };
  } catch {
    return emptyProgress();
  }
}

let state = load();
const listeners = new Set<() => void>();

/** `local: true` marks a change made by the learner (triggers a sync upload). */
const changeListeners = new Set<(p: Progress) => void>();

function write(next: Progress, fromUser: boolean) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l());
  if (fromUser) changeListeners.forEach((l) => l(state));
}

const set = (next: Progress) => write({ ...next, updatedAt: Date.now() }, true);

/**
 * Another tab saved progress. Each tab keeps progress in memory and saves it on every change, so without this
 * two open tabs overwrite each other's work. Merge the other tab's save into memory; it is persisted on this
 * tab's next change (writing it back now could ping-pong between tabs).
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      state = mergeProgress(state, { ...emptyProgress(), ...JSON.parse(e.newValue) });
      listeners.forEach((l) => l());
    } catch {
      /* unreadable save from another tab: keep ours */
    }
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const useProgress = () => useSyncExternalStore(subscribe, () => state);
export const getProgress = () => state;
export function onUserChange(cb: (p: Progress) => void) {
  changeListeners.add(cb);
  return () => {
    changeListeners.delete(cb);
  };
}
/** Replace everything without triggering an upload (used when data comes from the server). */
export const replaceProgress = (p: Progress) => write({ ...emptyProgress(), ...p }, false);

export function dayString(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function gain(p: Progress, xp: number): Progress {
  const d = dayString();
  return {
    ...p,
    xp: p.xp + xp,
    xpByDay: { ...p.xpByDay, [d]: (p.xpByDay[d] ?? 0) + xp },
    days: p.days.includes(d) ? p.days : [...p.days, d].slice(-400),
  };
}

export const XP = { correct: 5, attempt: 1, lessonFirst: 20, lessonRepeat: 5, quizPerfect: 15, think: 5 };

export function recordAnswer(key: string, correct: boolean) {
  const prev = state.cards[key];
  const box = correct ? Math.min((prev?.box ?? 1) + 1, MAX_BOX) : 1;
  const card: Card = {
    box,
    due: Date.now() + INTERVAL_DAYS[box] * DAY,
    seen: (prev?.seen ?? 0) + 1,
    right: (prev?.right ?? 0) + (correct ? 1 : 0),
    hist: ((prev?.hist ?? '') + (correct ? '1' : '0')).slice(-HIST_LEN),
    last: Date.now(),
  };
  set(gain({ ...state, cards: { ...state.cards, [key]: card } }, correct ? XP.correct : XP.attempt));
}

/** Returns the XP awarded. */
export function completeLesson(key: string): number {
  const xp = state.completed[key] ? XP.lessonRepeat : XP.lessonFirst;
  set(gain({ ...state, completed: { ...state.completed, [key]: Date.now() } }, xp));
  return xp;
}

/**
 * Saves a thinking sheet after a completed phase, awards XP.think and marks today as a thinking day.
 * Returns the XP awarded.
 */
export function saveSheet(sheet: Sheet): number {
  const d = dayString();
  const now = Date.now();
  const sheets = { ...state.sheets, [sheet.key]: { ...sheet, updatedAt: now } };
  set({
    ...gain({ ...state, sheets: pruneSessionSheets(sheets) }, XP.think),
    thinkDays: state.thinkDays.includes(d) ? state.thinkDays : [...state.thinkDays, d].slice(-400),
  });
  return XP.think;
}

/** Session sheets (review, practice, quiz) pile up fast; keep the newest MAX_SESSION_SHEETS. Lesson sheets are kept. */
export const MAX_SESSION_SHEETS = 60;
function pruneSessionSheets(sheets: Record<string, Sheet>): Record<string, Sheet> {
  const sessions = Object.values(sheets).filter((x) => x.key.startsWith('session/'));
  if (sessions.length <= MAX_SESSION_SHEETS) return sheets;
  const drop = new Set(
    sessions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(MAX_SESSION_SHEETS)
      .map((x) => x.key),
  );
  return Object.fromEntries(Object.entries(sheets).filter(([k]) => !drop.has(k)));
}

/** Adds active study time to a course (no XP; it's what the certificate's hours are based on). */
export function addStudyTime(courseId: string, ms: number) {
  if (!courseId || !(ms > 0)) return;
  const studyMs = { ...state.studyMs, [courseId]: (state.studyMs?.[courseId] ?? 0) + Math.round(ms) };
  set({ ...state, studyMs });
}

/** Saves a course's knowledge map and returns the `updatedAt` it was stamped with. */
export function saveMap(courseId: string, map: KnowledgeMap): number {
  const updatedAt = Date.now();
  set({ ...state, maps: { ...state.maps, [courseId]: { ...map, updatedAt } } });
  return updatedAt;
}

export function openLesson(course: string, lesson: string) {
  set({ ...state, last: { course, lesson, at: Date.now() } });
}

export function recordQuiz(courseId: string, percent: number) {
  const best = Math.max(state.quizBest[courseId] ?? 0, percent);
  const next = { ...state, quizBest: { ...state.quizBest, [courseId]: best } };
  set(percent === 100 ? gain(next, XP.quizPerfect) : next);
}

export function setDailyGoal(goal: number) {
  set({ ...state, dailyGoal: goal });
}

export function resetProgress() {
  set(emptyProgress());
}

/** Clears local data without syncing (used on sign-out so the next person starts clean). */
export function clearLocal() {
  write(emptyProgress(), false);
}

// ---------- derived ----------

function runs(dayList: string[]) {
  const days = new Set(dayList);
  const step = (d: Date) => d.setDate(d.getDate() - 1);
  const d = new Date();
  if (!days.has(dayString(d))) step(d);
  let current = 0;
  while (days.has(dayString(d))) {
    current++;
    step(d);
  }
  let best = current;
  const sorted = [...days].sort();
  let run = 0;
  let prev: number | null = null;
  for (const s of sorted) {
    const t = new Date(`${s}T12:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return { current, best };
}

export const streak = (p: Progress) => runs(p.days).current;
export const bestStreak = (p: Progress) => runs(p.days).best;
/** Consecutive days with at least one thinking phase (make it wrong / shorter / again). */
export const thinkingStreak = (p: Progress) => runs(p.thinkDays ?? []).current;
export const xpToday = (p: Progress) => p.xpByDay[dayString()] ?? 0;

export function dueKeys(p: Progress, now = Date.now()): string[] {
  return Object.entries(p.cards)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([k]) => k);
}

/** Levels get progressively longer: level n starts at 50·n·(n−1) XP. */
export function levelInfo(xp: number) {
  let level = 1;
  while (50 * (level + 1) * level <= xp) level++;
  const start = 50 * level * (level - 1);
  const end = 50 * (level + 1) * level;
  return { level, start, end, into: xp - start, needed: end - start, title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] };
}
const LEVEL_TITLES = ['Curious', 'Learner', 'Explorer', 'Builder', 'Practitioner', 'Specialist', 'Expert', 'Master', 'Sage', 'Legend'];

// ---------- merge (guest progress + server progress on sign-in) ----------

export function mergeProgress(a: Progress, b: Progress): Progress {
  const completed = { ...a.completed };
  for (const [k, t] of Object.entries(b.completed)) completed[k] = Math.max(completed[k] ?? 0, t);

  const cards = { ...a.cards };
  for (const [k, c] of Object.entries(b.cards)) {
    const mine = cards[k];
    if (!mine || c.seen > mine.seen || (c.seen === mine.seen && c.due > mine.due)) cards[k] = c;
  }

  const xpByDay = { ...a.xpByDay };
  for (const [d, x] of Object.entries(b.xpByDay ?? {})) xpByDay[d] = Math.max(xpByDay[d] ?? 0, x);
  const summed = Object.values(xpByDay).reduce((s, x) => s + x, 0);

  const quizBest = { ...a.quizBest };
  for (const [k, v] of Object.entries(b.quizBest)) quizBest[k] = Math.max(quizBest[k] ?? 0, v);

  const maps = { ...(a.maps ?? {}) };
  for (const [k, m] of Object.entries(b.maps ?? {})) if (!maps[k] || m.updatedAt > maps[k].updatedAt) maps[k] = m;
  const sheets = { ...(a.sheets ?? {}) };
  for (const [k, x] of Object.entries(b.sheets ?? {})) if (!sheets[k] || x.updatedAt > sheets[k].updatedAt) sheets[k] = x;

  const newer = a.updatedAt >= b.updatedAt ? a : b;
  return {
    completed,
    cards,
    xp: Math.max(a.xp, b.xp, summed),
    xpByDay,
    days: [...new Set([...a.days, ...b.days])].sort().slice(-400),
    quizBest,
    last: (a.last?.at ?? 0) >= (b.last?.at ?? 0) ? a.last : b.last,
    dailyGoal: newer.dailyGoal,
    maps,
    sheets,
    thinkDays: [...new Set([...(a.thinkDays ?? []), ...(b.thinkDays ?? [])])].sort().slice(-400),
    // Each device only ever adds time, so the larger total is the most complete one.
    studyMs: Object.fromEntries(
      [...new Set([...Object.keys(a.studyMs ?? {}), ...Object.keys(b.studyMs ?? {})])].map((k) => [k, Math.max(a.studyMs?.[k] ?? 0, b.studyMs?.[k] ?? 0)]),
    ),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

export const hasProgress = (p: Progress) => p.xp > 0 || Object.keys(p.cards).length > 0;

// ---------- backup ----------

export function exportProgress() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `projectlearn-progress-${dayString()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importProgress(file: File) {
  const data = JSON.parse(await file.text());
  if (typeof data !== 'object' || data === null || typeof data.cards !== 'object') {
    throw new Error('That file does not look like a ProjectLearn progress export.');
  }
  set(mergeProgress(state, { ...emptyProgress(), ...data }));
}
