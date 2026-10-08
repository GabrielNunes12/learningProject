// The Socratic step-back: after a wrong attempt, ask about the foundation the question builds on (or about the question's
// own concept when it has no foundation), and offer three one-sentence summaries to choose from. The pick is a nudge,
// not a lesson: the learner still retries. Pure (type-only imports) so node:test can load it.
import type { Concept } from '../types.ts';

export interface Probe {
  /** The concept the question asks about: a prerequisite of the question's concept, or the concept itself. */
  concept: Concept;
  /** True when `concept` is a foundation the question builds on; false when it is the question's own concept. */
  foundation: boolean;
  /** Three one-sentence summaries, shuffled: the target's and two from other concepts. */
  choices: string[];
  /** Index in `choices` of the target's summary. */
  answer: number;
}

/** Wrong answers offered next to the right one. */
const DISTRACTORS = 2;

/** FNV-1a: a string to a 32-bit seed. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A linear congruential generator in [0, 1): the same seed always gives the same sequence. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The probe for a question testing `stepConcepts`, or null when there's nothing to ask. The target is the first
 * prerequisite (same course, with a summary) of the first step concept that has one; failing that, the first step
 * concept with a summary. Distractors come from the target's lesson first, then from the rest of the course, and never
 * from the target or the step's own concepts. The same `seed` always gives the same probe.
 */
export function probeFor(
  stepConcepts: string[] | undefined,
  concepts: Concept[],
  prereqs: Map<string, string[]>,
  seed: string,
): Probe | null {
  const step = stepConcepts ?? [];
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const usable = (id: string) => !id.includes('/') && Boolean(byId.get(id)?.summary);

  let target: Concept | undefined;
  let foundation = false;
  for (const id of step) {
    const prereq = (prereqs.get(id) ?? []).find(usable);
    if (prereq) {
      target = byId.get(prereq);
      foundation = true;
      break;
    }
  }
  if (!target) target = step.map((id) => byId.get(id)).find((c): c is Concept => Boolean(c?.summary));
  if (!target?.summary) return null;

  // Distractors: other concepts' summaries, the target's lesson first, each text used once.
  const exclude = new Set([target.id, ...step]);
  const texts = new Set([target.summary]);
  const pool = concepts.filter((c) => c.summary && !exclude.has(c.id));
  const rnd = random(hash(seed));
  const ordered = [
    ...shuffle(
      pool.filter((c) => c.lesson === target.lesson),
      rnd,
    ),
    ...shuffle(
      pool.filter((c) => c.lesson !== target.lesson),
      rnd,
    ),
  ];
  const distractors: string[] = [];
  for (const c of ordered) {
    if (distractors.length === DISTRACTORS) break;
    if (texts.has(c.summary!)) continue;
    texts.add(c.summary!);
    distractors.push(c.summary!);
  }
  if (distractors.length < DISTRACTORS) return null;

  const choices = shuffle([target.summary, ...distractors], rnd);
  return { concept: target, foundation, choices, answer: choices.indexOf(target.summary) };
}
