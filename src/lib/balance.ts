// Pure model behind the "balance the equation" mini-game: a·x + b = c·x + d on a scale, where every move is done to
// both sides. Moves, whole-number rules, formatting and the breadth-first "par" search. Only the pure i18n core.
import { formatList, t } from '../i18n/core.ts';

/** One side of the scale: [x-coefficient, constant], always whole numbers. */
export type Side = readonly [number, number];

export interface Equation {
  left: Side;
  right: Side;
}

export type Op = '+' | '-' | '*' | '/';

/** A move done to both sides: add / subtract k (or k·x when `x`), multiply or divide by k. */
export interface Move {
  op: Op;
  k: number;
  /** Only for + and −: the amount is k·x rather than the number k. */
  x?: boolean;
}

export type MoveResult = { ok: true; eq: Equation } | { ok: false; reason: string };

/** Numbers stay readable: a move that would push any of them past this is refused. */
export const MAX_MAGNITUDE = 999;
/** The breadth-first search for par gives up beyond this many moves. */
export const PAR_DEPTH = 6;

const MINUS = '−';

/** A whole number with a real minus sign: -3 → "−3". */
export const num = (n: number) => (n < 0 ? `${MINUS}${-n}` : String(n));

/** k·x as text: 1 → "x", -1 → "−x", 3 → "3x". */
export function xTerm(k: number, v = 'x'): string {
  if (k === 1) return v;
  if (k === -1) return `${MINUS}${v}`;
  return `${num(k)}${v}`;
}

/** One side as people write it: "2x + 3", "−x − 4", "x", "5", "0". */
export function formatSide(side: Side, v = 'x'): string {
  const [a, b] = side;
  if (a === 0) return num(b);
  const head = xTerm(a, v);
  if (b === 0) return head;
  return `${head} ${b < 0 ? MINUS : '+'} ${Math.abs(b)}`;
}

export const formatEquation = (eq: Equation, v = 'x') => `${formatSide(eq.left, v)} = ${formatSide(eq.right, v)}`;

/** The amount of a move as text: "3", "2x", "x", "−1". */
export const moveAmount = (m: Move, v = 'x') => (m.x ? xTerm(m.k, v) : num(m.k));

/** A negative amount gets brackets after an operator: "× (−1)". */
const bracketed = (m: Move, v: string) => (m.k < 0 ? `(${moveAmount(m, v)})` : moveAmount(m, v));

/** "− 3 from both sides", "+ 2x to both sides", "× (−1) on both sides", "÷ 2 on both sides". */
export function describeMove(m: Move, v = 'x'): string {
  const amount = bracketed(m, v);
  switch (m.op) {
    case '+':
      return t('games.balance.move.add', { amount });
    case '-':
      return t('games.balance.move.subtract', { amount });
    case '*':
      return t('games.balance.move.multiply', { amount });
    case '/':
      return t('games.balance.move.divide', { amount });
  }
}

/** A compact label for history arrows: "−3", "+2x", "×(−1)", "÷2". */
export function shortMove(m: Move, v = 'x'): string {
  const sym = m.op === '+' ? '+' : m.op === '-' ? MINUS : m.op === '*' ? '×' : '÷';
  return `${sym}${bracketed(m, v)}`;
}

/** The move written into the equation before simplifying: "2x + 3 − 3 = 9 − 3", "(2x) ÷ 2 = (6) ÷ 2". */
export function previewMove(eq: Equation, m: Move, v = 'x'): string {
  const amount = bracketed(m, v);
  const one = (side: Side) => {
    const s = formatSide(side, v);
    if (m.op === '+' || m.op === '-') return `${s} ${m.op === '+' ? '+' : MINUS} ${amount}`;
    const wrapped = side[0] !== 0 && side[1] !== 0 ? `(${s})` : s;
    return `${wrapped} ${m.op === '*' ? '×' : '÷'} ${amount}`;
  };
  return `${one(eq.left)} = ${one(eq.right)}`;
}

/** Do `m` to both sides, or explain (kindly) why that move isn't allowed here. */
export function applyMove(eq: Equation, m: Move, v = 'x'): MoveResult {
  const { op, k } = m;
  if (!Number.isInteger(k)) return { ok: false, reason: t('games.balance.reason.wholeNumbers') };
  if (m.x && (op === '*' || op === '/')) {
    return { ok: false, reason: t('games.balance.reason.noVarMultiply', { v }) };
  }
  let left: [number, number] = [eq.left[0], eq.left[1]];
  let right: [number, number] = [eq.right[0], eq.right[1]];
  switch (op) {
    case '+':
    case '-': {
      if (k === 0) return { ok: false, reason: t(op === '+' ? 'games.balance.reason.addZero' : 'games.balance.reason.subtractZero') };
      const d = op === '+' ? k : -k;
      const i = m.x ? 0 : 1;
      left[i] += d;
      right[i] += d;
      break;
    }
    case '*': {
      if (k === 0) return { ok: false, reason: t('games.balance.reason.multiplyZero', { v }) };
      if (k === 1) return { ok: false, reason: t('games.balance.reason.multiplyOne') };
      left = [left[0] * k, left[1] * k];
      right = [right[0] * k, right[1] * k];
      break;
    }
    case '/': {
      if (k === 0) return { ok: false, reason: t('games.balance.reason.divideZero') };
      if (k === 1) return { ok: false, reason: t('games.balance.reason.divideOne') };
      const stuck = [left[0], left[1], right[0], right[1]].filter((n) => n % k !== 0);
      if (stuck.length) {
        const numbers = formatList([...new Set(stuck.map(Math.abs))].map(String));
        // Loose numbers sitting next to the x-term are what usually blocks a clean division.
        const looseBesideX = (left[0] !== 0 && left[1] !== 0) || (right[0] !== 0 && right[1] !== 0);
        const msg = looseBesideX ? 'games.balance.reason.fractionsMoveFirst' : 'games.balance.reason.fractionsTryCommon';
        return { ok: false, reason: t(msg, { k: num(k), numbers, v }) };
      }
      left = [left[0] / k, left[1] / k];
      right = [right[0] / k, right[1] / k];
      break;
    }
  }
  // -0 → 0, so formatting and equality checks behave.
  left = [left[0] + 0, left[1] + 0];
  right = [right[0] + 0, right[1] + 0];
  if ([...left, ...right].some((n) => Math.abs(n) > MAX_MAGNITUDE)) {
    return { ok: false, reason: t('games.balance.reason.tooBig') };
  }
  return { ok: true, eq: { left, right } };
}

const alone = (p: Side, q: Side) => p[0] === 1 && p[1] === 0 && q[0] === 0;

/** Solved: one side is exactly 1·x and the other side has no x. */
export const isSolved = (eq: Equation) => alone(eq.left, eq.right) || alone(eq.right, eq.left);

/** The value of x once solved, or null. */
export function solvedValue(eq: Equation): number | null {
  if (alone(eq.left, eq.right)) return eq.right[1];
  if (alone(eq.right, eq.left)) return eq.left[1];
  return null;
}

/** Which side holds the lone x once solved. */
export const solvedSide = (eq: Equation): 'left' | 'right' | null =>
  alone(eq.left, eq.right) ? 'left' : alone(eq.right, eq.left) ? 'right' : null;

/** Undo whatever is on a side: subtract a positive amount, add a negative one. */
const cancel = (k: number, x: boolean): Move => (k > 0 ? { op: '-', k, x } : { op: '+', k: -k, x });

/** The moves worth trying from here: cancel any constant or x-term, divide by an x-coefficient, flip the signs. */
export function sensibleMoves(eq: Equation): Move[] {
  const out: Move[] = [];
  const seen = new Set<string>();
  const add = (m: Move) => {
    const key = `${m.op}${m.k}${m.x ? 'x' : ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  };
  for (const side of [eq.left, eq.right]) {
    if (side[1] !== 0) add(cancel(side[1], false));
    if (side[0] !== 0) add(cancel(side[0], true));
  }
  for (const side of [eq.left, eq.right]) {
    if (side[0] !== 0 && side[0] !== 1) add({ op: '/', k: side[0] });
  }
  add({ op: '*', k: -1 });
  return out;
}

const key = (eq: Equation) => `${eq.left[0]},${eq.left[1]}|${eq.right[0]},${eq.right[1]}`;

/** The shortest sequence of sensible moves that leaves x alone (breadth-first), or null past the depth cap. */
export function solve(start: Equation, maxDepth = PAR_DEPTH): Move[] | null {
  if (isSolved(start)) return [];
  const seen = new Set([key(start)]);
  let frontier: { eq: Equation; path: Move[] }[] = [{ eq: start, path: [] }];
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { eq, path } of frontier) {
      for (const m of sensibleMoves(eq)) {
        const r = applyMove(eq, m);
        if (!r.ok) continue;
        const k = key(r.eq);
        if (seen.has(k)) continue;
        seen.add(k);
        const p = [...path, m];
        if (isSolved(r.eq)) return p;
        next.push({ eq: r.eq, path: p });
      }
    }
    frontier = next;
  }
  return null;
}

/** Par: the fewest moves that solve it, or null if the search gives up. */
export function minMoves(start: Equation, maxDepth = PAR_DEPTH): number | null {
  return solve(start, maxDepth)?.length ?? null;
}

/** ★★★ at or under par, ★★ within two extra moves, ★ otherwise. */
export const starsFor = (moves: number, par: number): 1 | 2 | 3 => (moves <= par ? 3 : moves <= par + 2 ? 2 : 1);

/**
 * Quick-pick amounts for the operation pad, from the numbers on the scale right now.
 * + and −: each constant and x-term present (as positive amounts). ×: −1. ÷: each x-coefficient other than 1, and −1.
 */
export function quickAmounts(eq: Equation, op: Op): Move[] {
  const out: Move[] = [];
  const seen = new Set<string>();
  const add = (k: number, x = false) => {
    const id = `${k}${x ? 'x' : ''}`;
    if (k === 0 || seen.has(id)) return;
    seen.add(id);
    out.push({ op, k, x });
  };
  const sides = [eq.left, eq.right];
  if (op === '+' || op === '-') {
    for (const s of sides) add(Math.abs(s[1]));
    for (const s of sides) add(Math.abs(s[0]), true);
  } else if (op === '*') {
    add(-1);
  } else {
    for (const s of sides) if (s[0] !== 1) add(s[0]);
    add(-1);
  }
  return out;
}

/** What a pan holds, in pieces to draw: x-tiles and unit weights; negatives are balloons that pull up. */
export interface PanGroup {
  kind: 'x' | 'unit';
  negative: boolean;
  count: number;
  /** Too many to draw one by one: show a single stacked piece with "×count". */
  stacked: boolean;
}

/** Above this many pieces of one kind, a pan shows a compact "×17" stack instead. */
export const STACK_OVER = 12;

export function panGroups(side: Side): PanGroup[] {
  const groups: PanGroup[] = [];
  const push = (kind: 'x' | 'unit', n: number) => {
    if (n !== 0) groups.push({ kind, negative: n < 0, count: Math.abs(n), stacked: Math.abs(n) > STACK_OVER });
  };
  push('x', side[0]);
  push('unit', side[1]);
  return groups;
}
