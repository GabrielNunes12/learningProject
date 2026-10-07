// SQL join semantics for the JOIN playground: inner, left, right and full outer joins on one equality condition.
// Pure and dependency-free (tested in tests/joinsim.test.ts). NULL never matches anything, not even NULL.
import { t } from '../i18n/core.ts';

export type JoinType = 'inner' | 'left' | 'right' | 'full';
export type Cell = string | number | null;

export interface JoinTable {
  name: string;
  columns: string[];
  rows: Cell[][];
}

export interface ResultRow {
  /** Index of the source row in the left table, or null when padded with NULLs. */
  left: number | null;
  right: number | null;
  values: Cell[];
}

export interface JoinResult {
  /** Qualified headers, e.g. "c.id", "o.total". */
  columns: string[];
  rows: ResultRow[];
  /** All matching [left, right] row pairs (independent of join type). */
  pairs: [number, number][];
  /** Left rows with no partner, and right rows with no partner. */
  unmatchedLeft: number[];
  unmatchedRight: number[];
}

export const JOIN_TYPES: JoinType[] = ['inner', 'left', 'right', 'full'];

export const JOIN_KEYWORD: Record<JoinType, string> = {
  inner: 'INNER JOIN',
  left: 'LEFT JOIN',
  right: 'RIGHT JOIN',
  full: 'FULL OUTER JOIN',
};

/** SQL equality: NULL = anything is unknown, so it is never a match. 1 and "1" count as equal. */
export function sqlEquals(a: Cell, b: Cell): boolean {
  if (a === null || b === null) return false;
  return String(a) === String(b);
}

/** Short table aliases: first letter of each name, or t1/t2 when they clash. */
export function aliases(left: string, right: string): [string, string] {
  const l = left.charAt(0).toLowerCase() || 'l';
  const r = right.charAt(0).toLowerCase() || 'r';
  return l === r ? ['t1', 't2'] : [l, r];
}

export function joinTables(left: JoinTable, right: JoinTable, on: [string, string], type: JoinType): JoinResult {
  const li = left.columns.indexOf(on[0]);
  const ri = right.columns.indexOf(on[1]);
  if (li < 0 || ri < 0) throw new Error(`join columns not found: ${on.join(', ')}`);
  const [la, ra] = aliases(left.name, right.name);
  const columns = [...left.columns.map((c) => `${la}.${c}`), ...right.columns.map((c) => `${ra}.${c}`)];
  const nullsL = left.columns.map(() => null);
  const nullsR = right.columns.map(() => null);

  const pairs: [number, number][] = [];
  left.rows.forEach((lr, i) => right.rows.forEach((rr, j) => sqlEquals(lr[li], rr[ri]) && pairs.push([i, j])));
  const unmatchedLeft = left.rows.map((_, i) => i).filter((i) => !pairs.some((p) => p[0] === i));
  const unmatchedRight = right.rows.map((_, j) => j).filter((j) => !pairs.some((p) => p[1] === j));

  const rows: ResultRow[] = [];
  if (type === 'right') {
    // Driven by the right table: each right row with its matches, or NULLs on the left.
    right.rows.forEach((rr, j) => {
      const ms = pairs.filter((p) => p[1] === j);
      if (ms.length === 0) rows.push({ left: null, right: j, values: [...nullsL, ...rr] });
      for (const [i] of ms) rows.push({ left: i, right: j, values: [...left.rows[i], ...rr] });
    });
  } else {
    left.rows.forEach((lr, i) => {
      const ms = pairs.filter((p) => p[0] === i);
      if (ms.length === 0 && type !== 'inner') rows.push({ left: i, right: null, values: [...lr, ...nullsR] });
      for (const [, j] of ms) rows.push({ left: i, right: j, values: [...lr, ...right.rows[j]] });
    });
    if (type === 'full') for (const j of unmatchedRight) rows.push({ left: null, right: j, values: [...nullsL, ...right.rows[j]] });
  }
  return { columns, rows, pairs, unmatchedLeft, unmatchedRight };
}

/** Whether a row with no partner survives this join type. */
export function keepsUnmatched(type: JoinType, side: 'left' | 'right'): boolean {
  return type === 'full' || type === side;
}

export function joinSql(left: JoinTable, right: JoinTable, on: [string, string], type: JoinType): string {
  const [la, ra] = aliases(left.name, right.name);
  return `SELECT *\nFROM ${left.name} ${la}\n${JOIN_KEYWORD[type]} ${right.name} ${ra}\n  ON ${la}.${on[0]} = ${ra}.${on[1]};`;
}

/** A short human name for a row: its first text column that isn't the join key, else "<first column> <value>". */
export function rowLabel(t: JoinTable, i: number, key: string): string {
  const row = t.rows[i];
  const k = t.columns.findIndex((c, ci) => c !== key && typeof row[ci] === 'string' && !/^\d/.test(String(row[ci])));
  if (k >= 0) return String(row[k]);
  return `${t.columns[0]} ${formatCell(row[0])}`;
}

export function formatCell(v: Cell): string {
  return v === null ? 'NULL' : String(v);
}

/** Plain-language summary of what the chosen join keeps and drops. */
export function describeJoin(left: JoinTable, right: JoinTable, on: [string, string], type: JoinType): string[] {
  const r = joinTables(left, right, on, type);
  const lines: string[] = [];
  const li = left.columns.indexOf(on[0]);
  const ri = right.columns.indexOf(on[1]);
  const list = (tb: JoinTable, idx: number[], key: string) => idx.map((i) => rowLabel(tb, i, key)).join(', ');
  lines.push(t('sims.join.pairs', { count: r.pairs.length }));
  const repeatsL = left.rows.map((_, i) => i).filter((i) => r.pairs.filter((p) => p[0] === i).length > 1);
  if (repeatsL.length) lines.push(t('sims.join.repeats', { count: repeatsL.length, rows: list(left, repeatsL, on[0]) }));
  const repeatsR = right.rows.map((_, j) => j).filter((j) => r.pairs.filter((p) => p[1] === j).length > 1);
  if (repeatsR.length) lines.push(t('sims.join.repeats', { count: repeatsR.length, rows: list(right, repeatsR, on[1]) }));
  const side = (tb: JoinTable, idx: number[], key: string, keyIdx: number, s: 'left' | 'right') => {
    if (!idx.length) return;
    const nulls = idx.filter((i) => tb.rows[i][keyIdx] === null);
    const params = { table: tb.name, rows: list(tb, idx, key), other: s === 'left' ? right.name : left.name };
    const line = t(keepsUnmatched(type, s) ? 'sims.join.noMatchKept' : 'sims.join.noMatchDropped', params);
    lines.push(nulls.length ? t('sims.join.withNullNote', { sentence: line }) : line);
  };
  side(left, r.unmatchedLeft, on[0], li, 'left');
  side(right, r.unmatchedRight, on[1], ri, 'right');
  return lines;
}
