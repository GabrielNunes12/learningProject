// Tests for the learning report analysis. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { analyzeCourse, buildReport, hasEnoughForReport, isStarted, list, missText, rolling, type CardLike, type ProgressLike } from '../src/lib/insights.ts';
import type { Course, Lesson } from '../src/types.ts';

const NOW = Date.UTC(2026, 9, 6, 12);
const DAY = 86_400_000;

const mcq = (id: string, concepts?: string[]) => ({ type: 'mcq' as const, id, prompt: 'P', choices: ['a', 'b'], answer: 0, explanation: 'E.', ...(concepts ? { concepts } : {}) });
const bug = (id: string, concepts?: string[]) => ({
  type: 'bug' as const,
  id,
  prompt: 'P',
  code: 'x',
  lines: [1],
  fixes: ['a', 'b'],
  answer: 0,
  explanation: 'E.',
  ...(concepts ? { concepts } : {}),
});
const lesson = (id: string, steps: Lesson['steps'], pareto: 'core' | 'extra' = 'core'): Lesson => ({ id, title: `Lesson ${id}`, pareto, takeaway: 'T.', steps });

function makeCourse(id: string, lessons: Lesson[], graph = true): Course {
  return {
    id,
    title: `Course ${id}`,
    icon: 'C',
    description: 'D.',
    keyIdeas: ['I.'],
    units: [{ id: 'u1', title: 'Unit one', lessons }],
    lessons,
    ...(graph
      ? {
          concepts: [
            { id: 'contra', label: 'Contrapositive', lesson: 'l1' },
            { id: 'conv', label: 'Converse', lesson: 'l1' },
            { id: 'loops', label: 'Loops', lesson: 'l2' },
            { id: 'unused', label: 'Unused', lesson: 'l2' },
          ],
          links: [],
        }
      : {}),
  };
}

const logic = makeCourse('logic', [
  lesson('l1', [mcq('q1', ['contra']), mcq('q2', ['contra', 'conv']), bug('q3', ['conv'])]),
  lesson('l2', [bug('q4', ['loops']), mcq('q5', ['loops'])]),
  lesson('l3', [mcq('q6')]),
]);

/** A card from a hist string, answered `daysAgo` days ago. */
function card(hist: string, daysAgo = 1, box?: number, dueInDays = 1): CardLike {
  let b = 1;
  for (const h of hist) b = h === '1' ? Math.min(b + 1, 6) : 1;
  return {
    box: box ?? b,
    due: NOW + dueInDays * DAY,
    seen: hist.length,
    right: [...hist].filter((c) => c === '1').length,
    hist,
    last: NOW - daysAgo * DAY,
  };
}
const progress = (cards: Record<string, CardLike>, completed: Record<string, number> = {}): ProgressLike => ({ cards, completed });

describe('helpers', () => {
  test('rolling accuracy', () => {
    assert.deepEqual(rolling('1100', 2), [1, 1, 0.5, 0]);
    assert.deepEqual(rolling(''), []);
  });
  test('list joins names', () => {
    assert.equal(list(['a']), 'a');
    assert.equal(list(['a', 'b']), 'a and b');
    assert.equal(list(['a', 'b', 'c', 'd', 'e']), 'a, b, c and 2 more');
  });
});

describe('per-concept stats', () => {
  test('aggregates every card tagged with the concept', () => {
    const p = progress({ 'logic/l1/q1': card('1100', 3), 'logic/l1/q2': card('10', 1) });
    const r = analyzeCourse(logic, p, NOW);
    const contra = r.items.find((i) => i.id === 'contra')!;
    assert.equal(contra.questions, 2);
    assert.equal(contra.seenQuestions, 2);
    assert.equal(contra.attempts, 6);
    assert.equal(contra.right, 3);
    // q1 answered longer ago, so its results come first.
    assert.equal(contra.recent, '110010');
    assert.equal(contra.recentMisses, 3);
    assert.equal(contra.recentCount, 6);
    assert.equal(contra.lapses, 1); // q1 '1100' lapsed; q2 '10' was right only once
    assert.equal(contra.lastSeen, NOW - DAY);
    assert.equal(contra.lessonTitle, 'Lesson l1');
    assert.equal(contra.unitTitle, 'Unit one');
  });

  test('classifies mastery', () => {
    const p = progress({
      'logic/l1/q1': card('000111', 1),
      'logic/l1/q2': card('0100', 1),
      'logic/l2/q4': card('1111', 1),
      'logic/l2/q5': card('111', 1),
      'logic/l1/q3': card('1', 1),
    });
    const r = analyzeCourse(logic, p, NOW);
    const by = (id: string) => r.items.find((i) => i.id === id)!;
    assert.equal(by('loops').mastery, 'mastered');
    assert.equal(by('contra').mastery, 'struggling'); // last 6: 1,1,0,1,0,0 -> 50%
    assert.equal(by('unused').mastery, 'none');
    const r2 = analyzeCourse(logic, progress({}), NOW);
    assert.equal(r2.items.find((i) => i.id === 'contra')!.mastery, 'untested');
  });

  test('not enough data: thin items get no verdict and are never weak', () => {
    const r = analyzeCourse(logic, progress({ 'logic/l1/q1': card('00', 1) }), NOW);
    const contra = r.items.find((i) => i.id === 'contra')!;
    assert.equal(contra.thin, true);
    assert.equal(contra.mastery, 'learning');
    assert.equal(contra.weakness, 0);
  });

  test('cards without hist fall back to all-time numbers', () => {
    const legacy: CardLike = { box: 1, due: NOW - DAY, seen: 5, right: 1 };
    const r = analyzeCourse(logic, progress({ 'logic/l1/q1': legacy }), NOW);
    const contra = r.items.find((i) => i.id === 'contra')!;
    assert.equal(contra.allTime, true);
    assert.equal(contra.recentAccuracy, 0.2);
    assert.equal(contra.recentMisses, 4);
    assert.equal(contra.lastSeen, null);
    assert.equal(contra.due, 1);
    assert.match(missText(contra), /missed Contrapositive 4 of 5 times so far/);
  });

  test('falls back to lessons for a course without a concept graph', () => {
    const plain = makeCourse('plain', logic.lessons.map((l) => ({ ...l, steps: l.steps })), false);
    const r = analyzeCourse(plain, progress({ 'plain/l2/q4': card('0101', 1) }), NOW);
    assert.equal(r.hasGraph, false);
    assert.deepEqual(r.items.map((i) => i.id), ['l1', 'l2', 'l3']);
    assert.equal(r.items[1].kind, 'lesson');
    assert.equal(r.items[1].attempts, 4);
    assert.equal(missText({ ...r.items[1], recentMisses: 2, recentCount: 4 }), 'You missed questions in "Lesson l2" 2 of the last 4 times.');
    assert.equal(r.units[0].lessons.length, 3);
  });

  test('groups items by unit and lesson', () => {
    const r = analyzeCourse(logic, progress({}), NOW);
    assert.deepEqual(
      r.units[0].lessons.map((g) => [g.lesson.id, g.items.map((i) => i.id)]),
      [
        ['l1', ['contra', 'conv']],
        ['l2', ['loops', 'unused']],
      ],
    );
  });

  test('finds core lessons skipped before the furthest one done', () => {
    const r = analyzeCourse(logic, progress({}, { 'logic/l3': NOW }), NOW);
    assert.deepEqual(r.skippedCore.map((l) => l.id), ['l1', 'l2']);
    const r2 = analyzeCourse(logic, progress({ 'logic/l1/q1': card('1') }), NOW);
    assert.deepEqual(r2.skippedCore, []);
  });
});

describe('the report', () => {
  test('empty state for a new learner', () => {
    const r = buildReport([logic], progress({}), NOW);
    assert.equal(r.enoughData, false);
    assert.equal(r.totalAttempts, 0);
    assert.deepEqual(r.weak, []);
    assert.deepEqual(r.tips, []);
    assert.equal(r.week.accuracy, null);
    assert.equal(hasEnoughForReport([logic], progress({})), false);
  });

  test('ranks weak concepts by recent misses with an explainable tip', () => {
    const p = progress({
      'logic/l1/q1': card('110000', 2),
      'logic/l1/q3': card('1100', 1),
      'logic/l2/q4': card('1101', 1),
    });
    const r = buildReport([logic], p, NOW);
    assert.equal(r.enoughData, true);
    assert.equal(r.itemNoun, 'concepts');
    assert.equal(r.weak[0].label, 'Contrapositive');
    const tip = r.tips.find((t) => t.id === 'weak-logic/contra')!;
    assert.equal(tip.evidence, 'You missed Contrapositive 4 of the last 6 times.');
    assert.deepEqual(tip.actions.map((a) => a.route), [
      ['course', 'logic', 'lesson', 'l1'],
      ['practice', 'logic', 'contra'],
    ]);
    assert.ok(r.tips.length >= 3 && r.tips.length <= 5);
  });

  test('accuracy by question type and the format pattern', () => {
    const p = progress({
      'logic/l1/q1': card('11111', 1),
      'logic/l1/q2': card('11110', 1),
      'logic/l1/q3': card('01001', 1),
      'logic/l2/q4': card('00101', 1),
    });
    const r = buildReport([logic], p, NOW);
    const bugT = r.types.find((t) => t.type === 'bug')!;
    assert.equal(bugT.attempts, 10);
    assert.equal(bugT.accuracy, 0.4);
    assert.equal(r.types.find((t) => t.type === 'mcq')!.accuracy, 0.9);
    const pat = r.patterns.find((x) => x.id === 'formats')!;
    assert.match(pat.title, /bug hunts/);
    assert.match(pat.detail, /40% right vs multiple choice 90%/);
    assert.ok(r.tips.some((t) => t.id === 'format-bug' && /error first/.test(t.advice)));
  });

  test('does not compare formats with too few answers', () => {
    const p = progress({ 'logic/l1/q1': card('1111111111', 1), 'logic/l1/q3': card('00', 1) });
    const r = buildReport([logic], p, NOW);
    assert.equal(r.patterns.some((x) => x.id === 'formats'), false);
  });

  test('due reviews piling up becomes the first tip', () => {
    const cards: Record<string, CardLike> = {};
    for (const [l, q] of [['l1', 'q1'], ['l1', 'q2'], ['l1', 'q3'], ['l2', 'q4'], ['l2', 'q5']]) cards[`logic/${l}/${q}`] = card('11', 5, 3, -4);
    const r = buildReport([logic], progress(cards), NOW);
    assert.equal(r.due, 5);
    assert.equal(r.oldestDueDays, 4);
    assert.equal(r.tips[0].id, 'clear-reviews');
    assert.deepEqual(r.tips[0].actions[0].route, ['review', 'start', 'logic']);
  });

  test('accuracy windows use each question’s latest answer', () => {
    const p = progress({ 'logic/l1/q1': card('01', 2), 'logic/l1/q2': card('10', 10), 'logic/l2/q4': card('1', 40) });
    const r = buildReport([logic], p, NOW);
    assert.deepEqual([r.week.questions, r.week.right], [1, 1]);
    assert.deepEqual([r.month.questions, r.month.right], [2, 1]);
  });

  test('forgetting: right once, wrong later', () => {
    const p = progress({ 'logic/l2/q5': card('1110', 3), 'logic/l1/q1': card('111111', 1) });
    const r = buildReport([logic], p, NOW);
    assert.deepEqual(r.forgotten.map((i) => i.id), ['loops']);
    assert.ok(r.patterns.some((x) => x.id === 'forgetting'));
  });

  test('strengths and mixed nouns across courses', () => {
    const plain = makeCourse('plain', [lesson('l1', [mcq('q1')])], false);
    const p = progress({ 'logic/l2/q4': card('11111', 1), 'logic/l2/q5': card('11111', 1), 'plain/l1/q1': card('1', 1) });
    const r = buildReport([logic, plain], p, NOW);
    assert.equal(r.itemNoun, 'topics');
    assert.deepEqual(r.strengths.map((s) => s.id), ['loops']);
    assert.equal(r.counts.mastered, 1);
    assert.ok(r.tips.some((t) => t.id === 'confirm'));
  });

  test('isStarted', () => {
    assert.equal(isStarted(logic, progress({})), false);
    assert.equal(isStarted(logic, progress({ 'logic/l1/q1': card('1') })), true);
    assert.equal(isStarted(logic, progress({}, { 'logic/l2': NOW })), true);
  });
});
