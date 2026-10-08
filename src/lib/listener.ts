// The listener: the learner explains a lesson back in their own words, and the explanation is compared with the
// lesson's ideas (its concepts): "3 of 4 ideas, you missed this one". It points; the learner fixes. Matching is by the
// words that name an idea (its label or an alias), so it checks coverage, not correctness. Pure so node:test can load it.
import type { Concept } from '../types.ts';
import { editDistance, normalize, stem, typoBudget } from './knowledgeMap.ts';

/** Words an explanation needs before it's compared (a handful of words can't explain a lesson). */
export const MIN_EXPLAIN_WORDS = 12;

interface Word {
  raw: string;
  stem: string;
}
/** Normalised words, each with its stem. */
export const textWords = (s: string): Word[] =>
  normalize(s)
    .split(' ')
    .filter(Boolean)
    .map((raw) => ({ raw, stem: stem(raw) }));

// Same stem ("lists"/"list"), or a small typo in the word as written: stems would hide a typo ("slicng" vs "slic").
const sameWord = (a: Word, b: Word) => a.stem === b.stem || (Math.min(a.raw.length, b.raw.length) >= 5 && editDistance(a.raw, b.raw) <= typoBudget(Math.min(a.raw.length, b.raw.length)));

/** True when `text` contains `term`'s words next to each other, small typos forgiven. */
export function mentions(text: Word[], term: string): boolean {
  const tw = textWords(term);
  // A single short word ("if", "map") is too common to claim the idea was named.
  if (!tw.length || (tw.length === 1 && tw[0].raw.length < 4)) return false;
  for (let i = 0; i + tw.length <= text.length; i++) if (tw.every((w, j) => sameWord(text[i + j], w))) return true;
  return false;
}

export const wordCount = (s: string) => normalize(s).split(' ').filter(Boolean).length;

export interface ExplainBack {
  ideas: Concept[];
  covered: Concept[];
  missed: Concept[];
}

/** Which of the lesson's ideas the explanation names (by label or alias). */
export function explainBack(explanation: string, ideas: Concept[]): ExplainBack {
  const text = textWords(explanation);
  const covered = ideas.filter((c) => [c.label, ...(c.aliases ?? [])].some((term) => mentions(text, term)));
  return { ideas, covered, missed: ideas.filter((c) => !covered.includes(c)) };
}
