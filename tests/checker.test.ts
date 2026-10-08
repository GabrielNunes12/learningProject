// Tests for the checker (true or false claims at the end of a lesson). Run with: npm test
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { lessonClaims, type Claim } from '../src/lib/checker.ts';
import type { Concept, ConceptLink, CourseFile } from '../src/types.ts';

const norm = (s: string) => s.trim().toLowerCase();
const concept = (id: string, lesson: string): Concept => ({ id, label: id, lesson });
const labelsOf = (links: ConceptLink[]) => links.map((l) => norm(l.label));
const linked = (links: ConceptLink[], a: string, b: string) => links.some((l) => (l.from === a && l.to === b) || (l.from === b && l.to === a));
const readsAs = (c: Claim) => `${c.from}\u0000${c.to}`;

// Four lessons' worth of ideas: lesson "b" has the links under test.
const concepts: Concept[] = [
  concept('a1', 'a'),
  concept('a2', 'a'),
  concept('b1', 'b'),
  concept('b2', 'b'),
  concept('b3', 'b'),
  concept('c1', 'c'),
  concept('c2', 'c'),
  concept('d1', 'd'),
];
const order = ['a', 'b', 'c', 'd'];
const links: ConceptLink[] = [
  { from: 'b1', to: 'a1', label: 'builds on' },
  { from: 'b2', to: 'b1', label: 'builds on' },
  { from: 'b3', to: 'b2', label: 'contrasts with' },
  { from: 'b2', to: 'c1', label: 'is used in' },
  { from: 'b3', to: 'a2', label: 'replaces' },
  { from: 'c2', to: 'd1', label: 'needs' },
];

describe('the checker', () => {
  test('only reversible labels are reversed; a comparison is never flipped', () => {
    const claims = lessonClaims(concepts, links, labelsOf(links), 'b', 'seed', 6, order);
    for (const c of claims.filter((c) => c.kind === 'reversed')) {
      assert.ok(['builds on', 'is used in', 'replaces'].includes(norm(links[c.link].label)), `reversed a "${links[c.link].label}" link`);
      assert.equal(c.from, links[c.link].to);
      assert.equal(c.to, links[c.link].from);
    }
    assert.ok(!claims.some((c) => c.link === 2 && c.kind !== 'link'), '"contrasts with" only appears as written');
  });

  test('a reversed claim is skipped when the reverse link with the same label exists', () => {
    const mutual: ConceptLink[] = [
      { from: 'b1', to: 'b2', label: 'builds on' },
      { from: 'b2', to: 'b1', label: 'builds on' },
      { from: 'b3', to: 'a1', label: 'needs' },
    ];
    const seeds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    const all = seeds.flatMap((s) => lessonClaims(concepts, mutual, labelsOf(mutual), 'b', s, 6, order));
    assert.ok(!all.some((c) => c.kind === 'reversed' && c.link < 2), 'both builds-on links are mutual, so neither reverses');
    assert.ok(all.some((c) => c.kind === 'reversed' && c.link === 2), 'the one-way "needs" still reverses');
  });

  test('a swapped claim never names an idea linked to its first concept', () => {
    for (const seed of ['one', 'two', 'three', 'four', 'five']) {
      const claims = lessonClaims(concepts, links, labelsOf(links), 'b', seed, 6, order);
      for (const c of claims.filter((c) => c.kind === 'swapped')) {
        assert.notEqual(c.to, c.from);
        assert.ok(!linked(links, c.from, c.to), `${c.from} and ${c.to} are linked`);
      }
    }
  });

  test('builds-on swaps prefer an idea from a later lesson', () => {
    const one: ConceptLink[] = [{ from: 'b1', to: 'b2', label: 'builds on' }, { from: 'b3', to: 'a1', label: 'needs' }, { from: 'b2', to: 'c1', label: 'contrasts with' }, { from: 'c2', to: 'd1', label: 'contrasts with' }];
    for (const seed of ['x', 'y', 'z', 'w']) {
      const claims = lessonClaims(concepts, one, labelsOf(one), 'b', seed, 6, order);
      const swap = claims.find((c) => c.kind === 'swapped' && norm(one[c.link].label) === 'builds on');
      if (swap) assert.ok(['c', 'd'].includes(concepts.find((k) => k.id === swap.to)!.lesson), `swapped to ${swap.to}, not a later lesson`);
    }
  });

  test('the same seed gives the same claims, and different seeds vary them', () => {
    const a = lessonClaims(concepts, links, labelsOf(links), 'b', 'python/decorators', 6, order);
    const b = lessonClaims(concepts, links, labelsOf(links), 'b', 'python/decorators', 6, order);
    assert.deepEqual(a, b);
    const variants = new Set(
      ['s1', 's2', 's3', 's4', 's5', 's6'].map((s) => JSON.stringify(lessonClaims(concepts, links, labelsOf(links), 'b', s, 6, order))),
    );
    assert.ok(variants.size > 1, 'the seed changes which claims are picked');
  });

  test('about half the claims are true, and the rest false', () => {
    const claims = lessonClaims(concepts, links, labelsOf(links), 'b', 'balance', 6, order);
    assert.equal(claims.length, 6);
    assert.equal(claims.filter((c) => c.truth).length, 3);
    assert.equal(claims.filter((c) => !c.truth).length, 3);
    for (const c of claims) assert.equal(c.truth, c.kind === 'link');
  });

  test('a true claim is the link as written', () => {
    const claims = lessonClaims(concepts, links, labelsOf(links), 'b', 'seed', 6, order);
    for (const c of claims.filter((c) => c.truth)) {
      assert.equal(c.from, links[c.link].from);
      assert.equal(c.to, links[c.link].to);
    }
  });

  test('returns nothing when fewer than four claims can be made', () => {
    const one: ConceptLink[] = [{ from: 'b1', to: 'a1', label: 'contrasts with' }];
    assert.deepEqual(lessonClaims(concepts, one, labelsOf(one), 'b', 'seed', 6, order), []);
    assert.deepEqual(lessonClaims(concepts, [], [], 'b', 'seed', 6, order), []);
    assert.deepEqual(lessonClaims(concepts, links, labelsOf(links), 'nope', 'seed', 6, order), [], 'no lesson of that id');
  });

  test('links to other courses, or to concepts that do not exist, are ignored', () => {
    const foreign: ConceptLink[] = [
      { from: 'b1', to: 'java/loops', label: 'builds on' },
      { from: 'b2', to: 'ghost', label: 'builds on' },
    ];
    assert.deepEqual(lessonClaims(concepts, foreign, labelsOf(foreign), 'b', 'seed', 6, order), []);
  });
});

describe('the checker on every shipped course', () => {
  const dir = join(import.meta.dirname, '..', 'src', 'content', 'topics');
  const courses = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as CourseFile);

  test('no false claim matches an existing link, and no two claims share a pair of ideas', () => {
    let lessons = 0;
    let claimed = 0;
    for (const course of courses) {
      const cs = course.concepts ?? [];
      const ls = course.links ?? [];
      const labels = labelsOf(ls);
      const lessonList = course.units ? course.units.flatMap((u) => u.lessons) : (course.lessons ?? []);
      const lessonOrder = lessonList.map((l) => l.id);
      for (const lesson of lessonList) {
        lessons++;
        const claims: Claim[] = lessonClaims(cs, ls, labels, lesson.id, `${course.id}/${lesson.id}`, 6, lessonOrder);
        assert.ok(claims.length === 0 || (claims.length >= 4 && claims.length <= 6), `${course.id}/${lesson.id}: ${claims.length} claims`);
        const pairs = new Set<string>();
        for (const c of claims) {
          claimed++;
          const key = readsAs(c);
          assert.ok(!pairs.has(key), `${course.id}/${lesson.id}: "${c.from} → ${c.to}" appears twice`);
          pairs.add(key);
          if (!c.truth) {
            const clash = ls.some((l) => l.from === c.from && l.to === c.to && norm(l.label) === labels[c.link]);
            assert.ok(!clash, `${course.id}/${lesson.id}: false claim ${c.from} ${labels[c.link]} ${c.to} is an existing link`);
          }
        }
      }
    }
    assert.ok(lessons > 0 && claimed > 0, 'the courses were read');
  });
});
