// Tests for the balance-scale equation model. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  applyMove,
  describeMove,
  formatEquation,
  formatSide,
  isSolved,
  minMoves,
  panGroups,
  previewMove,
  quickAmounts,
  sensibleMoves,
  shortMove,
  solve,
  solvedSide,
  solvedValue,
  starsFor,
  type Equation,
  type Move,
} from '../src/lib/balance.ts';

const eq = (a: number, b: number, c: number, d: number): Equation => ({ left: [a, b], right: [c, d] });
const apply = (e: Equation, m: Move) => {
  const r = applyMove(e, m);
  assert.ok(r.ok, `expected ${describeMove(m)} to be allowed on ${formatEquation(e)}`);
  return r.eq;
};
const refused = (e: Equation, m: Move) => {
  const r = applyMove(e, m);
  assert.equal(r.ok, false);
  return r.ok ? '' : r.reason;
};

describe('formatting', () => {
  test('sides', () => {
    assert.equal(formatSide([2, 3]), '2x + 3');
    assert.equal(formatSide([-1, -4]), '−x − 4');
    assert.equal(formatSide([1, 0]), 'x');
    assert.equal(formatSide([0, 0]), '0');
    assert.equal(formatSide([0, -7]), '−7');
    assert.equal(formatSide([-3, 0]), '−3x');
    assert.equal(formatSide([5, -2], 'n'), '5n − 2');
  });

  test('equations and moves', () => {
    assert.equal(formatEquation(eq(2, 3, 0, 9)), '2x + 3 = 9');
    assert.equal(describeMove({ op: '-', k: 3 }), '− 3 from both sides');
    assert.equal(describeMove({ op: '+', k: 2, x: true }), '+ 2x to both sides');
    assert.equal(describeMove({ op: '-', k: 1, x: true }), '− x from both sides');
    assert.equal(describeMove({ op: '*', k: -1 }), '× (−1) on both sides');
    assert.equal(describeMove({ op: '/', k: 2 }), '÷ 2 on both sides');
    assert.equal(shortMove({ op: '-', k: 3 }), '−3');
    assert.equal(shortMove({ op: '*', k: -1 }), '×(−1)');
    assert.equal(shortMove({ op: '+', k: 1, x: true }), '+x');
  });

  test('preview writes the move into both sides', () => {
    assert.equal(previewMove(eq(2, 3, 0, 9), { op: '-', k: 3 }), '2x + 3 − 3 = 9 − 3');
    assert.equal(previewMove(eq(2, 0, 0, 6), { op: '/', k: 2 }), '2x ÷ 2 = 6 ÷ 2');
    assert.equal(previewMove(eq(2, 4, 0, 6), { op: '/', k: 2 }), '(2x + 4) ÷ 2 = 6 ÷ 2');
    assert.equal(previewMove(eq(-1, 0, 0, 3), { op: '*', k: -1 }), '−x × (−1) = 3 × (−1)');
  });
});

describe('moves are done to both sides', () => {
  test('add and subtract numbers and x-terms', () => {
    assert.deepEqual(apply(eq(2, 3, 0, 9), { op: '-', k: 3 }), eq(2, 0, 0, 6));
    assert.deepEqual(apply(eq(2, -3, 0, 9), { op: '+', k: 3 }), eq(2, 0, 0, 12));
    assert.deepEqual(apply(eq(3, 1, 1, 5), { op: '-', k: 1, x: true }), eq(2, 1, 0, 5));
    assert.deepEqual(apply(eq(2, 0, -1, 6), { op: '+', k: 1, x: true }), eq(3, 0, 0, 6));
  });

  test('multiply by any non-zero whole number', () => {
    assert.deepEqual(apply(eq(-1, 0, 0, 3), { op: '*', k: -1 }), eq(1, 0, 0, -3));
    assert.deepEqual(apply(eq(1, 2, 0, 3), { op: '*', k: 3 }), eq(3, 6, 0, 9));
    assert.match(refused(eq(1, 2, 0, 3), { op: '*', k: 0 }), /0/);
    assert.match(refused(eq(1, 2, 0, 3), { op: '*', k: 1 }), /nothing/);
  });

  test('divide only when every number divides evenly', () => {
    assert.deepEqual(apply(eq(2, 0, 0, 6), { op: '/', k: 2 }), eq(1, 0, 0, 3));
    assert.deepEqual(apply(eq(4, 2, 2, 6), { op: '/', k: 2 }), eq(2, 1, 1, 3));
    assert.deepEqual(apply(eq(-3, 0, 0, 12), { op: '/', k: -3 }), eq(1, 0, 0, -4));
    const reason = refused(eq(2, 3, 0, 9), { op: '/', k: 2 });
    assert.match(reason, /3 and 9/);
    assert.match(reason, /fractions/);
    assert.match(refused(eq(2, 0, 0, 6), { op: '/', k: 0 }), /divide by 0/);
  });

  test('refuses no-ops, x as a multiplier, and runaway numbers', () => {
    assert.ok(refused(eq(2, 3, 0, 9), { op: '+', k: 0 }));
    assert.ok(refused(eq(2, 3, 0, 9), { op: '*', k: 2, x: true }));
    assert.match(refused(eq(20, 20, 1, 0), { op: '*', k: 99 }), /huge/);
  });

  test('never produces negative zero', () => {
    const r = apply(eq(0, 0, -2, 4), { op: '*', k: -1 });
    assert.ok(Object.is(r.left[0], 0) && Object.is(r.left[1], 0));
  });

  test('every move keeps the solution', () => {
    const start = eq(3, 1, 1, 5); // x = 2
    const moves: Move[] = [
      { op: '+', k: 7 },
      { op: '-', k: 4, x: true },
      { op: '*', k: -3 },
      { op: '+', k: 2, x: true },
    ];
    let e = start;
    for (const m of moves) {
      e = apply(e, m);
      assert.equal(e.left[0] * 2 + e.left[1], e.right[0] * 2 + e.right[1]);
    }
  });
});

describe('solved', () => {
  test('x alone on either side, no x on the other', () => {
    assert.ok(isSolved(eq(1, 0, 0, 3)));
    assert.ok(isSolved(eq(0, -4, 1, 0)));
    assert.equal(solvedValue(eq(0, -4, 1, 0)), -4);
    assert.equal(solvedSide(eq(0, -4, 1, 0)), 'right');
    assert.ok(!isSolved(eq(-1, 0, 0, 3)));
    assert.ok(!isSolved(eq(1, 2, 0, 3)));
    assert.ok(!isSolved(eq(1, 0, 1, 3)));
    assert.equal(solvedValue(eq(2, 0, 0, 6)), null);
  });
});

describe('par by breadth-first search', () => {
  test('known pars', () => {
    assert.equal(minMoves(eq(1, 3, 0, 7)), 1); // x + 3 = 7
    assert.equal(minMoves(eq(2, 0, 0, 6)), 1); // 2x = 6
    assert.equal(minMoves(eq(-1, 0, 0, 3)), 1); // −x = 3
    assert.equal(minMoves(eq(2, 3, 0, 9)), 2); // 2x + 3 = 9
    assert.equal(minMoves(eq(2, 4, 0, 6)), 2); // ÷2 then −2, or −4 then ÷2
    assert.equal(minMoves(eq(3, 1, 1, 5)), 3); // 3x + 1 = x + 5
    assert.equal(minMoves(eq(2, 5, 3, 1)), 2); // −2x → 5 = x + 1 → −1
    assert.equal(minMoves(eq(1, 0, 0, 3)), 0);
  });

  test('the solution path really solves it, in exactly par moves', () => {
    for (const start of [eq(3, 1, 1, 5), eq(-2, 7, 1, -2), eq(5, -3, 2, 9), eq(-4, 8, 0, 0)]) {
      const path = solve(start)!;
      assert.ok(path);
      let e = start;
      for (const m of path) e = apply(e, m);
      assert.ok(isSolved(e), formatEquation(start));
      assert.equal(path.length, minMoves(start));
    }
  });

  test('every equation the validator accepts has a par of at most 3', () => {
    for (let a = -20; a <= 20; a += 3) {
      for (let c = -20; c <= 20; c += 5) {
        if (a === c) continue;
        for (let b = -20; b <= 20; b += 7) {
          for (let x = -4; x <= 4; x++) {
            const d = (a - c) * x + b;
            if (Math.abs(d) > 20) continue;
            const start = eq(a, b, c, d);
            if (isSolved(start)) continue;
            const par = minMoves(start);
            assert.ok(par !== null && par >= 1 && par <= 3, `${formatEquation(start)}: par ${par}`);
            let e = start;
            for (const m of solve(start)!) e = apply(e, m);
            assert.equal(solvedValue(e), x);
          }
        }
      }
    }
  });

  test('sensible moves cancel what is there, divide by coefficients and flip signs', () => {
    const ms = sensibleMoves(eq(2, 3, -1, 9)).map((m) => shortMove(m));
    assert.deepEqual(ms, ['−3', '−2x', '−9', '+x', '÷2', '÷(−1)', '×(−1)']);
  });

  test('gives up past the depth cap', () => {
    assert.equal(minMoves(eq(3, 1, 1, 5), 2), null);
  });
});

describe('scoring and pad helpers', () => {
  test('stars', () => {
    assert.equal(starsFor(2, 2), 3);
    assert.equal(starsFor(1, 2), 3);
    assert.equal(starsFor(4, 2), 2);
    assert.equal(starsFor(5, 2), 1);
  });

  test('quick amounts come from the scale', () => {
    const e = eq(2, -3, 1, 9);
    assert.deepEqual(
      quickAmounts(e, '-').map((m) => shortMove(m)),
      ['−3', '−9', '−2x', '−x'],
    );
    assert.deepEqual(quickAmounts(e, '*').map((m) => m.k), [-1]);
    assert.deepEqual(quickAmounts(e, '/').map((m) => m.k), [2, -1]);
  });

  test('pan pieces, with stacks for big counts', () => {
    assert.deepEqual(panGroups([2, -3]), [
      { kind: 'x', negative: false, count: 2, stacked: false },
      { kind: 'unit', negative: true, count: 3, stacked: false },
    ]);
    assert.deepEqual(panGroups([0, 17]), [{ kind: 'unit', negative: false, count: 17, stacked: true }]);
    assert.deepEqual(panGroups([0, 0]), []);
  });
});
