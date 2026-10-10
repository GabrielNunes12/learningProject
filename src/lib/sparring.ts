// The sparring partner: before a right answer's "Why", the learner argues against a wrong choice. The choice is the
// learner's own first wrong pick when they made one, else a wrong choice picked by a seed (the step id), so the same
// question always spars the same way. Pure (no imports) so node:test can load it.

/** Words an argument needs before the "Why" is revealed (a few words can't defend a choice). */
export const SPAR_MIN_WORDS = 6;

/** FNV-1a: a string to a 32-bit number. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The choice to argue against: the learner's first wrong pick, else a wrong choice chosen by `seed`. -1 when there is
 * none (fewer than two choices). A `firstWrong` that is out of range or equals the answer is ignored.
 */
export function sparChoice(answer: number, count: number, seed: string, firstWrong?: number | null): number {
  if (count < 2) return -1;
  if (firstWrong != null && Number.isInteger(firstWrong) && firstWrong >= 0 && firstWrong < count && firstWrong !== answer) return firstWrong;
  const wrong: number[] = [];
  for (let i = 0; i < count; i++) if (i !== answer) wrong.push(i);
  return wrong[hash(seed) % wrong.length];
}
