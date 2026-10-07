// Logic for the 3-layer knowledge-map canvas (KnowledgeMap.tsx). Pure: no DOM, no runtime imports.
//
// Layer 1: recall concepts from memory (forgiving matching against labels and aliases).
// Layer 2: reveal the concepts in scope that weren't recalled ("islands").
// Layer 3: connect the dots, then compare the learner's links with the course's expert links.
//
// One map is stored per course. A "scope" is the whole course (ALL) or one unit; a scope shows the course
// concepts taught in it, plus the notes written while that scope was open (note ids carry their scope).

import type { Concept, ConceptLink } from '../types.ts';
import type { KnowledgeMap } from './storage.ts';

export const ALL = '*';
export type Layer = 1 | 2 | 3;

/** The saved map. Its per-scope fields (`scopes`, `learned`, `hinted`) are optional, so older maps simply lack them. */
export type MapState = KnowledgeMap;

export interface Pos {
  x: number;
  y: number;
}

/** The parts of a course the map needs (a loaded Course satisfies this). */
export interface MapCourse {
  id: string;
  concepts?: Concept[];
  links?: ConceptLink[];
  units: { id: string; lessons: { id: string }[] }[];
}

export const emptyMap = (): MapState => ({ layer: 1, recalled: [], pos: {}, notes: [], links: [], updatedAt: 0 });

/** Fills in fields an older or partial saved map may lack. */
export function normalizeMap(m: Partial<MapState> | undefined): MapState {
  const e = emptyMap();
  if (!m) return e;
  return {
    ...e,
    ...m,
    recalled: Array.isArray(m.recalled) ? m.recalled : [],
    pos: m.pos && typeof m.pos === 'object' ? m.pos : {},
    notes: Array.isArray(m.notes) ? m.notes : [],
    links: Array.isArray(m.links) ? m.links : [],
  };
}

// ---------- matching ----------

/** Lowercase, no accents or punctuation, single spaces. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** A deliberately small stemmer: plurals and -ing/-ed, applied the same way to both sides. */
export function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && /(s|x|z|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  return w;
}

const words = (s: string) => normalize(s).split(' ').filter(Boolean).map(stem);

/** Edit distance with adjacent transpositions counting as one edit (optimal string alignment). */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

/** Typos allowed for a term of this many letters: none for short terms, then one per five letters (max 3). */
export const typoBudget = (len: number) => (len < 5 ? 0 : Math.min(3, Math.floor(len / 5)));

export type MatchKind = 'exact' | 'typo' | 'partial';
export interface Match {
  id: string;
  kind: MatchKind;
  /** The label or alias that matched. */
  term: string;
}

/**
 * Finds the concept a free-recall entry most likely names, or null.
 * Case, spacing, punctuation and simple plurals don't matter; small typos are forgiven relative to length;
 * an entry may name whole words of a multi-word label ("loops" for "Looping over items", typos forgiven from 5 letters),
 * an entry of 5+ letters may be any part of a multi-word label ("comprehen" for "List comprehension"),
 * and an entry may contain a whole label ("python list comprehensions").
 * `prefer` breaks ties (e.g. concepts not yet on the map).
 */
export function matchConcept(input: string, concepts: Concept[], prefer?: (id: string) => boolean): Match | null {
  const iw = words(input);
  const ic = iw.join('');
  if (!ic) return null;
  let best: { m: Match; rank: number } | null = null;
  const consider = (m: Match, rank: number) => {
    const better =
      !best ||
      rank < best.rank ||
      (rank === best.rank && prefer && prefer(m.id) && !prefer(best.m.id));
    if (better) best = { m, rank };
  };
  for (const c of concepts) {
    for (const term of [c.label, ...(c.aliases ?? [])]) {
      // For partial matches a concept's own label beats an alias that happens to share a word.
      const aliasPenalty = term === c.label ? 0 : 0.5;
      const tw = words(term);
      const tc = tw.join('');
      if (!tc) continue;
      if (tc === ic) {
        consider({ id: c.id, kind: 'exact', term }, 0);
        continue;
      }
      if (ic.length >= 3) {
        const dist = editDistance(ic, tc);
        if (dist <= typoBudget(Math.min(ic.length, tc.length))) {
          consider({ id: c.id, kind: 'typo', term }, 1 + dist);
          continue;
        }
      }
      // Some whole words of a multi-word label, typos forgiven ("loop" or "loooping" for "Looping over items").
      if (tw.length >= 2 && ic.length >= 4) {
        let bestDist = Infinity;
        for (let i = 0; i < tw.length; i++) {
          for (let j = i + 1; j <= tw.length; j++) {
            const w = tw.slice(i, j).join('');
            if (w.length < 4) continue;
            const dist = editDistance(ic, w);
            if (dist <= typoBudget(Math.min(ic.length, w.length))) bestDist = Math.min(bestDist, dist);
          }
        }
        if (bestDist < Infinity) {
          consider({ id: c.id, kind: 'partial', term }, 10 + bestDist + aliasPenalty + (tc.length - ic.length) / 100);
          continue;
        }
      }
      // Part of a multi-word label, word-aligned or not ("comprehen", "hashmap" in "hash map lookup").
      if (ic.length >= 5 && tw.length >= 2 && tc.includes(ic)) {
        consider({ id: c.id, kind: 'partial', term }, 14 + aliasPenalty + (tc.length - ic.length) / 100);
        continue;
      }
      // The entry contains the whole term as words ("python list comprehensions").
      if (tc.length >= 4 && iw.length > tw.length && ` ${iw.join(' ')} `.includes(` ${tw.join(' ')} `)) {
        consider({ id: c.id, kind: 'partial', term }, 20 + aliasPenalty + (ic.length - tc.length) / 100);
      }
    }
  }
  return best ? (best as { m: Match }).m : null;
}

/** True when two pieces of text say the same thing once normalised (for spotting duplicate notes). */
export const sameText = (a: string, b: string) => words(a).join('') === words(b).join('');

// ---------- scope ----------

export interface Scope {
  key: string;
  /** In-scope course concepts, in course order. */
  concepts: Concept[];
  ids: Set<string>;
  /** Expert links with both ends in scope (deduplicated, undirected). */
  links: ConceptLink[];
}

export function scopeOf(course: MapCourse, key: string): Scope {
  const unit = key === ALL ? undefined : course.units.find((u) => u.id === key);
  const lessons = new Set((unit ? [unit] : course.units).flatMap((u) => u.lessons.map((l) => l.id)));
  const concepts = (course.concepts ?? []).filter((c) => lessons.has(c.lesson));
  const ids = new Set(concepts.map((c) => c.id));
  const seen = new Set<string>();
  const links = (course.links ?? []).filter((l) => {
    const k = pairKey(l.from, l.to);
    if (!ids.has(l.from) || !ids.has(l.to) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { key: unit ? unit.id : ALL, concepts, ids, links };
}

/** The distinct link labels the course uses, most used first: the vocabulary offered when labelling a link. */
export function linkVocabulary(course: MapCourse): string[] {
  const count = new Map<string, number>();
  for (const l of course.links ?? []) {
    const label = l.label.trim();
    if (label) count.set(label, (count.get(label) ?? 0) + 1);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([l]) => l);
}

export const pairKey = (a: string, b: string) => (a < b ? `${a}~${b}` : `${b}~${a}`);

export const NOTE_PREFIX = 'note:';
export const isNote = (id: string) => id.startsWith(NOTE_PREFIX);
/** The scope a note was written in. */
export const noteScope = (id: string) => id.slice(NOTE_PREFIX.length).split(':')[0];

export function newNoteId(map: MapState, scope: string): string {
  let n = map.notes.length + 1;
  const taken = new Set(map.notes.map((x) => x.id));
  while (taken.has(`${NOTE_PREFIX}${scope}:${n}`)) n++;
  return `${NOTE_PREFIX}${scope}:${n}`;
}

export const scopeLayer = (map: MapState, scope: string): Layer => map.scopes?.[scope] ?? 1;

export type NodeKind = 'recalled' | 'island' | 'learned' | 'note';
export interface MapNode {
  id: string;
  kind: NodeKind;
  label: string;
  concept?: Concept;
}

/**
 * The nodes visible in a scope at a layer: recalled concepts and the scope's notes always;
 * the rest of the scope's concepts from layer 2 on (islands, or "learned" once marked).
 */
export function visibleNodes(map: MapState, scope: Scope, layer: Layer): MapNode[] {
  const recalled = new Set(map.recalled);
  const learned = new Set(map.learned ?? []);
  const nodes: MapNode[] = [];
  for (const c of scope.concepts) {
    if (recalled.has(c.id)) nodes.push({ id: c.id, kind: 'recalled', label: c.label, concept: c });
    else if (layer >= 2) nodes.push({ id: c.id, kind: learned.has(c.id) ? 'learned' : 'island', label: c.label, concept: c });
  }
  for (const n of map.notes) {
    if (scope.key === ALL || noteScope(n.id) === scope.key) nodes.push({ id: n.id, kind: 'note', label: n.text });
  }
  return nodes;
}

// ---------- map edits (all return a new map) ----------

const withScopeLayer = (map: MapState, scope: string, layer: Layer): MapState => ({
  ...map,
  scopes: { ...map.scopes, [scope]: Math.max(scopeLayer(map, scope), layer) as Layer },
  layer: Math.max(map.layer, layer) as Layer,
});

export const advance = (map: MapState, scope: string, layer: Layer) => withScopeLayer(map, scope, layer);

/** Adds a recalled concept, at `at` unless it already has a place (no `at`: it gets one when it is shown). */
export function addRecall(map: MapState, conceptId: string, at?: Pos): MapState {
  if (map.recalled.includes(conceptId)) return map;
  return {
    ...map,
    recalled: [...map.recalled, conceptId],
    learned: (map.learned ?? []).filter((id) => id !== conceptId),
    pos: map.pos[conceptId] || !at ? map.pos : { ...map.pos, [conceptId]: at },
  };
}

export function addNote(map: MapState, scope: string, text: string, at: Pos): { map: MapState; id: string } {
  const id = newNoteId(map, scope);
  return { id, map: { ...map, notes: [...map.notes, { id, text: text.trim() }], pos: { ...map.pos, [id]: at } } };
}

/** Removes a node's own data: a note entirely, or a concept from recalled/learned (its course concept stays). */
export function removeNode(map: MapState, id: string): MapState {
  const pos = { ...map.pos };
  delete pos[id];
  return {
    ...map,
    notes: map.notes.filter((n) => n.id !== id),
    recalled: map.recalled.filter((c) => c !== id),
    learned: map.learned?.filter((c) => c !== id),
    links: map.links.filter((l) => l.from !== id && l.to !== id),
    pos: isNote(id) ? pos : map.pos,
  };
}

/** A recalled concept that was matched by mistake becomes the learner's own note instead. */
export function unrecallToNote(map: MapState, conceptId: string, scope: string, text: string): MapState {
  const at = map.pos[conceptId] ?? { x: 0, y: 0 };
  const { map: m, id } = addNote({ ...map, recalled: map.recalled.filter((c) => c !== conceptId) }, scope, text, at);
  return { ...m, links: m.links.map((l) => ({ ...l, from: l.from === conceptId ? id : l.from, to: l.to === conceptId ? id : l.to })) };
}

/**
 * Merges a note into a course concept: the note's position and links move to the concept, which counts as
 * recalled (the learner wrote it from memory, just in their own words).
 */
export function mergeNote(map: MapState, noteId: string, conceptId: string): MapState {
  const note = map.notes.find((n) => n.id === noteId);
  if (!note) return map;
  const repoint = (id: string) => (id === noteId ? conceptId : id);
  const seen = new Set<string>();
  const links = map.links
    .map((l) => ({ ...l, from: repoint(l.from), to: repoint(l.to) }))
    .filter((l) => {
      const k = pairKey(l.from, l.to);
      if (l.from === l.to || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  const pos = { ...map.pos };
  if (pos[noteId]) pos[conceptId] = pos[noteId];
  delete pos[noteId];
  return {
    ...map,
    notes: map.notes.filter((n) => n.id !== noteId),
    recalled: map.recalled.includes(conceptId) ? map.recalled : [...map.recalled, conceptId],
    learned: map.learned?.filter((c) => c !== conceptId),
    links,
    pos,
  };
}

export function setLearned(map: MapState, conceptId: string, on: boolean): MapState {
  const learned = (map.learned ?? []).filter((c) => c !== conceptId);
  return { ...map, learned: on ? [...learned, conceptId] : learned };
}

/** Adds an undirected link (or relabels the existing one between the same two nodes). */
export function addLink(map: MapState, a: string, b: string, label?: string): MapState {
  if (!a || !b || a === b) return map;
  const k = pairKey(a, b);
  const i = map.links.findIndex((l) => pairKey(l.from, l.to) === k);
  const link = { from: a, to: b, ...(label ? { label } : {}) };
  if (i < 0) return { ...map, links: [...map.links, link] };
  const links = [...map.links];
  links[i] = { from: links[i].from, to: links[i].to, ...(label ? { label } : {}) };
  return { ...map, links };
}

export function removeLink(map: MapState, a: string, b: string): MapState {
  const k = pairKey(a, b);
  return { ...map, links: map.links.filter((l) => pairKey(l.from, l.to) !== k) };
}

export function addHint(map: MapState, key: string): MapState {
  return map.hinted?.includes(key) ? map : { ...map, hinted: [...(map.hinted ?? []), key] };
}

export const moveNode = (map: MapState, id: string, p: Pos): MapState => ({ ...map, pos: { ...map.pos, [id]: p } });

/** "Start over" for one scope: forgets what the learner did in it. For the whole course, everything. */
export function resetScope(map: MapState, scope: Scope): MapState {
  if (scope.key === ALL) return emptyMap();
  const gone = new Set<string>([...scope.ids, ...map.notes.filter((n) => noteScope(n.id) === scope.key).map((n) => n.id)]);
  const pos = Object.fromEntries(Object.entries(map.pos).filter(([id]) => !gone.has(id)));
  const scopes = { ...map.scopes };
  delete scopes[scope.key];
  const layer = Math.max(1, ...Object.values(scopes)) as Layer;
  return {
    ...map,
    recalled: map.recalled.filter((c) => !gone.has(c)),
    learned: map.learned?.filter((c) => !gone.has(c)),
    notes: map.notes.filter((n) => !gone.has(n.id)),
    links: map.links.filter((l) => !gone.has(l.from) && !gone.has(l.to)),
    hinted: map.hinted?.filter((k) => !k.split('~').some((id) => gone.has(id))),
    pos,
    scopes,
    layer,
    score: undefined,
  };
}

// ---------- scores ----------

export interface RecallScore {
  recalled: number;
  total: number;
  fraction: number;
}

export function recallScore(map: MapState, scope: Scope): RecallScore {
  const total = scope.concepts.length;
  const recalled = scope.concepts.filter((c) => map.recalled.includes(c.id)).length;
  return { recalled, total, fraction: total ? recalled / total : 0 };
}

/** Honest and encouraging: names the number, frames the gaps as the next thing to read. */
export function recallMessage({ recalled, total, fraction }: RecallScore): string {
  if (!total) return 'This part of the course has no concepts to recall yet.';
  if (recalled === total) return `You recalled all ${total} ideas from memory. That is the whole map.`;
  if (recalled === 0)
    return 'Nothing came to mind this time, and that is a useful starting point: studies suggest that trying to recall first tends to make the next read stick better.';
  const lead = `You recalled ${recalled} of ${total} ideas from memory`;
  if (fraction >= 0.67) return `${lead}. That is strong recall; the few islands left are quick wins.`;
  if (fraction >= 0.34) return `${lead}. A solid base to build on; the islands below show exactly what to read next.`;
  return `${lead}. Every idea you pulled out got a little stronger, and the islands below are your reading list.`;
}

export type LinkStatus = 'found' | 'hinted' | 'extra';

export interface CheckResult {
  /** Expert links in scope. */
  total: number;
  /** Expert links the learner drew without a hint. */
  found: number;
  /** Expert links the learner drew after seeing the hint. */
  withHint: number;
  /** Expert links not drawn yet, in course order. */
  missed: ConceptLink[];
  /** Hinted expert links not drawn yet. */
  shownHints: ConceptLink[];
  /** Status of each learner link, by pairKey. "extra" = not in the course map (might still be true). */
  status: Record<string, LinkStatus>;
  /** The learner links that match an expert link, in the expert's direction and with its label. */
  correct: { from: string; to: string; label: string }[];
}

/** Compares the learner's links (undirected) with the expert links among in-scope concepts. */
export function checkMap(map: MapState, scope: Scope): CheckResult {
  const expert = new Map(scope.links.map((l) => [pairKey(l.from, l.to), l]));
  const hinted = new Set(map.hinted ?? []);
  const status: Record<string, LinkStatus> = {};
  const correct: CheckResult['correct'] = [];
  let found = 0;
  let withHint = 0;
  const drawn = new Set<string>();
  for (const l of map.links) {
    const k = pairKey(l.from, l.to);
    const e = expert.get(k);
    drawn.add(k);
    if (!e) {
      status[k] = 'extra';
      continue;
    }
    if (hinted.has(k)) {
      status[k] = 'hinted';
      withHint++;
    } else {
      status[k] = 'found';
      found++;
    }
    correct.push({ from: e.from, to: e.to, label: e.label });
  }
  const missed = scope.links.filter((l) => !drawn.has(pairKey(l.from, l.to)));
  const shownHints = missed.filter((l) => hinted.has(pairKey(l.from, l.to)));
  return { total: scope.links.length, found, withHint, missed, shownHints, status, correct };
}

/** The next missed link to show as a hint: one touching a node the learner recalled if possible, else the first. */
export function nextHint(result: CheckResult, map: MapState): ConceptLink | undefined {
  const hinted = new Set(map.hinted ?? []);
  const open = result.missed.filter((l) => !hinted.has(pairKey(l.from, l.to)));
  const recalled = new Set(map.recalled);
  return open.find((l) => recalled.has(l.from) && recalled.has(l.to)) ?? open.find((l) => recalled.has(l.from) || recalled.has(l.to)) ?? open[0];
}

export function linkMessage(r: CheckResult): string {
  if (!r.total) return 'The course map has no links inside this scope yet, so every link you draw is your own.';
  const got = r.found + r.withHint;
  if (got === 0) return `The course map links these ideas in ${r.total} ways. Draw a few you are sure of, then check again, or take a hint.`;
  const hints = r.withHint ? ` (${r.withHint} with a hint)` : '';
  if (got === r.total) return `You found all ${r.total} links in the course map${hints}. Connected knowledge like this tends to be easier to use.`;
  return `You found ${got} of ${r.total} links in the course map${hints}. Each one ties two ideas together.`;
}

// ---------- chunks ----------

export interface Chunk {
  /** Node ids, the "name" node first. */
  members: string[];
  /** The best-connected member (ties: the earliest in `order`). */
  name: string;
}

/**
 * Groups of nodes joined by correct links (connected components of size 2+), largest first.
 * `order` gives a stable tie-break (e.g. course concept order).
 */
export function chunks(correct: { from: string; to: string }[], order: string[]): Chunk[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    let c = x;
    while (parent.get(c) !== r) {
      const n = parent.get(c)!;
      parent.set(c, r);
      c = n;
    }
    return r;
  };
  const degree = new Map<string, number>();
  for (const { from, to } of correct) {
    for (const id of [from, to]) {
      if (!parent.has(id)) parent.set(id, id);
      degree.set(id, (degree.get(id) ?? 0) + 1);
    }
    const a = find(from);
    const b = find(to);
    if (a !== b) parent.set(a, b);
  }
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i < 0 ? order.length : i;
  };
  const groups = new Map<string, string[]>();
  for (const id of parent.keys()) {
    const r = find(id);
    groups.set(r, [...(groups.get(r) ?? []), id]);
  }
  return [...groups.values()]
    .map((g) => {
      const sorted = g.sort((a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0) || rank(a) - rank(b) || a.localeCompare(b));
      return { members: sorted, name: sorted[0] };
    })
    .sort((a, b) => b.members.length - a.members.length || rank(a.name) - rank(b.name));
}

// ---------- layout ----------

export const NODE_W = 168;
export const NODE_H = 46;
export const CELL_W = NODE_W + 28;
export const CELL_H = NODE_H + 34;

/** Estimated on-canvas size of a node with this label (labels wrap to two lines at NODE_W). */
export function nodeSize(label: string): { w: number; h: number } {
  const natural = 34 + label.length * 7.4;
  return natural <= NODE_W ? { w: Math.max(72, natural), h: 38 } : { w: NODE_W, h: 56 };
}

/** Where the segment from `from` to the centre `to` meets the box (half-size hw × hh) around `to`: arrowheads end there. */
export function edgeEnd(from: Pos, to: Pos, hw: number, hh: number): Pos {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  if (!dx && !dy) return to;
  const s = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return s >= 1 ? to : { x: to.x + dx * s, y: to.y + dy * s };
}

/** Grid cells in a square spiral around the origin: (0,0), (1,0), (1,1), (0,1), (-1,1), ... */
function* spiral(): Generator<[number, number]> {
  let x = 0;
  let y = 0;
  yield [0, 0];
  for (let r = 1; ; r++) {
    x++;
    yield [x, y];
    while (y < r) yield [x, ++y];
    while (x > -r) yield [--x, y];
    while (y > -r) yield [x, --y];
    while (x < r) yield [++x, y];
  }
}

/** The free grid slot nearest the centre (`around`) for a new node, so recalled ideas land in a tidy pattern. */
export function nextSlot(taken: Pos[], around: Pos = { x: 0, y: 0 }): Pos {
  const free = (p: Pos) => taken.every((t) => Math.abs(t.x - p.x) >= CELL_W * 0.8 || Math.abs(t.y - p.y) >= CELL_H * 0.8);
  let i = 0;
  for (const [gx, gy] of spiral()) {
    const p = { x: around.x + gx * CELL_W, y: around.y + gy * CELL_H };
    if (free(p) || ++i > 4000) return p;
  }
  return around;
}

/** Places each id without a position into the next free slot, in order. */
export function placeMissing(pos: Record<string, Pos>, ids: string[], around?: Pos): Record<string, Pos> {
  const out = { ...pos };
  const taken = Object.values(out);
  for (const id of ids) {
    if (out[id]) continue;
    const p = nextSlot(taken, around);
    out[id] = p;
    taken.push(p);
  }
  return out;
}

/**
 * A tidy grid in reading order, centred on the origin (used when there are no links to arrange around).
 * `aspect` is the canvas width ÷ height: a tall phone canvas gets fewer, longer columns.
 */
export function gridLayout(ids: string[], columns?: number, aspect?: number): Record<string, Pos> {
  const auto = aspect ? Math.sqrt((ids.length * aspect * CELL_H) / CELL_W) : Math.sqrt(ids.length * 1.6);
  const cols = columns ?? Math.max(1, Math.ceil(auto));
  const rows = Math.ceil(ids.length / cols);
  const out: Record<string, Pos> = {};
  ids.forEach((id, i) => {
    out[id] = { x: ((i % cols) - (cols - 1) / 2) * CELL_W, y: (Math.floor(i / cols) - (rows - 1) / 2) * CELL_H };
  });
  return out;
}

/**
 * Deterministic force-directed layout (Fruchterman–Reingold from a circle in input order), then
 * overlap removal for the rectangular nodes. With no links it falls back to `gridLayout`.
 */
export function forceLayout(ids: string[], links: { from: string; to: string }[], iterations = 300, aspect?: number): Record<string, Pos> {
  const idx = new Map(ids.map((id, i) => [id, i]));
  const edges = links.map((l) => [idx.get(l.from), idx.get(l.to)] as const).filter((e): e is readonly [number, number] => e[0] !== undefined && e[1] !== undefined && e[0] !== e[1]);
  if (!edges.length || ids.length < 3) return gridLayout(ids, undefined, aspect);
  const n = ids.length;
  const k = 150; // ideal edge length
  const radius = Math.max(k, (n * k) / (2 * Math.PI));
  const p = ids.map((_, i) => ({ x: radius * Math.cos((2 * Math.PI * i) / n), y: radius * 0.7 * Math.sin((2 * Math.PI * i) / n) }));
  let temp = radius / 2;
  for (let it = 0; it < iterations; it++) {
    const d = p.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = p[i].x - p[j].x;
        let dy = p[i].y - p[j].y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          dx = 0.01 * (i - j);
          dy = 0.01;
          dist = Math.hypot(dx, dy);
        }
        const f = (k * k) / dist;
        d[i].x += (dx / dist) * f;
        d[i].y += (dy / dist) * f;
        d[j].x -= (dx / dist) * f;
        d[j].y -= (dy / dist) * f;
      }
    }
    for (const [a, b] of edges) {
      const dx = p[a].x - p[b].x;
      const dy = p[a].y - p[b].y;
      const dist = Math.max(0.01, Math.hypot(dx, dy));
      const f = (dist * dist) / k;
      d[a].x -= (dx / dist) * f;
      d[a].y -= (dy / dist) * f;
      d[b].x += (dx / dist) * f;
      d[b].y += (dy / dist) * f;
    }
    for (let i = 0; i < n; i++) {
      // Gentle pull to the centre keeps disconnected pieces from drifting away.
      d[i].x -= p[i].x * 0.02 * (k / 10);
      d[i].y -= p[i].y * 0.03 * (k / 10);
      const len = Math.max(0.01, Math.hypot(d[i].x, d[i].y));
      const step = Math.min(len, temp);
      p[i].x += (d[i].x / len) * step;
      p[i].y += (d[i].y / len) * step;
    }
    temp = Math.max(1, temp * 0.97);
  }
  // The forces settle into a wide shape; on a tall canvas (a phone held upright) turn it on its side, then clear overlaps.
  if (aspect !== undefined && aspect < 1) for (const q of p) [q.x, q.y] = [q.y, q.x];
  separate(p, NODE_W + 16, NODE_H + 20);
  const cx = p.reduce((s, q) => s + q.x, 0) / n;
  const cy = p.reduce((s, q) => s + q.y, 0) / n;
  return Object.fromEntries(ids.map((id, i) => [id, { x: Math.round(p[i].x - cx), y: Math.round(p[i].y - cy) }]));
}

/**
 * "Tidy up": each chunk of linked ideas gets its own force layout, the chunks are packed in rows shaped like the
 * canvas, and the ideas not linked yet wait in a compact grid underneath. (One force layout over everything spread
 * the pieces around a big circle and left most of the canvas empty.)
 */
export function arrangeLayout(ids: string[], links: { from: string; to: string }[], aspect?: number): Record<string, Pos> {
  const known = new Set(ids);
  const edges = links.filter((l) => known.has(l.from) && known.has(l.to) && l.from !== l.to);
  // Connected components, in the order their first idea appears in `ids`.
  const parent = new Map(ids.map((id) => [id, id]));
  const root = (id: string): string => (parent.get(id) === id ? id : root(parent.get(id)!));
  for (const l of edges) parent.set(root(l.from), root(l.to));
  const groups = new Map<string, string[]>();
  for (const id of ids) groups.set(root(id), [...(groups.get(root(id)) ?? []), id]);
  const chunks = [...groups.values()].filter((g) => g.length > 1);
  const loose = [...groups.values()].filter((g) => g.length === 1).flat();
  if (!chunks.length) return gridLayout(ids, undefined, aspect);

  // Lay out each chunk around its own origin and measure it.
  const boxes = chunks.map((g) => {
    const lay = forceLayout(g, edges, undefined, aspect);
    const ps = Object.values(lay);
    const minX = Math.min(...ps.map((p) => p.x)), maxX = Math.max(...ps.map((p) => p.x));
    const minY = Math.min(...ps.map((p) => p.y)), maxY = Math.max(...ps.map((p) => p.y));
    return { lay, minX, minY, w: maxX - minX + CELL_W, h: maxY - minY + CELL_H };
  });
  // Shelf packing: fill a row up to a width that suits the canvas shape, then start the next row.
  const area = boxes.reduce((s, b) => s + b.w * b.h, 0);
  const rowWidth = Math.max(...boxes.map((b) => b.w), Math.sqrt(area * (aspect ?? 1.6)));
  const out: Record<string, Pos> = {};
  let x = 0, y = 0, rowH = 0;
  for (const b of boxes) {
    if (x > 0 && x + b.w > rowWidth) [x, y, rowH] = [0, y + rowH, 0];
    for (const [id, p] of Object.entries(b.lay)) out[id] = { x: x + p.x - b.minX, y: y + p.y - b.minY };
    x += b.w;
    rowH = Math.max(rowH, b.h);
  }
  if (loose.length) {
    const grid = gridLayout(loose, undefined, aspect);
    const gx = Math.min(...Object.values(grid).map((p) => p.x));
    const gy = Math.min(...Object.values(grid).map((p) => p.y));
    for (const id of loose) out[id] = { x: grid[id].x - gx, y: y + rowH + grid[id].y - gy };
  }
  // Centre on the origin like the other layouts.
  const ps = Object.values(out);
  const cx = (Math.min(...ps.map((p) => p.x)) + Math.max(...ps.map((p) => p.x))) / 2;
  const cy = (Math.min(...ps.map((p) => p.y)) + Math.max(...ps.map((p) => p.y))) / 2;
  return Object.fromEntries(ids.map((id) => [id, { x: Math.round(out[id].x - cx), y: Math.round(out[id].y - cy) }]));
}

/** Pushes overlapping rectangles apart along the axis of least overlap. */
export function separate(p: Pos[], w: number, h: number, rounds = 60) {
  for (let r = 0; r < rounds; r++) {
    let moved = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dx = p[j].x - p[i].x;
        const dy = p[j].y - p[i].y;
        const ox = w - Math.abs(dx);
        const oy = h - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox / w < oy / h) {
          const s = (dx >= 0 ? 1 : -1) * (ox / 2 + 0.5);
          p[i].x -= s;
          p[j].x += s;
        } else {
          const s = (dy >= 0 ? 1 : -1) * (oy / 2 + 0.5);
          p[i].y -= s;
          p[j].y += s;
        }
      }
    }
    if (!moved) return;
  }
}

export interface View {
  x: number;
  y: number;
  k: number;
}
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 2.5;
const clampK = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

/** The view (translate, then scale) that fits every point, with room for the nodes, into a w×h viewport. */
export function fitView(points: Pos[], w: number, h: number, pad = 24): View {
  if (!points.length) return { x: w / 2, y: h / 2, k: 1 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs) - NODE_W / 2;
  const maxX = Math.max(...xs) + NODE_W / 2;
  const minY = Math.min(...ys) - NODE_H / 2 - 10;
  const maxY = Math.max(...ys) + NODE_H / 2 + 10;
  const k = clampK(Math.min(1.2, (w - 2 * pad) / Math.max(1, maxX - minX), (h - 2 * pad) / Math.max(1, maxY - minY)));
  return { k, x: w / 2 - ((minX + maxX) / 2) * k, y: h / 2 - ((minY + maxY) / 2) * k };
}

/** Zooms by `factor` keeping the screen point (sx, sy) fixed. */
export function zoomAt(v: View, factor: number, sx: number, sy: number): View {
  const k = clampK(v.k * factor);
  const f = k / v.k;
  return { k, x: sx - (sx - v.x) * f, y: sy - (sy - v.y) * f };
}

export const toWorld = (v: View, sx: number, sy: number): Pos => ({ x: (sx - v.x) / v.k, y: (sy - v.y) / v.k });

/** Convex hull (monotone chain), counter-clockwise, for drawing a soft blob around a chunk. */
export function hull(points: Pos[]): Pos[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const cross = (o: Pos, a: Pos, b: Pos) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pos[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pos[] = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
