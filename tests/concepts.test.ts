// Tests for concept-graph validation. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { validateConceptCoverage, validateConceptRefs, validateCourse } from '../src/content/validate.ts';

const q = (id: string, concepts?: string[]) => ({ type: 'order', id, prompt: 'P', items: ['a', 'b', 'c'], explanation: 'E.', ...(concepts ? { concepts } : {}) });
const course = (extra: object, steps = [q('q1', ['loops'])]) => ({
  id: 'demo',
  title: 'Demo',
  icon: 'D',
  description: 'D.',
  keyIdeas: ['I.'],
  lessons: [{ id: 'l1', title: 'L', pareto: 'core', takeaway: 'T.', steps }],
  concepts: [
    { id: 'loops', label: 'Loops', lesson: 'l1', aliases: ['for loop'] },
    { id: 'ranges', label: 'Ranges', lesson: 'l1' },
  ],
  links: [{ from: 'loops', to: 'ranges', label: 'iterate over' }],
  ...extra,
});
const errors = (c: object) => validateCourse(c, 'demo.json').join('\n');

describe('concept graph validation', () => {
  test('accepts a well-formed graph with tagged questions', () => {
    assert.equal(errors(course({})), '');
    assert.equal(errors(course({ links: [{ from: 'loops', to: 'python/for-loops', label: 'same as' }] })), '');
  });

  test('rejects broken concepts', () => {
    assert.match(errors(course({ concepts: [{ id: 'Loops!', label: 'L', lesson: 'l1' }] })), /kebab-case/);
    assert.match(errors(course({ concepts: [{ id: 'loops', label: 'L', lesson: 'nope' }] })), /"lesson" must be a lesson id/);
    assert.match(errors(course({ concepts: [{ id: 'loops', label: 'L', lesson: 'l1' }, { id: 'loops', label: 'M', lesson: 'l1' }] })), /duplicate concept id/);
  });

  test('rejects broken links', () => {
    assert.match(errors(course({ links: [{ from: 'loops', to: 'nope', label: 'x' }] })), /"to" must be a concept id/);
    assert.match(errors(course({ links: [{ from: 'loops', to: 'loops', label: 'x' }] })), /can't link to itself/);
    assert.match(errors(course({ links: [{ from: 'loops', to: 'ranges', label: '' }] })), /needs a "label"/);
    assert.match(
      errors(course({ links: [{ from: 'loops', to: 'ranges', label: 'a' }, { from: 'ranges', to: 'loops', label: 'b' }] })),
      /already linked/,
    );
  });

  test('checks question tags', () => {
    assert.match(errors(course({}, [q('q1', ['nope'])])), /"concepts" must list concept ids/);
    assert.match(errors(course({ concepts: undefined, links: undefined }, [q('q1', ['loops'])])), /no "concepts" list/);
  });

  test('checks cross-course links once all courses are loaded', () => {
    const a = course({ links: [{ from: 'loops', to: 'other/maps', label: 'used by' }] });
    const b = { id: 'other', concepts: [{ id: 'maps', label: 'Maps', lesson: 'x' }] };
    assert.deepEqual(validateConceptRefs([a, b]), []);
    assert.match(validateConceptRefs([a]).join(''), /no such concept/);
  });
});

describe('concept coverage (shipped courses)', () => {
  // Eight concepts on one lesson, each tested by its own question: the smallest course that passes.
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const full = (extra: object = {}, steps = ids.map((id) => q(`q-${id}`, [id]))) =>
    course({ concepts: ids.map((id) => ({ id, label: id.toUpperCase(), lesson: 'l1' })), links: [], ...extra }, steps);
  const coverage = (c: object) => validateConceptCoverage(c, 'demo.json').join('\n');

  test('accepts a fully tagged graph', () => {
    assert.equal(coverage(full()), '');
    assert.equal(coverage(full({}, [{ type: 'explain', id: 'intro', body: 'B.' }, ...ids.map((id) => q(`q-${id}`, [id]))])), '');
  });

  test('requires a graph of the right size', () => {
    assert.match(coverage(course({ concepts: undefined, links: undefined }, [q('q1')])), /needs a concept graph of 8–24/);
    assert.match(coverage(course({})), /has 2/);
  });

  test('flags untagged questions, untested concepts and lessons that teach nothing', () => {
    assert.match(coverage(full({}, [...ids.map((id) => q(`q-${id}`, [id])), q('q-extra')])), /question "q-extra": list the "concepts"/);
    assert.match(coverage(full({}, ids.slice(1).map((id) => q(`q-${id}`, [id])))), /concept "a": no graded step tests it/);
    const twoLessons = full({
      lessons: [
        { id: 'l1', title: 'L', pareto: 'core', takeaway: 'T.', steps: ids.map((id) => q(`q-${id}`, [id])) },
        { id: 'l2', title: 'M', pareto: 'core', takeaway: 'T.', steps: [q('q-more', ['a'])] },
      ],
    });
    assert.match(coverage(twoLessons), /lesson "l2": no concept is taught here/);
  });
});
