// Tests for the clerk (session notes): each concept's worst outcome, lucky guesses, caps, and the root cause the
// session showed. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { CLERK_MAX, sessionNotes, type ClerkItem } from '../src/lib/clerk.ts';
import { prerequisites } from '../src/lib/diagnose.ts';
import type { Concept, ConceptLink } from '../src/types.ts';

const concept = (id: string): Concept => ({ id, label: id, lesson: `${id}-lesson` });
const item = (courseId: string, ids: string[], ok: boolean, confidence: ClerkItem['confidence'] = 'sure'): ClerkItem => ({
  courseId,
  concepts: ids.map(concept),
  ok,
  confidence,
});
const ids = (list: { concept: Concept }[]) => list.map((c) => c.concept.id);
const none = () => new Map<string, string[]>();

describe('the clerk: session notes', () => {
  test('a concept lands in its worst bucket across the session', () => {
    const right = sessionNotes([item('py', ['loops'], true), item('py', ['loops'], false)], () => none());
    assert.deepEqual(ids(right.missed), ['loops'], 'right, then wrong: missed');
    assert.deepEqual(ids(right.solid), []);

    const guess = sessionNotes([item('py', ['loops'], true), item('py', ['loops'], true, 'guess')], () => none());
    assert.deepEqual(ids(guess.guessed), ['loops'], 'right and sure, then a lucky guess: guessed');
    assert.deepEqual(ids(guess.solid), []);

    const bad = sessionNotes([item('py', ['loops'], false), item('py', ['loops'], true, 'guess')], () => none());
    assert.deepEqual(ids(bad.missed), ['loops'], 'wrong, then a lucky guess: still missed');
    assert.deepEqual(ids(bad.guessed), []);
  });

  test('a right answer guessed is a lucky guess, not solid', () => {
    const notes = sessionNotes([item('py', ['loops'], true, 'guess')], () => none());
    assert.deepEqual(ids(notes.guessed), ['loops']);
    assert.deepEqual(ids(notes.solid), []);
    assert.deepEqual(ids(notes.missed), []);
  });

  test('"I don\'t know" counts as missed, even when the answer happened to be right', () => {
    const unknown = sessionNotes([item('py', ['loops'], false, 'unknown')], () => none());
    assert.deepEqual(ids(unknown.missed), ['loops']);
    const lucky = sessionNotes([item('py', ['loops'], true, 'unknown')], () => none());
    assert.deepEqual(ids(lucky.missed), ['loops'], 'right with "I don\'t know" is still not known');
    assert.deepEqual(ids(lucky.solid), []);
  });

  test('missed concepts are listed most-missed first, ties in first-seen order', () => {
    const notes = sessionNotes(
      [
        item('py', ['a'], false),
        item('py', ['b'], false),
        item('py', ['c'], false),
        item('py', ['b'], false),
        item('py', ['c'], false),
        item('py', ['c'], false),
      ],
      () => none(),
    );
    assert.deepEqual(ids(notes.missed), ['c', 'b', 'a']);
  });

  test('each list shows at most six concepts', () => {
    const many = Array.from({ length: 8 }, (_, i) => `c${i}`);
    assert.equal(CLERK_MAX, 6);
    assert.equal(sessionNotes([item('py', many, true)], () => none()).solid.length, 6);
    assert.equal(sessionNotes([item('py', many, true, 'guess')], () => none()).guessed.length, 6);
    assert.equal(sessionNotes([item('py', many, false)], () => none()).missed.length, 6);
  });

  test('a root is named only when the session showed it', () => {
    // comprehensions builds on loops, which builds on variables. Only comprehensions is in the session.
    const links: ConceptLink[] = [
      { from: 'comprehensions', to: 'loops', label: 'builds on' },
      { from: 'loops', to: 'variables', label: 'builds on' },
    ];
    const prereqOf = () => prerequisites(links);
    assert.equal(sessionNotes([item('py', ['comprehensions'], false)], prereqOf).root, undefined, 'the foundation was never tested');

    const seen = sessionNotes([item('py', ['comprehensions'], false), item('py', ['variables'], false)], prereqOf);
    assert.equal(seen.root?.root.id, 'variables');
    assert.deepEqual(seen.root?.explains.map((c) => c.id), ['comprehensions']);
  });

  test('a solid foundation is not named as a cause', () => {
    const links: ConceptLink[] = [{ from: 'comprehensions', to: 'loops', label: 'builds on' }];
    const notes = sessionNotes([item('py', ['comprehensions'], false), item('py', ['loops'], true)], () => prerequisites(links));
    assert.equal(notes.root, undefined);
  });

  test('no root without prerequisites', () => {
    const notes = sessionNotes([item('py', ['a'], false), item('py', ['b'], false)], () => none());
    assert.equal(notes.root, undefined);
    assert.equal('root' in notes, false);
  });

  test('a root names the foundation that explains the most missed concepts', () => {
    const links: ConceptLink[] = [
      { from: 'x', to: 'base', label: 'builds on' },
      { from: 'y', to: 'base', label: 'builds on' },
      { from: 'z', to: 'other', label: 'builds on' },
    ];
    const notes = sessionNotes(
      [item('py', ['x'], false), item('py', ['y'], false), item('py', ['z'], false), item('py', ['base'], false), item('py', ['other'], false)],
      () => prerequisites(links),
    );
    assert.equal(notes.root?.root.id, 'base');
    assert.deepEqual(notes.root?.explains.map((c) => c.id), ['x', 'y']);
  });

  test('courses keep separate keys: the same concept id in two courses does not merge', () => {
    const notes = sessionNotes([item('python', ['loops'], true), item('java', ['loops'], false)], () => none());
    assert.deepEqual(notes.solid.map((c) => c.courseId), ['python']);
    assert.deepEqual(notes.missed.map((c) => c.courseId), ['java']);
    assert.deepEqual(notes.guessed, []);
  });

  test('a session with no tagged questions has no notes', () => {
    assert.deepEqual(sessionNotes([], () => none()), { solid: [], guessed: [], missed: [] });
  });
});
