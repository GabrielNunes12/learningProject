// Tests for the dice simulator's pure logic. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { emptyState, exactLabel, exactProbability, pct, rollBatch, rollFaces, seededRng, thin, totalCounts, totalsRange } from '../src/lib/dicesim.ts';

describe('totalCounts', () => {
  test('two six-sided dice: the triangle 1,2,3,4,5,6,5,4,3,2,1', () => {
    assert.deepEqual(totalCounts(2, 6).slice(2), [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]);
    assert.equal(totalCounts(2, 6)[0], 0);
    assert.equal(totalCounts(2, 6)[1], 0);
  });
  test('one coin and one die are uniform', () => {
    assert.deepEqual(totalCounts(1, 2), [0, 1, 1]);
    assert.deepEqual(totalCounts(1, 6).slice(1), [1, 1, 1, 1, 1, 1]);
  });
  test('counts always sum to sides^dice', () => {
    for (let dice = 1; dice <= 3; dice++)
      for (const sides of [2, 4, 6, 8, 10, 12, 20]) {
        const c = totalCounts(dice, sides);
        assert.equal(c.length, dice * sides + 1);
        assert.equal(c.reduce((a, b) => a + b, 0), sides ** dice);
      }
  });
  test('three dice: 27 ways to make 10 and 11', () => {
    const c = totalCounts(3, 6);
    assert.equal(c[10], 27);
    assert.equal(c[11], 27);
    assert.equal(c[3], 1);
  });
  test('totalsRange', () => {
    assert.deepEqual(totalsRange(2, 3), [2, 3, 4, 5, 6]);
  });
});

describe('exactProbability', () => {
  test('sum of 7 with two dice is 6/36 = 1/6', () => {
    const e = exactProbability(2, 6, [7]);
    assert.deepEqual([e.hits, e.outcomes, e.num, e.den], [6, 36, 1, 6]);
    assert.equal(exactLabel(e), '6/36 = 1/6 ≈ 16.7%');
  });
  test('12 with two dice: 1/36', () => {
    const e = exactProbability(2, 6, [12]);
    assert.equal(exactLabel(e), '1/36 ≈ 2.8%');
  });
  test('several targets add, duplicates and unreachable totals ignored', () => {
    const e = exactProbability(2, 6, [2, 12, 12, 13]);
    assert.deepEqual([e.hits, e.num, e.den], [2, 1, 18]);
  });
  test('coin heads is 1/2', () => {
    assert.equal(exactProbability(1, 2, [1]).p, 0.5);
  });
  test('pct', () => {
    assert.equal(pct(1 / 6), '16.7%');
    assert.equal(pct(1 / 216), '0.46%');
    assert.equal(pct(0), '0.0%');
  });
});

describe('rolling', () => {
  test('seeded rolls are reproducible and in range', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    for (let i = 0; i < 200; i++) {
      const fa = rollFaces(3, 20, a);
      assert.deepEqual(fa, rollFaces(3, 20, b));
      assert.ok(fa.every((f) => Number.isInteger(f) && f >= 1 && f <= 20));
    }
  });
  test('every face shows up', () => {
    const rng = seededRng(1);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rollFaces(1, 6, rng)[0]);
    assert.deepEqual([...seen].sort(), [1, 2, 3, 4, 5, 6]);
  });
  test('rollBatch keeps counts, hits and series consistent and does not mutate', () => {
    const s0 = emptyState(2, 6);
    const s1 = rollBatch(s0, 2, 6, [7], 1, seededRng(7));
    assert.equal(s0.rolls, 0);
    assert.equal(s1.rolls, 1);
    assert.equal(s1.last.length, 2);
    assert.equal(s1.series.length, 1);
    const s2 = rollBatch(s1, 2, 6, [7], 10_000, seededRng(8));
    assert.equal(s2.rolls, 10_001);
    assert.equal(s2.counts.reduce((a, b) => a + b, 0), 10_001);
    assert.equal(s2.hits, s2.counts[7]);
    assert.ok(s2.series.length <= 400);
    assert.equal(s2.series[s2.series.length - 1].rolls, 10_001);
    // law of large numbers: 10,000 rolls land near 1/6
    assert.ok(Math.abs(s2.hits / s2.rolls - 1 / 6) < 0.02, `rate ${s2.hits / s2.rolls}`);
  });
  test('thin keeps first and last and stays under the cap', () => {
    const pts = Array.from({ length: 1001 }, (_, i) => ({ rolls: i + 1, rate: 0.5 }));
    const t = thin(pts, 400);
    assert.ok(t.length <= 400);
    assert.equal(t[0].rolls, 1);
    assert.equal(t[t.length - 1].rolls, 1001);
  });
});
