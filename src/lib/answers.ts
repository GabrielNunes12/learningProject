import type { QuestionStep } from '../types';

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

export function checkAnswer(step: QuestionStep, response: number | string | null): boolean {
  switch (step.type) {
    case 'mcq':
      return response === step.answer;
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

export function answerLabel(step: QuestionStep): string {
  switch (step.type) {
    case 'mcq':
      return step.choices[step.answer];
    case 'numeric': {
      const n = Number.isInteger(step.answer) ? step.answer.toLocaleString('en-US') : String(+step.answer.toFixed(4));
      return step.unit ? `${n} ${step.unit}` : n;
    }
    case 'text':
      return step.accept[0];
  }
}

export function shuffled<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
