// Mixed (interleaved) practice: picks a short session of questions the learner has already met, mixing related
// concepts so they practise telling similar ideas apart. Pure and deterministic for a given seed. The only runtime
// import is the translation core (explicit .ts), so node:test can load it.
//
// Rules, in order of how the session is built:
//   1. Only questions the learner has met: in a completed lesson, or already answered (a card exists). Never questions
//      from lessons they haven't reached.
//   2. Weak and due concepts weigh more, but some strong ones are always kept for confidence and contrast.
//   3. Related concepts (1 hop in the concept graph, including cross-course "<course>/<concept>" links) are pulled in
//      next to the weak ones, so similar ideas sit side by side.
//   4. Interleave: no two consecutive questions on the same concept; avoid the same lesson back-to-back and the same
//      question type back-to-back where possible.
//   5. Courses without a concept graph (or untagged questions) fall back to lessons as the "concept".
//   6. Questions answered right in the last 10 minutes are left out.

import type { Course, LessonInfo, QuestionInfo } from '../types.ts';
import type { Card } from './storage.ts';
import { t } from '../i18n/core.ts';

/** Structurally the same as QuestionRef in src/content/index.ts. */
export interface PracticeQuestion {
  key: string;
  course: Course;
  lesson: LessonInfo;
  step: QuestionInfo;
}

export interface MixProgress {
  cards: Record<string, Card>;
  completed: Record<string, number>;
}

export interface MixOptions {
  /** Every loaded course (used to resolve cross-course links). */
  courses: Course[];
  /** Every question of every course. */
  questions: PracticeQuestion[];
  progress: MixProgress;
  /** Limit to one course (plus its cross-course neighbours). Omit for every course the learner has started. */
  courseId?: string;
  /** With courseId: focus on this concept and the concepts linked to it. Falls back to the course mix when thin. */
  conceptId?: string;
  /** Number of questions wanted (default 12). The session is shorter when fewer questions qualify. */
  size?: number;
  seed?: number;
  now?: number;
}

export type TopicKind = 'concept' | 'lesson';
export type TopicStatus = 'weak' | 'due' | 'new' | 'ok' | 'strong';

export interface TopicLink {
  /** Topic id of the other end. */
  other: string;
  otherLabel: string;
  /** The link read as a sentence, e.g. "Contrapositive is not the same as Converse". */
  sentence: string;
  /** The other end is in a different course. */
  cross: boolean;
}

export interface Topic {
  /** "<course>/<concept>" for a concept, "<course>/@<lesson>" for the lesson fallback. */
  id: string;
  kind: TopicKind;
  label: string;
  course: Course;
  /** The lesson that teaches it (where to go back to). */
  lesson: LessonInfo;
  /** 0..1 from recent results and Leitner boxes; 0.5 when nothing has been answered yet. */
  strength: number;
  status: TopicStatus;
  /** Answers on record across its questions (recent window). */
  recentRight: number;
  recentSeen: number;
  dueCount: number;
}

export type Reason =
  | { kind: 'due' }
  | { kind: 'missed' }
  | { kind: 'new' }
  | { kind: 'weak'; right: number; seen: number }
  | { kind: 'strong' }
  | { kind: 'focus' }
  | { kind: 'related'; link: TopicLink };

export interface PlannedTopic extends Topic {
  /** Questions from this topic in the session. */
  count: number;
  /** Why the topic is in the mix (first entry is the main reason). */
  reasons: Reason[];
}

export interface Pick {
  q: PracticeQuestion;
  /** The topic this question was chosen for. */
  topic: PlannedTopic;
  /** Every topic the question is tagged with (the chosen one first). */
  tags: string[];
  /** Why this particular question (question-level reasons first, then the topic's). */
  reasons: Reason[];
}

export interface MixPlan {
  picks: Pick[];
  /** Topics in the session, in order of first appearance. */
  topics: PlannedTopic[];
  /** Lessons the learner has reached in scope (completed or answered something in). */
  reachedLessons: number;
  /** Questions the learner has met in scope, before leaving out the recent ones. */
  metCount: number;
  /** Met questions left out because they were answered right in the last 10 minutes. */
  recentCount: number;
  /** At least one topic comes from a concept graph (otherwise the mix is by lesson). */
  usesGraph: boolean;
  /** A conceptId was asked for, but it had too few questions, so this is the normal course mix. */
  focusFallback: boolean;
  /** The focused concept's topic, when the focus was used. */
  focus?: Topic;
}

export const SESSION_SIZES = [8, 12, 20] as const;
export const DEFAULT_SIZE = 12;
/** Lessons needed before mixed practice makes sense. */
export const MIN_LESSONS = 2;
/** Questions answered right this recently are left out. */
export const RECENT_MS = 10 * 60_000;
/** A concept focus needs at least this many questions, or the normal course mix is used. */
export const MIN_FOCUS_QUESTIONS = 4;
/** Same as MAX_BOX in storage.ts (not imported at runtime to keep this module pure). */
const TOP_BOX = 6;
const RECENT_WINDOW = 5;

// ---------------------------------------------------------------- helpers

/** mulberry32: small, fast, deterministic. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lessonId = (courseId: string, lesson: string) => `${courseId}/${lesson}`;
const lessonTopicId = (courseId: string, lesson: string) => `${courseId}/@${lesson}`;
const isRecentRight = (c: Card | undefined, now: number) =>
  Boolean(c && c.last !== undefined && now - c.last < RECENT_MS && c.hist?.endsWith('1'));

/** Recent accuracy for a card: last few results from `hist`, or lifetime right/seen on old cards. */
function recent(c: Card): { right: number; seen: number } {
  if (c.hist) {
    const w = c.hist.slice(-RECENT_WINDOW);
    return { right: [...w].filter((x) => x === '1').length, seen: w.length };
  }
  return { right: c.right, seen: c.seen };
}

/** 0..1: how well a card is known. */
export function cardStrength(c: Card): number {
  const r = recent(c);
  const acc = r.seen ? r.right / r.seen : 0.5;
  const box = (Math.min(Math.max(c.box, 1), TOP_BOX) - 1) / (TOP_BOX - 1);
  return 0.6 * acc + 0.4 * box;
}

/** The latest answer was wrong, or right but guessed (a guess isn't knowing it). */
const lastMissed = (c: Card | undefined) => Boolean(c?.hist && /[0g]$/.test(c.hist));

/** The topics a question belongs to: its concept tags, or its lesson when its course has no usable tags. */
export function topicsOf(q: PracticeQuestion): string[] {
  const known = new Set((q.course.concepts ?? []).map((c) => c.id));
  const tags = (q.step.concepts ?? []).filter((t) => known.has(t)).map((t) => `${q.course.id}/${t}`);
  return tags.length ? tags : [lessonTopicId(q.course.id, q.lesson.id)];
}

/** Lessons reached (completed, or with an answered question), optionally limited to some courses. */
export function reachedLessons(questions: PracticeQuestion[], p: MixProgress, courseIds?: string[]): Set<string> {
  const inScope = (id: string) => !courseIds || courseIds.includes(id);
  const out = new Set<string>();
  for (const k of Object.keys(p.completed)) if (inScope(k.split('/')[0])) out.add(k);
  for (const q of questions) if (inScope(q.course.id) && p.cards[q.key]) out.add(lessonId(q.course.id, q.lesson.id));
  return out;
}

/** Undirected 1-hop neighbourhoods over topic ids, from every course's links. */
function linkGraph(courses: Course[]): Map<string, TopicLink[]> {
  const label = new Map<string, string>();
  for (const c of courses) for (const k of c.concepts ?? []) label.set(`${c.id}/${k.id}`, k.label);
  const adj = new Map<string, TopicLink[]>();
  const add = (a: string, b: string, sentence: string) => {
    if (!label.has(a) || !label.has(b) || a === b) return;
    const list = adj.get(a) ?? [];
    if (!list.some((l) => l.other === b)) list.push({ other: b, otherLabel: label.get(b)!, sentence, cross: a.split('/')[0] !== b.split('/')[0] });
    adj.set(a, list);
  };
  for (const c of courses) {
    for (const l of c.links ?? []) {
      const from = `${c.id}/${l.from}`;
      const to = l.to.includes('/') ? l.to : `${c.id}/${l.to}`;
      const sentence = t('practice.linkSentence', { from: label.get(from) ?? l.from, link: l.label, to: label.get(to) ?? l.to });
      add(from, to, sentence);
      add(to, from, sentence);
    }
  }
  return adj;
}

interface Pool {
  topic: Topic;
  questions: PracticeQuestion[];
  weight: number;
}

function buildTopic(id: string, qs: PracticeQuestion[], cards: Record<string, Card>, now: number): Topic {
  const first = qs[0];
  let kind: TopicKind = 'lesson';
  let label = first.lesson.title;
  let lesson = first.lesson;
  if (!id.includes('/@')) {
    const concept = (first.course.concepts ?? []).find((c) => `${first.course.id}/${c.id}` === id)!;
    kind = 'concept';
    label = concept.label;
    lesson = first.course.lessons.find((l) => l.id === concept.lesson) ?? first.lesson;
  }
  const seenCards = qs.map((q) => cards[q.key]).filter((c): c is Card => Boolean(c));
  const strength = seenCards.length ? seenCards.reduce((s, c) => s + cardStrength(c), 0) / seenCards.length : 0.5;
  const rs = seenCards.map(recent);
  const recentRight = rs.reduce((s, r) => s + r.right, 0);
  const recentSeen = rs.reduce((s, r) => s + r.seen, 0);
  const dueCount = seenCards.filter((c) => c.due <= now).length;
  const missed = seenCards.some(lastMissed);
  const status: TopicStatus = !seenCards.length
    ? 'new'
    : strength < 0.5 || missed
      ? 'weak'
      : dueCount
        ? 'due'
        : strength >= 0.75
          ? 'strong'
          : 'ok';
  return { id, kind, label, course: first.course, lesson, strength, status, recentRight, recentSeen, dueCount };
}

const topicWeight = (t: Topic) => 1 + 3 * (1 - t.strength) + (t.dueCount ? 1.5 : 0) + (t.status === 'weak' ? 1 : 0);

// ---------------------------------------------------------------- planning

/** Builds an interleaved practice session. Deterministic for the same options and seed. */
export function planMix(opts: MixOptions): MixPlan {
  const { courses, questions, progress: p } = opts;
  const size = Math.max(1, opts.size ?? DEFAULT_SIZE);
  const now = opts.now ?? Date.now();
  const rand = rng(opts.seed ?? 1);
  const cards = p.cards;

  // 1. Met questions (rule 1) and the recent ones (rule 6).
  const met = questions.filter((q) => p.completed[lessonId(q.course.id, q.lesson.id)] || cards[q.key]);
  const recentKeys = new Set(met.filter((q) => isRecentRight(cards[q.key], now)).map((q) => q.key));
  const fresh = met.filter((q) => !recentKeys.has(q.key));

  // Topics over every met question (any course), so cross-course neighbours can join.
  const byTopic = new Map<string, PracticeQuestion[]>();
  for (const q of fresh) for (const t of topicsOf(q)) byTopic.set(t, [...(byTopic.get(t) ?? []), q]);
  const pools = new Map<string, Pool>();
  for (const [id, qs] of byTopic) {
    const topic = buildTopic(id, qs, cards, now);
    pools.set(id, { topic, questions: qs, weight: topicWeight(topic) });
  }
  const graph = linkGraph(courses);
  const neighbours = (id: string) => (graph.get(id) ?? []).filter((l) => pools.has(l.other));

  // 2. Scope: which topics can seed the session ("home"), which may only join as neighbours.
  const inCourse = (id: string) => !opts.courseId || id.split('/')[0] === opts.courseId;
  let home = [...pools.keys()].filter(inCourse);
  let focusFallback = false;
  let focus: Topic | undefined;
  if (opts.courseId && opts.conceptId) {
    const fid = `${opts.courseId}/${opts.conceptId}`;
    const around = pools.has(fid) ? [fid, ...neighbours(fid).map((l) => l.other)] : [];
    const n = new Set(around.flatMap((t) => pools.get(t)!.questions.map((q) => q.key))).size;
    if (n >= MIN_FOCUS_QUESTIONS) {
      home = around;
      focus = pools.get(fid)!.topic;
    } else focusFallback = true;
  }
  const scopeCourses = opts.courseId ? [opts.courseId] : [...new Set(met.map((q) => q.course.id))];
  const reached = reachedLessons(questions, p, scopeCourses).size;
  const scopeMet = met.filter((q) => scopeCourses.includes(q.course.id));
  const base = {
    reachedLessons: reached,
    metCount: scopeMet.length,
    recentCount: scopeMet.filter((q) => recentKeys.has(q.key)).length,
    focusFallback,
    focus,
  };
  if (!home.length) return { ...base, picks: [], topics: [], usesGraph: false };

  // 3. Choose topics (rules 2 and 3).
  const reasons = new Map<string, Reason[]>();
  const addReason = (id: string, r: Reason) => reasons.set(id, [...(reasons.get(id) ?? []), r]);
  const chosen: string[] = [];
  const choose = (id: string) => {
    if (!chosen.includes(id)) chosen.push(id);
  };
  const allowed = (id: string) => !focus || home.includes(id);
  const reachable = new Set([...home, ...home.flatMap((t) => neighbours(t).map((l) => l.other))].filter(allowed));
  const target = Math.min(reachable.size, Math.max(3, Math.ceil(size / 2)));
  const jittered = (ids: string[]) =>
    ids
      .map((id) => ({ id, key: pools.get(id)!.weight * (0.8 + 0.4 * rand()) }))
      .sort((a, b) => b.key - a.key)
      .map((x) => x.id);
  const isStrong = (id: string) => pools.get(id)!.topic.status === 'strong';
  const strongIds = jittered(home.filter(isStrong));
  const strongQuota = strongIds.length ? Math.max(1, Math.round(target * 0.25)) : 0;
  const strongMissing = () => Math.max(0, strongQuota - chosen.filter(isStrong).length);
  const seeds = jittered(home.filter((id) => !isStrong(id)));
  /** Adds the best linked topic of `id` (1 hop) while there is room below `limit`. */
  const relate = (id: string, limit: number) => {
    for (const l of neighbours(id)) {
      // Already in the mix: just record the pairing.
      if (chosen.includes(l.other) && !(reasons.get(l.other) ?? []).some((r) => r.kind === 'related'))
        addReason(l.other, { kind: 'related', link: { ...l, other: id, otherLabel: pools.get(id)!.topic.label } });
    }
    const options = neighbours(id).filter((l) => !chosen.includes(l.other) && allowed(l.other));
    if (!options.length || chosen.length >= limit) return;
    const best = jittered(options.map((l) => l.other))[0];
    const link = options.find((l) => l.other === best)!;
    choose(best);
    addReason(best, { kind: 'related', link: { ...link, other: id, otherLabel: pools.get(id)!.topic.label } });
  };
  if (focus) {
    choose(focus.id);
    addReason(focus.id, { kind: 'focus' });
    relate(focus.id, target - strongMissing());
  }
  for (const id of seeds) {
    if (chosen.length >= target - strongMissing()) break;
    choose(id);
    relate(id, target - strongMissing());
  }
  for (const id of strongIds) {
    if (!strongMissing() || chosen.length >= target) break;
    choose(id);
    relate(id, target);
  }
  // Room left: more neighbours of what's in the mix first (contrast pairs), then anything else in scope.
  for (const id of [...chosen]) while (chosen.length < target && neighbours(id).some((l) => !chosen.includes(l.other) && allowed(l.other))) relate(id, target);
  for (const id of [...seeds, ...strongIds]) if (chosen.length < target) choose(id);
  for (const id of chosen) {
    const t = pools.get(id)!.topic;
    const own: Reason[] =
      t.status === 'weak'
        ? [{ kind: 'weak', right: t.recentRight, seen: t.recentSeen }]
        : t.status === 'due'
          ? [{ kind: 'due' }]
          : t.status === 'strong'
            ? [{ kind: 'strong' }]
            : t.status === 'new'
              ? [{ kind: 'new' }]
              : [];
    reasons.set(id, [...(reasons.get(id) ?? []).filter((r) => r.kind === 'focus'), ...own, ...(reasons.get(id) ?? []).filter((r) => r.kind !== 'focus')]);
  }

  // 4. How many questions per topic: one each, then by weight, capped so interleaving stays possible.
  const used = new Set<string>();
  const available = (id: string) => pools.get(id)!.questions.length;
  const alloc = new Map(chosen.map((id) => [id, 0]));
  let total = 0;
  const cap = Math.max(1, Math.ceil(size / 2));
  const capacity = (id: string) => Math.min(available(id), chosen.length > 1 ? cap : size);
  // Shared questions (tagged with two chosen topics) can only be used once, so allocation is optimistic and the
  // question pick below simply skips topics that run dry.
  while (total < size) {
    let best: string | null = null;
    let bestScore = -1;
    for (const id of chosen) {
      const a = alloc.get(id)!;
      if (a >= capacity(id)) continue;
      const score = a === 0 ? 1e6 + pools.get(id)!.weight : pools.get(id)!.weight / (a + 1);
      if (score > bestScore) {
        bestScore = score;
        best = id;
      }
    }
    if (!best) break;
    alloc.set(best, alloc.get(best)! + 1);
    total++;
  }

  // 5. Pick the questions: due, missed, weak and unseen first; spread question types (rule 4).
  const typeCount = new Map<string, number>();
  const picked: { q: PracticeQuestion; topic: string }[] = [];
  const order = [...chosen].sort((a, b) => pools.get(b)!.weight - pools.get(a)!.weight);
  const priority = (q: PracticeQuestion) => {
    const c = cards[q.key];
    const typeBonus = typeCount.has(q.step.type) ? 1.5 / (1 + typeCount.get(q.step.type)!) : 2;
    return (c && c.due <= now ? 3 : 0) + (lastMissed(c) ? 2 : 0) + (c ? 2 * (1 - cardStrength(c)) : 1) + typeBonus + 0.5 * rand();
  };
  for (let round = 0; picked.length < total && round < size; round++) {
    let progressed = false;
    for (const id of order) {
      const have = picked.filter((x) => x.topic === id).length;
      if (have >= alloc.get(id)! || picked.length >= total) continue;
      const options = pools.get(id)!.questions.filter((q) => !used.has(q.key));
      if (!options.length) continue;
      const q = options.map((q) => ({ q, s: priority(q) })).sort((a, b) => b.s - a.s)[0].q;
      used.add(q.key);
      typeCount.set(q.step.type, (typeCount.get(q.step.type) ?? 0) + 1);
      picked.push({ q, topic: id });
      progressed = true;
    }
    if (!progressed) break;
  }

  // A topic may fill at most half the session, or back-to-back repeats would be unavoidable: trim the excess.
  for (;;) {
    const per = new Map<string, number>();
    for (const x of picked) per.set(x.topic, (per.get(x.topic) ?? 0) + 1);
    if (per.size < 2) break;
    const [top, n] = [...per].sort((a, b) => b[1] - a[1])[0];
    if (n <= Math.ceil(picked.length / 2)) break;
    picked.splice(picked.map((x) => x.topic).lastIndexOf(top), 1);
  }

  // 6. Order them (rule 4).
  const ordered = interleave(picked, rand);

  const planned = new Map<string, PlannedTopic>();
  for (const x of ordered) {
    const t = planned.get(x.topic);
    if (t) t.count++;
    else planned.set(x.topic, { ...pools.get(x.topic)!.topic, count: 1, reasons: reasons.get(x.topic) ?? [] });
  }
  const picks: Pick[] = ordered.map(({ q, topic }) => {
    const c = cards[q.key];
    const own: Reason[] = [];
    if (!c) own.push({ kind: 'new' });
    else if (lastMissed(c)) own.push({ kind: 'missed' });
    else if (c.due <= now) own.push({ kind: 'due' });
    const t = planned.get(topic)!;
    const rest = t.reasons.filter((r) => !own.some((o) => o.kind === r.kind));
    return { q, topic: t, tags: [topic, ...topicsOf(q).filter((x) => x !== topic)], reasons: [...own, ...rest] };
  });
  return {
    ...base,
    picks,
    topics: [...planned.values()],
    usesGraph: [...planned.values()].some((t) => t.kind === 'concept'),
  };
}

/**
 * Orders picks so that no two neighbours share a topic (hard, whenever any arrangement allows it), and, where
 * possible, neither the lesson nor the question type repeats back-to-back.
 */
export function interleave<T extends { q: PracticeQuestion; topic: string }>(items: T[], rand: () => number = rng(1)): T[] {
  const left = [...items];
  const out: T[] = [];
  const counts = () => {
    const m = new Map<string, number>();
    for (const x of left) m.set(x.topic, (m.get(x.topic) ?? 0) + 1);
    return m;
  };
  // Can the rest still be arranged with no equal neighbours, given the topic placed just before?
  const feasible = (prevTopic: string, rest: Map<string, number>, n: number) => {
    for (const [t, c] of rest) if (c > (t === prevTopic ? Math.floor(n / 2) : Math.ceil(n / 2))) return false;
    return true;
  };
  while (left.length) {
    const prev = out[out.length - 1];
    const prevTags = prev ? new Set(topicsOf(prev.q)) : new Set<string>();
    const m = counts();
    let candidates = left.filter((x) => !prev || x.topic !== prev.topic);
    candidates = candidates.filter((x) => {
      const rest = new Map(m);
      rest.set(x.topic, rest.get(x.topic)! - 1);
      return feasible(x.topic, rest, left.length - 1);
    });
    if (!candidates.length) candidates = left.filter((x) => !prev || x.topic !== prev.topic);
    if (!candidates.length) candidates = left;
    let best = candidates[0];
    let bestScore = -Infinity;
    for (const x of candidates) {
      const tags = topicsOf(x.q);
      const score =
        (prev && x.q.lesson.id === prev.q.lesson.id && x.q.course.id === prev.q.course.id ? 0 : 3) +
        (prev && x.q.step.type === prev.q.step.type ? 0 : 2) +
        (tags.some((t) => prevTags.has(t)) ? 0 : 2) +
        0.3 * (m.get(x.topic) ?? 0) +
        rand();
      if (score > bestScore) {
        bestScore = score;
        best = x;
      }
    }
    out.push(best);
    left.splice(left.indexOf(best), 1);
  }
  return out;
}

// ---------------------------------------------------------------- explaining

/** One plain sentence per reason, for the UI. */
export function describeReason(r: Reason): string {
  switch (r.kind) {
    case 'due':
      return t('practice.reason.due');
    case 'missed':
      return t('practice.reason.missed');
    case 'new':
      return t('practice.reason.new');
    case 'weak':
      if (!r.seen) return t('practice.reason.weakSpot');
      // Mostly right but the latest try was wrong: say that, rather than call 4 of 5 a weak spot.
      return t(r.right / r.seen >= 0.5 ? 'practice.reason.slipping' : 'practice.reason.weak', { right: r.right, seen: r.seen });
    case 'strong':
      return t('practice.reason.strong');
    case 'focus':
      return t('practice.reason.focus');
    case 'related':
      return t(r.link.cross ? 'practice.reason.relatedCross' : 'practice.reason.related', { label: r.link.otherLabel, sentence: r.link.sentence });
  }
}

/** Why a question is in the session: one short sentence per reason, most specific first. */
export function explainPick(pick: Pick): string[] {
  return [...new Set(pick.reasons.map(describeReason))];
}

export interface TopicResult {
  topic: PlannedTopic;
  right: number;
  total: number;
}

/** Groups session results by the topic each question was picked for; topics with misses first. */
export function summarize(plan: MixPlan, results: { key: string; ok: boolean }[]): TopicResult[] {
  const topicOf = new Map(plan.picks.map((p) => [p.q.key, p.topic]));
  const out = new Map<string, TopicResult>();
  for (const r of results) {
    const t = topicOf.get(r.key);
    if (!t) continue;
    const e = out.get(t.id) ?? { topic: t, right: 0, total: 0 };
    e.total++;
    if (r.ok) e.right++;
    out.set(t.id, e);
  }
  const order = plan.topics.map((t) => t.id);
  return [...out.values()].sort((a, b) => a.right / a.total - b.right / b.total || order.indexOf(a.topic.id) - order.indexOf(b.topic.id));
}
