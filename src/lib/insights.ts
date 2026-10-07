// The learner's report: what they miss, what they struggle with, and how to improve.
// Pure analysis over courses + progress cards. No runtime imports (type-only), so node:test can load it.
//
// Everything here is derived from data the app really stores per question card: attempts (`seen`), correct
// answers (`right`), the Leitner `box`, `due`, and — on newer cards — `hist` (recent results, oldest first) and
// `last` (time of the latest answer). We never invent data we don't have (e.g. answer speed or per-answer dates).

import type { Course, LessonInfo, QuestionStep, UnitInfo } from '../types';

// ---------- inputs ----------

export interface CardLike {
  box: number;
  due: number;
  seen: number;
  right: number;
  hist?: string;
  last?: number;
}

export interface ProgressLike {
  cards: Record<string, CardLike>;
  completed: Record<string, number>;
}

// ---------- thresholds (kept in one place so the report can explain itself) ----------

/** Same as MASTERED_BOX in storage.ts: a card at box 4+ has been right at least three times in a row. */
export const MASTERED = 4;
/** How many of the latest answers count as "recent". */
export const RECENT = 6;
/** Latest answers kept per concept for the sparkline. */
export const HIST_WINDOW = 12;
/** Answers needed before a concept or lesson gets a verdict. */
export const MIN_ATTEMPTS = 3;
/** Recent accuracy below this (with at least 2 recent misses) counts as struggling. */
export const STRUGGLE_BELOW = 0.6;
/** Answers needed per question format before formats are compared. */
export const MIN_TYPE_ATTEMPTS = 5;
/** Accuracy gap (0–1) between formats worth pointing out. */
export const TYPE_GAP = 0.2;
/** Due reviews at which they count as piling up. */
export const PILE_UP = 10;
/** Total answers before the report (and the Home card) has something to say. */
export const MIN_TOTAL_ATTEMPTS = 10;

const DAY = 86_400_000;

// ---------- outputs ----------

export type Mastery = 'none' | 'untested' | 'learning' | 'struggling' | 'mastered';

export interface ItemStats {
  /** "<course>/<concept>" or "<course>/<lesson>". */
  key: string;
  kind: 'concept' | 'lesson';
  id: string;
  courseId: string;
  courseTitle: string;
  label: string;
  summary?: string;
  lessonId: string;
  lessonTitle: string;
  unitId: string;
  unitTitle: string;
  /** Graded questions that test it. */
  questions: number;
  /** Of those, how many have been answered at least once. */
  seenQuestions: number;
  attempts: number;
  right: number;
  /** All-time accuracy, or null with no attempts. */
  accuracy: number | null;
  /** Latest answers across its questions, oldest first ("1" right, "0" wrong). Order across questions is by each question's last answer. */
  recent: string;
  /** Accuracy over the last RECENT answers (falls back to all-time when cards predate `hist`). */
  recentAccuracy: number | null;
  /** Misses among the answers recentAccuracy is based on. */
  recentMisses: number;
  /** How many answers recentAccuracy is based on (up to RECENT, or every answer when `allTime`). */
  recentCount: number;
  /** Some cards predate `hist`, so "recent" numbers are all-time numbers. */
  allTime: boolean;
  /** Lowest box among answered questions (0 if none answered). */
  minBox: number;
  /** Time of the latest answer, if known. */
  lastSeen: number | null;
  /** Answered questions whose review is due now. */
  due: number;
  /** Questions that were right at least twice in a row, then wrong on the latest try (see hasLapse). */
  lapses: number;
  mastery: Mastery;
  /** Fewer than MIN_ATTEMPTS answers: shown, but without a verdict. */
  thin: boolean;
  /**
   * Ranking score for "needs attention": 1 per recent miss + 0.5 per lapsed question + up to 0.5 for low all-time
   * accuracy. 0 = not weak (thin, mastered, or fewer than 2 recent misses without struggling).
   */
  weakness: number;
  /** Rolling accuracy (window 3) over `recent`, for the sparkline. */
  trend: number[];
}

export interface TypeStats {
  type: QuestionStep['type'];
  label: string;
  attempts: number;
  right: number;
  accuracy: number;
}

export interface LessonGroup {
  lesson: LessonInfo;
  items: ItemStats[];
}
export interface UnitGroup {
  unit: UnitInfo;
  lessons: LessonGroup[];
}

export interface CourseReport {
  course: Course;
  /** True when the course has a concept graph; otherwise items are its lessons. */
  hasGraph: boolean;
  items: ItemStats[];
  units: UnitGroup[];
  attempts: number;
  due: number;
  /** Core lessons not done and never practised, that come before the furthest lesson you've done. */
  skippedCore: LessonInfo[];
}

export interface Window {
  days: number;
  /** Questions whose latest answer falls in the window. */
  questions: number;
  /** Of those, how many were right on that latest answer. */
  right: number;
  accuracy: number | null;
}

export type ActionLink = { label: string; route: string[] };

export interface Tip {
  id: string;
  title: string;
  /** The evidence the tip is based on. */
  evidence: string;
  /** What to do and why. */
  advice: string;
  actions: ActionLink[];
}

export interface Pattern {
  id: 'formats' | 'forgetting' | 'pileup' | 'skipped';
  title: string;
  detail: string;
}

export interface Report {
  courses: CourseReport[];
  /** What items are called: "concepts", "lessons" or "topics" (a mix). */
  itemNoun: 'concepts' | 'lessons' | 'topics';
  totalAttempts: number;
  enoughData: boolean;
  week: Window;
  month: Window;
  counts: { mastered: number; learning: number; struggling: number; untested: number };
  due: number;
  /** Oldest due review, in whole days overdue. */
  oldestDueDays: number;
  weak: ItemStats[];
  strengths: ItemStats[];
  forgotten: ItemStats[];
  types: TypeStats[];
  patterns: Pattern[];
  tips: Tip[];
}

// ---------- helpers ----------

export const TYPE_LABELS: Record<QuestionStep['type'], string> = {
  mcq: 'Multiple choice',
  numeric: 'Number answers',
  text: 'Short answers',
  output: 'Predict the output',
  bug: 'Bug hunts',
  order: 'Put in order',
  buckets: 'Sort into groups',
  trace: 'Code traces',
  truthtable: 'Truth tables',
  logicgrid: 'Logic grids',
  balance: 'Balance puzzles',
};

/** One concrete habit per format, offered when that format is clearly the weakest. */
export const TYPE_ADVICE: Record<QuestionStep['type'], string> = {
  mcq: 'Try to answer in your head before reading the choices, then pick the one that matches.',
  numeric: 'Estimate the answer first so a result that is way off stands out, and check the units.',
  text: 'Say the idea in your own words first, then name the exact term the question asks for.',
  output: 'Trace the code on paper: write each variable after every line before you type the output.',
  bug: 'Read the error first, then trace the variables line by line to find where they go wrong.',
  order: 'Place the first and last pieces first, then fill in the middle.',
  buckets: 'Name the rule behind each group before you sort the first card.',
  trace: 'Predict what each line changes before you step forward, then compare.',
  truthtable: 'Fill one column at a time and lean on the helper columns.',
  logicgrid: 'Mark what each clue rules out, not only what it confirms.',
  balance: 'Gather the unknowns on one side first, then the plain numbers on the other.',
};

const qKey = (course: string, lesson: string, id: string) => `${course}/${lesson}/${id}`;

export const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)}%`);

/** Rolling accuracy over a "1"/"0" string, window `w`. */
export function rolling(results: string, w = 3): number[] {
  const out: number[] = [];
  for (let i = 0; i < results.length; i++) {
    const win = results.slice(Math.max(0, i - w + 1), i + 1);
    out.push([...win].filter((c) => c === '1').length / win.length);
  }
  return out;
}

/** True if a card was right at least twice in a row, then wrong on its latest try(s): known once, missed now. */
export const hasLapse = (hist?: string) => Boolean(hist && /11+0+$/.test(hist));

interface Q {
  key: string;
  type: QuestionStep['type'];
  lesson: LessonInfo;
  concepts?: string[];
}

function courseQuestions(course: Course): Q[] {
  return course.lessons.flatMap((lesson) =>
    lesson.questions.map((s) => ({ key: qKey(course.id, lesson.id, s.id), type: s.type, lesson, concepts: s.concepts })),
  );
}

interface Base {
  key: string;
  kind: 'concept' | 'lesson';
  id: string;
  label: string;
  summary?: string;
  lesson: LessonInfo;
}

function itemStats(course: Course, base: Base, qs: Q[], p: ProgressLike, now: number): ItemStats {
  const unit = course.units.find((u) => u.lessons.includes(base.lesson)) ?? course.units[0];
  const cards = qs.map((q) => p.cards[q.key]).filter((c): c is CardLike => Boolean(c && c.seen > 0));
  const attempts = cards.reduce((s, c) => s + c.seen, 0);
  const right = cards.reduce((s, c) => s + c.right, 0);
  const ordered = [...cards].sort((a, b) => (a.last ?? 0) - (b.last ?? 0));
  const merged = ordered.map((c) => c.hist ?? '').join('');
  const recent = merged.slice(-HIST_WINDOW);
  const window = merged.slice(-RECENT);
  // Old cards have no hist, so their order is unknown: then fall back to all-time numbers rather than guess.
  const allTime = cards.some((c) => !c.hist);
  const winRight = [...window].filter((c) => c === '1').length;
  const recentCount = allTime ? attempts : window.length;
  const recentMisses = allTime ? attempts - right : window.length - winRight;
  const recentAccuracy = recentCount ? (allTime ? right : winRight) / recentCount : null;
  const lastSeen = cards.reduce<number | null>((m, c) => (c.last && (m === null || c.last > m) ? c.last : m), null);
  const minBox = cards.length ? Math.min(...cards.map((c) => c.box)) : 0;
  const lapses = cards.filter((c) => hasLapse(c.hist)).length;
  const thin = attempts < MIN_ATTEMPTS;

  let mastery: Mastery;
  if (!qs.length) mastery = 'none';
  else if (!cards.length) mastery = 'untested';
  else if (!thin && recentAccuracy !== null && recentAccuracy < STRUGGLE_BELOW && recentMisses >= 2) mastery = 'struggling';
  else if (minBox >= MASTERED) mastery = 'mastered';
  else mastery = 'learning';

  // Explainable ranking: each recent miss counts 1, each question that lapsed counts 0.5, plus a small nudge
  // for low all-time accuracy to break ties. Thin items and items with no recent misses are not "weak".
  const accuracy = attempts ? right / attempts : null;
  const isWeak = !thin && mastery !== 'mastered' && (mastery === 'struggling' || recentMisses >= 2);
  const weakness = isWeak ? recentMisses + 0.5 * lapses + (1 - (accuracy ?? 1)) * 0.5 : 0;

  return {
    key: base.key,
    kind: base.kind,
    id: base.id,
    courseId: course.id,
    courseTitle: course.title,
    label: base.label,
    summary: base.summary,
    lessonId: base.lesson.id,
    lessonTitle: base.lesson.title,
    unitId: unit?.id ?? '',
    unitTitle: unit?.title ?? '',
    questions: qs.length,
    seenQuestions: cards.length,
    attempts,
    right,
    accuracy,
    recent,
    recentAccuracy,
    recentMisses,
    recentCount,
    allTime,
    minBox,
    lastSeen,
    due: cards.filter((c) => c.due <= now).length,
    lapses,
    mastery,
    thin,
    weakness,
    trend: rolling(recent),
  };
}

export function analyzeCourse(course: Course, p: ProgressLike, now = Date.now()): CourseReport {
  const qs = courseQuestions(course);
  const hasGraph = Boolean(course.concepts?.length);
  const lessonById = new Map(course.lessons.map((l) => [l.id, l]));
  const items: ItemStats[] = hasGraph
    ? course.concepts!.flatMap((c) => {
        const lesson = lessonById.get(c.lesson);
        if (!lesson) return [];
        const tagged = qs.filter((q) => q.concepts?.includes(c.id));
        return [itemStats(course, { key: `${course.id}/${c.id}`, kind: 'concept', id: c.id, label: c.label, summary: c.summary, lesson }, tagged, p, now)];
      })
    : course.lessons.map((l) =>
        itemStats(course, { key: `${course.id}/${l.id}`, kind: 'lesson', id: l.id, label: l.title, lesson: l }, qs.filter((q) => q.lesson === l), p, now),
      );

  const units: UnitGroup[] = course.units
    .map((unit) => ({
      unit,
      lessons: unit.lessons.map((lesson) => ({ lesson, items: items.filter((i) => i.lessonId === lesson.id) })).filter((g) => g.items.length),
    }))
    .filter((u) => u.lessons.length);

  const seenLesson = (l: LessonInfo) =>
    Boolean(p.completed[`${course.id}/${l.id}`]) || qs.some((q) => q.lesson === l && (p.cards[q.key]?.seen ?? 0) > 0);
  const furthest = course.lessons.reduce((m, l, i) => (seenLesson(l) ? i : m), -1);
  const skippedCore = course.lessons.filter((l, i) => i < furthest && l.pareto === 'core' && !seenLesson(l));

  return {
    course,
    hasGraph,
    items,
    units,
    attempts: qs.reduce((s, q) => s + (p.cards[q.key]?.seen ?? 0), 0),
    due: qs.filter((q) => {
      const c = p.cards[q.key];
      return c && c.due <= now;
    }).length,
    skippedCore,
  };
}

function windowStats(cards: CardLike[], days: number, now: number): Window {
  const inWin = cards.filter((c) => c.last !== undefined && now - c.last <= days * DAY && c.hist);
  const right = inWin.filter((c) => c.hist!.endsWith('1')).length;
  return { days, questions: inWin.length, right, accuracy: inWin.length ? right / inWin.length : null };
}

/** Is the course started (any lesson done or question answered)? */
export function isStarted(course: Course, p: ProgressLike) {
  return (
    course.lessons.some((l) => p.completed[`${course.id}/${l.id}`]) ||
    Object.keys(p.cards).some((k) => k.startsWith(`${course.id}/`) && p.cards[k].seen > 0)
  );
}

/** Builds the full report for the given courses (usually the started ones, or one course). */
export function buildReport(courses: Course[], p: ProgressLike, now = Date.now()): Report {
  const reports = courses.map((c) => analyzeCourse(c, p, now));
  const items = reports.flatMap((r) => r.items);
  const graphs = reports.filter((r) => r.hasGraph).length;
  const itemNoun = graphs === reports.length && graphs ? 'concepts' : graphs === 0 ? 'lessons' : 'topics';

  // Cards of the questions in scope, and accuracy by question format.
  const scoped: { card: CardLike; type: QuestionStep['type']; due: number }[] = [];
  for (const c of courses)
    for (const q of courseQuestions(c)) {
      const card = p.cards[q.key];
      if (card && card.seen > 0) scoped.push({ card, type: q.type, due: card.due });
    }
  const totalAttempts = scoped.reduce((s, x) => s + x.card.seen, 0);
  const byType = new Map<QuestionStep['type'], { attempts: number; right: number }>();
  for (const { card, type } of scoped) {
    const t = byType.get(type) ?? { attempts: 0, right: 0 };
    t.attempts += card.seen;
    t.right += card.right;
    byType.set(type, t);
  }
  const types: TypeStats[] = [...byType.entries()]
    .map(([type, t]) => ({ type, label: TYPE_LABELS[type], attempts: t.attempts, right: t.right, accuracy: t.right / t.attempts }))
    .sort((a, b) => b.attempts - a.attempts);

  const dueCards = scoped.filter((x) => x.due <= now);
  const due = dueCards.length;
  const oldestDueDays = due ? Math.floor((now - Math.min(...dueCards.map((x) => x.due))) / DAY) : 0;

  const counts = { mastered: 0, learning: 0, struggling: 0, untested: 0 };
  for (const i of items) if (i.mastery !== 'none') counts[i.mastery]++;

  const weak = items
    .filter((i) => i.weakness > 0)
    .sort((a, b) => b.weakness - a.weakness || (a.recentAccuracy ?? 1) - (b.recentAccuracy ?? 1) || b.attempts - a.attempts);
  const strengths = items.filter((i) => i.mastery === 'mastered').sort((a, b) => b.attempts - a.attempts || a.label.localeCompare(b.label));
  const forgotten = items.filter((i) => i.lapses > 0 && i.mastery !== 'mastered').sort((a, b) => b.lapses - a.lapses);

  const patterns: Pattern[] = [];
  const comparable = types.filter((t) => t.attempts >= MIN_TYPE_ATTEMPTS);
  const worstType = comparable.length >= 2 ? [...comparable].sort((a, b) => a.accuracy - b.accuracy)[0] : undefined;
  const bestType = comparable.length >= 2 ? [...comparable].sort((a, b) => b.accuracy - a.accuracy)[0] : undefined;
  const formatGap = worstType && bestType && bestType.accuracy - worstType.accuracy >= TYPE_GAP;
  if (formatGap)
    patterns.push({
      id: 'formats',
      title: `Weakest format: ${worstType!.label.toLowerCase()}`,
      detail: `${worstType!.label} ${pct(worstType!.accuracy)} right vs ${bestType!.label.toLowerCase()} ${pct(bestType!.accuracy)} (all answers so far).`,
    });
  if (forgotten.length)
    patterns.push({
      id: 'forgetting',
      title: 'Right once, wrong later',
      detail: `${list(forgotten.map((i) => i.label))}: you answered ${forgotten.length === 1 ? 'a question on it' : 'questions on these'} right at least twice, then missed ${forgotten.length === 1 ? 'it' : 'them'} on your latest try. That's normal forgetting, and the cue to review.`,
    });
  if (due >= PILE_UP)
    patterns.push({
      id: 'pileup',
      title: 'Reviews are piling up',
      detail: `${due} reviews are due${oldestDueDays >= 1 ? `, the oldest for ${oldestDueDays} day${oldestDueDays === 1 ? '' : 's'}` : ''}.`,
    });
  const skipped = reports.flatMap((r) => r.skippedCore.map((l) => ({ course: r.course, lesson: l })));
  if (skipped.length)
    patterns.push({
      id: 'skipped',
      title: 'Core lessons you skipped',
      detail: `${list(skipped.map((s) => `"${s.lesson.title}"`))} ${skipped.length === 1 ? 'is a core lesson' : 'are core lessons'} you haven't opened, though you've done later ones.`,
    });

  // ---------- tips: rule-based, each tied to evidence and an action ----------
  const tips: Tip[] = [];
  const oneCourse = courses.length === 1 ? courses[0].id : undefined;
  const reviewRoute = oneCourse ? ['review', 'start', oneCourse] : ['review', 'start'];
  if (due >= PILE_UP || (due >= 5 && oldestDueDays >= 3))
    tips.push({
      id: 'clear-reviews',
      title: `Clear your ${due} due reviews first`,
      evidence: `${due} reviews are due${oldestDueDays >= 1 ? `; the oldest has waited ${oldestDueDays} day${oldestDueDays === 1 ? '' : 's'}` : ''}.`,
      advice: 'Do them before new lessons. Spaced review tends to work best when it happens close to the due date.',
      actions: [{ label: 'Start reviews', route: reviewRoute }],
    });
  for (const w of weak.slice(0, 2)) {
    tips.push({
      id: `weak-${w.key}`,
      title: `Revisit ${name(w)}`,
      evidence: missText(w),
      advice:
        w.kind === 'concept'
          ? `Reread the lesson "${w.lessonTitle}", then do a short mixed practice: mixing it with other ideas tends to help you pick the right approach, not just repeat it.`
          : `Redo the lesson, then a short mixed practice on ${w.courseTitle}.`,
      actions: [
        { label: w.kind === 'concept' ? `Open "${w.lessonTitle}"` : 'Redo the lesson', route: ['course', w.courseId, 'lesson', w.lessonId] },
        w.kind === 'concept'
          ? { label: `Practise ${w.label}`, route: ['practice', w.courseId, w.id] }
          : { label: 'Mixed practice', route: ['practice', w.courseId] },
      ],
    });
  }
  const forgotNotWeak = forgotten.filter((f) => !weak.slice(0, 2).includes(f));
  if (forgotNotWeak.length) {
    const f = forgotNotWeak[0];
    tips.push({
      id: 'forgetting',
      title: `Review ${name(f)} sooner`,
      evidence: `You'd answered ${name(f)} right at least twice, then missed it on your latest try.`,
      advice: 'Retrieval practice spread over several days tends to make memories last. Practise your weakest questions today and let the schedule bring them back.',
      actions: [{ label: 'Practise weakest', route: ['review', 'weak', f.courseId] }],
    });
  }
  if (formatGap)
    tips.push({
      id: `format-${worstType!.type}`,
      title: `${worstType!.label}: try a different approach`,
      evidence: `${pct(worstType!.accuracy)} right on ${worstType!.label.toLowerCase()} vs ${pct(bestType!.accuracy)} on ${bestType!.label.toLowerCase()}.`,
      advice: TYPE_ADVICE[worstType!.type],
      actions: [{ label: 'Practise weakest', route: oneCourse ? ['review', 'weak', oneCourse] : ['review', 'weak'] }],
    });
  if (skipped.length) {
    const s = skipped[0];
    tips.push({
      id: 'skipped',
      title: `Do the core lesson "${s.lesson.title}"`,
      evidence: `It's a core lesson in ${s.course.title} that you haven't opened, though you've moved past it.`,
      advice: 'Core lessons carry most of a course; later lessons often build on them.',
      actions: [{ label: 'Open lesson', route: ['course', s.course.id, 'lesson', s.lesson.id] }],
    });
  }
  if (tips.length < 3 && strengths.length) {
    const c = reports.find((r) => r.items.some((i) => i.mastery === 'mastered'))!.course;
    tips.push({
      id: 'confirm',
      title: 'Check what you know with a quiz',
      evidence: `You've mastered ${strengths.length} ${strengths.length === 1 ? itemNoun.replace(/s$/, '') : itemNoun}.`,
      advice: 'A quiz mixes questions from the whole course, a quick way to confirm it sticks and find gaps.',
      actions: [{ label: `${c.title} quiz`, route: ['course', c.id, 'quiz'] }],
    });
  }
  if (tips.length < 3 && totalAttempts >= MIN_TOTAL_ATTEMPTS)
    tips.push({
      id: 'mix',
      title: 'Mix your practice',
      evidence: weak.length ? `${weak.length} ${itemNoun} still trip you up now and then.` : 'Nothing stands out as weak right now.',
      advice: 'Practising several topics in one session tends to help you choose the right method, not just recall it.',
      actions: [{ label: 'Mixed practice', route: oneCourse ? ['practice', oneCourse] : ['practice'] }],
    });

  const cardsOnly = scoped.map((x) => x.card);
  return {
    courses: reports,
    itemNoun,
    totalAttempts,
    enoughData: totalAttempts >= MIN_TOTAL_ATTEMPTS,
    week: windowStats(cardsOnly, 7, now),
    month: windowStats(cardsOnly, 30, now),
    counts,
    due,
    oldestDueDays,
    weak,
    strengths,
    forgotten,
    types,
    patterns,
    tips: tips.slice(0, 5),
  };
}

/** "You missed Contrapositive 4 of the last 6 times." — the evidence line for a weak item. */
export function missText(i: ItemStats) {
  const what = i.kind === 'concept' ? i.label : `questions in "${i.label}"`;
  const times = `time${i.recentCount === 1 ? '' : 's'}`;
  return i.allTime
    ? `You've missed ${what} ${i.recentMisses} of ${i.recentCount} ${times} so far.`
    : `You missed ${what} ${i.recentMisses} of the last ${i.recentCount} ${times}.`;
}

/** How an item is named in a sentence: concepts as is, lessons in quotes. */
export const name = (i: ItemStats) => (i.kind === 'concept' ? i.label : `"${i.label}"`);

/** "a", "a and b", "a, b and 2 more". */
export function list(xs: string[], max = 3) {
  if (xs.length <= 1) return xs[0] ?? '';
  if (xs.length <= max) return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
  return `${xs.slice(0, max).join(', ')} and ${xs.length - max} more`;
}

/** Whether there's enough practice to show the Home "learning report" card. */
export const hasEnoughForReport = (courses: Course[], p: ProgressLike) => {
  let n = 0;
  for (const c of courses) for (const q of courseQuestions(c)) n += p.cards[q.key]?.seen ?? 0;
  return n >= MIN_TOTAL_ATTEMPTS;
};
