// Tests for the sparring partner (which wrong choice the learner argues against). Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { sparChoice } from '../src/lib/sparring.ts';

describe('the sparring partner', () => {
  test('argues against the first wrong pick when it is valid', () => {
    assert.equal(sparChoice(2, 4, 'step-1', 0), 0);
    assert.equal(sparChoice(2, 4, 'step-1', 3), 3);
  });

  test('ignores a first wrong pick equal to the answer or out of range', () => {
    const fallback = sparChoice(2, 4, 'step-1');
    assert.equal(sparChoice(2, 4, 'step-1', 2), fallback);
    assert.equal(sparChoice(2, 4, 'step-1', 4), fallback);
    assert.equal(sparChoice(2, 4, 'step-1', -1), fallback);
    assert.equal(sparChoice(2, 4, 'step-1', 1.5), fallback);
  });

  test('never returns the answer', () => {
    for (let seed = 0; seed < 200; seed++) {
      assert.notEqual(sparChoice(1, 4, `step-${seed}`), 1);
      assert.notEqual(sparChoice(3, 4, `step-${seed}`, null), 3);
    }
  });

  test('is deterministic per seed', () => {
    assert.equal(sparChoice(0, 5, 'mcq-loops-2'), sparChoice(0, 5, 'mcq-loops-2'));
  });

  test('returns -1 when there is no wrong choice to argue against', () => {
    assert.equal(sparChoice(0, 1, 'step-1'), -1);
    assert.equal(sparChoice(0, 0, 'step-1'), -1);
  });

  test('spreads across the wrong choices for different seeds', () => {
    const picks = new Set<number>();
    for (let seed = 0; seed < 100; seed++) picks.add(sparChoice(1, 4, `step-${seed}`));
    assert.deepEqual([...picks].sort(), [0, 2, 3]);
  });
});
