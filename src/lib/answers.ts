import type {
  BalanceStep,
  BucketsStep,
  BugStep,
  ClassicQuestionStep,
  LogicGridStep,
  OrderStep,
  TraceFrame,
  TraceStep,
  TruthTableStep,
} from '../types';
// Explicit .ts extension so node:test can load this file directly.
import { truthTableAnswers } from './logic.ts';
import { formatNumber, t } from '../i18n/core.ts';

/**
 * Reads what a learner typed into a number. Accepts "0.25", "1/4", "25%", "1,000", "0,5" and "$-3".
 * A percentage yields two candidates (25% → 0.25 or 25) so either convention is accepted.
 */
export function parseNumberCandidates(raw: string): number[] {
  let s = raw.trim().replace(/[\s$€£]/g, '');
  // "0,5" is a decimal comma; "1,000" is a thousands separator.
  if (/^-?\d+,\d+$/.test(s) && !/^-?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(',', '.');
  s = s.replace(/,/g, '');
  const percent = s.endsWith('%');
  if (percent) s = s.slice(0, -1);
  const frac = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  const n = frac ? Number(frac[1]) / Number(frac[2]) : s === '' ? NaN : Number(s);
  if (!Number.isFinite(n)) return [];
  return percent ? [n / 100, n] : [n];
}

export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

/** Program output as lines: trims each line, collapses runs of spaces, drops blank lines at the ends. */
export const normalizeOutput = (s: string) =>
  s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/[ \t]+/g, ' '))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');

/** For "bug" steps, response is the chosen fix; the line is checked separately with isBugLine. */
export function checkAnswer(step: ClassicQuestionStep, response: number | string | null): boolean {
  switch (step.type) {
    case 'mcq':
    case 'bug':
      return response === step.answer;
    case 'output': {
      const r = normalizeOutput(String(response ?? ''));
      return r !== '' && r === normalizeOutput(step.output);
    }
    case 'numeric': {
      const tol = step.tolerance ?? (Number.isInteger(step.answer) ? 0 : Math.abs(step.answer) * 0.01);
      return parseNumberCandidates(String(response ?? '')).some((n) => Math.abs(n - step.answer) <= tol + 1e-9);
    }
    case 'text': {
      const r = normalizeText(String(response ?? ''));
      return r !== '' && step.accept.some((a) => normalizeText(a) === r);
    }
  }
}

export function answerLabel(step: ClassicQuestionStep): string {
  switch (step.type) {
    case 'mcq':
      return step.choices[step.answer];
    case 'numeric': {
      const n = formatNumber(step.answer, undefined, { maximumFractionDigits: 4 });
      return step.unit ? t('lesson.answer.withUnit', { value: n, unit: step.unit }) : n;
    }
    case 'text':
      return step.accept[0];
    case 'output':
      return step.output;
    case 'bug':
      return t('lesson.answer.bugFix', { line: step.lines[0], fix: step.fixes[step.answer] });
  }
}

export const isBugLine = (step: BugStep, line: number | null) => line !== null && step.lines.includes(line);

export function shuffled<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- mini-games (order, buckets, trace) ----------

/** `order` lists item indexes (into step.items) as the learner arranged them. Returns, per position, whether it's right. */
export const orderMarks = (step: OrderStep, order: number[]) => step.items.map((_, pos) => order[pos] === pos);

export const isOrderCorrect = (step: OrderStep, order: number[]) =>
  order.length === step.items.length && orderMarks(step, order).every(Boolean);

export const isRightBucket = (step: BucketsStep, item: number, bucket: number) => step.items[item]?.bucket === bucket;

/** The frames that ask the learner for a value. */
export const askedFrames = (step: TraceStep) => step.frames.filter((f) => f.ask);

/** The value the learner must predict at this frame. */
export const expectedValue = (frame: TraceFrame) => (frame.ask ? frame.vars[frame.ask] : undefined);

const QUOTED = /^(['"])(.*)\1$/s;

/** Drops whitespace outside string literals and treats ' and " alike, so `[1,2, 3]` matches `[1, 2, 3]`. */
function compact(s: string): string {
  let out = '';
  let quote: string | null = null;
  for (const ch of s) {
    if (quote) {
      if (ch === quote) quote = null;
      out += ch === "'" || ch === '"' ? '"' : ch;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      out += '"';
    } else if (!/\s/.test(ch)) out += ch;
  }
  return out;
}

/**
 * Compares a prediction with the frame's value. Spacing is ignored, a string may be typed with or without its quotes
 * (single or double), and the learner may write the whole assignment (`items = [1, 2, 3]`, even `val items = …`)
 * instead of just the value.
 */
export function checkTraceValue(frame: TraceFrame, input: string): boolean {
  const expected = expectedValue(frame);
  if (expected === undefined || !frame.ask) return false;
  const name = frame.ask.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const value = normalizeOutput(input).replace(new RegExp(`^(?:(?:val|var|let|const|auto|final)\\s+)?${name}\\s*[=:]\\s*`), '');
  if (value === '') return false;
  const want = normalizeOutput(expected);
  if (value === want || compact(value) === compact(want)) return true;
  const unquoted = want.match(QUOTED);
  return unquoted !== null && value === unquoted[2];
}

/** True when two printed values read the same (spacing outside strings and quote style ignored). */
export const sameTraceValue = (a: string, b: string) => compact(normalizeOutput(a)) === compact(normalizeOutput(b));

/** FNV-1a: a string to a 32-bit seed, so the same question always shows its options in the same order. */
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Up to `max` values to choose from when predicting `frames[at]` (lessons; reviews and quizzes keep typing).
 * The right value plus believable wrong ones, nearest mistakes first: the value the variable had or will have on other
 * lines (a string template that "updates itself", a list before the append), then other variables' values on this line
 * (answering for `count` when asked about `msg`), then a list's last item alone or without it, then a number one off. Order is shuffled by `seed`. Fewer than two
 * means there is nothing believable to offer, and the learner types instead.
 */
export function traceChoices(frames: readonly TraceFrame[], at: number, seed: string, max = 4): string[] {
  const frame = frames[at];
  const right = frame?.ask ? frame.vars[frame.ask] : undefined;
  if (right === undefined || !frame.ask) return [];
  const ask = frame.ask;
  const picked = [right];
  const add = (v: string | undefined) => {
    if (v !== undefined && v.trim() !== '' && picked.length < max && !picked.some((p) => sameTraceValue(p, v))) picked.push(v);
  };
  // The asked variable on other lines, nearest first.
  for (let d = 1; d < frames.length; d++) {
    add(frames[at - d]?.vars[ask]);
    add(frames[at + d]?.vars[ask]);
  }
  // Other variables on this line: the ones the line changed first.
  const prev = frames[at - 1]?.vars;
  const others = Object.keys(frame.vars).filter((k) => k !== ask);
  for (const k of [...others.filter((k) => prev?.[k] !== frame.vars[k]), ...others.filter((k) => prev?.[k] === frame.vars[k])]) add(frame.vars[k]);
  // A list with only its last item (a "fresh" list each time) or without it (the append that "didn't happen").
  const list = right.trim().match(/^\[(.*)\]$/s);
  // Flat lists only: splitting nested ones on commas would make broken options.
  if (list && list[1].trim() && !/[[{(]/.test(list[1])) {
    const items = list[1].split(',').map((x) => x.trim());
    if (items.length > 1) {
      add(`[${items.at(-1)}]`);
      add(`[${items.slice(0, -1).join(', ')}]`);
    }
  }
  // A number one off.
  if (/^-?\d+$/.test(right.trim())) {
    add(String(Number(right) + 1));
    add(String(Number(right) - 1));
  }
  // Seeded Fisher–Yates.
  let state = seedOf(seed);
  const rnd = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked;
}

/**
 * When a wrong prediction is the new value of another variable the line just changed (the learner answered for
 * `count` while the question asks about `msg`), that variable's name. It's a misread question, not a wrong idea.
 */
export function otherChangedVar(frame: TraceFrame, prevVars: Record<string, string> | undefined, input: string): string | undefined {
  if (!frame.ask || checkTraceValue(frame, input)) return undefined;
  return Object.keys(frame.vars).find((name) => name !== frame.ask && prevVars?.[name] !== frame.vars[name] && checkTraceValue({ ...frame, ask: name }, input));
}

/** Short text for "Correct answer:" lines. */
export function gameAnswerLabel(
  step: OrderStep | BucketsStep | TraceStep | TruthTableStep | LogicGridStep | BalanceStep,
): string {
  switch (step.type) {
    case 'truthtable': {
      const answers = truthTableAnswers(step.vars, step.columns.map((c) => c.expr));
      return step.columns
        .map((c, ci) => (c.given ? null : `\`${c.label ?? c.expr}\`: ${answers.map((row) => t(row[ci] ? 'lesson.answer.true' : 'lesson.answer.false')).join(' ')}`))
        .filter(Boolean)
        .join(' · ');
    }
    case 'logicgrid':
      return step.categories[0].items.map((item, i) => `**${item}:** ${step.solution[i].join(', ')}`).join(' · ');
    case 'balance':
      return `${step.variable ?? 'x'} = ${balanceSolution(step)}`;
    case 'order':
      return step.items.join(' → ');
    case 'buckets':
      return step.buckets
        .map((b, bi) => `**${b}:** ${step.items.filter((it) => it.bucket === bi).map((it) => it.text).join(', ')}`)
        .join(' · ');
    case 'trace':
      return askedFrames(step)
        .map((f) => t('lesson.answer.traceValue', { expr: `${f.ask} = ${expectedValue(f)}`, line: f.line }))
        .join(', ');
  }
}

// ---------- truth table, logic grid, balance ----------

/** The correct value of each learner-filled cell: [row][column]; `given` columns are included too. */
export const truthTableKey = (step: TruthTableStep) => truthTableAnswers(step.vars, step.columns.map((c) => c.expr));

/** Per cell: is the learner's value right? Cells left empty (null) count as wrong. Given columns are always right. */
export function truthTableMarks(step: TruthTableStep, cells: (boolean | null)[][]): boolean[][] {
  return truthTableKey(step).map((row, r) => row.map((want, c) => step.columns[c].given || cells[r]?.[c] === want));
}

export const isTruthTableCorrect = (step: TruthTableStep, cells: (boolean | null)[][]) =>
  truthTableMarks(step, cells).every((row) => row.every(Boolean));

/**
 * `picks[row][k]` is the learner's chosen item (index into categories[k + 1].items) for the row's first-category item,
 * or null. Returns whether every pick matches the solution.
 */
export function isLogicGridSolved(step: LogicGridStep, picks: (number | null)[][]): boolean {
  return step.categories[0].items.every((_, row) =>
    step.categories.slice(1).every((cat, k) => {
      const pick = picks[row]?.[k];
      return pick !== null && pick !== undefined && cat.items[pick] === step.solution[row][k];
    }),
  );
}

/** x in a·x + b = c·x + d. */
export const balanceSolution = (step: BalanceStep) => (step.right[1] - step.left[1]) / (step.left[0] - step.right[0]);
