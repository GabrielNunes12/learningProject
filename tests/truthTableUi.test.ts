// Tests for the truth-table mini-game's UI logic. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isTruthTableCorrect, truthTableKey, truthTableMarks } from '../src/lib/answers.ts';
import {
  allTruthFilled,
  cycleTruth,
  editableColumns,
  emptyTruthCells,
  filledCount,
  nextTruthPos,
  prettyLogic,
  rowsRight,
  setTruthCell,
  spokenLogic,
  truthKey,
} from '../src/lib/truthTableUi.ts';
import type { TruthTableStep } from '../src/types.ts';

// A sample step for reasoning about the UI (not used in any course).
const deMorgan: TruthTableStep = {
  type: 'truthtable',
  id: 'q-tt',
  prompt: 'Fill in the table.',
  vars: ['P', 'Q'],
  columns: [{ expr: 'P and Q', given: true }, { expr: 'not (P and Q)' }, { expr: '!P || !Q', label: 'Either is false' }],
  explanation: 'Why.',
};

describe('truth table: cells', () => {
  test('tapping cycles blank → T → F → blank', () => {
    assert.equal(cycleTruth(null), true);
    assert.equal(cycleTruth(true), false);
    assert.equal(cycleTruth(false), null);
  });

  test('only non-given columns count toward "filled"', () => {
    const editable = editableColumns(deMorgan.columns);
    assert.deepEqual(editable, [1, 2]);
    let cells = emptyTruthCells(4, 3);
    assert.equal(allTruthFilled(cells, editable), false);
    for (let r = 0; r < 4; r++) for (const c of editable) cells = setTruthCell(cells, r, c, r === 0 ? false : true);
    assert.equal(filledCount(cells, editable), 8);
    assert.equal(allTruthFilled(cells, editable), true);
    assert.equal(cells[0][0], null); // the given column is never filled by the learner
    assert.equal(isTruthTableCorrect(deMorgan, cells), true);
  });

  test('setTruthCell copies only the changed row', () => {
    const cells = emptyTruthCells(2, 2);
    const next = setTruthCell(cells, 1, 0, true);
    assert.equal(next[0], cells[0]);
    assert.notEqual(next[1], cells[1]);
    assert.deepEqual(next[1], [true, null]);
  });

  test('rows right counts rows whose every cell is marked right', () => {
    const cells = emptyTruthCells(4, 3).map((row) => row.map(() => true as boolean | null));
    cells[0][1] = false;
    const marks = truthTableMarks(deMorgan, cells);
    // Key: ¬(P∧Q) = F T T T, so row 0 is fixed by the false; rows 1–3 are all T in both columns.
    assert.deepEqual(truthTableKey(deMorgan).map((r) => r.slice(1)), [
      [false, false],
      [true, true],
      [true, true],
      [true, true],
    ]);
    assert.equal(rowsRight(marks), 3);
  });
});

describe('truth table: keyboard', () => {
  test('T/F set and advance, Space cycles, Backspace clears', () => {
    const at = { r: 0, c: 0 };
    assert.deepEqual(truthKey('t', at, 4, 2), { kind: 'set', value: true, advance: true });
    assert.deepEqual(truthKey('F', at, 4, 2), { kind: 'set', value: false, advance: true });
    assert.deepEqual(truthKey('1', at, 4, 2), { kind: 'set', value: true, advance: true });
    assert.deepEqual(truthKey(' ', at, 4, 2), { kind: 'cycle' });
    assert.deepEqual(truthKey('Backspace', at, 4, 2), { kind: 'set', value: null, advance: false });
    assert.equal(truthKey('q', at, 4, 2), null);
  });

  test('arrows move and stop at the edges; Home / End jump along the row', () => {
    assert.deepEqual(truthKey('ArrowDown', { r: 3, c: 0 }, 4, 2), { kind: 'move', to: { r: 3, c: 0 } });
    assert.deepEqual(truthKey('ArrowRight', { r: 1, c: 0 }, 4, 2), { kind: 'move', to: { r: 1, c: 1 } });
    assert.deepEqual(truthKey('ArrowLeft', { r: 1, c: 0 }, 4, 2), { kind: 'move', to: { r: 1, c: 0 } });
    assert.deepEqual(truthKey('ArrowUp', { r: 1, c: 1 }, 4, 2), { kind: 'move', to: { r: 0, c: 1 } });
    assert.deepEqual(truthKey('End', { r: 2, c: 0 }, 4, 3), { kind: 'move', to: { r: 2, c: 2 } });
    assert.deepEqual(truthKey('Home', { r: 2, c: 2 }, 4, 3), { kind: 'move', to: { r: 2, c: 0 } });
  });

  test('typing fills down a column, then moves to the top of the next one', () => {
    assert.deepEqual(nextTruthPos({ r: 0, c: 0 }, 4, 2), { r: 1, c: 0 });
    assert.deepEqual(nextTruthPos({ r: 3, c: 0 }, 4, 2), { r: 0, c: 1 });
    assert.deepEqual(nextTruthPos({ r: 3, c: 1 }, 4, 2), { r: 3, c: 1 });
  });
});

describe('truth table: pretty expressions', () => {
  test('ASCII and words become logic symbols with tidy spacing', () => {
    assert.equal(prettyLogic('not (P and Q)'), '¬(P ∧ Q)');
    assert.equal(prettyLogic('!P || !Q'), '¬P ∨ ¬Q');
    assert.equal(prettyLogic('P -> Q'), 'P → Q');
    assert.equal(prettyLogic('P<->Q'), 'P ↔ Q');
    assert.equal(prettyLogic('P xor (Q & ~R)'), 'P ⊕ (Q ∧ ¬R)');
    assert.equal(prettyLogic('A implies B iff C'), 'A → B ↔ C');
    assert.equal(prettyLogic('P && T'), 'P ∧ T');
    assert.equal(prettyLogic('¬(P∨Q)'), '¬(P ∨ Q)');
    assert.equal(prettyLogic('not not P'), '¬¬P');
  });

  test('spoken form reads the symbols as words', () => {
    assert.equal(spokenLogic('not (P and Q) -> R'), 'not (P and Q) implies R');
    assert.equal(spokenLogic('P <-> Q'), 'P if and only if Q');
  });
});
