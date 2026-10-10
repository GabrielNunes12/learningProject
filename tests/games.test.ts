// Tests for the mini-game answer checks and the new validation rules. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { checkTraceValue, gameAnswerLabel, isOrderCorrect, isRightBucket, orderMarks, otherChangedVar, sameTraceValue, traceChoices } from '../src/lib/answers.ts';
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
  test('accepts the whole assignment, any spacing and either quote style', () => {
    const items = { line: 7, vars: { items: '[1, 2, 3]' }, ask: 'items' };
    for (const typed of ['[1, 2, 3]', 'items = [1, 2, 3]', 'items=[1,2,3]', 'val items = [1, 2, 3]', '[ 1,2 , 3 ]', 'items: [1, 2, 3]'])
      assert.equal(checkTraceValue(items, typed), true, typed);
    for (const typed of ['[1, 2]', 'items = [1, 2]', 'count = [1, 2, 3]', 'items =', '[1, 2, 3, 4]']) assert.equal(checkTraceValue(items, typed), false, typed);
    const msg = { line: 4, vars: { msg: '"Ann has 1"' }, ask: 'msg' };
    for (const typed of ['"Ann has 1"', "'Ann has 1'", 'Ann has 1', 'msg = "Ann has 1"', 'msg = Ann has 1']) assert.equal(checkTraceValue(msg, typed), true, typed);
    assert.equal(checkTraceValue(msg, '"Annhas1"'), false, 'spaces inside a string still count');
    const words = { line: 1, vars: { xs: "['a', 'b']" }, ask: 'xs' };
    assert.equal(checkTraceValue(words, '["a","b"]'), true);
  });

  test('lesson options: the right value plus the nearest believable mistakes', () => {
    const frames = [
      { line: 1, vars: { count: '1' } },
      { line: 3, vars: { count: '1', msg: '"Ann has 1"' } },
      { line: 4, vars: { count: '3', msg: '"Ann has 1"' }, ask: 'msg' },
      { line: 5, vars: { count: '3', msg: '"Ann has 3"' }, ask: 'msg' },
    ];
    const at4 = traceChoices(frames, 2, 'seed');
    assert.ok(at4.includes('"Ann has 1"'), 'the right value');
    assert.ok(at4.includes('"Ann has 3"'), 'the "template updates itself" mistake');
    assert.ok(at4.includes('3'), "count's value: answering for the wrong variable");
    assert.ok(at4.length >= 2 && at4.length <= 4);
    assert.deepEqual(traceChoices(frames, 2, 'seed'), at4, 'same seed, same order');
    assert.deepEqual(traceChoices(frames, 0, 'seed'), [], 'no prediction on this frame');
    const lists = traceChoices([{ line: 1, vars: { xs: '[1, 2]' } }, { line: 2, vars: { xs: '[1,2, 3]' }, ask: 'xs' }], 1, 's');
    assert.ok(lists.some((v) => sameTraceValue(v, '[1, 2]')), 'the list before the append');
    assert.equal(new Set(lists.map((v) => v.replace(/\s/g, ''))).size, lists.length, 'no option twice, even spaced differently');
  });

  test('every shipped trace prediction offers its right value among 2–4 distinct options', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = new URL('../src/content/topics/', import.meta.url);
    let asks = 0;
    let typed = 0;
    const walk = (o: unknown, visit: (step: { type: string; frames: { ask?: string; vars: Record<string, string>; line: number }[] }) => void): void => {
      if (Array.isArray(o)) o.forEach((x) => walk(x, visit));
      else if (o && typeof o === 'object') {
        if ((o as { type?: string }).type === 'trace') visit(o as never);
        Object.values(o).forEach((x) => walk(x, visit));
      }
    };
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      walk(JSON.parse(readFileSync(new URL(f, dir), 'utf8')), (step) =>
        step.frames.forEach((fr, i) => {
          if (!fr.ask) return;
          asks++;
          const c = traceChoices(step.frames, i, `${f}/${i}`);
          if (c.length < 2) return void typed++;
          assert.ok(c.length <= 4, `${f} frame ${i}`);
          assert.equal(c.filter((v) => checkTraceValue(fr, v)).length, 1, `${f} frame ${i}: exactly one right option`);
        }),
      );
    }
    assert.ok(asks > 0);
    assert.ok(typed / asks < 0.1, `${typed} of ${asks} predictions fall back to typing`);
  });

  test('a value that belongs to another variable the line just changed is a misread question, not a wrong answer', () => {
    // Line 4 of the Kotlin template trace: `count = count + 2` runs, but the question asks about `msg`.
    const prev = { count: '1', name: '"Ann"', msg: '"Ann has 1"' };
    const frame = { line: 4, vars: { count: '3', name: '"Ann"', msg: '"Ann has 1"' }, ask: 'msg' };
    assert.equal(otherChangedVar(frame, prev, '3'), 'count');
    assert.equal(otherChangedVar(frame, prev, 'Ann has 1'), undefined, 'the right answer');
    assert.equal(otherChangedVar(frame, prev, 'Ann'), undefined, 'name did not change on this line');
    assert.equal(otherChangedVar(frame, prev, '4'), undefined, 'just wrong');
  });

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
