// Tests for the logic-grid model behind LogicGridGame. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isLogicGridSolved } from '../src/lib/answers.ts';
import {
  autoFill,
  autoFillAll,
  cellAt,
  clearAuto,
  cycleMark,
  derivePicks,
  emptyLogicGrid,
  gridSummary,
  logicBlocks,
  logicKey,
  logicMove,
  picksComplete,
  posOf,
  rowsPicked,
  setMark,
  solutionGrid,
  solutionIndexes,
  toggleMark,
  wrongTicks,
  type LogicGrid,
} from '../src/lib/logicGrid.ts';
import type { LogicGridStep } from '../src/types.ts';

// A sample puzzle for reasoning about the UI (not used in any course).
const pets: LogicGridStep = {
  type: 'logicgrid',
  id: 'q-grid',
  prompt: 'Who owns which pet, and who drinks what?',
  categories: [
    { name: 'Person', items: ['Ana', 'Ben', 'Cy'] },
    { name: 'Pet', items: ['cat', 'dog', 'fish'] },
    { name: 'Drink', items: ['tea', 'coffee', 'juice'] },
  ],
  clues: ['Ana owns the dog.', 'The cat owner drinks juice.', 'Cy does not drink tea.', 'Ben does not own the fish.'],
  solution: [
    ['dog', 'tea'],
    ['cat', 'juice'],
    ['fish', 'coffee'],
  ],
  explanation: 'Why.',
};
const two: LogicGridStep = { ...pets, categories: pets.categories.slice(0, 2), solution: pets.solution.map((r) => [r[0]]) };

/** Draws a block as text, one string per row: . blank, x ✗, - helper ✗, o ✓. */
const draw = (block: LogicGrid[number]) => block.map((row) => row.map((m) => (m === '' ? '.' : m === 'auto' ? '-' : m)).join(''));

describe('logic grid: blocks and marks', () => {
  test('two categories have one graded block; three add the C2 × C1 reasoning block', () => {
    assert.deepEqual(logicBlocks(2), [{ rowCat: 0, colCat: 1, graded: true }]);
    assert.deepEqual(logicBlocks(3), [
      { rowCat: 0, colCat: 1, graded: true },
      { rowCat: 0, colCat: 2, graded: true },
      { rowCat: 2, colCat: 1, graded: false },
    ]);
    const g = emptyLogicGrid(3, 4);
    assert.equal(g.length, 3);
    assert.deepEqual(draw(g[2]), ['....', '....', '....', '....']);
  });

  test('tapping cycles blank → ✗ → ✓ → blank, and a helper ✗ goes straight to ✓', () => {
    assert.equal(cycleMark(''), 'x');
    assert.equal(cycleMark('x'), 'o');
    assert.equal(cycleMark('o'), '');
    assert.equal(cycleMark('auto'), 'o');
  });

  test('X / O toggle their own mark', () => {
    assert.equal(toggleMark('', 'o'), 'o');
    assert.equal(toggleMark('o', 'o'), '');
    assert.equal(toggleMark('x', 'o'), 'o');
    assert.equal(toggleMark('', 'x'), 'x');
    assert.equal(toggleMark('auto', 'x'), '');
    assert.equal(toggleMark('o', 'x'), 'x');
  });
});

describe('logic grid: helper ✗s', () => {
  test('a ✓ fills ✗ across the rest of its row and column, inside its block only', () => {
    const g = setMark(emptyLogicGrid(3, 3), 0, 1, 2, 'o', true);
    assert.deepEqual(draw(g[0]), ['..-', '--o', '..-']);
    assert.deepEqual(draw(g[1]), ['...', '...', '...']);
  });

  test('helpers keep the learner’s own marks and never overwrite a ✓', () => {
    let g = setMark(emptyLogicGrid(2, 3), 0, 0, 0, 'x', true);
    g = setMark(g, 0, 0, 1, 'o', true);
    g = setMark(g, 0, 2, 1, 'o', true); // a contradiction stays visible
    assert.deepEqual(draw(g[0]), ['xo-', '.-.', '-o-']);
  });

  test('removing a ✓ takes its helper ✗s away, but not ones another ✓ still needs', () => {
    let g = setMark(emptyLogicGrid(2, 3), 0, 0, 0, 'o', true);
    g = setMark(g, 0, 1, 1, 'o', true);
    assert.deepEqual(draw(g[0]), ['o--', '-o-', '--.']);
    g = setMark(g, 0, 0, 0, '', true);
    assert.deepEqual(draw(g[0]), ['.-.', '-o-', '.-.']);
  });

  test('without helpers nothing is filled in; switching them off and on clears and re-derives', () => {
    const off = setMark(emptyLogicGrid(2, 3), 0, 0, 0, 'o', false);
    assert.deepEqual(draw(off[0]), ['o..', '...', '...']);
    const on = autoFillAll(off);
    assert.deepEqual(draw(on[0]), ['o--', '-..', '-..']);
    assert.deepEqual(draw(clearAuto(on)[0]), ['o..', '...', '...']);
    assert.deepEqual(autoFill([['x', ''], ['', '']]), [['x', ''], ['', '']]);
  });
});

describe('logic grid: picks, completion and grading', () => {
  /** Fills the graded blocks from a list of [row, block, column] ✓s. */
  const withTicks = (cats: number, ticks: [number, number, number][]) =>
    ticks.reduce((g, [r, b, c]) => setMark(g, b, r, c, 'o', true), emptyLogicGrid(cats, 3));

  test('picks are the single ✓ per row and block; check unlocks once every row has one in every block', () => {
    const partial = withTicks(3, [
      [0, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
    ]);
    assert.deepEqual(derivePicks(partial, 3), [
      [1, 0],
      [0, null],
      [null, null],
    ]);
    assert.equal(picksComplete(partial, 3), false);
    assert.equal(rowsPicked(partial, 3), 1);

    const full = withTicks(3, [
      [0, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
      [1, 1, 2],
      [2, 0, 2],
      [2, 1, 1],
    ]);
    assert.equal(picksComplete(full, 3), true);
    assert.equal(isLogicGridSolved(pets, derivePicks(full, 3)), true);
    assert.equal(wrongTicks(full, pets).size, 0);
  });

  test('two ✓s in one row is not a pick', () => {
    const g = setMark(setMark(emptyLogicGrid(2, 3), 0, 0, 0, 'o', false), 0, 0, 1, 'o', false);
    assert.deepEqual(derivePicks(g, 2)[0], [null]);
  });

  test('wrong ✓s are flagged, in graded blocks and in the reasoning block', () => {
    let g = withTicks(2, [
      [0, 0, 0], // Ana-cat: wrong (dog)
      [1, 0, 1], // Ben-dog: wrong (cat)
      [2, 0, 2], // Cy-fish: right
    ]);
    assert.equal(isLogicGridSolved(two, derivePicks(g, 2)), false);
    assert.deepEqual([...wrongTicks(g, two)].sort(), ['0:0:0', '0:1:1']);
    g = setMark(emptyLogicGrid(3, 3), 2, 0, 0, 'o', true); // tea ↔ cat: wrong (tea ↔ dog)
    assert.deepEqual([...wrongTicks(g, pets)], ['2:0:0']);
  });

  test('the solution grid has one ✓ per row and column in every block, C2 × C1 included', () => {
    assert.deepEqual(solutionIndexes(pets), [
      [1, 0],
      [0, 2],
      [2, 1],
    ]);
    const sol = solutionGrid(pets);
    assert.deepEqual(draw(sol[0]), ['xox', 'oxx', 'xxo']);
    assert.deepEqual(draw(sol[1]), ['oxx', 'xxo', 'xox']);
    // rows: tea, coffee, juice; columns: cat, dog, fish
    assert.deepEqual(draw(sol[2]), ['xox', 'xxo', 'oxx']);
    assert.equal(isLogicGridSolved(pets, derivePicks(sol, 3)), true);
  });
});

describe('logic grid: solution-so-far summary', () => {
  test('shows direct picks, and chains through the C2 × C1 block when it pins a match down', () => {
    let g = emptyLogicGrid(3, 3);
    g = setMark(g, 0, 0, 1, 'o', true); // Ana-dog
    g = setMark(g, 2, 0, 1, 'o', true); // tea-dog → Ana drinks tea
    g = setMark(g, 1, 1, 2, 'o', true); // Ben-juice
    g = setMark(g, 2, 2, 0, 'o', true); // juice-cat → Ben owns the cat
    assert.deepEqual(gridSummary(g, 3), [
      [
        { item: 1, inferred: false },
        { item: 0, inferred: true },
      ],
      [
        { item: 0, inferred: true },
        { item: 2, inferred: false },
      ],
      [
        { item: null, inferred: false },
        { item: null, inferred: false },
      ],
    ]);
    assert.deepEqual(gridSummary(emptyLogicGrid(2, 3), 2)[0], [{ item: null, inferred: false }]);
  });
});

describe('logic grid: staircase coordinates and keys', () => {
  test('positions map to blocks, and the bottom-right corner is empty', () => {
    assert.deepEqual(cellAt({ gr: 1, gc: 4 }, 3, 3), { b: 1, r: 1, c: 1 });
    assert.deepEqual(cellAt({ gr: 4, gc: 2 }, 3, 3), { b: 2, r: 1, c: 2 });
    assert.equal(cellAt({ gr: 4, gc: 3 }, 3, 3), null);
    assert.equal(cellAt({ gr: 3, gc: 0 }, 2, 3), null);
    for (const [b, r, c] of [
      [0, 2, 1],
      [1, 0, 2],
      [2, 2, 0],
    ]) {
      assert.deepEqual(cellAt(posOf(b, r, c, 3), 3, 3), { b, r, c });
    }
  });

  test('arrows cross block borders but never leave the staircase', () => {
    assert.deepEqual(logicMove({ gr: 0, gc: 2 }, 'ArrowRight', 3, 3), { gr: 0, gc: 3 });
    assert.deepEqual(logicMove({ gr: 2, gc: 1 }, 'ArrowDown', 3, 3), { gr: 3, gc: 1 });
    assert.deepEqual(logicMove({ gr: 2, gc: 4 }, 'ArrowDown', 3, 3), { gr: 2, gc: 4 });
    assert.deepEqual(logicMove({ gr: 3, gc: 2 }, 'ArrowRight', 3, 3), { gr: 3, gc: 2 });
    assert.deepEqual(logicMove({ gr: 0, gc: 0 }, 'ArrowUp', 3, 3), { gr: 0, gc: 0 });
    assert.deepEqual(logicMove({ gr: 1, gc: 1 }, 'End', 3, 3), { gr: 1, gc: 5 });
    assert.deepEqual(logicMove({ gr: 4, gc: 1 }, 'End', 3, 3), { gr: 4, gc: 2 });
    assert.deepEqual(logicMove({ gr: 4, gc: 1 }, 'Home', 3, 3), { gr: 4, gc: 0 });
    assert.equal(logicMove({ gr: 0, gc: 0 }, 'a', 3, 3), null);
  });

  test('keys map to actions', () => {
    assert.equal(logicKey('x'), 'x');
    assert.equal(logicKey('O'), 'o');
    assert.equal(logicKey(' '), 'cycle');
    assert.equal(logicKey('Backspace'), 'clear');
    assert.equal(logicKey('q'), null);
  });
});
