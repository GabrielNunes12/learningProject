// Tests for the logic parser and the truth-table / logic-grid / balance checks. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { balanceSolution, gameAnswerLabel, isLogicGridSolved, isTruthTableCorrect, truthTableMarks } from '../src/lib/answers.ts';
import { evalLogic, parseLogic, truthRows, truthTableAnswers } from '../src/lib/logic.ts';
import { validateCourse } from '../src/content/validate.ts';
import type { BalanceStep, LogicGridStep, TruthTableStep } from '../src/types.ts';

const col = (vars: string[], expr: string) => truthTableAnswers(vars, [expr]).map((r) => (r[0] ? 'T' : 'F')).join('');

describe('logic parser', () => {
  test('rows come in textbook order', () => {
    assert.deepEqual(truthRows(['P', 'Q']), [
      { P: true, Q: true },
      { P: true, Q: false },
      { P: false, Q: true },
      { P: false, Q: false },
    ]);
    assert.equal(truthRows(['A', 'B', 'C']).length, 8);
  });

  test('evaluates every operator and its spellings', () => {
    assert.equal(col(['P', 'Q'], 'P and Q'), 'TFFF');
    assert.equal(col(['P', 'Q'], 'P ∧ Q'), 'TFFF');
    assert.equal(col(['P', 'Q'], 'P || Q'), 'TTTF');
    assert.equal(col(['P', 'Q'], 'P xor Q'), 'FTTF');
    assert.equal(col(['P', 'Q'], 'P -> Q'), 'TFTT');
    assert.equal(col(['P', 'Q'], 'P → Q'), 'TFTT');
    assert.equal(col(['P', 'Q'], 'P <-> Q'), 'TFFT');
    assert.equal(col(['P'], 'not P'), 'FT');
    assert.equal(col(['P'], '¬¬P'), 'TF');
  });

  test('uses standard precedence: not > and > xor > or > -> > <->', () => {
    assert.equal(col(['P', 'Q'], 'not P and Q'), col(['P', 'Q'], '(not P) and Q'));
    assert.equal(col(['P', 'Q', 'R'], 'P or Q and R'), col(['P', 'Q', 'R'], 'P or (Q and R)'));
    assert.equal(col(['P', 'Q', 'R'], 'P -> Q -> R'), col(['P', 'Q', 'R'], 'P -> (Q -> R)'));
    assert.equal(col(['P', 'Q'], 'P -> Q <-> not Q -> not P'), 'TTTT', 'contrapositive is equivalent');
    assert.equal(col(['P', 'Q'], '(P -> Q) <-> (Q -> P)'), 'TFFT', 'converse is not');
  });

  test('allows word variables and constants', () => {
    const tree = parseLogic('rain -> wet and T', ['rain', 'wet']);
    assert.equal(evalLogic(tree, { rain: true, wet: false }), false);
  });

  test('reports malformed expressions', () => {
    assert.throws(() => parseLogic('P and', ['P']), /ends too early/);
    assert.throws(() => parseLogic('(P or Q', ['P', 'Q']), /never closed/);
    assert.throws(() => parseLogic('P and R', ['P', 'Q']), /"R" is not one of the variables/);
    assert.throws(() => parseLogic('P Q', ['P', 'Q']), /after a complete expression/);
    assert.throws(() => parseLogic('P # Q', ['P', 'Q']), /unexpected "#"/);
  });
});

const tt: TruthTableStep = {
  type: 'truthtable',
  id: 'q-tt',
  prompt: 'Fill it in.',
  vars: ['P', 'Q'],
  columns: [{ expr: 'not Q', given: true }, { expr: 'P -> Q', label: 'If P then Q' }],
  explanation: 'Why.',
};
const grid: LogicGridStep = {
  type: 'logicgrid',
  id: 'q-g',
  prompt: 'Solve it.',
  categories: [
    { name: 'Person', items: ['Ana', 'Ben', 'Cy'] },
    { name: 'Drink', items: ['tea', 'coffee', 'juice'] },
  ],
  clues: ['Ana drinks coffee.', 'Ben does not drink juice.'],
  solution: [['coffee'], ['tea'], ['juice']],
  explanation: 'Why.',
};
const balance: BalanceStep = { type: 'balance', id: 'q-bal', prompt: 'Solve.', left: [2, 3], right: [0, 9], explanation: 'Why.' };

describe('truth table, logic grid and balance checks', () => {
  test('truth table cells', () => {
    const right = [
      [null, true],
      [null, false],
      [null, true],
      [null, true],
    ];
    assert.equal(isTruthTableCorrect(tt, right), true, 'given columns need no input');
    const wrong = right.map((r) => [...r]);
    wrong[2][1] = false;
    wrong[3][1] = null;
    assert.deepEqual(truthTableMarks(tt, wrong).map((r) => r[1]), [true, true, false, false]);
    assert.equal(gameAnswerLabel(tt), '`If P then Q`: T F T T');
  });

  test('logic grid picks', () => {
    assert.equal(isLogicGridSolved(grid, [[1], [0], [2]]), true);
    assert.equal(isLogicGridSolved(grid, [[1], [2], [0]]), false);
    assert.equal(isLogicGridSolved(grid, [[1], [0], [null]]), false);
    assert.equal(gameAnswerLabel(grid), '**Ana:** coffee · **Ben:** tea · **Cy:** juice');
  });

  test('balance solution', () => {
    assert.equal(balanceSolution(balance), 3);
    assert.equal(balanceSolution({ ...balance, left: [5, -4], right: [2, 11] }), 5);
    assert.equal(gameAnswerLabel({ ...balance, variable: 'n' }), 'n = 3');
  });
});

describe('validation of the new games', () => {
  const errors = (step: object) =>
    validateCourse(
      { id: 'd', title: 'D', icon: 'T', description: 'D.', keyIdeas: ['I.'], lessons: [{ id: 'l', title: 'L', pareto: 'core', takeaway: 'T.', steps: [step] }] },
      'd.json',
    ).join('\n');

  test('accepts well-formed steps', () => {
    assert.equal(errors(tt), '');
    assert.equal(errors(grid), '');
    assert.equal(errors(balance), '');
  });

  test('rejects broken steps', () => {
    assert.match(errors({ ...tt, columns: [{ expr: 'P and' }] }), /can't read "P and": the expression ends too early/);
    assert.match(errors({ ...tt, columns: [{ expr: 'P', given: true }] }), /at least one column that isn't "given"/);
    assert.match(errors({ ...tt, vars: ['P', 'Q', 'R', 'S'] }), /1–3 "vars"/);
    assert.match(errors({ ...grid, solution: [['coffee'], ['coffee'], ['juice']] }), /each "Drink" item exactly once/);
    assert.match(errors({ ...grid, categories: [grid.categories[0], { name: 'Drink', items: ['tea', 'coffee'] }] }), /same number of items/);
    assert.match(errors({ ...balance, right: [0, 8] }), /must be a whole number/);
    assert.match(errors({ ...balance, right: [2, 9] }), /different x-coefficients/);
    assert.match(errors({ ...balance, left: [1, 0], right: [0, 4] }), /already solved/);
  });
});

describe('course icons', async () => {
  const { iconProblem, LOGOS } = await import('../src/content/validate.ts');
  const { existsSync } = await import('node:fs');

  test('accepts logos and short monograms', () => {
    for (const icon of ['logo:python', 'P(x)', '∴', '80/20', 'SQL', '✓', '%']) assert.equal(iconProblem(icon), null, icon);
  });

  test('rejects emoji, unknown logos and long monograms', () => {
    assert.match(iconProblem('🐍') ?? '', /can't be an emoji/);
    assert.match(iconProblem('🧠') ?? '', /can't be an emoji/);
    assert.match(iconProblem('logo:rust') ?? '', /unknown logo/);
    assert.match(iconProblem('Python') ?? '', /too long/);
    assert.match(iconProblem('') ?? '', /missing/);
  });

  test('every logo has its SVG file', () => {
    for (const name of LOGOS) assert.ok(existsSync(new URL(`../src/assets/logos/${name}.svg`, import.meta.url)), name);
  });
});
