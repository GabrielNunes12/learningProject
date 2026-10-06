// Pure logic for the dice simulator: exact distributions, exact target probabilities, a roller and the
// running hit-rate series. No runtime imports so it can be tested with node:test.

/**
 * Exact number of ways to reach every total when rolling `dice` fair dice with `sides` sides.
 * Index = total (0 … dice × sides); totals below `dice` are 0. The counts sum to sides^dice.
 */
export function totalCounts(dice: number, sides: number): number[] {
  let ways = [1]; // zero dice: one way to make total 0
  for (let d = 0; d < dice; d++) {
    const next = new Array<number>(ways.length + sides).fill(0);
    ways.forEach((w, t) => {
      if (!w) return;
      for (let f = 1; f <= sides; f++) next[t + f] += w;
    });
    ways = next;
  }
  return ways.slice(0, dice * sides + 1);
}

/** Every total that can come up, smallest first. */
export function totalsRange(dice: number, sides: number): number[] {
  const out: number[] = [];
  for (let t = dice; t <= dice * sides; t++) out.push(t);
  return out;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export interface Exact {
  /** Favourable outcomes (ordered rolls that hit a target total). */
  hits: number;
  /** All equally likely ordered outcomes: sides^dice. */
  outcomes: number;
  /** hits/outcomes in lowest terms. */
  num: number;
  den: number;
  /** hits/outcomes as a number. */
  p: number;
}

/** Exact probability that the total lands on one of `target` (duplicates and unreachable totals ignored). */
export function exactProbability(dice: number, sides: number, target: number[]): Exact {
  const counts = totalCounts(dice, sides);
  const hits = [...new Set(target)].reduce((s, t) => s + (t >= dice && t < counts.length ? counts[t] : 0), 0);
  const outcomes = sides ** dice;
  const g = gcd(hits, outcomes) || 1;
  return { hits, outcomes, num: hits / g, den: outcomes / g, p: hits / outcomes };
}

/** "6/36 = 1/6 ≈ 16.7%" (the reduced form only when it differs). */
export function exactLabel(e: Exact): string {
  const raw = `${e.hits}/${e.outcomes}`;
  const reduced = e.num === e.hits ? '' : ` = ${e.num}/${e.den}`;
  return `${raw}${reduced} ≈ ${pct(e.p)}`;
}

/** 0.16667 → "16.7%"; tiny non-zero values keep two decimals. */
export function pct(p: number): string {
  const v = p * 100;
  if (v !== 0 && Math.abs(v) < 1) return `${v.toFixed(2)}%`;
  return `${v.toFixed(1)}%`;
}

/** A function returning floats in [0, 1). */
export type Rng = () => number;

/** Deterministic generator (mulberry32) for tests; without a seed the simulator uses Math.random. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed?: number): Rng {
  return seed === undefined ? Math.random : seededRng(seed);
}

/** One roll: the face of each die (1 … sides). */
export function rollFaces(dice: number, sides: number, rng: Rng): number[] {
  const faces: number[] = [];
  for (let d = 0; d < dice; d++) faces.push(1 + Math.floor(rng() * sides));
  return faces;
}

/** A point on the running hit-rate line: after `rolls` rolls, `rate` of them were hits. */
export interface RatePoint {
  rolls: number;
  rate: number;
}

export interface DiceState {
  /** Observed count per total (index = total). */
  counts: number[];
  rolls: number;
  hits: number;
  /** Faces of the most recent roll. */
  last: number[];
  /** Running hit rate, thinned to at most MAX_POINTS points. */
  series: RatePoint[];
}

export const MAX_POINTS = 400;

export function emptyState(dice: number, sides: number): DiceState {
  return { counts: new Array<number>(dice * sides + 1).fill(0), rolls: 0, hits: 0, last: [], series: [] };
}

/**
 * Roll `times` more times and return the new state (the input is not modified).
 * Small batches record a rate point after every roll; big ones about 100 points per batch.
 */
export function rollBatch(state: DiceState, dice: number, sides: number, target: number[], times: number, rng: Rng): DiceState {
  const hit = new Set(target);
  const counts = state.counts.slice();
  let { rolls, hits } = state;
  let last = state.last;
  const series = state.series.slice();
  const every = Math.max(1, Math.ceil(times / 100));
  for (let i = 0; i < times; i++) {
    last = rollFaces(dice, sides, rng);
    const total = last.reduce((s, f) => s + f, 0);
    counts[total]++;
    rolls++;
    if (hit.has(total)) hits++;
    if ((i + 1) % every === 0 || i === times - 1) series.push({ rolls, rate: hits / rolls });
  }
  return { counts, rolls, hits, last, series: thin(series, MAX_POINTS) };
}

/** Keeps the line light: while there are more than `max` points, drop every other one (always keeping the first and last). */
export function thin(points: RatePoint[], max: number): RatePoint[] {
  let out = points;
  while (out.length > max) {
    const lastPoint = out[out.length - 1];
    out = out.filter((_, i) => i % 2 === 0);
    if (out[out.length - 1] !== lastPoint) out.push(lastPoint);
  }
  return out;
}
