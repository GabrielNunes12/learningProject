// Tests for the pure helpers behind the order and buckets mini-games. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  dragShift,
  dragTarget,
  formatClock,
  hitTest,
  isCleanRun,
  minMoves,
  moveItem,
  scrambledOrder,
  shuffledIndexes,
} from '../src/lib/sortGames.ts';

/** A deterministic random source (LCG), so failures are reproducible. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('shuffling', () => {
  test('shuffledIndexes is a permutation', () => {
    const rand = seeded(1);
    for (let n = 0; n <= 9; n++) {
      assert.deepEqual([...shuffledIndexes(n, rand)].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i));
    }
  });

  test('scrambledOrder is never already sorted', () => {
    const rand = seeded(42);
    for (let n = 2; n <= 8; n++) {
      for (let k = 0; k < 300; k++) {
        const order = scrambledOrder(n, rand);
        assert.deepEqual([...order].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i));
        assert.ok(order.some((v, i) => v !== i), `identity for n=${n}`);
      }
    }
  });

  test('scrambledOrder survives a random source that always yields the identity', () => {
    const order = scrambledOrder(4, () => 0.999999);
    assert.ok(order.some((v, i) => v !== i));
  });
});

describe('moving and counting moves', () => {
  test('moveItem moves one element and keeps the rest in order', () => {
    assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']);
    assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 3, 0), ['d', 'a', 'b', 'c']);
    assert.deepEqual(moveItem(['a', 'b'], 1, 1), ['a', 'b']);
    assert.deepEqual(moveItem(['a', 'b', 'c'], 0, 99), ['b', 'c', 'a']);
  });

  test('minMoves counts the cards outside the longest increasing run', () => {
    assert.equal(minMoves([0, 1, 2, 3]), 0);
    assert.equal(minMoves([1, 0, 2, 3]), 1);
    assert.equal(minMoves([3, 0, 1, 2]), 1);
    assert.equal(minMoves([3, 2, 1, 0]), 3);
    assert.equal(minMoves([1, 3, 0, 2]), 2);
  });

  test('minMoves single moves really are enough', () => {
    // Brute force: breadth-first search over single moves for every permutation of 5.
    const perms = (n: number): number[][] =>
      n === 0 ? [[]] : perms(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
    const key = (p: number[]) => p.join(',');
    const dist = new Map<string, number>([[key([0, 1, 2, 3, 4]), 0]]);
    let frontier = [[0, 1, 2, 3, 4]];
    while (frontier.length) {
      const next: number[][] = [];
      for (const p of frontier) {
        for (let f = 0; f < 5; f++) {
          for (let t = 0; t < 5; t++) {
            const q = moveItem(p, f, t);
            if (!dist.has(key(q))) {
              dist.set(key(q), dist.get(key(p))! + 1);
              next.push(q);
            }
          }
        }
      }
      frontier = next;
    }
    for (const p of perms(5)) assert.equal(minMoves(p), dist.get(key(p)), key(p));
  });
});

describe('drag layout', () => {
  // Four cards, 50px tall, 10px apart: tops 0, 60, 120, 180.
  const tops = [0, 60, 120, 180];
  const heights = [50, 50, 50, 50];

  test('dragTarget follows the dragged card past neighbours’ middles', () => {
    assert.equal(dragTarget(tops, heights, 0, 0), 0);
    assert.equal(dragTarget(tops, heights, 0, 30), 0); // middle 55 < neighbour middle 85
    assert.equal(dragTarget(tops, heights, 0, 70), 1); // middle 95 > 85
    assert.equal(dragTarget(tops, heights, 0, 500), 3);
    assert.equal(dragTarget(tops, heights, 3, -100), 0);
    assert.equal(dragTarget(tops, heights, 2, 70), 2); // middle 95 is still below card 1’s middle (85)
    assert.equal(dragTarget(tops, heights, 2, 50), 1);
  });

  test('dragShift opens a gap at the target', () => {
    // Dragging card 0 down to slot 2: cards 1 and 2 slide up one step.
    assert.deepEqual([0, 1, 2, 3].map((i) => dragShift(i, 0, 2, 60)), [0, -60, -60, 0]);
    // Dragging card 3 up to slot 1: cards 1 and 2 slide down.
    assert.deepEqual([0, 1, 2, 3].map((i) => dragShift(i, 3, 1, 60)), [0, 60, 60, 0]);
    assert.deepEqual([0, 1, 2, 3].map((i) => dragShift(i, 2, 2, 60)), [0, 0, 0, 0]);
  });
});

describe('buckets helpers', () => {
  const boxes = [
    { left: 0, top: 0, width: 100, height: 100 },
    { left: 110, top: 0, width: 100, height: 100 },
  ];

  test('hitTest finds the box under the pointer', () => {
    assert.equal(hitTest(boxes, 50, 50), 0);
    assert.equal(hitTest(boxes, 150, 10), 1);
    assert.equal(hitTest(boxes, 105, 50), -1);
    assert.equal(hitTest(boxes, 50, 150), -1);
    assert.equal(hitTest([], 0, 0), -1);
  });

  test('hitTest prefers the closest centre when boxes overlap', () => {
    const overlapping = [
      { left: 0, top: 0, width: 100, height: 100 },
      { left: 50, top: 0, width: 100, height: 100 },
    ];
    assert.equal(hitTest(overlapping, 60, 50), 0);
    assert.equal(hitTest(overlapping, 90, 50), 1);
  });

  test('formatClock', () => {
    assert.equal(formatClock(0), '0:00');
    assert.equal(formatClock(9_999), '0:09');
    assert.equal(formatClock(83_400), '1:23');
    assert.equal(formatClock(-5), '0:00');
  });

  test('a clean run needs every card sorted and no misses', () => {
    assert.equal(isCleanRun(8, 8, 0), true);
    assert.equal(isCleanRun(8, 8, 1), false);
    assert.equal(isCleanRun(7, 8, 0), false);
  });
});
