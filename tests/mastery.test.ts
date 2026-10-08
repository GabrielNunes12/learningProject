// Tests for honest confidence, difficulty, the find-your-level quiz and harder review. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  creditedCard,
  difficulty,
  harderReview,
  histMark,
  INTERVAL_DAYS,
  levelQuizPlan,
  levelResult,
  nextCard,
  shouldStopLevel,
  type LevelAnswer,
  type PoolQuestion,
} from '../src/lib/mastery.ts';
import type { Card } from '../src/lib/storage.ts';
import type { Course, LessonInfo, QuestionInfo } from '../src/types.ts';

const DAY = 86_400_000;
const NOW = 1_000 * DAY;

describe('honest confidence', () => {
  test('history marks: sure right, guessed right, wrong', () => {
    assert.equal(histMark(true), '1');
    assert.equal(histMark(true, 'guess'), 'g');
    assert.equal(histMark(false, 'guess'), '0');
    assert.equal(histMark(false, 'unknown'), '0');
  });

  test('a sure right answer moves the card up; a guess keeps it and brings it back tomorrow', () => {
    const prev: Card = { box: 3, due: 0, seen: 4, right: 3, hist: '0111', last: 0 };
    const sure = nextCard(prev, true, 'sure', NOW);
    assert.equal(sure.box, 4);
    assert.equal(sure.due, NOW + INTERVAL_DAYS[4] * DAY);
    assert.equal(sure.right, 4);
    assert.equal(sure.hist, '01111');

    const guess = nextCard(prev, true, 'guess', NOW);
    assert.equal(guess.box, 3, 'no promotion for a lucky guess');
    assert.equal(guess.due, NOW + DAY, 'comes back tomorrow');
    assert.equal(guess.right, 3, 'a guess is not counted as right');
    assert.equal(guess.seen, 5);
    assert.equal(guess.hist, '0111g');
  });

  test('wrong or "I don\'t know" sends the card back to box 1', () => {
    const prev: Card = { box: 5, due: 0, seen: 6, right: 6 };
    for (const conf of ['sure', 'guess', 'unknown'] as const) {
      const c = nextCard(prev, false, conf, NOW);
      assert.equal(c.box, 1);
      assert.equal(c.hist, '0');
    }
  });

  test('a first answer starts at box 2 when sure, box 1 when guessed', () => {
    assert.equal(nextCard(undefined, true, 'sure', NOW).box, 2);
    assert.equal(nextCard(undefined, true, 'guess', NOW).box, 1);
  });

  test('a card credited by a harder question keeps its own history', () => {
    const prev: Card = { box: 3, due: 0, seen: 3, right: 3, hist: '111' };
    assert.deepEqual(creditedCard(prev, true, 'sure', NOW), { ...prev, box: 4, due: NOW + INTERVAL_DAYS[4] * DAY });
    assert.deepEqual(creditedCard(prev, false, 'sure', NOW), { ...prev, box: 3, due: NOW + DAY });
    assert.deepEqual(creditedCard(prev, true, 'guess', NOW), { ...prev, box: 3, due: NOW + DAY });
  });
});

describe('difficulty', () => {
  test('the kind of task comes first, then how far into the course', () => {
    assert.ok(difficulty('mcq', 9, 10) < difficulty('numeric', 0, 10), 'any recall beats any recognition');
    assert.ok(difficulty('numeric', 9, 10) < difficulty('output', 0, 10), 'any tracing beats any recall');
    assert.ok(difficulty('bug', 2, 10) < difficulty('bug', 7, 10), 'later lessons are harder');
    assert.equal(difficulty('trace', 0, 1), 3);
  });
});

// A course of n lessons; lesson i has the given question types.
function course(types: QuestionInfo['type'][][], extra: number[] = []): Course {
  const lessons = types.map(
    (ts, i): LessonInfo => ({
      id: `l${i}`,
      title: `Lesson ${i}`,
      pareto: extra.includes(i) ? 'extra' : 'core',
      stepCount: ts.length,
      questions: ts.map((type, j) => ({ id: `q${j}`, type })),
    }) as unknown as LessonInfo,
  );
  return { id: 'c', title: 'C', units: [{ id: 'u', title: 'U', lessons }], lessons } as unknown as Course;
}

describe('find your level', () => {
  test('one question per lesson in course order, preferring recall over multiple choice', () => {
    const c = course([['mcq', 'numeric'], ['mcq'], [], ['output', 'mcq']]);
    const plan = levelQuizPlan(c, () => 0);
    assert.deepEqual(
      plan.map((q) => q.key),
      ['c/l0/q1', 'c/l1/q0', 'c/l3/q0'],
      'lesson 2 has no questions; mcq only when nothing else exists',
    );
    assert.deepEqual(plan.map((q) => q.index), [0, 1, 3]);
  });

  test('long courses drop deep dives first and keep the order', () => {
    const c = course(Array.from({ length: 6 }, () => ['numeric'] as QuestionInfo['type'][]), [1, 4]);
    assert.deepEqual(levelQuizPlan(c, () => 0, 4).map((q) => q.lesson.id), ['l0', 'l2', 'l3', 'l5']);
  });

  test('stops after two answers in a row that were missed, guessed or not known', () => {
    const a = (ok: boolean, conf: 'sure' | 'guess' | 'unknown' = 'sure') => ({ ok, conf });
    assert.equal(shouldStopLevel([a(true), a(false)]), false);
    assert.equal(shouldStopLevel([a(true), a(false), a(true, 'guess')]), true);
    assert.equal(shouldStopLevel([a(false), a(true), a(false, 'unknown')]), false, 'one slip is not the edge');
    assert.equal(shouldStopLevel([a(false, 'unknown'), a(false)]), true);
  });

  test('the level is where the guessing started', () => {
    const c = course(Array.from({ length: 5 }, () => ['numeric'] as QuestionInfo['type'][]));
    const plan = levelQuizPlan(c, () => 0);
    const L = c.lessons;
    const answers: LevelAnswer[] = [
      { lesson: L[0], ok: true, conf: 'sure' },
      { lesson: L[1], ok: true, conf: 'sure' },
      { lesson: L[2], ok: true, conf: 'guess' },
      { lesson: L[3], ok: false, conf: 'sure' },
    ];
    const r = levelResult(plan, answers);
    assert.equal(r.stopped, true);
    assert.equal(r.start?.id, 'l2');
    assert.deepEqual(r.solid.map((l) => l.id), ['l0', 'l1']);
    assert.deepEqual(r.shaky.map((l) => l.id), ['l2', 'l3']);
    assert.deepEqual(r.untested.map((l) => l.id), ['l4']);
  });

  test('reaching the end: start at the first shaky lesson, or nowhere when all are known', () => {
    const c = course([['numeric'], ['numeric'], ['numeric']]);
    const plan = levelQuizPlan(c, () => 0);
    const L = c.lessons;
    const patchy = levelResult(plan, [
      { lesson: L[0], ok: true, conf: 'sure' },
      { lesson: L[1], ok: false, conf: 'sure' },
      { lesson: L[2], ok: true, conf: 'sure' },
    ]);
    assert.equal(patchy.stopped, false);
    assert.equal(patchy.start?.id, 'l1');
    const known = levelResult(plan, L.map((lesson) => ({ lesson, ok: true, conf: 'sure' as const })));
    assert.equal(known.start, null);
    assert.equal(known.shaky.length, 0);
  });

  test('a stop on the last question still reports the edge, not a finish', () => {
    const c = course([['numeric'], ['numeric']]);
    const plan = levelQuizPlan(c, () => 0);
    const r = levelResult(plan, [
      { lesson: c.lessons[0], ok: false, conf: 'sure' },
      { lesson: c.lessons[1], ok: false, conf: 'sure' },
    ]);
    assert.equal(r.stopped, false, 'it ran out of questions rather than stopping early');
    assert.equal(r.start?.id, 'l0');
  });
});

describe('harder each time', () => {
  const pool: PoolQuestion[] = [
    { key: 'c/l0/easy', course: 'c', type: 'mcq', concepts: ['loops'], lessonIndex: 0, lessonCount: 4 },
    { key: 'c/l1/mid', course: 'c', type: 'numeric', concepts: ['loops'], lessonIndex: 1, lessonCount: 4 },
    { key: 'c/l3/hard', course: 'c', type: 'trace', concepts: ['loops', 'vars'], lessonIndex: 3, lessonCount: 4 },
    { key: 'c/l2/other', course: 'c', type: 'output', concepts: ['strings'], lessonIndex: 2, lessonCount: 4 },
    { key: 'd/l0/elsewhere', course: 'd', type: 'output', concepts: ['loops'], lessonIndex: 0, lessonCount: 1 },
  ];
  const card = (box: number, hist: string): Card => ({ box, due: 0, seen: hist.length, right: 0, hist });

  test('a known due card is replaced by the next harder question on its concept', () => {
    const cards = { 'c/l0/easy': card(3, '11'), 'c/l1/mid': card(2, '10'), 'c/l3/hard': card(1, '0'), 'd/l0/elsewhere': card(1, '0') };
    assert.deepEqual(harderReview(['c/l0/easy'], pool, cards), { keys: ['c/l1/mid'], standIn: { 'c/l1/mid': 'c/l0/easy' } });
  });

  test('skips mastered, unseen, already-due and other-course questions', () => {
    const cards = { 'c/l0/easy': card(3, '11'), 'c/l1/mid': card(5, '1111'), 'c/l3/hard': card(2, '1') };
    assert.deepEqual(harderReview(['c/l0/easy'], pool, cards).keys, ['c/l3/hard'], 'mid is mastered, so the next rung is hard');
    assert.deepEqual(harderReview(['c/l0/easy', 'c/l3/hard'], pool, cards).keys, ['c/l0/easy', 'c/l3/hard'], 'hard is already in the session');
    assert.deepEqual(harderReview(['c/l0/easy'], pool, { 'c/l0/easy': card(3, '11') }).keys, ['c/l0/easy'], 'never-seen questions are not used');
  });

  test('cards that are not known yet, or were last guessed or missed, are asked as they are', () => {
    const others = { 'c/l1/mid': card(2, '10') };
    assert.deepEqual(harderReview(['c/l0/easy'], pool, { ...others, 'c/l0/easy': card(2, '1') }).keys, ['c/l0/easy'], 'box 2 is not known well enough');
    assert.deepEqual(harderReview(['c/l0/easy'], pool, { ...others, 'c/l0/easy': card(3, '11g') }).keys, ['c/l0/easy'], 'last answer was a guess');
  });
});
