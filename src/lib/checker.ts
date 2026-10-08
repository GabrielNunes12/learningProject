// The checker: "Check yourself" at the end of a lesson. True or false claims about how the lesson's ideas connect,
// built from the course's concept graph: a link as written is true; the same link reversed ("Functions builds on
// Decorators") or with an unrelated idea swapped in is false. Labels decide which claims can be reversed (only the
// ones that point one way). Pure so node:test can load it: the same seed always gives the same claims.
import type { Concept, ConceptLink } from '../types.ts';

/** Labels whose direction matters: reversing one makes the claim false. Other labels are only ever used as written. */
const REVERSIBLE = new Set([
  'builds on',
  'needs',
  'is used in',
  'is part of',
  'is a',
  'is a special case of',
  'extends',
  'causes',
  'replaces',
  'uses',
  'is checked by',
  'prevents',
  'is deepened in',
]);

/** Labels where a false claim reads most naturally when the other idea comes later (a prerequisite is never a later idea). */
const NEEDS_EARLIER = new Set(['builds on', 'needs', 'extends', 'is a special case of']);

/** One statement to judge: "<from> <link label> <to>", which is true or false. */
export interface Claim {
  /** Concept id as the statement reads. */
  from: string;
  /** Concept id as the statement reads. */
  to: string;
  /** Index into the course's links of the link the claim comes from. */
  link: number;
  truth: boolean;
  /** 'link' = as written (true); 'reversed' = from and to swapped (false); 'swapped' = `to` replaced by an unlinked idea (false). */
  kind: 'link' | 'reversed' | 'swapped';
}

/** A small deterministic generator: FNV-1a hash of the seed, then a linear congruential generator. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  next();
  return next;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Two ideas in either order: linked, whichever way the link points. */
const eitherWay = (a: string, b: string) => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);
/** One statement: "a builds on b" and "b builds on a" are different claims, so both can appear together. */
const readsAs = (c: Pick<Claim, 'from' | 'to'>) => `${c.from}\u0000${c.to}`;

/**
 * Up to `max` claims about the ideas of one lesson (about half true, the rest false), or [] when fewer than four can be
 * made. `englishLabels` holds each link's label in English, lowercased, by link index: translations change the words,
 * not the classes. `lessonOrder` lists lesson ids in course order, so "builds on" and "needs" false claims point at a
 * later idea when there is one.
 */
export function lessonClaims(
  concepts: Concept[],
  links: ConceptLink[],
  englishLabels: string[],
  lessonId: string,
  seed: string,
  max = 6,
  lessonOrder: string[] = [],
): Claim[] {
  const rand = seeded(seed);
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const order = new Map(lessonOrder.map((id, i) => [id, i]));
  const lessonIndex = (id: string) => order.get(byId.get(id)?.lesson ?? '') ?? -1;
  const labelOf = (i: number) => englishLabels[i] ?? links[i].label.trim().toLowerCase();
  const linked = new Set(links.map((l) => eitherWay(l.from, l.to)));
  const ordered = new Set(links.map((l, i) => `${l.from}\u0000${labelOf(i)}\u0000${l.to}`));

  const trues: Claim[] = [];
  const reversed: Claim[] = [];
  const swapped: Claim[] = [];
  links.forEach((l, i) => {
    const from = byId.get(l.from);
    const to = byId.get(l.to);
    // Both ends are concepts of this course, and at least one of them is in this lesson.
    if (!from || !to || l.from.includes('/') || l.to.includes('/')) return;
    if (from.lesson !== lessonId && to.lesson !== lessonId) return;
    trues.push({ from: l.from, to: l.to, link: i, truth: true, kind: 'link' });

    const label = labelOf(i);
    if (!REVERSIBLE.has(label)) return;
    if (!ordered.has(`${l.to}\u0000${label}\u0000${l.from}`)) {
      reversed.push({ from: l.to, to: l.from, link: i, truth: false, kind: 'reversed' });
    }

    // A swapped claim keeps `from` and needs a lesson idea at one end, so a link from another lesson only swaps in one of this lesson's ideas.
    const fromHere = from.lesson === lessonId;
    let pool = concepts.filter((c) => c.id !== l.from && !linked.has(eitherWay(l.from, c.id)) && (fromHere || c.lesson === lessonId));
    if (NEEDS_EARLIER.has(label)) {
      const later = pool.filter((c) => lessonIndex(c.id) > lessonIndex(l.from));
      if (later.length) pool = later;
    }
    if (pool.length) swapped.push({ from: l.from, to: pool[Math.floor(rand() * pool.length)].id, link: i, truth: false, kind: 'swapped' });
  });

  const wantTrue = Math.ceil(max / 2);
  const used = new Set<string>();
  const take = (pool: Claim[], limit: number, out: Claim[]) => {
    for (const c of pool) {
      if (out.length >= limit) break;
      const key = readsAs(c);
      if (used.has(key)) continue;
      used.add(key);
      out.push(c);
    }
  };

  // Falses alternate between reversed and swapped, so both kinds show up when the course allows it.
  const falseRound: Claim[] = [];
  const revs = shuffle(reversed, rand);
  const swaps = shuffle(swapped, rand);
  for (let i = 0; i < Math.max(revs.length, swaps.length); i++) {
    if (i < revs.length) falseRound.push(revs[i]);
    if (i < swaps.length) falseRound.push(swaps[i]);
  }
  const trueRound = shuffle(trues, rand);

  const t: Claim[] = [];
  const f: Claim[] = [];
  take(trueRound, wantTrue, t);
  take(falseRound, max - wantTrue, f);
  // A course with few false claims still gets a full set of true ones, and the reverse.
  take(trueRound, max - f.length, t);
  take(falseRound, max - t.length, f);

  if (t.length + f.length < 4) return [];
  return shuffle([...t, ...f], rand);
}
