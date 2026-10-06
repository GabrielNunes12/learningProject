// Pure helpers for the "order" and "buckets" mini-games: shuffling, move counting, drag layout math, hit testing.
// No runtime imports, so it can be unit tested with node:test.

/** A random number in [0, 1), like Math.random. Injectable for tests. */
export type Rand = () => number;

/** The indexes 0..n-1 in random order (Fisher–Yates). */
export function shuffledIndexes(n: number, rand: Rand = Math.random): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isIdentity = (order: readonly number[]) => order.every((v, i) => v === i);

/** A shuffled order of 0..n-1 that is never already sorted (for n ≥ 2), so there is always something to do. */
export function scrambledOrder(n: number, rand: Rand = Math.random): number[] {
  if (n < 2) return shuffledIndexes(n, rand);
  for (let tries = 0; tries < 20; tries++) {
    const order = shuffledIndexes(n, rand);
    if (!isIdentity(order)) return order;
  }
  // A rigged random source could keep returning the identity: rotate by one instead.
  return Array.from({ length: n }, (_, i) => (i + 1) % n);
}

/** A copy of `items` with the element at `from` moved to index `to`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const a = [...items];
  if (from === to || from < 0 || from >= a.length) return a;
  const [x] = a.splice(from, 1);
  a.splice(Math.max(0, Math.min(to, a.length)), 0, x);
  return a;
}

/**
 * The fewest single-card moves (pick one card up, put it anywhere) that sort `order` into 0..n-1:
 * every card outside the longest increasing subsequence has to move once, and those are enough.
 */
export function minMoves(order: readonly number[]): number {
  // Patience sorting: tails[k] is the smallest tail of an increasing subsequence of length k + 1.
  const tails: number[] = [];
  for (const v of order) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = v;
  }
  return order.length - tails.length;
}

/**
 * Where a dragged card would land. `tops` and `heights` describe every card's resting slot (list-relative, in
 * current order), `from` is the dragged card's index and `draggedTop` its current top. The card lands after
 * every other card whose middle is above the dragged card's middle.
 */
export function dragTarget(tops: readonly number[], heights: readonly number[], from: number, draggedTop: number): number {
  const middle = draggedTop + heights[from] / 2;
  let target = 0;
  for (let i = 0; i < tops.length; i++) {
    if (i !== from && tops[i] + heights[i] / 2 < middle) target++;
  }
  return target;
}

/** How far card `index` slides (px) to make room while the card at `from` hovers over slot `to`. */
export function dragShift(index: number, from: number, to: number, step: number): number {
  if (index === from) return 0;
  if (from < to && index > from && index <= to) return -step;
  if (to < from && index >= to && index < from) return step;
  return 0;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Index of the box containing (x, y), or -1. When several contain it, the one whose centre is closest wins. */
export function hitTest(boxes: readonly Box[], x: number, y: number): number {
  let best = -1;
  let bestDist = Infinity;
  boxes.forEach((b, i) => {
    if (x < b.left || x > b.left + b.width || y < b.top || y > b.top + b.height) return;
    const d = (x - (b.left + b.width / 2)) ** 2 + (y - (b.top + b.height / 2)) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

/** Milliseconds as m:ss, e.g. 83_400 → "1:23". */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Bucket-game result: the first attempt counts only if the whole deck was sorted without a single miss. */
export const isCleanRun = (sorted: number, total: number, misses: number) => sorted === total && misses === 0;
