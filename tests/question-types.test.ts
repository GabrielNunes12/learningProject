// Tests for the "output" (predict the output) and "bug" (find the bug) question types.
// Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { answerLabel, checkAnswer, isBugLine, normalizeOutput } from '../src/lib/answers.ts';
import { validateCourse } from '../src/content/validate.ts';
import type { BugStep, OutputStep } from '../src/types.ts';

const output: OutputStep = {
  type: 'output',
  id: 'q-out',
  prompt: 'What does this print?',
  language: 'python',
  code: "print('missing')\nprint(2, 'passed')",
  output: 'missing\n2 passed',
  explanation: 'Because.',
};

const bug: BugStep = {
  type: 'bug',
  id: 'q-bug',
  prompt: 'Click the broken line.',
  language: 'python',
  code: 'a = 1\nb = a +\nprint(b)',
  error: 'SyntaxError: invalid syntax',
  lines: [2],
  fixes: ['Change line 2 to `b = a + 1`', 'Delete line 3'],
  answer: 0,
  explanation: 'Because.',
};

describe('output questions', () => {
  test('accepts the exact output', () => {
    assert.equal(checkAnswer(output, 'missing\n2 passed'), true);
  });

  test('ignores extra spaces, Windows line endings and blank lines at the ends', () => {
    assert.equal(checkAnswer(output, '\n  missing  \r\n2    passed\n\n'), true);
  });

  test('rejects a wrong value, a wrong case, missing lines and an empty answer', () => {
    assert.equal(checkAnswer(output, 'missing\n3 passed'), false);
    assert.equal(checkAnswer(output, 'Missing\n2 passed'), false);
    assert.equal(checkAnswer(output, '2 passed'), false);
    assert.equal(checkAnswer(output, '   \n '), false);
  });

  test('keeps blank lines in the middle of the output', () => {
    assert.equal(normalizeOutput('a\n\nb'), 'a\n\nb');
    assert.equal(checkAnswer({ ...output, output: 'a\n\nb' }, 'a\nb'), false);
  });

  test('reveals the expected output as the answer', () => {
    assert.equal(answerLabel(output), 'missing\n2 passed');
  });
});

describe('bug questions', () => {
  test('finds the bug only on a listed line', () => {
    assert.equal(isBugLine(bug, 2), true);
    assert.equal(isBugLine(bug, 1), false);
    assert.equal(isBugLine(bug, null), false);
    assert.equal(isBugLine({ ...bug, lines: [2, 3] }, 3), true);
  });

  test('checks the chosen fix by index', () => {
    assert.equal(checkAnswer(bug, 0), true);
    assert.equal(checkAnswer(bug, 1), false);
    assert.equal(checkAnswer(bug, null), false);
  });

  test('reveals the line and the fix as the answer', () => {
    assert.equal(answerLabel(bug), 'Line 2: Change line 2 to `b = a + 1`');
  });
});

describe('content validation', () => {
  const course = (step: object) => ({
    id: 'demo',
    title: 'Demo',
    icon: '🧪',
    description: 'Demo course.',
    keyIdeas: ['One idea.'],
    lessons: [{ id: 'l1', title: 'Lesson', pareto: 'core', takeaway: 'Takeaway.', steps: [step] }],
  });
  const errors = (step: object) => validateCourse(course(step), 'demo.json');

  test('accepts well-formed output and bug questions', () => {
    assert.deepEqual(errors(output), []);
    assert.deepEqual(errors(bug), []);
  });

  test('rejects broken output questions', () => {
    assert.match(errors({ ...output, output: '' }).join('\n'), /needs "output"/);
    assert.match(errors({ ...output, code: '```python\nprint(1)\n```' }).join('\n'), /no ``` fences/);
  });

  test('rejects broken bug questions', () => {
    assert.match(errors({ ...bug, lines: [4] }).join('\n'), /inside "code" \(it has 3 lines\)/);
    assert.match(errors({ ...bug, lines: [] }).join('\n'), /"lines"/);
    assert.match(errors({ ...bug, answer: 2 }).join('\n'), /index of the correct fix/);
    assert.match(errors({ ...bug, fixes: ['Only one'] }).join('\n'), /at least 2 string "fixes"/);
  });
});
