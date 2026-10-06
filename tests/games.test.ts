// Tests for the mini-game answer checks and the new validation rules. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { checkTraceValue, gameAnswerLabel, isOrderCorrect, isRightBucket, orderMarks } from '../src/lib/answers.ts';
import { validateCourse, validateRoadmap } from '../src/content/validate.ts';
import type { BucketsStep, OrderStep, TraceStep } from '../src/types.ts';

const order: OrderStep = { type: 'order', id: 'q-o', prompt: 'Order', items: ['FROM', 'WHERE', 'SELECT'], explanation: 'Why.' };
const buckets: BucketsStep = {
  type: 'buckets',
  id: 'q-b',
  prompt: 'Sort',
  buckets: ['Truthy', 'Falsy'],
  items: [
    { text: "'a'", bucket: 0 },
    { text: '0', bucket: 1 },
    { text: '[]', bucket: 1 },
    { text: "' '", bucket: 0 },
  ],
  explanation: 'Why.',
};
const trace: TraceStep = {
  type: 'trace',
  id: 'q-t',
  prompt: 'Trace',
  language: 'python',
  code: "s = 'a'\ns = s * 2\nn = len(s)",
  frames: [
    { line: 1, vars: { s: "'a'" } },
    { line: 2, vars: { s: "'aa'" }, ask: 's' },
    { line: 3, vars: { s: "'aa'", n: '2' }, ask: 'n' },
  ],
  explanation: 'Why.',
};

describe('order game', () => {
  test('marks each position', () => {
    assert.deepEqual(orderMarks(order, [0, 2, 1]), [true, false, false]);
    assert.equal(isOrderCorrect(order, [0, 1, 2]), true);
    assert.equal(isOrderCorrect(order, [1, 0, 2]), false);
    assert.equal(isOrderCorrect(order, [0, 1]), false);
  });
});

describe('buckets game', () => {
  test('checks one card at a time', () => {
    assert.equal(isRightBucket(buckets, 0, 0), true);
    assert.equal(isRightBucket(buckets, 1, 0), false);
    assert.equal(isRightBucket(buckets, 9, 0), false);
  });
});

describe('trace game', () => {
  test('accepts the value with or without string quotes, ignoring spaces', () => {
    assert.equal(checkTraceValue(trace.frames[1], "'aa'"), true);
    assert.equal(checkTraceValue(trace.frames[1], 'aa'), true);
    assert.equal(checkTraceValue(trace.frames[1], ' aa '), true);
    assert.equal(checkTraceValue(trace.frames[1], 'a'), false);
    assert.equal(checkTraceValue(trace.frames[2], '2'), true);
    assert.equal(checkTraceValue(trace.frames[2], ''), false);
    assert.equal(checkTraceValue(trace.frames[0], 'a'), false, 'frames without ask never match');
  });

  test('labels the revealed answers', () => {
    assert.equal(gameAnswerLabel(order), 'FROM → WHERE → SELECT');
    assert.equal(gameAnswerLabel(trace), "`s = 'aa'` after line 2, `n = 2` after line 3");
    assert.match(gameAnswerLabel(buckets), /\*\*Falsy:\*\* 0, \[\]/);
  });
});

describe('validation', () => {
  const course = (step: object) => ({
    id: 'demo',
    title: 'Demo',
    icon: 'T',
    description: 'Demo.',
    keyIdeas: ['Idea.'],
    lessons: [{ id: 'l1', title: 'L', pareto: 'core', takeaway: 'T.', steps: [step] }],
  });
  const errors = (step: object) => validateCourse(course(step), 'demo.json').join('\n');

  test('accepts well-formed games and simulators', () => {
    for (const step of [
      order,
      buckets,
      trace,
      { type: 'sim', sim: 'git', goal: { text: 'Merge', merged: [{ from: 'feature', into: 'main' }] } },
      { type: 'sim', sim: 'dice', dice: 2, sides: 6, target: [7], goalRolls: 100 },
      { type: 'sim', sim: 'growth', curves: ['n', 'n^2'] },
      {
        type: 'sim',
        sim: 'join',
        left: { name: 'customers', columns: ['id', 'name'], rows: [[1, 'Ana']] },
        right: { name: 'orders', columns: ['id', 'customer_id'], rows: [[10, 1]] },
        on: ['id', 'customer_id'],
      },
    ]) {
      assert.equal(errors(step), '', JSON.stringify(step));
    }
  });

  test('rejects broken games and simulators', () => {
    assert.match(errors({ ...order, items: ['a', 'a', 'b'] }), /all be different/);
    assert.match(errors({ ...buckets, items: buckets.items.map((it) => ({ ...it, bucket: 0 })) }), /every bucket needs/);
    assert.match(errors({ ...trace, frames: trace.frames.map((f) => ({ ...f, ask: undefined })) }), /at least one frame with "ask"/);
    assert.match(errors({ ...trace, frames: [{ line: 9, vars: {} }, trace.frames[1]] }), /inside "code"/);
    assert.match(errors({ ...trace, frames: [trace.frames[0], { line: 2, vars: { s: "'aa'" }, ask: 'x' }] }), /"ask" must name/);
    assert.match(errors({ type: 'sim', sim: 'dice', dice: 2, sides: 6, target: [13] }), /reachable totals/);
    assert.match(errors({ type: 'sim', sim: 'git', goal: { text: 'x' } }), /at least one condition/);
    assert.match(errors({ type: 'sim', sim: 'chess' }), /unknown simulator/);
  });

  test('requires an interactive step in every lesson', () => {
    const mcq = { type: 'mcq', id: 'q-m', prompt: 'P', choices: ['a', 'b'], answer: 0, explanation: 'E.' };
    assert.match(errors(mcq), /needs at least one interactive step/);
    assert.match(errors({ type: 'explain', body: 'Just reading.' }), /needs at least one interactive step/);
    assert.doesNotMatch(errors(order), /interactive step/);
    assert.doesNotMatch(errors({ type: 'sim', sim: 'growth', curves: ['n', 'n^2'] }), /interactive step/);
  });

  test('checks the roadmap against known courses', () => {
    const ok = { tracks: [{ id: 't', title: 'T', icon: 'R', description: 'D', nodes: [{ course: 'a' }, { course: 'b', after: ['a'] }] }] };
    assert.deepEqual(validateRoadmap(ok, ['a', 'b']), []);
    assert.match(validateRoadmap(ok, ['a']).join('\n'), /unknown course "b"/);
    const cycle = { tracks: [{ ...ok.tracks[0], nodes: [{ course: 'a', after: ['b'] }, { course: 'b' }] }] };
    assert.match(validateRoadmap(cycle, ['a', 'b']).join('\n'), /isn't an earlier node/);
  });
});
