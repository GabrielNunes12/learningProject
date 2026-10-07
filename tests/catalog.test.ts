// Tests for the course catalog (every course without its step bodies). Run with: npm test
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { toCatalog, withLessons } from '../src/content/catalog.ts';
import { isQuestion, type CourseFile, type Lesson } from '../src/types.ts';

const lesson = (id: string): Lesson => ({
  id,
  title: `Lesson ${id}`,
  pareto: 'core',
  minutes: 4,
  takeaway: 'T.',
  steps: [
    { type: 'explain', body: 'B.' },
    { type: 'mcq', id: 'q1', prompt: 'P', choices: ['a', 'b'], answer: 0, explanation: 'E.', concepts: ['c1'] },
    { type: 'sim', sim: 'dice', dice: 1, sides: 6, target: [6] },
    { type: 'numeric', id: 'q2', prompt: 'P', answer: 2, explanation: 'E.' },
  ],
});

const file: CourseFile = { id: 'c', title: 'C', icon: 'C', description: 'D.', keyIdeas: ['I.'], lessons: [lesson('l1'), lesson('l2')] };

describe('toCatalog', () => {
  test('keeps lesson facts, counts steps and lists questions without their bodies', () => {
    const entry = toCatalog(file);
    const l1 = entry.units[0].lessons[0];
    assert.deepEqual(l1, {
      id: 'l1',
      title: 'Lesson l1',
      pareto: 'core',
      minutes: 4,
      takeaway: 'T.',
      stepCount: 4,
      questions: [
        { id: 'q1', type: 'mcq', concepts: ['c1'] },
        { id: 'q2', type: 'numeric' },
      ],
    });
    assert.equal('lessons' in entry, false);
  });

  test('wraps a flat lesson list in one unit and defaults the category', () => {
    const entry = toCatalog(file);
    assert.deepEqual(
      entry.units.map((u) => [u.id, u.lessons.map((l) => l.id)]),
      [['lessons', ['l1', 'l2']]],
    );
    assert.equal(entry.category, 'General');
  });

  test('withLessons flattens units into the same lesson objects', () => {
    const course = withLessons(toCatalog({ ...file, lessons: undefined, units: [{ id: 'u1', title: 'U1', lessons: [lesson('a')] }, { id: 'u2', title: 'U2', lessons: [lesson('b')] }] }));
    assert.deepEqual(course.lessons.map((l) => l.id), ['a', 'b']);
    assert.equal(course.lessons[1], course.units[1].lessons[0]);
  });

  test('every real course: the catalog lists exactly the questions in its lessons', () => {
    const dir = join(import.meta.dirname, '..', 'src', 'content', 'topics');
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const raw = JSON.parse(readFileSync(join(dir, name), 'utf8')) as CourseFile;
      const lessons = raw.units ? raw.units.flatMap((u) => u.lessons) : (raw.lessons ?? []);
      const course = withLessons(toCatalog(raw));
      assert.deepEqual(
        course.lessons.map((l) => [l.id, l.stepCount, l.questions.map((q) => q.id)]),
        lessons.map((l) => [l.id, l.steps.length, l.steps.filter(isQuestion).map((q) => q.id)]),
        name,
      );
    }
  });
});
