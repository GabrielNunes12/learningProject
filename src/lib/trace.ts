// Pure logic for the "trace the code" mini-game: reading printed values, spotting what changed between frames,
// and the stepping/asking state machine. No runtime imports, so it's easy to test.
import type { TraceFrame } from '../types';

// ---------- printed values ----------

export type TraceValue =
  | { kind: 'list'; items: string[] }
  | { kind: 'dict'; entries: [string, string][] }
  | { kind: 'text'; text: string };

const OPEN: Record<string, string> = { '[': ']', '{': '}', '(': ')' };

/**
 * Splits on `sep` only at the top level: commas inside quotes or nested brackets don't count.
 * Returns null when brackets or quotes are unbalanced.
 */
export function splitTopLevel(s: string, sep: string | ((ch: string) => boolean)): string[] | null {
  const isSep = typeof sep === 'string' ? (ch: string) => ch === sep : sep;
  const parts: string[] = [];
  const stack: string[] = [];
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (OPEN[ch]) {
      stack.push(OPEN[ch]);
    } else if (ch === ']' || ch === '}' || ch === ')') {
      if (stack.pop() !== ch) return null;
    } else if (stack.length === 0 && isSep(ch)) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  if (quote || stack.length) return null;
  parts.push(s.slice(start));
  return parts;
}

/**
 * How to draw a printed value: "[3, 1, 2]" as a list of boxes, "{'a': 1}" (Python) or "{a=1}" (Kotlin/Java maps)
 * as key → value pairs, anything else as plain text.
 */
export function parseTraceValue(raw: string): TraceValue {
  const v = raw.trim();
  const inner = v.slice(1, -1).trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    if (inner === '') return { kind: 'list', items: [] };
    const items = splitTopLevel(inner, ',');
    if (items) return { kind: 'list', items: items.map((x) => x.trim()) };
  }
  if (v.startsWith('{') && v.endsWith('}')) {
    if (inner === '') return { kind: 'dict', entries: [] };
    const parts = splitTopLevel(inner, ',');
    if (parts) {
      const entries: [string, string][] = [];
      for (const part of parts) {
        const kv = splitTopLevel(part, (ch) => ch === ':' || ch === '=');
        if (!kv || kv.length < 2) return { kind: 'text', text: v }; // a set like {1, 2}
        // Everything after the first top-level ":" or "=" is the value.
        entries.push([kv[0].trim(), part.slice(kv[0].length + 1).trim()]);
      }
      return { kind: 'dict', entries };
    }
  }
  return { kind: 'text', text: v };
}

/** Variables that are new or have a different value than in the previous frame. */
export function changedVars(prev: Record<string, string> | undefined, cur: Record<string, string>): Set<string> {
  const out = new Set<string>();
  for (const [k, v] of Object.entries(cur)) if (prev?.[k] !== v) out.add(k);
  return out;
}

/** Per list position: is this item new or different from the same position before? */
export function changedItems(prev: string | undefined, cur: string): boolean[] {
  const now = parseTraceValue(cur);
  if (now.kind !== 'list') return [];
  const before = prev === undefined ? null : parseTraceValue(prev);
  const old = before?.kind === 'list' ? before.items : null;
  return now.items.map((item, i) => old === null || old[i] !== item);
}

// ---------- stepping and asking ----------

/** right: first try · retried: right after a miss · missed: revealed (gave up, or wrong in test mode). */
export type AskOutcome = 'right' | 'retried' | 'missed';

export interface TraceState {
  /** Index of the frame being shown; -1 = nothing has run yet. */
  pos: number;
  /** The furthest frame revealed so far. Anything up to here can be revisited freely. */
  reached: number;
  /** The frame whose `ask` value the learner is predicting, or null. */
  asking: number | null;
  /** Wrong attempts per ask frame (kept if the learner steps back and returns). */
  tries: Record<number, number>;
  outcomes: Record<number, AskOutcome>;
}

export const initialTrace: TraceState = { pos: -1, reached: -1, asking: null, tries: {}, outcomes: {} };

export type TraceAction =
  | { type: 'forward' }
  | { type: 'back' }
  | { type: 'seek'; to: number }
  | { type: 'answer'; ok: boolean; test: boolean }
  | { type: 'reveal' };

type Frames = readonly Pick<TraceFrame, 'ask'>[];

function resolve(s: TraceState, outcome: AskOutcome): TraceState {
  if (s.asking === null) return s;
  const i = s.asking;
  return { ...s, pos: i, reached: Math.max(s.reached, i), asking: null, outcomes: { ...s.outcomes, [i]: outcome } };
}

export function traceStep(s: TraceState, a: TraceAction, frames: Frames): TraceState {
  const last = frames.length - 1;
  switch (a.type) {
    case 'forward': {
      if (s.asking !== null || s.pos >= last) return s;
      if (s.pos < s.reached) return { ...s, pos: s.pos + 1 };
      const next = s.reached + 1;
      if (frames[next].ask) return { ...s, asking: next };
      return { ...s, pos: next, reached: next };
    }
    case 'back':
      if (s.asking !== null) return { ...s, asking: null };
      return s.pos > -1 ? { ...s, pos: s.pos - 1 } : s;
    case 'seek': {
      const to = Math.max(-1, Math.min(s.reached, a.to));
      return to === s.pos && s.asking === null ? s : { ...s, pos: to, asking: null };
    }
    case 'answer': {
      if (s.asking === null) return s;
      const tries = s.tries[s.asking] ?? 0;
      if (a.ok) return resolve(s, tries > 0 ? 'retried' : 'right');
      if (a.test) return resolve({ ...s, tries: { ...s.tries, [s.asking]: tries + 1 } }, 'missed');
      return { ...s, tries: { ...s.tries, [s.asking]: tries + 1 } };
    }
    case 'reveal':
      return resolve(s, 'missed');
  }
}

/** The frame on screen: the one being predicted, else the current one (-1 = none). */
export const shownFrame = (s: TraceState) => s.asking ?? s.pos;

/** The learner has revealed every frame. */
export const traceFinished = (s: TraceState, frames: Frames) => s.reached === frames.length - 1 && s.asking === null;

export const allFirstTriesRight = (s: TraceState, frames: Frames) =>
  frames.every((f, i) => !f.ask || s.outcomes[i] === 'right');

/**
 * While predicting, hide the asked variable and everything else that changed on that line,
 * so another name for the same list can't give the answer away.
 */
export function hiddenVars(frames: readonly TraceFrame[], s: TraceState): Set<string> {
  if (s.asking === null) return new Set();
  const f = frames[s.asking];
  const hidden = changedVars(frames[s.asking - 1]?.vars, f.vars);
  if (f.ask) hidden.add(f.ask);
  return hidden;
}
