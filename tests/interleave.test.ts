// Tests for mixed (interleaved) practice selection. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  describeReason,
  explainPick,
  interleave,
  planMix,
  reachedLessons,
  summarize,
  type MixOptions,
  type MixProgress,
  type PracticeQuestion,
} from '../src/lib/interleave.ts';
import type { Card } from '../src/lib/storage.ts';
import { toCatalog, withLessons } from '../src/content/catalog.ts';
import type { Course, QuestionStep } from '../src/types.ts';

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const TYPES = ['mcq', 'order', 'buckets', 'numeric'] as const;

// ---------- fake content ----------

type LessonSpec = { id: string; concepts: string[]; perConcept?: number };
function makeCourse(id: string, lessons: LessonSpec[], graph?: { links: [string, string, string][] }): Course {
  const ls = lessons.map((l) => ({
    id: l.id,
    title: `Lesson ${l.id}`,
    pareto: 'core' as const,
    takeaway: 'T.',
    steps: l.concepts.flatMap((c, ci) =>
      Array.from({ length: l.perConcept ?? 3 }, (_, i) => ({
        type: TYPES[(ci + i) % TYPES.length],
        id: `${c}-${i}`,
        prompt: 'P',
        explanation: 'E.',
        ...(graph ? { concepts: [c] } : {}),
      })) as unknown as QuestionStep[],
    ),
  }));
  return withLessons(toCatalog({
    id,
    title: `Course ${id}`,
    icon: id.slice(0, 2).toUpperCase(),
    description: 'D.',
    keyIdeas: ['I.'],
    units: [{ id: 'u', title: 'U', lessons: ls }],
    ...(graph
      ? {
          concepts: lessons.flatMap((l) => l.concepts.map((c) => ({ id: c, label: c[0].toUpperCase() + c.slice(1), lesson: l.id }))),
          links: graph.links.map(([from, to, label]) => ({ from, to, label })),
        }
      : {}),
  }));
}

const questionsOf = (courses: Course[]): PracticeQuestion[] =>
  courses.flatMap((course) =>
    course.lessons.flatMap((lesson) =>
      lesson.questions.map((step) => ({ key: `${course.id}/${lesson.id}/${step.id}`, course, lesson, step })),
    ),
  );

const logic = makeCourse(
  'logic',
  [
    { id: 'l1', concepts: ['conditional', 'converse'] },
    { id: 'l2', concepts: ['contrapositive', 'inverse'] },
    { id: 'l3', concepts: ['and', 'or'] },
    { id: 'l4', concepts: ['negation', 'xor'] },
    { id: 'l5', concepts: ['quantifier'] },
  ],
  {
    links: [
      ['contrapositive', 'converse', 'is not the same as'],
      ['converse', 'conditional', 'reverses'],
      ['inverse', 'conditional', 'negates both parts of'],
      ['and', 'or', 'is the dual of'],
      ['contrapositive', 'math/contradiction', 'is used in'],
    ],
  },
);
const math = makeCourse('math', [{ id: 'm1', concepts: ['contradiction', 'induction'] }], { links: [['induction', 'contradiction', 'differs from']] });
const plain = makeCourse('plain', [
  { id: 'p1', concepts: ['a', 'b'] },
  { id: 'p2', concepts: ['c'] },
  { id: 'p3', concepts: ['d'] },
]);
const COURSES = [logic, math, plain];
const QUESTIONS = questionsOf(COURSES);

const card = (hist: string, box: number, extra: Partial<Card> = {}): Card => ({
  box,
  due: NOW + DAY,
  seen: hist.length,
  right: [...hist].filter((x) => x === '1').length,
  hist,
  last: NOW - 2 * DAY,
  ...extra,
});
const done = (...lessons: string[]) => Object.fromEntries(lessons.map((l) => [l, NOW - DAY]));
const plan = (progress: MixProgress, extra: Partial<MixOptions> = {}) =>
  planMix({ courses: COURSES, questions: QUESTIONS, progress, now: NOW, seed: 7, ...extra });
const keysOfConcept = (concept: string) => QUESTIONS.filter((q) => q.step.id.startsWith(`${concept}-`)).map((q) => q.key);
const cardsFor = (concepts: string[], c: Card) => Object.fromEntries(concepts.flatMap(keysOfConcept).map((k) => [k, c]));
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

// ---------- rule 1: only what the learner has met ----------

describe('only questions the learner has met', () => {
  test('nothing met: an empty plan', () => {
    const p = plan({ cards: {}, completed: {} });
    assert.equal(p.picks.length, 0);
    assert.equal(p.reachedLessons, 0);
  });

  test('never picks from lessons not reached', () => {
    const progress = { cards: {}, completed: done('logic/l1', 'logic/l2') };
    for (const seed of SEEDS) {
      const p = plan(progress, { seed, size: 20 });
      assert.ok(p.picks.length > 0);
      for (const pick of p.picks) assert.ok(['l1', 'l2'].includes(pick.q.lesson.id), `${pick.q.key} is from an unreached lesson`);
    }
  });

  test('an answered question counts as met even before its lesson is completed', () => {
    const progress = { cards: { 'logic/l3/and-0': card('1', 2) }, completed: done('logic/l1') };
    assert.equal(reachedLessons(QUESTIONS, progress).size, 2);
    const keys = new Set(SEEDS.flatMap((seed) => plan(progress, { seed, size: 20 }).picks.map((p) => p.q.key)));
    assert.ok(keys.has('logic/l3/and-0'));
    assert.ok(![...keys].some((k) => k.startsWith('logic/l3/') && k !== 'logic/l3/and-0'), 'unanswered questions of an unreached lesson stay out');
  });

  test('all-courses mix spans every started course, and only those', () => {
    const progress = { cards: {}, completed: done('logic/l1', 'plain/p1') };
    const courses = new Set(SEEDS.flatMap((seed) => plan(progress, { seed }).picks.map((p) => p.q.course.id)));
    assert.deepEqual([...courses].sort(), ['logic', 'plain']);
  });
});

// ---------- rule 2: weak and due weigh more, strong ones stay in ----------

describe('weighting', () => {
  const progress: MixProgress = {
    completed: done('logic/l1', 'logic/l2', 'logic/l3', 'logic/l4'),
    cards: {
      ...cardsFor(['xor'], card('0010', 1)),
      ...cardsFor(['negation'], card('11', 3, { due: NOW - 1000 })),
      ...cardsFor(['and', 'or', 'conditional', 'converse', 'contrapositive', 'inverse'], card('11111', 6)),
    },
  };

  test('weak and due concepts are always in the mix', () => {
    for (const seed of SEEDS) {
      const p = plan(progress, { seed, size: 8, courseId: 'logic' });
      const ids = p.topics.map((t) => t.id);
      assert.ok(ids.includes('logic/xor'), `seed ${seed}: weak concept missing`);
      assert.ok(ids.includes('logic/negation'), `seed ${seed}: due concept missing`);
      assert.equal(p.topics.find((t) => t.id === 'logic/xor')!.status, 'weak');
      assert.equal(p.topics.find((t) => t.id === 'logic/negation')!.status, 'due');
    }
  });

  test('weak concepts get at least as many questions as strong ones', () => {
    for (const seed of SEEDS) {
      const p = plan(progress, { seed, size: 12, courseId: 'logic' });
      const weak = p.topics.find((t) => t.id === 'logic/xor')!.count;
      for (const t of p.topics.filter((t) => t.status === 'strong')) assert.ok(weak >= t.count);
    }
  });

  test('strong concepts are still included, for confidence and contrast', () => {
    const allStrongButOne: MixProgress = {
      completed: progress.completed,
      cards: { ...cardsFor(['and', 'or', 'conditional', 'converse', 'contrapositive', 'inverse', 'negation'], card('11111', 6)), ...cardsFor(['xor'], card('000', 1)) },
    };
    for (const seed of SEEDS) {
      const p = plan(allStrongButOne, { seed, size: 8, courseId: 'logic' });
      const strong = p.topics.filter((t) => t.status === 'strong');
      assert.ok(strong.length >= 1);
      assert.ok(strong.some((t) => t.reasons.some((r) => r.kind === 'strong')));
      // ...and the weak one is not crowded out.
      assert.ok(p.topics.some((t) => t.id === 'logic/xor'));
    }
  });
});

// ---------- rule 3: related concepts ----------

describe('related concepts', () => {
  test('a weak concept pulls in a linked one, with the link as the reason', () => {
    const progress: MixProgress = {
      completed: done('logic/l1', 'logic/l2', 'logic/l3', 'logic/l4'),
      cards: { ...cardsFor(['contrapositive'], card('000', 1)), ...cardsFor(['and', 'or', 'negation', 'xor', 'inverse', 'conditional'], card('1111', 5)) },
    };
    for (const seed of SEEDS) {
      const p = plan(progress, { seed, size: 8, courseId: 'logic' });
      const conv = p.topics.find((t) => t.id === 'logic/converse');
      assert.ok(conv, `seed ${seed}: converse (linked to the weak contrapositive) missing`);
      const why = conv.reasons.find((r) => r.kind === 'related');
      assert.ok(why && why.kind === 'related');
      assert.equal(why.link.sentence, 'Contrapositive is not the same as Converse');
    }
  });

  test('cross-course neighbours join a course mix only when met', () => {
    const base = { completed: done('logic/l1', 'logic/l2'), cards: cardsFor(['contrapositive'], card('00', 1)) };
    const without = SEEDS.flatMap((seed) => plan(base, { seed, courseId: 'logic' }).picks);
    assert.ok(without.every((p) => p.q.course.id === 'logic'), 'math not reached: stays out');

    const withMath = { ...base, completed: { ...base.completed, ...done('math/m1') } };
    let joined = 0;
    for (const seed of SEEDS) {
      const p = plan(withMath, { seed, courseId: 'logic' });
      const cross = p.topics.filter((t) => t.course.id !== 'logic');
      assert.ok(cross.every((t) => t.id === 'math/contradiction'), 'only the 1-hop neighbour, not the rest of math');
      if (cross.length) {
        joined++;
        const r = cross[0].reasons.find((r) => r.kind === 'related');
        assert.ok(r && r.kind === 'related' && r.link.cross);
      }
    }
    assert.ok(joined > SEEDS.length / 2, `cross-course neighbour joined only ${joined} times`);
  });
});

// ---------- rule 4: interleaving ----------

describe('interleaving', () => {
  const progress = { completed: done('logic/l1', 'logic/l2', 'logic/l3', 'logic/l4', 'plain/p1', 'plain/p2'), cards: {} };

  test('no two consecutive questions on the same concept', () => {
    for (const seed of SEEDS)
      for (const size of [8, 12, 20]) {
        const p = plan(progress, { seed, size });
        for (let i = 1; i < p.picks.length; i++) assert.notEqual(p.picks[i].topic.id, p.picks[i - 1].topic.id, `seed ${seed} size ${size} at ${i}`);
      }
  });

  test('no question twice, and the requested length when there is enough', () => {
    for (const size of [8, 12, 20]) {
      const p = plan(progress, { size });
      assert.equal(p.picks.length, size);
      assert.equal(new Set(p.picks.map((x) => x.q.key)).size, size);
    }
  });

  test('mixes question types', () => {
    for (const seed of SEEDS) {
      const p = plan(progress, { seed, size: 12 });
      assert.ok(new Set(p.picks.map((x) => x.q.step.type)).size >= 3);
      const repeats = p.picks.filter((x, i) => i > 0 && x.q.step.type === p.picks[i - 1].q.step.type).length;
      assert.ok(repeats <= 2, `seed ${seed}: ${repeats} back-to-back repeats of a type`);
    }
  });

  test('interleave() avoids the same lesson and type back-to-back when it can', () => {
    const q = (lesson: string, type: string) => QUESTIONS.find((x) => x.lesson.id === lesson && x.step.type === type)!;
    const items = [
      { q: q('l1', 'mcq'), topic: 'A' },
      { q: q('l1', 'order'), topic: 'B' },
      { q: q('l2', 'mcq'), topic: 'C' },
      { q: q('l2', 'order'), topic: 'D' },
    ];
    for (const seed of SEEDS) {
      const out = interleave(items, () => ((seed * 9301 + 49297) % 233280) / 233280);
      for (let i = 1; i < out.length; i++) assert.notEqual(out[i].q.lesson.id, out[i - 1].q.lesson.id);
    }
  });

  test('interleave() keeps topics apart even when one topic is half the session', () => {
    const items = ['A', 'A', 'A', 'B', 'C'].map((topic, i) => ({ q: QUESTIONS[i], topic }));
    for (const seed of SEEDS) {
      let s = seed;
      const out = interleave(items, () => (s = (s * 16807) % 2147483647) / 2147483647);
      assert.deepEqual(out.map((x) => x.topic).filter((t, i, a) => i > 0 && t === a[i - 1]), []);
    }
  });
});

// ---------- rule 5: courses without a concept graph ----------

describe('fallback to lessons', () => {
  test('a course without a graph mixes by lesson', () => {
    const p = plan({ completed: done('plain/p1', 'plain/p2', 'plain/p3'), cards: {} }, { courseId: 'plain', size: 12 });
    assert.equal(p.usesGraph, false);
    assert.ok(p.topics.every((t) => t.kind === 'lesson'));
    assert.deepEqual(new Set(p.topics.map((t) => t.label)), new Set(['Lesson p1', 'Lesson p2', 'Lesson p3']));
    for (let i = 1; i < p.picks.length; i++) assert.notEqual(p.picks[i].q.lesson.id, p.picks[i - 1].q.lesson.id);
  });

  test('graph and no-graph courses mix together', () => {
    const p = plan({ completed: done('plain/p1', 'plain/p2', 'logic/l1'), cards: {} }, { size: 20 });
    assert.equal(p.usesGraph, true);
    assert.deepEqual(new Set(p.topics.map((t) => t.kind)), new Set(['concept', 'lesson']));
  });
});

// ---------- rule 6: recent right answers ----------

describe('recent answers', () => {
  test('questions answered right in the last 10 minutes are left out', () => {
    const cards = {
      'logic/l1/conditional-0': card('1', 2, { last: NOW - 60_000 }), // right 1 min ago: out
      'logic/l1/conditional-1': card('10', 1, { last: NOW - 60_000, due: NOW }), // missed 1 min ago: in
      'logic/l1/conditional-2': card('1', 2, { last: NOW - 20 * 60_000 }), // right 20 min ago: in
    };
    const progress = { completed: done('logic/l1', 'logic/l2'), cards };
    const keys = new Set(SEEDS.flatMap((seed) => plan(progress, { seed, size: 20 }).picks.map((p) => p.q.key)));
    assert.ok(!keys.has('logic/l1/conditional-0'));
    assert.ok(keys.has('logic/l1/conditional-1'));
    assert.ok(keys.has('logic/l1/conditional-2'));
    assert.equal(plan(progress).recentCount, 1);
  });
});

// ---------- focus on one concept ----------

describe('concept focus', () => {
  const progress = { completed: done('logic/l1', 'logic/l2', 'logic/l3'), cards: {} };

  test('focus uses the concept and its 1-hop neighbours only', () => {
    for (const seed of SEEDS) {
      const p = plan(progress, { seed, courseId: 'logic', conceptId: 'contrapositive' });
      assert.equal(p.focusFallback, false);
      assert.equal(p.focus?.id, 'logic/contrapositive');
      assert.ok(p.topics.some((t) => t.id === 'logic/contrapositive' && t.reasons[0].kind === 'focus'));
      for (const t of p.topics) assert.ok(['logic/contrapositive', 'logic/converse'].includes(t.id), t.id);
      for (let i = 1; i < p.picks.length; i++) assert.notEqual(p.picks[i].topic.id, p.picks[i - 1].topic.id);
    }
  });

  test('too few questions: falls back to the course mix', () => {
    const p = plan(progress, { courseId: 'logic', conceptId: 'quantifier' });
    assert.equal(p.focusFallback, true);
    assert.ok(p.topics.length >= 3);
  });
});

// ---------- determinism, explanations and results ----------

describe('plan output', () => {
  const progress = { completed: done('logic/l1', 'logic/l2', 'logic/l3', 'plain/p1'), cards: cardsFor(['converse'], card('10', 1, { due: NOW - 1 })) };

  test('deterministic for a seed', () => {
    const keys = (seed: number) => plan(progress, { seed }).picks.map((p) => p.q.key).join();
    assert.equal(keys(3), keys(3));
    assert.ok(new Set(SEEDS.map(keys)).size > 5, 'different seeds give different sessions');
  });

  test('explains every pick', () => {
    const p = plan(progress, { size: 20 });
    for (const pick of p.picks) assert.ok(explainPick(pick).length > 0, pick.q.key);
    const conv = p.picks.find((x) => x.topic.id === 'logic/converse')!;
    assert.match(explainPick(conv).join(' | '), /missed it last time/);
    assert.ok(p.picks.some((x) => explainPick(x).some((s) => s.startsWith('Linked to'))));
  });

  test('summarize groups results by concept, misses first', () => {
    const p = plan(progress, { size: 8 });
    const results = p.picks.map((x) => ({ key: x.q.key, ok: x.topic.id !== 'logic/converse' }));
    const rows = summarize(p, results);
    assert.equal(rows[0].topic.id, 'logic/converse');
    assert.equal(rows[0].right, 0);
    assert.equal(rows.reduce((s, r) => s + r.total, 0), p.picks.length);
    assert.ok(rows.slice(1).every((r) => r.right === r.total));
  });
});

describe('reason wording', () => {
  test('a mostly-right concept missed on the latest try is "slipping", not a weak spot', () => {
    assert.match(describeReason({ kind: 'weak', right: 4, seen: 5 }), /^Slipping: you missed your latest try/);
    assert.equal(describeReason({ kind: 'weak', right: 1, seen: 5 }), 'Weak spot: 1 of 5 recent answers right');
    assert.equal(describeReason({ kind: 'weak', right: 0, seen: 0 }), 'Weak spot');
  });
});
