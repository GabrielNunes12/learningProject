// Tests for the Socratic step-back (the probe after a wrong answer). Run with: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { prerequisites } from '../src/lib/diagnose.ts';
import { probeFor } from '../src/lib/socratic.ts';
import type { Concept, ConceptLink } from '../src/types.ts';

const concept = (id: string, lesson: string, summary?: string): Concept => ({ id, label: id, lesson, summary });

describe('the socratic step-back', () => {
  const concepts: Concept[] = [
    concept('variables', 'basics', 'A variable is a name bound to a value.'),
    concept('loops', 'control', 'A loop repeats a block of code.'),
    concept('functions', 'control', 'A function packages code under a name.'),
    concept('lists', 'data', 'A list is an ordered collection.'),
    concept('dicts', 'data', 'A dict maps keys to values.'),
    concept('types', 'basics', 'A type says what operations a value supports.'),
    concept('recursion', 'control', 'Recursion is a function calling itself.'),
    concept('no-summary', 'data'),
  ];
  const links: ConceptLink[] = [
    { from: 'loops', to: 'variables', label: 'builds on' },
    { from: 'functions', to: 'loops', label: 'needs' },
    { from: 'recursion', to: 'functions', label: 'builds on' },
    { from: 'lists', to: 'loops', label: 'uses' },
  ];
  const prereqs = prerequisites(links);

  test('asks about the prerequisite when the question has one (foundation)', () => {
    const p = probeFor(['loops'], concepts, prereqs, 'course/q1');
    assert.ok(p);
    assert.equal(p.foundation, true);
    assert.equal(p.concept.id, 'variables');
    assert.equal(p.choices[p.answer], 'A variable is a name bound to a value.');
  });

  test('falls back to the question concept itself when it has no prerequisite', () => {
    const p = probeFor(['variables'], concepts, prereqs, 'course/q1');
    assert.ok(p);
    assert.equal(p.foundation, false);
    assert.equal(p.concept.id, 'variables');
    assert.equal(p.choices[p.answer], 'A variable is a name bound to a value.');
  });

  test('takes the first step concept that has a prerequisite, in step order', () => {
    const p = probeFor(['variables', 'recursion'], concepts, prereqs, 'course/q2');
    assert.ok(p);
    assert.equal(p.foundation, true);
    assert.equal(p.concept.id, 'functions');
  });

  test('skips a prerequisite without a summary or from another course', () => {
    const cs = [concept('a', 'l1', 'A.'), concept('b', 'l1'), concept('c', 'l1', 'C.'), concept('d', 'l1', 'D.'), concept('e', 'l1', 'E.')];
    const ps = new Map([
      ['a', ['b', 'other/x']],
      ['d', ['c']],
    ]);
    assert.equal(probeFor(['a'], cs, ps, 's')?.concept.id, 'a', 'no usable prerequisite: asks about the question concept');
    assert.equal(probeFor(['d'], cs, ps, 's')?.concept.id, 'c');
  });

  test('is null without concepts or summaries', () => {
    assert.equal(probeFor(undefined, concepts, prereqs, 's'), null);
    assert.equal(probeFor([], concepts, prereqs, 's'), null);
    assert.equal(probeFor(['no-summary'], concepts, prereqs, 's'), null);
    assert.equal(probeFor(['unknown'], concepts, prereqs, 's'), null);
  });

  test('is null with fewer than two other summaries to offer', () => {
    const few = [concept('a', 'l1', 'A.'), concept('b', 'l1', 'B.')];
    assert.equal(probeFor(['a'], few, new Map(), 's'), null);
  });

  test('distractors exclude the target, the step concepts and repeated texts', () => {
    const cs = [
      concept('target', 'l1', 'Same.'),
      concept('step', 'l1', 'Step text.'),
      concept('twin', 'l1', 'Same.'),
      concept('x', 'l2', 'X text.'),
      concept('y', 'l2', 'Y text.'),
      concept('z', 'l3', 'Z text.'),
    ];
    const p = probeFor(['step'], cs, new Map([['step', ['target']]]), 's');
    assert.ok(p);
    assert.equal(p.choices.length, 3);
    assert.equal(new Set(p.choices).size, 3, 'no repeated choice text');
    assert.ok(!p.choices.includes('Step text.'), 'a step concept is never offered');
    assert.equal(p.choices.filter((c) => c === 'Same.').length, 1, 'the twin summary is the same text as the target');
    assert.equal(p.choices[p.answer], 'Same.');
  });

  test('prefers distractors from the target lesson', () => {
    const cs = [
      concept('foundation', 'l1', 'Foundation.'),
      concept('step', 'l5', 'Step.'),
      concept('a', 'l1', 'A.'),
      concept('b', 'l1', 'B.'),
      concept('far1', 'l9', 'Far one.'),
      concept('far2', 'l9', 'Far two.'),
    ];
    const p = probeFor(['step'], cs, new Map([['step', ['foundation']]]), 'seed');
    assert.ok(p);
    assert.deepEqual([...p.choices].sort(), ['A.', 'B.', 'Foundation.']);
  });

  test('is deterministic per seed and the answer always points at the target', () => {
    const a = probeFor(['loops'], concepts, prereqs, 'course/lesson/q');
    const b = probeFor(['loops'], concepts, prereqs, 'course/lesson/q');
    assert.deepEqual(a, b);
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const p = probeFor(['loops'], concepts, prereqs, `seed-${i}`);
      assert.ok(p);
      assert.equal(p.choices[p.answer], 'A variable is a name bound to a value.');
      seen.add(p.answer);
    }
    assert.ok(seen.size > 1, 'the target moves around between seeds');
  });

  test('every concept of the real python course yields a probe whose answer is its target', () => {
    const course = JSON.parse(readFileSync(new URL('../src/content/topics/python.json', import.meta.url), 'utf8')) as {
      concepts: Concept[];
      links: ConceptLink[];
      units: { lessons: { id: string; steps: { id: string; type: string; concepts?: string[] }[] }[] }[];
    };
    const lessonOf = new Map(course.concepts.map((c) => [c.id, course.units.flatMap((u) => u.lessons).findIndex((l) => l.id === c.lesson)]));
    const graph = prerequisites(course.links, (id) => (lessonOf.get(id) ?? -1) >= 0 ? lessonOf.get(id) : undefined);

    let probed = 0;
    for (const unit of course.units)
      for (const lesson of unit.lessons)
        for (const step of lesson.steps) {
          if (!step.concepts?.length) continue;
          const p = probeFor(step.concepts, course.concepts, graph, `python/${step.id}`);
          assert.ok(p, `question ${step.id} has a probe`);
          assert.equal(p.choices.length, 3);
          assert.equal(p.choices[p.answer], p.concept.summary);
          probed++;
        }
    assert.ok(probed > 0, 'python has questions with concepts');

    for (const c of course.concepts) {
      const p = probeFor([c.id], course.concepts, graph, `python/${c.id}`);
      assert.ok(p, `concept ${c.id} has a probe`);
      assert.equal(p.choices[p.answer], p.concept.summary);
    }
  });
});
