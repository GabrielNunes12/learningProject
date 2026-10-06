// UI logic for the truth-table mini-game: cell cycling, keyboard navigation and pretty-printing expressions.
// Pure, no runtime imports, so node:test can load it directly.

/** A learner cell: true, false, or still empty. */
export type TruthCell = boolean | null;

/** Where the keyboard focus is: a row, and an index into the *editable* (non-given) columns. */
export interface TruthPos {
  r: number;
  c: number;
}

/** Tap / Space: blank → T → F → blank. */
export const cycleTruth = (v: TruthCell): TruthCell => (v === null ? true : v ? false : null);

/** An empty answer grid: rows × columns, all null (given columns included, they're ignored). */
export const emptyTruthCells = (rows: number, cols: number): TruthCell[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

/** Indexes of the columns the learner fills in. */
export const editableColumns = (columns: { given?: boolean }[]): number[] =>
  columns.flatMap((col, i) => (col.given ? [] : [i]));

/** True when every learner cell has a value. */
export const allTruthFilled = (cells: TruthCell[][], editable: number[]): boolean =>
  cells.every((row) => editable.every((c) => row[c] !== null && row[c] !== undefined));

export const filledCount = (cells: TruthCell[][], editable: number[]): number =>
  cells.reduce((n, row) => n + editable.filter((c) => row[c] !== null && row[c] !== undefined).length, 0);

/** Rows whose learner cells are all right, given the per-cell marks from truthTableMarks. */
export const rowsRight = (marks: boolean[][]): number => marks.filter((row) => row.every(Boolean)).length;

/** Returns `cells` with one cell replaced (rows are copied, the rest shared). */
export function setTruthCell(cells: TruthCell[][], r: number, c: number, v: TruthCell): TruthCell[][] {
  return cells.map((row, ri) => (ri === r ? row.map((x, ci) => (ci === c ? v : x)) : row));
}

export type TruthKeyAction =
  | { kind: 'set'; value: TruthCell; advance: boolean }
  | { kind: 'cycle' }
  | { kind: 'move'; to: TruthPos };

/**
 * What a key press on a learner cell does. T/1 and F/0 set a value and advance to the next cell; Space cycles;
 * Backspace/Delete clear; arrows, Home and End move. Returns null for keys the game doesn't use.
 */
export function truthKey(key: string, pos: TruthPos, rows: number, cols: number): TruthKeyAction | null {
  const clamp = (r: number, c: number): TruthPos => ({ r: Math.max(0, Math.min(rows - 1, r)), c: Math.max(0, Math.min(cols - 1, c)) });
  switch (key) {
    case 't':
    case 'T':
    case '1':
      return { kind: 'set', value: true, advance: true };
    case 'f':
    case 'F':
    case '0':
      return { kind: 'set', value: false, advance: true };
    case ' ':
    case 'Spacebar':
      return { kind: 'cycle' };
    case 'Backspace':
    case 'Delete':
      return { kind: 'set', value: null, advance: false };
    case 'ArrowUp':
      return { kind: 'move', to: clamp(pos.r - 1, pos.c) };
    case 'ArrowDown':
      return { kind: 'move', to: clamp(pos.r + 1, pos.c) };
    case 'ArrowLeft':
      return { kind: 'move', to: clamp(pos.r, pos.c - 1) };
    case 'ArrowRight':
      return { kind: 'move', to: clamp(pos.r, pos.c + 1) };
    case 'Home':
      return { kind: 'move', to: clamp(pos.r, 0) };
    case 'End':
      return { kind: 'move', to: clamp(pos.r, cols - 1) };
    default:
      return null;
  }
}

/** After typing a value: the next cell down the column, then the top of the next column; stays put at the very end. */
export function nextTruthPos(pos: TruthPos, rows: number, cols: number): TruthPos {
  if (pos.r < rows - 1) return { r: pos.r + 1, c: pos.c };
  if (pos.c < cols - 1) return { r: 0, c: pos.c + 1 };
  return pos;
}

// ---------- pretty expressions ----------

const PRETTY: [string, string][] = [
  ['<->', '↔'],
  ['->', '→'],
  ['&&', '∧'],
  ['||', '∨'],
  ['&', '∧'],
  ['!', '¬'],
  ['~', '¬'],
  ['↔', '↔'],
  ['→', '→'],
  ['∧', '∧'],
  ['∨', '∨'],
  ['⊕', '⊕'],
  ['¬', '¬'],
  ['(', '('],
  [')', ')'],
];
const PRETTY_WORDS: Record<string, string> = { and: '∧', or: '∨', xor: '⊕', not: '¬', implies: '→', iff: '↔' };

/**
 * Renders an expression with logic symbols: "not (P and Q) -> R" → "¬(P ∧ Q) → R".
 * Binary operators get spaces around them; ¬ and parentheses hug their operand. Unknown characters are kept.
 */
export function prettyLogic(expr: string): string {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) {
      i++;
      continue;
    }
    const sym = PRETTY.find(([s]) => expr.startsWith(s, i));
    if (sym) {
      tokens.push(sym[1]);
      i += sym[0].length;
      continue;
    }
    const word = expr.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (word) {
      tokens.push(PRETTY_WORDS[word[0].toLowerCase()] ?? word[0]);
      i += word[0].length;
      continue;
    }
    tokens.push(expr[i]);
    i++;
  }
  let out = '';
  tokens.forEach((t, k) => {
    const prev = tokens[k - 1];
    if (k > 0 && prev !== '¬' && prev !== '(' && t !== ')') out += ' ';
    out += t;
  });
  return out;
}

/** How a screen reader should hear an expression: "not (P and Q) implies R". */
export function spokenLogic(expr: string): string {
  const words: Record<string, string> = { '¬': 'not ', '∧': ' and ', '∨': ' or ', '⊕': ' xor ', '→': ' implies ', '↔': ' if and only if ' };
  return prettyLogic(expr)
    .replace(/\s*([∧∨⊕→↔])\s*/g, (_, op: string) => words[op])
    .replace(/¬/g, words['¬']);
}
