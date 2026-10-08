// The learner's report: what they miss, what they struggle with, and how to improve.
// Pure analysis over courses + progress cards. The only runtime import is the translation core (explicit .ts),
// so node:test can load it. Sentences are produced with t() when the report is built, in the active language.
//
// Everything here is derived from data the app really stores per question card: attempts (`seen`), correct
// answers (`right`), the Leitner `box`, `due`, and — on newer cards — `hist` (recent results, oldest first) and
// `last` (time of the latest answer). We never invent data we don't have (e.g. answer speed or per-answer dates).

import type { Course, LessonInfo, QuestionStep, UnitInfo } from '../types';
import { formatPercent, t, type MessageKey } from '../i18n/core.ts';
import { rootCauses } from './diagnose.ts';

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
  /** Latest answers across its questions, oldest first ("1" right, "g" right but guessed, "0" wrong). Order across questions is by each question's last answer. */
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

type QType = QuestionStep['type'];

/** Title-case name of a question format ("Multiple choice"), in the active language. */
export const typeLabel = (type: QType) => t(`insights.format.${type}` as MessageKey);
/** The format's name as it reads inside a sentence ("multiple choice"). */
export const typeLabelInline = (type: QType) => t(`insights.formatInline.${type}` as MessageKey);
/** One concrete habit per format, offered when that format is clearly the weakest. */
export const typeAdvice = (type: QType) => t(`insights.formatAdvice.${type}` as MessageKey);

/** Per-noun message keys: what items are called changes the whole sentence in most languages. */
const byNoun = (prefix: string, noun: Report['itemNoun']) => `${prefix}.${noun}` as MessageKey;
const qKey = (course: string, lesson: string, id: string) => `${course}/${lesson}/${id}`;

export const pct = (x: number | null) => (x === null ? '–' : formatPercent(x));

/** Rolling accuracy over a history string ("1" right; "g" guessed and "0" wrong count as not known), window `w`. */
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
/**
 * `prereqOf` gives a course's prerequisite graph (content/index.ts prerequisiteGraph); with it, the report looks for
 * the shaky foundation behind repeated mistakes (lib/diagnose.ts).
 */
export function buildReport(courses: Course[], p: ProgressLike, now = Date.now(), prereqOf?: (courseId: string) => Map<string, string[]>): Report {
  const reports = courses.map((c) => analyzeCourse(c, p, now));
  const items = reports.flatMap((r) => r.items);
  const graphs = reports.filter((r) => r.hasGraph).length;
  const itemNoun: Report['itemNoun'] = graphs === reports.length && graphs ? 'concepts' : graphs === 0 ? 'lessons' : 'topics';

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
    const s = byType.get(type) ?? { attempts: 0, right: 0 };
    s.attempts += card.seen;
    s.right += card.right;
    byType.set(type, s);
  }
  const types: TypeStats[] = [...byType.entries()]
    .map(([type, s]) => ({ type, label: typeLabel(type), attempts: s.attempts, right: s.right, accuracy: s.right / s.attempts }))
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
      title: t('insights.pattern.formats.title', { format: typeLabelInline(worstType!.type) }),
      detail: t('insights.pattern.formats.detail', {
        worst: worstType!.label,
        worstPct: pct(worstType!.accuracy),
        best: typeLabelInline(bestType!.type),
        bestPct: pct(bestType!.accuracy),
      }),
    });
  if (forgotten.length)
    patterns.push({
      id: 'forgetting',
      title: t('insights.pattern.forgetting.title'),
      detail: t('insights.pattern.forgetting.detail', { items: list(forgotten.map((i) => i.label)), count: forgotten.length }),
    });
  if (due >= PILE_UP)
    patterns.push({
      id: 'pileup',
      title: t('insights.pattern.pileup.title'),
      detail:
        oldestDueDays >= 1
          ? t('insights.pattern.pileup.detailOldest', { count: due, days: t('common.days', { count: oldestDueDays }) })
          : t('insights.pattern.pileup.detail', { count: due }),
    });
  const skipped = reports.flatMap((r) => r.skippedCore.map((l) => ({ course: r.course, lesson: l })));
  if (skipped.length)
    patterns.push({
      id: 'skipped',
      title: t('insights.pattern.skipped.title'),
      detail: t('insights.pattern.skipped.detail', {
        lessons: list(skipped.map((s) => t('insights.quoted', { title: s.lesson.title }))),
        count: skipped.length,
      }),
    });

  // The diagnostician: weak concepts that build on the same shaky foundation share one cause. Fix it first.
  const roots: { course: Course; root: ItemStats; explains: ItemStats[] }[] = [];
  if (prereqOf)
    for (const r of reports) {
      if (!r.hasGraph) continue;
      const byId = new Map(r.items.filter((i) => i.kind === 'concept').map((i) => [i.id, i]));
      const shaky = (id: string) => {
        const i = byId.get(id);
        return Boolean(i && (i.weakness > 0 || i.mastery === 'struggling' || i.mastery === 'untested' || (i.mastery === 'learning' && i.recentMisses > 0)));
      };
      const weakIds = [...byId.values()].filter((i) => i.weakness > 0).map((i) => i.id);
      for (const rc of rootCauses(weakIds, shaky, prereqOf(r.course.id)))
        roots.push({ course: r.course, root: byId.get(rc.root)!, explains: rc.explains.map((id) => byId.get(id)!) });
    }
  roots.sort((a, b) => b.explains.length - a.explains.length || b.root.weakness - a.root.weakness);
  const topRoot = roots[0];

  // ---------- tips: rule-based, each tied to evidence and an action ----------
  const tips: Tip[] = [];
  if (topRoot) {
    const { root, explains } = topRoot;
    tips.push({
      id: `root-${root.key}`,
      title: t('insights.tip.root.title', { name: name(root) }),
      evidence: t('insights.tip.root.evidence', { items: list(explains.map(name)), count: explains.length }),
      advice: root.mastery === 'untested' ? t('insights.tip.root.adviceUntested') : t('insights.tip.root.advice'),
      actions: [
        { label: t('insights.action.openLesson', { lesson: root.lessonTitle }), route: ['course', root.courseId, 'lesson', root.lessonId] },
        ...(root.mastery === 'untested' ? [] : [{ label: t('insights.action.practiseConcept', { concept: root.label }), route: ['practice', root.courseId, root.id] }]),
      ],
    });
  }
  const oneCourse = courses.length === 1 ? courses[0].id : undefined;
  const reviewRoute = oneCourse ? ['review', 'start', oneCourse] : ['review', 'start'];
  if (due >= PILE_UP || (due >= 5 && oldestDueDays >= 3))
    tips.push({
      id: 'clear-reviews',
      title: t('insights.tip.clearReviews.title', { count: due }),
      evidence:
        oldestDueDays >= 1
          ? t('insights.tip.clearReviews.evidenceOldest', { count: due, days: t('common.days', { count: oldestDueDays }) })
          : t('insights.tip.clearReviews.evidence', { count: due }),
      advice: t('insights.tip.clearReviews.advice'),
      actions: [{ label: t('insights.action.startReviews'), route: reviewRoute }],
    });
  // Weak concepts the root cause explains are covered by its tip.
  for (const w of weak.filter((i) => !topRoot?.explains.includes(i) && i !== topRoot?.root).slice(0, 2)) {
    tips.push({
      id: `weak-${w.key}`,
      title: t('insights.tip.weak.title', { name: name(w) }),
      evidence: missText(w),
      advice:
        w.kind === 'concept'
          ? t('insights.tip.weak.adviceConcept', { lesson: w.lessonTitle })
          : t('insights.tip.weak.adviceLesson', { course: w.courseTitle }),
      actions: [
        {
          label: w.kind === 'concept' ? t('insights.action.openLesson', { lesson: w.lessonTitle }) : t('insights.action.redoLesson'),
          route: ['course', w.courseId, 'lesson', w.lessonId],
        },
        w.kind === 'concept'
          ? { label: t('insights.action.practiseConcept', { concept: w.label }), route: ['practice', w.courseId, w.id] }
          : { label: t('insights.action.mixedPractice'), route: ['practice', w.courseId] },
      ],
    });
  }
  const forgotNotWeak = forgotten.filter((f) => !weak.slice(0, 2).includes(f) && !topRoot?.explains.includes(f) && f !== topRoot?.root);
  if (forgotNotWeak.length) {
    const f = forgotNotWeak[0];
    tips.push({
      id: 'forgetting',
      title: t('insights.tip.forgetting.title', { name: name(f) }),
      evidence: t('insights.tip.forgetting.evidence', { name: name(f) }),
      advice: t('insights.tip.forgetting.advice'),
      actions: [{ label: t('insights.action.practiseWeakest'), route: ['review', 'weak', f.courseId] }],
    });
  }
  if (formatGap)
    tips.push({
      id: `format-${worstType!.type}`,
      title: t('insights.tip.format.title', { format: worstType!.label }),
      evidence: t('insights.tip.format.evidence', {
        worstPct: pct(worstType!.accuracy),
        worst: typeLabelInline(worstType!.type),
        bestPct: pct(bestType!.accuracy),
        best: typeLabelInline(bestType!.type),
      }),
      advice: typeAdvice(worstType!.type),
      actions: [{ label: t('insights.action.practiseWeakest'), route: oneCourse ? ['review', 'weak', oneCourse] : ['review', 'weak'] }],
    });
  if (skipped.length) {
    const s = skipped[0];
    tips.push({
      id: 'skipped',
      title: t('insights.tip.skipped.title', { lesson: s.lesson.title }),
      evidence: t('insights.tip.skipped.evidence', { course: s.course.title }),
      advice: t('insights.tip.skipped.advice'),
      actions: [{ label: t('insights.action.openLessonPlain'), route: ['course', s.course.id, 'lesson', s.lesson.id] }],
    });
  }
  if (tips.length < 3 && strengths.length) {
    const c = reports.find((r) => r.items.some((i) => i.mastery === 'mastered'))!.course;
    tips.push({
      id: 'confirm',
      title: t('insights.tip.confirm.title'),
      evidence: t(byNoun('insights.tip.confirm.evidence', itemNoun), { count: strengths.length }),
      advice: t('insights.tip.confirm.advice'),
      actions: [{ label: t('insights.action.courseQuiz', { course: c.title }), route: ['course', c.id, 'quiz'] }],
    });
  }
  if (tips.length < 3 && totalAttempts >= MIN_TOTAL_ATTEMPTS)
    tips.push({
      id: 'mix',
      title: t('insights.tip.mix.title'),
      evidence: weak.length ? t(byNoun('insights.tip.mix.evidence', itemNoun), { count: weak.length }) : t('insights.tip.mix.evidenceNone'),
      advice: t('insights.tip.mix.advice'),
      actions: [{ label: t('insights.action.mixedPractice'), route: oneCourse ? ['practice', oneCourse] : ['practice'] }],
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
  const params = { name: i.label, misses: i.recentMisses, count: i.recentCount };
  if (i.kind === 'concept') return t(i.allTime ? 'insights.miss.conceptAllTime' : 'insights.miss.concept', params);
  return t(i.allTime ? 'insights.miss.lessonAllTime' : 'insights.miss.lesson', params);
}

/** How an item is named in a sentence: concepts as is, lessons in quotes. */
export const name = (i: ItemStats) => (i.kind === 'concept' ? i.label : t('insights.quoted', { title: i.label }));

/** "a", "a and b", "a, b and 2 more". */
export function list(xs: string[], max = 3) {
  if (xs.length <= 1) return xs[0] ?? '';
  const sep = t('insights.list.separator');
  if (xs.length <= max) return t('insights.list.and', { items: xs.slice(0, -1).join(sep), last: xs[xs.length - 1] });
  return t('insights.list.more', { items: xs.slice(0, max).join(sep), count: xs.length - max });
}

/** Whether there's enough practice to show the Home "learning report" card. */
export const hasEnoughForReport = (courses: Course[], p: ProgressLike) => {
  let n = 0;
  for (const c of courses) for (const q of courseQuestions(c)) n += p.cards[q.key]?.seen ?? 0;
  return n >= MIN_TOTAL_ATTEMPTS;
};
