// Tests for the diagnostician (root causes), the listener (explain it back) and the interviewer. Run with: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { prerequisites, rootCauses } from '../src/lib/diagnose.ts';
import { interviewPlan, mainCourse, PACE_GOAL } from '../src/lib/interview.ts';
import { explainBack, mentions, MIN_EXPLAIN_WORDS, textWords as words, wordCount } from '../src/lib/listener.ts';
import type { Concept, ConceptLink } from '../src/types.ts';

describe('the diagnostician', () => {
  const links: ConceptLink[] = [
    { from: 'loops', to: 'variables', label: 'builds on' },
    { from: 'comprehensions', to: 'loops', label: 'builds on' },
    { from: 'functions', to: 'variables', label: 'needs' },
    { from: 'variables', to: 'functions', label: 'contrasts with' },
    { from: 'types', to: 'variables', label: 'is used in' },
    { from: 'loops', to: 'java/loops', label: 'builds on' },
  ];

  test('reads prerequisites from the link labels, both directions, same course only', () => {
    const p = prerequisites(links);
    assert.deepEqual(p.get('loops'), ['variables']);
    assert.deepEqual(p.get('comprehensions'), ['loops']);
    assert.deepEqual(p.get('functions'), ['variables']);
    assert.deepEqual(p.get('variables'), ['types'], '"types is used in variables": types comes first; "contrasts with" is not a prerequisite');
  });

  test('other links between lessons point back to the earlier lesson; comparisons and explicit labels are kept', () => {
    const lesson: Record<string, number> = { heap: 0, raii: 1, uniq: 2, stack: 0 };
    const p = prerequisites(
      [
        { from: 'uniq', to: 'raii', label: 'applies' },
        { from: 'heap', to: 'raii', label: 'is cleaned up by' },
        { from: 'stack', to: 'heap', label: 'contrasts with' },
        { from: 'heap', to: 'uniq', label: 'builds on' },
      ],
      (c) => lesson[c],
    );
    assert.deepEqual(p.get('uniq'), ['raii'], 'lesson 2 builds on lesson 1');
    assert.deepEqual(p.get('raii'), ['heap'], 'the earlier lesson is the foundation, whichever way the link points');
    assert.deepEqual(p.get('heap'), ['uniq'], 'an explicit "builds on" wins over lesson order');
    assert.equal(p.get('stack'), undefined, 'a comparison is not a dependency');
  });

  test('weak concepts are grouped by the deepest shaky foundation they build on', () => {
    const p = prerequisites(links);
    const shaky = new Set(['variables', 'loops', 'comprehensions', 'functions']);
    const causes = rootCauses(['comprehensions', 'functions', 'loops'], (c) => shaky.has(c), p);
    assert.deepEqual(causes, [{ root: 'variables', explains: ['comprehensions', 'functions', 'loops'] }]);
  });

  test('the deepest shaky prerequisite wins; solid ones are skipped over', () => {
    const p = prerequisites(links);
    // variables is solid, but types (below it) is shaky.
    const causes = rootCauses(['comprehensions'], (c) => c === 'loops' || c === 'types', p);
    assert.deepEqual(causes, [{ root: 'types', explains: ['comprehensions'] }]);
  });

  test('a weak concept with no shaky foundation is its own cause and is not reported', () => {
    assert.deepEqual(rootCauses(['loops'], () => false, prerequisites(links)), []);
  });

  test('cycles in the graph do not loop forever', () => {
    const p = prerequisites([
      { from: 'a', to: 'b', label: 'needs' },
      { from: 'b', to: 'a', label: 'needs' },
    ]);
    assert.deepEqual(rootCauses(['a'], (c) => c === 'b', p), [{ root: 'b', explains: ['a'] }]);
  });

  test('the shipped courses have prerequisite graphs to diagnose with', () => {
    const python = JSON.parse(readFileSync(new URL('../src/content/topics/python.json', import.meta.url), 'utf8'));
    const p = prerequisites(python.links);
    const ids = new Set(python.concepts.map((c: Concept) => c.id));
    assert.ok(p.size >= 5, `python has ${p.size} concepts with prerequisites`);
    for (const [c, pre] of p) for (const x of [c, ...pre]) assert.ok(ids.has(x), `${x} is a python concept`);
  });
});

describe('the listener', () => {
  const ideas: Concept[] = [
    { id: 'lists', label: 'List', lesson: 'l', aliases: ['array'] },
    { id: 'slicing', label: 'Slicing', lesson: 'l', summary: '`a[1:3]` takes items 1 and 2.' },
    { id: 'mutability', label: 'Mutable vs immutable', lesson: 'l', aliases: ['mutable', 'immutability'] },
    { id: 'dict', label: 'Dictionary lookup', lesson: 'l', aliases: ['dict'] },
  ];

  test('finds a term inside free text: plurals, case, typos and multi-word terms', () => {
    assert.ok(mentions(words('We used LISTS a lot'), 'List'));
    assert.ok(mentions(words('slicng gives a copy'), 'Slicing'), 'one typo in a 6-letter word');
    assert.ok(mentions(words('a dictionary lookup is fast'), 'Dictionary lookup'));
    assert.ok(!mentions(words('a dictionary is fast'), 'Dictionary lookup'), 'every word of the term, in order');
    assert.ok(!mentions(words('put it in a map'), 'map'), 'single words under 4 letters are too common to count');
    assert.ok(mentions(words('look at the dict'), 'dict'));
  });

  test('3 of 4 ideas, and which one was missed', () => {
    const r = explainBack(
      'A list keeps items in order and you can change it because lists are mutable. Slicing with a[1:3] copies part of it.',
      ideas,
    );
    assert.deepEqual(r.covered.map((c) => c.id), ['lists', 'slicing', 'mutability']);
    assert.deepEqual(r.missed.map((c) => c.id), ['dict']);
  });

  test('works with accents (other languages) through aliases', () => {
    const fr: Concept[] = [{ id: 'mutability', label: 'Mutabilité', lesson: 'l', aliases: ['mutable'] }];
    assert.equal(explainBack('Une liste est mutable, on peut la modifier', fr).covered.length, 1);
    assert.equal(explainBack('La mutabilité des listes permet de les modifier', fr).covered.length, 1);
  });

  test('counts words', () => {
    assert.equal(wordCount('  one, two —   three '), 3);
    assert.ok(MIN_EXPLAIN_WORDS >= 10);
  });
});

describe('the interviewer', () => {
  const track = (id: string, courses: string[]) => ({ id, nodes: courses.map((course) => ({ course })) });
  const python = track('python-backend', ['learn-anything-fast', 'python', 'git', 'sql']);

  test('the main course is the first one after Learn Anything Fast', () => {
    assert.equal(mainCourse(python), 'python');
    assert.equal(mainCourse(track('game-engines', ['learn-anything-fast', 'cpp', 'game-development-cpp'])), 'cpp');
  });

  test('new to programming: start with how to learn; experienced: find your level in the main course', () => {
    assert.deepEqual(interviewPlan(python, 'none', 15), { track: 'python-backend', start: { course: 'learn-anything-fast', kind: 'learn' }, dailyGoal: PACE_GOAL[15] });
    assert.deepEqual(interviewPlan(python, 'some', 5).start, { course: 'python', kind: 'level' });
    assert.deepEqual(interviewPlan(python, 'pro', 60), { track: 'python-backend', start: { course: 'python', kind: 'level' }, dailyGoal: 200 });
  });

  test('the thinking track always starts at the beginning', () => {
    const thinking = track('thinking-tools', ['learn-anything-fast', 'logical-thinking']);
    assert.deepEqual(interviewPlan(thinking, 'pro', 30).start, { course: 'learn-anything-fast', kind: 'learn' });
  });

  test('every pace maps to a daily goal the profile offers', () => {
    assert.deepEqual(Object.values(PACE_GOAL), [20, 50, 100, 200]);
  });
});
