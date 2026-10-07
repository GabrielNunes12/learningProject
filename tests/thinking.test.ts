// Tests for thinking on paper (src/lib/thinking.ts). Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  addChip,
  addPile,
  addStroke,
  againItems,
  anchorFeedback,
  anchorsReady,
  dropChip,
  dueSheet,
  emptyDraft,
  finishAgain,
  finishShorter,
  limitWords,
  MAX_CHIPS,
  MAX_STROKES,
  pileAt,
  recallReady,
  remembered,
  sameIdea,
  sendToPile,
  SHEET_W,
  simplify,
  startLessonSheet,
  thinkingStats,
  TRAY_H,
  wrongReady,
} from '../src/lib/thinking.ts';
import type { Sheet } from '../src/lib/storage.ts';
import type { Concept } from '../src/types.ts';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 7, 12);

const draftWith = (...texts: string[]) => texts.reduce((d, t, i) => addChip(d, t, `c${i}`), emptyDraft());

describe('make it wrong', () => {
  test('needs 3 keywords sorted into 2 piles, and says what is missing', () => {
    let d = draftWith('loop', 'list');
    assert.match(wrongReady(d).missing, /1 more keyword/);
    d = addChip(d, 'dict', 'c2');
    assert.match(wrongReady(d).missing, /2 piles/);
    d = sendToPile(sendToPile(d, 'c0', 0), 'c1', 1);
    assert.deepEqual(wrongReady(d), { ok: true, missing: '' });
  });

  test('keywords are trimmed, unique and capped', () => {
    let d = draftWith('  big   O ', 'Big O', '');
    assert.deepEqual(d.chips.map((c) => c.text), ['big O']);
    for (let i = 0; i < 40; i++) d = addChip(d, `w${i}`);
    assert.equal(d.chips.length, MAX_CHIPS);
  });

  test('dropping a chip below the tray puts it in the pile under it', () => {
    const d = draftWith('a', 'b');
    assert.equal(pileAt(SHEET_W * 0.75, TRAY_H + 50, 2), 1);
    assert.equal(pileAt(100, TRAY_H - 5, 2), undefined);
    assert.equal(dropChip(d, 'c0', SHEET_W * 0.75, 400).chips[0].pile, 1);
    assert.equal(dropChip(d, 'c0', 200, 30).chips[0].pile, undefined);
  });

  test('new keywords take a free tray slot, and a full tray stacks them visibly offset', () => {
    const phone = { w: 320, h: 52 }; // a narrow sheet: three chips per tray row, one row
    let d = emptyDraft();
    for (const t of ['a', 'b', 'c', 'd']) d = addChip(d, t, t, phone);
    const [a, , , dd] = d.chips;
    assert.notDeepEqual([dd.x, dd.y], [a.x, a.y], 'the fourth chip does not land exactly on the first');
    d = sendToPile(d, 'b', 0, phone);
    const e = addChip(d, 'e', 'e', phone).chips.at(-1)!;
    const b = draftWith('x').chips[0];
    assert.equal(pileAt(e.x, e.y, 2), undefined, 'still in the tray');
    assert.ok(e.x > b.x, 'reuses the slot "b" left behind');
  });

  test('a third pile keeps every sorted chip in its pile', () => {
    let d = sendToPile(sendToPile(draftWith('a', 'b'), 'c0', 0), 'c1', 1);
    d = addPile(d);
    assert.equal(d.piles.length, 3);
    for (const c of d.chips) assert.equal(pileAt(c.x, c.y, 3), c.pile);
  });
});

describe('ink', () => {
  test('strokes are simplified and capped', () => {
    const line = Array.from({ length: 50 }, (_, i) => ({ x: i * 10, y: 100 }));
    assert.equal(simplify(line).length, 2, 'a straight line keeps only its ends');
    let d = emptyDraft();
    d = addStroke(d, line);
    assert.deepEqual(d.strokes[0].points, [0, 100, 490, 100]);
    for (let i = 0; i < 80; i++) d = addStroke(d, [{ x: 0, y: i }, { x: 50, y: i + 30 }]);
    assert.equal(d.strokes.length, MAX_STROKES);
    assert.equal(addStroke(emptyDraft(), [{ x: 1, y: 1 }]).strokes.length, 0, 'a dot is not a stroke');
  });
});

describe('make it shorter', () => {
  test('anchors are 4 words at most, and 2 are needed', () => {
    assert.equal(limitWords('one two three four five'), 'one two three four');
    assert.equal(limitWords('one two '), 'one two ', 'the space for the next word survives');
    assert.equal(limitWords('one two three four '), 'one two three four');
    assert.match(anchorsReady(['only one']).missing, /1 more anchor/);
    assert.equal(anchorsReady(['hash map lookups', 'n squared loops']).ok, true);
    assert.match(anchorsReady(['a b c d e', 'x']).missing, /4 words/);
  });

  test('feedback names the concepts the anchors cover and the lesson ideas they skip', () => {
    const concepts: Concept[] = [
      { id: 'hash-map', label: 'Hash map lookup', lesson: 'fast', aliases: ['dict lookup'] },
      { id: 'nested-loops', label: 'Nested loops', lesson: 'fast' },
      { id: 'big-o', label: 'Big-O notation', lesson: 'intro' },
    ];
    const f = anchorFeedback(['dict lookup is fast', 'big-o'], concepts, 'fast');
    assert.deepEqual(f.hit.map((c) => c.id), ['hash-map', 'big-o']);
    assert.deepEqual(f.missed.map((c) => c.id), ['nested-loops']);
  });

  test('a generic one-word alias inside a longer anchor does not count as naming the concept', () => {
    const concepts: Concept[] = [
      { id: 'constant-time', label: 'Constant O(1)', lesson: 'classes', aliases: ['O(1)', 'constant time', 'constant'] },
      { id: 'dominant-term', label: 'Drop the noise', lesson: 'growth', aliases: ['drop constants'] },
    ];
    assert.deepEqual(anchorFeedback(['constants vanish too'], concepts).hit, []);
    assert.deepEqual(anchorFeedback(['constant'], concepts).hit.map((c) => c.id), ['constant-time'], 'on its own it still matches');
    assert.deepEqual(anchorFeedback(['drop constants'], concepts).hit.map((c) => c.id), ['dominant-term']);
  });

  test('a lesson sheet is due for its first redo straight away; session sheets never are', () => {
    const lesson = finishShorter(startLessonSheet(undefined, 'py', 'loops', 'Loops', draftWith('a'), NOW), ['for each', 'range'], NOW);
    assert.equal(lesson.due, NOW);
    assert.deepEqual(lesson.anchors, ['for each', 'range']);
    const session: Sheet = { key: 'session/review/1', title: 'Review', again: [], createdAt: NOW, updatedAt: NOW };
    assert.equal(finishShorter(session, ['x y'], NOW).due, undefined);
  });
});

describe('make it again', () => {
  const sheet = (key: string, createdAt: number, due: number | undefined, redos = 0): Sheet => ({
    key,
    title: key,
    anchors: ['a'],
    again: Array.from({ length: redos }, () => ({ at: 0, recalled: [], remembered: 0, total: 0, fixed: 0 })),
    createdAt,
    due,
    updatedAt: createdAt,
  });

  test('picks the freshest never-redone sheet, then the most overdue, never the current lesson', () => {
    const sheets = {
      old: sheet('old', NOW - 9 * DAY, NOW - 5 * DAY, 2),
      older: sheet('older', NOW - 20 * DAY, NOW - 8 * DAY, 3),
      fresh: sheet('fresh', NOW - DAY, NOW - DAY),
      future: sheet('future', NOW - DAY, NOW + DAY),
      session: sheet('session/review/1', NOW, undefined),
    };
    assert.equal(dueSheet(sheets, NOW)?.key, 'fresh');
    assert.equal(dueSheet(sheets, NOW, 'fresh')?.key, 'older');
    assert.equal(dueSheet({ future: sheets.future }, NOW), undefined);
  });

  test('recall matching forgives word order, plurals and small typos', () => {
    assert.ok(sameIdea('Hash maps', 'hash map'));
    assert.ok(sameIdea('lookup dict', 'dict lookup'));
    assert.ok(sameIdea('recursion', 'recurson'));
    assert.ok(!sameIdea('list', 'loop'));
    assert.deepEqual(remembered(['hash map', 'loops'], ['Hash maps', 'nested loops', 'big o']), ['Hash maps', 'nested loops']);
    assert.deepEqual(remembered(['map'], ['hash map', 'map']), ['hash map'], 'one recalled keyword covers one old item');
  });

  test('finishing a redo keeps, fixes and drops old keywords, and schedules the next one', () => {
    const wrong = sendToPile(draftWith('O(n^2) is fast', 'hash map', 'loops'), 'c0', 0);
    const s = finishShorter(startLessonSheet(undefined, 'big-o', 'fast', 'Fast', wrong, NOW - DAY), ['hash map', 'loops nested'], NOW - DAY);
    assert.deepEqual(againItems(s), ['hash map', 'loops nested', 'O(n^2) is fast', 'loops']);
    const out = finishAgain(
      s,
      draftWith('hash maps'),
      { 'O(n^2) is fast': { verdict: 'fix', text: 'O(n^2) is slow' }, loops: { verdict: 'drop' } },
      NOW,
    );
    assert.deepEqual(out.anchors, ['hash map', 'loops nested']);
    assert.deepEqual(out.clean!.chips.map((c) => c.text), ['hash maps', 'loops nested', 'O(n^2) is slow']);
    assert.equal(out.clean!.chips[2].fixedFrom, 'O(n^2) is fast');
    assert.deepEqual(out.again.at(-1), { at: NOW, recalled: ['hash maps'], remembered: 1, total: 4, fixed: 1 });
    assert.equal(out.due, NOW + DAY, 'second redo comes a day later');
    assert.equal(recallReady(draftWith('one')).ok, false);
  });
});

describe('habit stats', () => {
  test('counts sheets, redos, recall rate and thinking days this week', () => {
    const today = new Date(2026, 9, 7, 12);
    const s: Sheet = {
      key: 'py/loops',
      title: 'Loops',
      anchors: ['a'],
      again: [{ at: 0, recalled: [], remembered: 3, total: 4, fixed: 0 }],
      createdAt: 0,
      due: today.getTime() - 1,
      updatedAt: 0,
    };
    const st = thinkingStats({ [s.key]: s }, ['2026-10-07', '2026-10-05', '2026-09-20'], today.getTime(), today);
    assert.deepEqual(st, { lessonSheets: 1, sessionSheets: 0, redos: 1, recallRate: 0.75, daysThisWeek: 2, dueNow: 1 });
  });
});
