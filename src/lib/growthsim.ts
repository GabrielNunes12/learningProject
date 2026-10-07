// Pure logic for the Big-O race: operation counts per complexity class, number formatting that survives
// astronomically large values (everything is carried as log10), and a human time at 1 µs per operation.
// Numbers are formatted for the active language; complexity notation (O(n log n)) stays as written.
import { formatNumber, t, type MessageKey } from '../i18n/core.ts';

export type Curve = '1' | 'log n' | 'n' | 'n log n' | 'n^2' | '2^n';

/** Slowest-growing first. */
export const CURVE_ORDER: Curve[] = ['1', 'log n', 'n', 'n log n', 'n^2', '2^n'];

export const CURVE_LABEL: Record<Curve, string> = {
  '1': 'O(1)',
  'log n': 'O(log n)',
  n: 'O(n)',
  'n log n': 'O(n log n)',
  'n^2': 'O(n²)',
  '2^n': 'O(2ⁿ)',
};

const CURVE_NAME_KEY: Record<Curve, MessageKey> = {
  '1': 'sims.growth.curve.constant',
  'log n': 'sims.growth.curve.logarithmic',
  n: 'sims.growth.curve.linear',
  'n log n': 'sims.growth.curve.linearithmic',
  'n^2': 'sims.growth.curve.quadratic',
  '2^n': 'sims.growth.curve.exponential',
};

/** The name of a complexity class ("linear", "quadratic") in the active language. */
export const curveName = (c: Curve) => t(CURVE_NAME_KEY[c]);

const LOG10_2 = Math.log10(2);

/** Above this, counts are shown in scientific notation instead of exact digits. */
export const SAFE_MAX = 1e15;

/** log10 of the operation count for `curve` at input size n (n ≥ 1). -Infinity means 0 operations. */
export function opsLog10(curve: Curve, n: number): number {
  const log2n = Math.log2(n);
  switch (curve) {
    case '1':
      return 0;
    case 'log n':
      return Math.log10(log2n);
    case 'n':
      return Math.log10(n);
    case 'n log n':
      return Math.log10(n) + Math.log10(log2n);
    case 'n^2':
      return 2 * Math.log10(n);
    case '2^n':
      return n * LOG10_2;
  }
}

/** The operation count as a plain number (Infinity once it overflows a double, e.g. 2^n for n > 1023). */
export function ops(curve: Curve, n: number): number {
  switch (curve) {
    case '1':
      return 1;
    case 'log n':
      return Math.log2(n);
    case 'n':
      return n;
    case 'n log n':
      return n * Math.log2(n);
    case 'n^2':
      return n * n;
    case '2^n':
      return 2 ** n;
  }
}

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };

/** 14 → "¹⁴". */
export function superscript(n: number): string {
  return String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('');
}

/** Splits 10^log into mantissa × 10^exponent with `digits` significant digits (mantissa in [1, 10)). */
export function sci(log: number, digits = 2): { mantissa: string; exponent: number } {
  let exponent = Math.floor(log);
  let m = 10 ** (log - exponent);
  let mantissa = m.toFixed(digits - 1);
  if (Number(mantissa) >= 10) {
    exponent += 1;
    m /= 10;
    mantissa = m.toFixed(digits - 1);
  }
  return { mantissa, exponent };
}

/** "3.2 × 10¹⁴" */
export function sciLabel(log: number, digits = 2): string {
  const { mantissa, exponent } = sci(log, digits);
  const m = formatNumber(Number(mantissa), undefined, { minimumFractionDigits: digits - 1, maximumFractionDigits: digits - 1 });
  return `${m} × 10${superscript(exponent)}`;
}

/** A count given as log10: exact digits up to SAFE_MAX ("1,000,000", "9,966", "20"), scientific beyond. */
export function formatCount(log: number): string {
  if (log === -Infinity) return formatNumber(0);
  if (log > Math.log10(SAFE_MAX)) return sciLabel(log);
  const v = 10 ** log;
  return formatNumber(v, undefined, { maximumFractionDigits: v < 100 ? 1 : 0 });
}

export function formatOps(curve: Curve, n: number): string {
  return formatCount(opsLog10(curve, n));
}

const UNITS: { key: MessageKey; seconds: number }[] = [
  { key: 'sims.growth.time.us', seconds: 1e-6 },
  { key: 'sims.growth.time.ms', seconds: 1e-3 },
  { key: 'sims.growth.time.s', seconds: 1 },
  { key: 'sims.growth.time.min', seconds: 60 },
  { key: 'sims.growth.time.h', seconds: 3600 },
  { key: 'sims.growth.time.days', seconds: 86400 },
  { key: 'sims.growth.time.years', seconds: 365.25 * 86400 },
];

/** One decimal below 10, whole numbers above (t() formats it for the language). */
function short(v: number): number {
  return v < 10 ? Number(v.toFixed(1)) : Math.round(v);
}

/**
 * Wall-clock time for 10^opsLog operations at `usPerOp` microseconds each:
 * "0 µs", "10 µs", "2 ms", "17 min", "11.6 days", "584,942 years", "3.2 × 10¹⁴ years".
 */
export function humanTime(opsLog: number, usPerOp = 1): string {
  if (opsLog === -Infinity) return t('sims.growth.time.us', { count: 0 });
  const secLog = opsLog + Math.log10(usPerOp) - 6;
  // the largest unit the value reaches
  let unit = UNITS[0];
  for (const u of UNITS) if (secLog >= Math.log10(u.seconds) - 1e-9) unit = u;
  const valLog = secLog - Math.log10(unit.seconds);
  if (unit === UNITS[UNITS.length - 1] && valLog >= 6) return t('sims.growth.time.yearsSci', { value: sciLabel(valLog) });
  const v = 10 ** valLog;
  return t(unit.key, { count: short(v) });
}

export function timeFor(curve: Curve, n: number): string {
  return humanTime(opsLog10(curve, n));
}

/** Slider position (0 … steps) ↔ input size, log-scaled so small n get as much room as big ones. */
export function sliderToN(pos: number, maxN: number, steps = 1000): number {
  const t = Math.min(Math.max(pos / steps, 0), 1);
  return Math.max(1, Math.min(maxN, Math.round(maxN ** t)));
}

export function nToSlider(n: number, maxN: number, steps = 1000): number {
  if (maxN <= 1) return 0;
  return Math.round((Math.log(Math.max(1, n)) / Math.log(maxN)) * steps);
}

/** Preset buttons that fit under maxN. */
export function quickSizes(maxN: number): number[] {
  return [10, 100, 1000, 1_000_000].filter((v) => v <= maxN);
}

/**
 * Where a bar ends on a 0…1 track. Linear: count ÷ axisMax. Log: log10(count) ÷ log10(axisMax).
 * `overLog` > 0 means it runs off the chart: by a factor of 10^overLog (linear) or by overLog powers of ten (log).
 */
export function barExtent(opsLog: number, axisLog: number, scale: 'linear' | 'log'): { frac: number; overLog: number } {
  if (opsLog === -Infinity) return { frac: 0, overLog: 0 };
  if (scale === 'linear') {
    const ratioLog = opsLog - axisLog;
    return ratioLog > 0 ? { frac: 1, overLog: ratioLog } : { frac: 10 ** ratioLog, overLog: 0 };
  }
  const frac = axisLog <= 0 ? 1 : Math.max(0, opsLog) / axisLog;
  return frac > 1 ? { frac: 1, overLog: opsLog - axisLog } : { frac, overLog: 0 };
}

/** "1.7", "51", "500", "1,000,000", "1.1 × 10³⁰" — how many times past the edge a bar runs. */
export function formatFactor(log: number): string {
  if (log < 1) return formatNumber(10 ** log, undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (log <= Math.log10(SAFE_MAX)) return formatNumber(Math.round(10 ** log), undefined, { maximumFractionDigits: 0 });
  return sciLabel(log);
}

/** Largest log10 shown on the log-scale race before a bar flies off even there. */
export const LOG_AXIS_CAP = 30;

/**
 * Axis maximum (as log10) for the race.
 * Linear: twice the O(n) count (or, without O(n), twice the middle curve) so faster-growing curves visibly fly off.
 * Log: the largest count, rounded up to a power of ten and capped at 10^LOG_AXIS_CAP.
 */
export function axisLog10(curves: Curve[], n: number, scale: 'linear' | 'log'): number {
  const sorted = CURVE_ORDER.filter((c) => curves.includes(c));
  if (scale === 'log') {
    const max = Math.max(...sorted.map((c) => opsLog10(c, n)));
    return Math.min(LOG_AXIS_CAP, Math.max(1, Math.ceil(max)));
  }
  const refLog = opsLog10(linearReference(curves), n);
  return Math.max(1, (refLog === -Infinity ? 0 : refLog) + LOG10_2);
}

/** The curve the linear axis is sized to (for the caption). */
export function linearReference(curves: Curve[]): Curve {
  const sorted = CURVE_ORDER.filter((c) => curves.includes(c));
  return sorted.includes('n') ? 'n' : sorted[Math.floor((sorted.length - 1) / 2)];
}
