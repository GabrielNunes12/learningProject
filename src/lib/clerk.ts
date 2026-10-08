// The clerk, at the end of a session: what the answers showed (solid, lucky guesses, to fix) and the foundation behind
// repeated misses (diagnose.ts). Written from the session's own answers only, so it never claims more than it saw.
// Pure (type-only imports) so node:test can load it.
import type { Confidence } from './mastery.ts';
import type { Concept } from '../types.ts';
import { rootCauses } from './diagnose.ts';

export interface ClerkItem {
  courseId: string;
  /** The concepts the question tests (already resolved against its course). */
  concepts: Concept[];
  ok: boolean;
  confidence: Confidence;
}

export interface ClerkConcept {
  courseId: string;
  concept: Concept;
}

export interface ClerkNotes {
  solid: ClerkConcept[];
  guessed: ClerkConcept[];
  missed: ClerkConcept[];
  /** The shaky foundation behind the most missed concepts, when the session showed it. */
  root?: { courseId: string; root: Concept; explains: Concept[] };
}

/** Each list shows at most this many items. */
export const CLERK_MAX = 6;

type Level = 'solid' | 'guessed' | 'missed';
/** Worst first: a concept takes the worst outcome it had in the session. */
const WORST: Record<Level, number> = { solid: 0, guessed: 1, missed: 2 };

/**
 * Concepts a question tests, looked up in its course's concept graph. Ids the course doesn't define are dropped.
 */
export function conceptsFor(ids: string[] | undefined, concepts: Concept[] | undefined): Concept[] {
  return (ids ?? []).map((id) => concepts?.find((c) => c.id === id)).filter((c): c is Concept => Boolean(c));
}

/**
 * The session's notes. Each concept (per course) lands in its worst bucket: missed (wrong, or "I don't know") beats
 * a lucky guess (right, but guessed), which beats solid (right and sure). Missed concepts are listed most-missed first.
 * The root is the one shaky foundation, among those this session showed, that explains the most missed concepts.
 */
export function sessionNotes(items: ClerkItem[], prereqOf: (courseId: string) => Map<string, string[]>): ClerkNotes {
  const seen = new Map<string, ClerkConcept & { level: Level; misses: number }>();
  for (const item of items)
    for (const concept of item.concepts) {
      const key = `${item.courseId}/${concept.id}`;
      const missed = !item.ok || item.confidence === 'unknown';
      const level: Level = missed ? 'missed' : item.confidence === 'guess' ? 'guessed' : 'solid';
      const prev = seen.get(key);
      const worst = prev && WORST[prev.level] > WORST[level] ? prev.level : level;
      // Map keeps a key's first position, so the lists stay in first-seen order.
      seen.set(key, { courseId: item.courseId, concept, level: worst, misses: (prev?.misses ?? 0) + (missed ? 1 : 0) });
    }
  const entries = [...seen.values()];
  const pick = (level: Level) => entries.filter((e) => e.level === level).map(({ courseId, concept }) => ({ courseId, concept }));

  const missedAll = entries.filter((e) => e.level === 'missed').sort((a, b) => b.misses - a.misses);
  const notes: ClerkNotes = {
    solid: pick('solid').slice(0, CLERK_MAX),
    guessed: pick('guessed').slice(0, CLERK_MAX),
    missed: missedAll.slice(0, CLERK_MAX).map(({ courseId, concept }) => ({ courseId, concept })),
  };

  // Root cause: per course, the shaky foundation (missed or guessed) that explains the most missed concepts. A root
  // only counts when this session showed it, so the notes never name a concept the learner wasn't tested on.
  let best: ClerkNotes['root'];
  for (const courseId of new Set(entries.map((e) => e.courseId))) {
    const mine = entries.filter((e) => e.courseId === courseId);
    const weak = mine.filter((e) => e.level === 'missed').map((e) => e.concept.id);
    if (!weak.length) continue;
    const shaky = new Set(mine.filter((e) => e.level !== 'solid').map((e) => e.concept.id));
    const byId = new Map(mine.map((e) => [e.concept.id, e.concept]));
    for (const cause of rootCauses(weak, (id) => shaky.has(id), prereqOf(courseId))) {
      const root = byId.get(cause.root);
      if (!root) continue;
      if (!best || cause.explains.length > best.explains.length)
        best = { courseId, root, explains: cause.explains.slice(0, CLERK_MAX).map((id) => byId.get(id)!) };
    }
  }
  if (best) notes.root = best;
  return notes;
}
