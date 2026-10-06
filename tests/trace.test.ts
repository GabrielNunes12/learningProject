// Tests for the trace game's pure logic (src/lib/trace.ts). Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  allFirstTriesRight,
  changedItems,
  changedVars,
  hiddenVars,
  initialTrace,
  parseTraceValue,
  shownFrame,
  splitTopLevel,
  traceFinished,
  traceStep,
  type TraceAction,
  type TraceState,
} from '../src/lib/trace.ts';
import type { TraceFrame } from '../src/types.ts';

describe('reading printed values', () => {
  test('splits only at the top level', () => {
    assert.deepEqual(splitTopLevel("1, 'a, b', [2, 3], {'k': (4, 5)}", ','), ['1', " 'a, b'", ' [2, 3]', " {'k': (4, 5)}"]);
    assert.equal(splitTopLevel('[1, 2', ','), null);
    assert.equal(splitTopLevel("'open", ','), null);
  });

  test('lists become items', () => {
    assert.deepEqual(parseTraceValue('[3, 1, 2]'), { kind: 'list', items: ['3', '1', '2'] });
    assert.deepEqual(parseTraceValue('[]'), { kind: 'list', items: [] });
    assert.deepEqual(parseTraceValue("['a, b', [1, 2]]"), { kind: 'list', items: ["'a, b'", '[1, 2]'] });
    assert.deepEqual(parseTraceValue('[1, 2, 3]'), { kind: 'list', items: ['1', '2', '3'] }); // Java Arrays.toString / Kotlin
  });

  test('Python dicts and Kotlin/Java maps become entries; sets and text stay text', () => {
    assert.deepEqual(parseTraceValue("{'a': 1, 'b': [2, 3]}"), { kind: 'dict', entries: [["'a'", '1'], ["'b'", '[2, 3]']] });
    assert.deepEqual(parseTraceValue('{a=1, b=2}'), { kind: 'dict', entries: [['a', '1'], ['b', '2']] });
    assert.deepEqual(parseTraceValue("{'url': 'http://x'}"), { kind: 'dict', entries: [["'url'", "'http://x'"]] });
    assert.deepEqual(parseTraceValue('{}'), { kind: 'dict', entries: [] });
    assert.deepEqual(parseTraceValue('{1, 2}'), { kind: 'text', text: '{1, 2}' });
    assert.deepEqual(parseTraceValue("'hi'"), { kind: 'text', text: "'hi'" });
    assert.deepEqual(parseTraceValue('(1, 2)'), { kind: 'text', text: '(1, 2)' });
    assert.deepEqual(parseTraceValue('[1, 2'), { kind: 'text', text: '[1, 2' });
  });

  test('spots changed variables and list items', () => {
    assert.deepEqual([...changedVars({ a: '1', b: '[1]' }, { a: '1', b: '[1, 2]', c: '0' })], ['b', 'c']);
    assert.deepEqual([...changedVars(undefined, { a: '1' })], ['a']);
    assert.deepEqual(changedItems('[3, 1, 2]', '[1, 2, 3, 4]'), [true, true, true, true]);
    assert.deepEqual(changedItems('[3, 1, 2]', '[3, 1, 2, 4]'), [false, false, false, true]);
    assert.deepEqual(changedItems(undefined, '[1]'), [true]);
    assert.deepEqual(changedItems('[1]', '5'), []);
  });
});

const frames: TraceFrame[] = [
  { line: 1, vars: { a: '[1]' } },
  { line: 2, vars: { a: '[1]', b: '[1]' } },
  { line: 3, vars: { a: '[1, 2]', b: '[1, 2]' }, ask: 'a' },
  { line: 4, vars: { a: '[1, 2]', b: '[1, 2]', n: '2' }, ask: 'n' },
];

const run = (actions: TraceAction[], from: TraceState = initialTrace) => actions.reduce((s, a) => traceStep(s, a, frames), from);
const fwd: TraceAction = { type: 'forward' };

describe('stepping and asking', () => {
  test('starts before line 1 and stops to ask before revealing an asked frame', () => {
    assert.equal(shownFrame(initialTrace), -1);
    const s = run([fwd, fwd, fwd]);
    assert.equal(s.pos, 1);
    assert.equal(s.asking, 2);
    assert.equal(shownFrame(s), 2);
    // Step does nothing while a prediction is pending.
    assert.equal(traceStep(s, fwd, frames), s);
  });

  test('hides the asked variable and everything else that changed on that line', () => {
    const s = run([fwd, fwd, fwd]);
    assert.deepEqual([...hiddenVars(frames, s)].sort(), ['a', 'b']);
    assert.equal(hiddenVars(frames, run([fwd])).size, 0);
  });

  test('a right first answer reveals the frame; reaching the end finishes with all first tries right', () => {
    let s = run([fwd, fwd, fwd, { type: 'answer', ok: true, test: false }]);
    assert.equal(s.pos, 2);
    assert.equal(s.reached, 2);
    assert.equal(s.outcomes[2], 'right');
    assert.equal(traceFinished(s, frames), false);
    s = run([fwd, { type: 'answer', ok: true, test: false }], s);
    assert.equal(traceFinished(s, frames), true);
    assert.equal(allFirstTriesRight(s, frames), true);
    assert.equal(traceStep(s, fwd, frames), s);
  });

  test('learn mode: a miss allows a retry, but the first try is remembered', () => {
    let s = run([fwd, fwd, fwd, { type: 'answer', ok: false, test: false }]);
    assert.equal(s.asking, 2);
    assert.equal(s.tries[2], 1);
    // Backing out and returning doesn't wipe the miss.
    s = run([{ type: 'back' }, fwd, { type: 'answer', ok: true, test: false }], s);
    assert.equal(s.outcomes[2], 'retried');
    s = run([fwd, { type: 'answer', ok: true, test: false }], s);
    assert.equal(traceFinished(s, frames), true);
    assert.equal(allFirstTriesRight(s, frames), false);
  });

  test('learn mode: "show me" reveals the value as a miss', () => {
    const s = run([fwd, fwd, fwd, { type: 'answer', ok: false, test: false }, { type: 'reveal' }]);
    assert.equal(s.asking, null);
    assert.equal(s.pos, 2);
    assert.equal(s.outcomes[2], 'missed');
  });

  test('test mode: one attempt, then the value is revealed', () => {
    const s = run([fwd, fwd, fwd, { type: 'answer', ok: false, test: true }]);
    assert.equal(s.asking, null);
    assert.equal(s.pos, 2);
    assert.equal(s.outcomes[2], 'missed');
  });

  test('frames already seen can be revisited without asking again', () => {
    let s = run([fwd, fwd, fwd, { type: 'answer', ok: true, test: false }]);
    s = run([{ type: 'seek', to: -1 }], s);
    assert.equal(s.pos, -1);
    s = run([fwd, fwd, fwd], s);
    assert.equal(s.pos, 2);
    assert.equal(s.asking, null);
    // Seeking can't jump past what has been revealed.
    assert.equal(run([{ type: 'seek', to: 3 }], s).pos, 2);
    assert.equal(run([{ type: 'seek', to: -9 }], s).pos, -1);
  });

  test('back from a pending question returns to the frame before it', () => {
    const s = run([fwd, fwd, fwd, { type: 'back' }]);
    assert.equal(s.asking, null);
    assert.equal(shownFrame(s), 1);
    assert.equal(run([{ type: 'back' }, { type: 'back' }, { type: 'back' }], s).pos, -1);
  });
});
