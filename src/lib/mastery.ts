// How answers turn into knowledge: confidence, review scheduling, question difficulty, the find-your-level quiz and
// harder review questions. Pure (type-only imports) so node:test can load it; storage.ts builds on it.
import type { Course, LessonInfo, QuestionStep } from '../types.ts';
import type { Card } from './storage.ts';

export const MAX_BOX = 6;
/** Days until the next review, indexed by box. Box 1 = review again right away. */
export const INTERVAL_DAYS = [0, 0, 1, 3, 7, 16, 35];
/** Cards at this box or above count as "mastered". */
export const MASTERED_BOX = 4;
/** Recent results kept per card. */
export const HIST_LEN = 12;
const DAY = 86_400_000;

// ---------- confidence ----------

/** How the learner answered: with conviction, marked "I'm guessing", or "I don't know". */
export type Confidence = 'sure' | 'guess' | 'unknown';

/** A card history mark: "1" right, "g" right but guessed, "0" wrong or "I don't know". */
export const histMark = (ok: boolean, conf: Confidence = 'sure') => (!ok ? '0' : conf === 'guess' ? 'g' : '1');

/** Right and sure: the only answer that counts as knowing it. */
export const isKnown = (ok: boolean, conf: Confidence = 'sure') => ok && conf === 'sure';

/**
 * The card after an answer. Right and sure moves it up a box; wrong (or "I don't know") sends it back to box 1.
 * A lucky guess isn't knowledge: the box stays where it was and the question comes back tomorrow.
 */
export function nextCard(prev: Card | undefined, ok: boolean, conf: Confidence, now: number): Card {
  const known = isKnown(ok, conf);
  const box = known ? Math.min((prev?.box ?? 1) + 1, MAX_BOX) : ok ? (prev?.box ?? 1) : 1;
  return {
    box,
    due: now + (ok && !known ? 1 : INTERVAL_DAYS[box]) * DAY,
    seen: (prev?.seen ?? 0) + 1,
    right: (prev?.right ?? 0) + (known ? 1 : 0),
    hist: ((prev?.hist ?? '') + histMark(ok, conf)).slice(-HIST_LEN),
    last: now,
  };
}

/**
 * A card whose concept was just tested by a harder question in its place: answering the harder one right (and sure)
 * counts for it too; otherwise it keeps its box and comes back tomorrow. Its own history is left alone.
 */
export function creditedCard(prev: Card, ok: boolean, conf: Confidence, now: number): Card {
  const known = isKnown(ok, conf);
  const box = known ? Math.min(prev.box + 1, MAX_BOX) : prev.box;
  return { ...prev, box, due: now + (known ? INTERVAL_DAYS[box] : 1) * DAY };
}

// ---------- difficulty ----------

/**
 * How demanding a kind of question is: recognising (pick or sort what's given), recalling and applying (produce a
 * value, an order, a table), producing and tracing (run code in your head, find and fix a bug).
 */
const TIER: Record<QuestionStep['type'], number> = {
  mcq: 1,
  buckets: 1,
  numeric: 2,
  text: 2,
  order: 2,
  truthtable: 2,
  balance: 2,
  logicgrid: 2,
  output: 3,
  bug: 3,
  trace: 3,
};
export const typeTier = (type: QuestionStep['type']) => TIER[type] ?? 2;

/** Difficulty of a question: its kind first, then how far into the course its lesson is (later lessons build on more). */
export const difficulty = (type: QuestionStep['type'], lessonIndex: number, lessonCount: number) =>
  typeTier(type) + (lessonCount > 1 ? lessonIndex / (lessonCount - 1) : 0) * 0.99;

// ---------- find your level ----------

export interface LevelQuestion {
  key: string;
  lesson: LessonInfo;
  /** Position of the lesson in the course. */
  index: number;
}

/** The most questions a level quiz asks (it usually stops sooner). */
export const LEVEL_MAX = 15;
/** Stop after this many answers in a row that weren't right and sure: the learner has reached the edge. */
export const LEVEL_STOP_AFTER = 2;

/**
 * The find-your-level quiz: one question per lesson, in course order (easy to hard). Recall questions are preferred
 * over multiple choice, which can be guessed. Long courses drop deep-dive lessons first, keeping the order.
 */
export function levelQuizPlan(course: Course, rand: () => number = Math.random, max = LEVEL_MAX): LevelQuestion[] {
  const pickFor = (lesson: LessonInfo) => {
    const qs = lesson.questions;
    if (!qs.length) return null;
    const rank = (t: QuestionStep['type']) => [2, 3, 1].indexOf(typeTier(t));
    const best = Math.min(...qs.map((q) => rank(q.type)));
    const pool = qs.filter((q) => rank(q.type) === best);
    return pool[Math.floor(rand() * pool.length) % pool.length];
  };
  let plan = course.lessons
    .map((lesson, index) => {
      const q = pickFor(lesson);
      return q ? { key: `${course.id}/${lesson.id}/${q.id}`, lesson, index } : null;
    })
    .filter((x): x is LevelQuestion => x !== null);
  for (let i = plan.length - 1; plan.length > max && i >= 0; i--) if (plan[i].lesson.pareto === 'extra') plan.splice(i, 1);
  if (plan.length > max) plan = plan.slice(0, max);
  return plan;
}

export interface LevelAnswer {
  lesson: LessonInfo;
  ok: boolean;
  conf: Confidence;
}

/** True once the last LEVEL_STOP_AFTER answers were all missed, guessed or "I don't know". */
export const shouldStopLevel = (answers: { ok: boolean; conf: Confidence }[]) =>
  answers.length >= LEVEL_STOP_AFTER && answers.slice(-LEVEL_STOP_AFTER).every((a) => !isKnown(a.ok, a.conf));

export interface LevelResult {
  /** The quiz stopped early because the learner started guessing. */
  stopped: boolean;
  /** Where to start studying: the first lesson of the closing streak, or the first lesson not known; null if all known. */
  start: LessonInfo | null;
  /** Lessons answered right and sure. */
  solid: LessonInfo[];
  /** Lessons answered wrong, guessed or "I don't know". */
  shaky: LessonInfo[];
  /** Lessons the quiz didn't reach. */
  untested: LessonInfo[];
}

export function levelResult(plan: LevelQuestion[], answers: LevelAnswer[]): LevelResult {
  const stopped = shouldStopLevel(answers) && answers.length < plan.length;
  const solid = answers.filter((a) => isKnown(a.ok, a.conf)).map((a) => a.lesson);
  const shaky = answers.filter((a) => !isKnown(a.ok, a.conf)).map((a) => a.lesson);
  const start = stopped ? answers[answers.length - LEVEL_STOP_AFTER].lesson : (shaky[0] ?? null);
  return { stopped, start, solid, shaky, untested: plan.slice(answers.length).map((q) => q.lesson) };
}

// ---------- harder each time ----------

export interface PoolQuestion {
  key: string;
  course: string;
  type: QuestionStep['type'];
  concepts?: string[];
  lessonIndex: number;
  lessonCount: number;
}

/** A card is known well enough to be examined harder once it has been right and sure at least twice in a row. */
const READY_BOX = 3;

/**
 * For a due card the learner already knows, a harder question on the same concept that they haven't mastered yet:
 * the next rung up (the easiest of the harder ones), never one already in the session. Null keeps the card itself.
 */
export function harderQuestion(key: string, pool: PoolQuestion[], cards: Record<string, Card>, taken: Set<string>): string | null {
  const q = pool.find((x) => x.key === key);
  const card = cards[key];
  if (!q || !card || card.box < READY_BOX || !card.hist?.endsWith('1') || !q.concepts?.length) return null;
  const d = difficulty(q.type, q.lessonIndex, q.lessonCount);
  const ladder = pool
    .filter(
      (x) =>
        x.course === q.course &&
        x.key !== key &&
        !taken.has(x.key) &&
        cards[x.key] !== undefined &&
        cards[x.key].box < MASTERED_BOX &&
        x.concepts?.some((c) => q.concepts!.includes(c)) &&
        difficulty(x.type, x.lessonIndex, x.lessonCount) > d,
    )
    .sort((a, b) => difficulty(a.type, a.lessonIndex, a.lessonCount) - difficulty(b.type, b.lessonIndex, b.lessonCount));
  return ladder[0]?.key ?? null;
}

/**
 * A review session: each due key, or a harder question in its place. Returns the keys to ask and, for each
 * replacement, the key it stands in for.
 */
export function harderReview(due: string[], pool: PoolQuestion[], cards: Record<string, Card>): { keys: string[]; standIn: Record<string, string> } {
  const taken = new Set(due);
  const keys: string[] = [];
  const standIn: Record<string, string> = {};
  for (const key of due) {
    const harder = harderQuestion(key, pool, cards, taken);
    if (harder) {
      taken.add(harder);
      standIn[harder] = key;
      keys.push(harder);
    } else keys.push(key);
  }
  return { keys, standIn };
}
