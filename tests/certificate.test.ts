// Tests for certificates, study time and the PDF writer. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  certificateMinutes,
  checkName,
  formatHours,
  hasEarned,
  lessonsLeft,
  pdfFileName,
  shareLinks,
} from '../src/lib/certificate.ts';
import { certificatePdf, hexToRgb, pdfString, readable } from '../src/lib/pdf.ts';
import { activeDelta, IDLE_MS } from '../src/lib/studyTime.ts';
import type { Course } from '../src/types.ts';

const course = {
  id: 'big-o',
  title: 'Big-O Thinking',
  lessons: [
    { id: 'growth', minutes: 10 },
    { id: 'classes', minutes: 15 },
    { id: 'loops' }, // no estimate: 5 minutes
  ],
} as unknown as Course;
const done = (...ids: string[]) => Object.fromEntries(ids.map((id) => [`big-o/${id}`, 1]));

describe('earning a certificate', () => {
  test('needs every lesson', () => {
    assert.equal(lessonsLeft(course, { completed: done('growth') }), 2);
    assert.equal(hasEarned(course, { completed: done('growth', 'classes') }), false);
    assert.equal(hasEarned(course, { completed: done('growth', 'classes', 'loops') }), true);
    assert.equal(hasEarned({ ...course, lessons: [] } as Course, { completed: {} }), false);
  });

  test('hours: tracked time, never below the completed lessons estimate', () => {
    const all = done('growth', 'classes', 'loops');
    assert.equal(certificateMinutes(course, { completed: all }), 30, 'no tracking yet: the estimate');
    assert.equal(certificateMinutes(course, { completed: all, studyMs: { 'big-o': 95 * 60_000 } }), 95, 'more real time than estimated');
    assert.equal(certificateMinutes(course, { completed: all, studyMs: { 'big-o': 4 * 60_000 } }), 30, 'less real time: the floor');
    assert.deepEqual([1, 45, 60, 89, 90, 150, 600].map(formatHours), ['1 minute', '45 minutes', '1 hour', '1.5 hours', '1.5 hours', '2.5 hours', '10 hours']);
  });
});

describe('the name', () => {
  test('accepts Latin names with accents and tidies spaces', () => {
    assert.deepEqual(checkName('  José   Ángel  Núñez '), { name: 'José Ángel Núñez', problem: null });
    assert.equal(checkName("Zoë O'Brien-Šimon").problem, null);
  });

  test('rejects what the PDF fonts cannot print, and empty or overlong names', () => {
    assert.match(checkName('李小龙').problem!, /can't print/);
    assert.match(checkName('Ana Šimić').problem!, /can't print “ć”/, 'Latin Extended letters outside WinAnsi too');
    assert.match(checkName('A').problem!, /Enter your name/);
    assert.match(checkName('x'.repeat(61)).problem!, /60 characters/);
    assert.match(checkName('12 34').problem!, /letter/);
  });
});

describe('sharing', () => {
  const cert = { id: 'K7Q2-M9XD', name: 'Ada', courseTitle: 'Big-O Thinking', minutes: 90, lessons: 6, issuedAt: Date.UTC(2026, 9, 7) };

  test('links point at the public page, with the course and issuer for LinkedIn', () => {
    const l = shareLinks(cert, 'https://learning.mentor-hub.space');
    assert.equal(l.url, 'https://learning.mentor-hub.space/c/K7Q2-M9XD');
    const add = new URL(l.linkedinProfile).searchParams;
    assert.equal(add.get('name'), 'Big-O Thinking');
    assert.equal(add.get('organizationName'), 'ProjectLearn');
    assert.equal(add.get('certUrl'), l.url);
    assert.equal(add.get('issueMonth'), '10');
    assert.equal(new URL(l.facebook).searchParams.get('u'), l.url);
    assert.equal(new URL(l.linkedin).searchParams.get('url'), l.url);
    assert.match(new URL(l.x).searchParams.get('text')!, /6 lessons, 1\.5 hours/);
  });

  test('file name is ASCII', () => {
    assert.equal(pdfFileName('Everyday Math: % & ratios'), 'ProjectLearn-Everyday-Math-ratios-certificate.pdf');
    assert.equal(pdfFileName('Café Ñandú'), 'ProjectLearn-Cafe-Nandu-certificate.pdf');
  });
});

describe('study time', () => {
  test('counts visible, recently active time only', () => {
    const t0 = 1_000_000;
    assert.equal(activeDelta({ lastTick: t0, lastActive: t0 }, t0 + 5000, true), 5000);
    assert.equal(activeDelta({ lastTick: t0, lastActive: t0 }, t0 + 5000, false), 0, 'hidden tab');
    assert.equal(activeDelta({ lastTick: t0, lastActive: t0 }, t0 + 10 * 60_000, true), IDLE_MS, 'away: counts up to the idle limit');
    assert.equal(activeDelta({ lastTick: t0 + IDLE_MS + 1, lastActive: t0 }, t0 + IDLE_MS + 5000, true), 0, 'still away');
  });
});

describe('PDF', () => {
  const pdf = certificatePdf({ id: 'K7Q2-M9XD', name: 'José (Jo) \\ Müller', courseTitle: 'Big-O Thinking', minutes: 190, lessons: 6, issuedAt: Date.UTC(2026, 9, 7), color: '#f8f9fa' });

  test('is a single ASCII file with a valid cross-reference table', () => {
    assert.ok(pdf.startsWith('%PDF-1.4\n') && pdf.endsWith('%%EOF\n'));
    assert.ok(/^[\x00-\x7f]*$/.test(pdf), 'ASCII only, so string offsets are byte offsets');
    const xref = Number(/startxref\n(\d+)/.exec(pdf)![1]);
    assert.ok(pdf.slice(xref).startsWith('xref\n'));
    const offsets = [...pdf.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    offsets.forEach((o, i) => assert.ok(pdf.slice(o).startsWith(`${i + 1} 0 obj\n`), `object ${i + 1} is where the table says`));
    const len = Number(/\/Length (\d+) >>\nstream\n/.exec(pdf)![1]);
    const start = pdf.indexOf('stream\n') + 'stream\n'.length;
    assert.ok(pdf.slice(start + len).startsWith('\nendstream'), 'stream length is exact');
  });

  test('encodes text for WinAnsi and escapes PDF syntax', () => {
    assert.equal(pdfString('a(b)c\\'), '(a\\(b\\)c\\\\)');
    assert.equal(pdfString('é—€'), '(\\351\\227\\200)');
    assert.equal(pdfString('李'), '(?)');
    assert.ok(pdf.includes('(Jos\\351 \\(Jo\\) \\\\ M\\374ller)'));
  });

  test('contains the course, hours, a clickable verification link, and readable colours', () => {
    assert.ok(pdf.includes('(Big-O Thinking)'));
    assert.ok(pdf.includes('3 hours of learning'));
    assert.ok(pdf.includes('/URI (https://learning.mentor-hub.space/c/K7Q2-M9XD)'));
    const light = hexToRgb('#f8f9fa');
    const lum = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    assert.ok(lum(readable(light)) <= 0.35, 'a pale course colour is darkened for text');
  });
});
