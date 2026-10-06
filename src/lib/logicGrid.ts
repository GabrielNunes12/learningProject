// Logic-grid ("Einstein puzzle") model for the LogicGridGame. Pure, no runtime imports.
//
// The grid is the classic staircase. With categories C0 (rows), C1 and C2:
//
//              | C1 items | C2 items |
//   C0 items   | block 0  | block 1  |      blocks 0 and 1 are graded: they give each C0 item its C1 / C2 match
//   C2 items   | block 2  |                 block 2 (C2 × C1) is only for the learner's reasoning
//
// With two categories there is just block 0. Each block is a square of marks.

/** '' blank · 'x' a learner's ✗ · 'auto' a ✗ the helper placed · 'o' a ✓. */
export type Mark = '' | 'x' | 'auto' | 'o';
/** blocks[b][row][col] */
export type LogicGrid = Mark[][][];

export interface GridBlock {
  rowCat: number;
  colCat: number;
  /** Graded blocks pair the first category with another; block index = that category's index − 1. */
  graded: boolean;
}

/** Position on the whole staircase: gr counts C0 rows then C2 rows, gc counts C1 columns then C2 columns. */
export interface GridPos {
  gr: number;
  gc: number;
}

interface PuzzleLike {
  categories: { name: string; items: string[] }[];
  solution: string[][];
}

export function logicBlocks(cats: number): GridBlock[] {
  const blocks: GridBlock[] = [];
  for (let k = 1; k < cats; k++) blocks.push({ rowCat: 0, colCat: k, graded: true });
  if (cats === 3) blocks.push({ rowCat: 2, colCat: 1, graded: false });
  return blocks;
}

export const emptyLogicGrid = (cats: number, size: number): LogicGrid =>
  logicBlocks(cats).map(() => Array.from({ length: size }, () => Array.from({ length: size }, (): Mark => '')));

/** Tap: blank → ✗ → ✓ → blank (a helper ✗ counts as ✗, so the next tap makes it ✓). */
export const cycleMark = (m: Mark): Mark => (m === '' ? 'x' : m === 'o' ? '' : 'o');

/** X / O keys, right-click and long-press: set that mark, or clear it if it's already there. */
export const toggleMark = (m: Mark, want: 'x' | 'o'): Mark => ((want === 'x' ? m === 'x' || m === 'auto' : m === want) ? '' : want);

/** Re-derives a block's helper ✗s: every blank cell sharing a row or column with a ✓ gets one; stale ones go. */
export function autoFill(block: Mark[][]): Mark[][] {
  const rows = new Set<number>();
  const cols = new Set<number>();
  block.forEach((row, r) =>
    row.forEach((m, c) => {
      if (m === 'o') {
        rows.add(r);
        cols.add(c);
      }
    }),
  );
  return block.map((row, r) =>
    row.map((m, c) => {
      if (m === 'x' || m === 'o') return m;
      return rows.has(r) || cols.has(c) ? 'auto' : '';
    }),
  );
}

/** Applies helpers to every block (used when the learner switches them back on). */
export const autoFillAll = (grid: LogicGrid): LogicGrid => grid.map(autoFill);

/** Removes helper ✗s everywhere (used when the learner switches helpers off). */
export const clearAuto = (grid: LogicGrid): LogicGrid => grid.map((block) => block.map((row) => row.map((m) => (m === 'auto' ? '' : m))));

/** Returns a new grid with one cell set; with helpers on, that block's helper ✗s are re-derived. */
export function setMark(grid: LogicGrid, b: number, r: number, c: number, mark: Mark, helpers: boolean): LogicGrid {
  return grid.map((block, bi) => {
    if (bi !== b) return block;
    const next = block.map((row, ri) => (ri === r ? row.map((m, ci) => (ci === c ? mark : m)) : row));
    return helpers ? autoFill(next) : next;
  });
}

/** The column holding the row's only ✓, or null if there's none or more than one. */
function onlyTick(row: Mark[]): number | null {
  const ticks = row.flatMap((m, c) => (m === 'o' ? [c] : []));
  return ticks.length === 1 ? ticks[0] : null;
}

/** picks[row][k]: the learner's match from category k + 1 for each first-category item (for isLogicGridSolved). */
export function derivePicks(grid: LogicGrid, cats: number): (number | null)[][] {
  const size = grid[0]?.length ?? 0;
  return Array.from({ length: size }, (_, r) => Array.from({ length: cats - 1 }, (_, k) => onlyTick(grid[k][r])));
}

/** Check is allowed when every row of every graded block has exactly one ✓. */
export const picksComplete = (grid: LogicGrid, cats: number): boolean => derivePicks(grid, cats).every((row) => row.every((p) => p !== null));

/** How many first-category rows have a single ✓ in every graded block. */
export const rowsPicked = (grid: LogicGrid, cats: number): number => derivePicks(grid, cats).filter((row) => row.every((p) => p !== null)).length;

/** solution as indexes: idx[row][k] = index of the match within categories[k + 1].items. */
export function solutionIndexes(step: PuzzleLike): number[][] {
  return step.solution.map((row) => row.map((item, k) => step.categories[k + 1].items.indexOf(item)));
}

/** The finished grid: ✓ on every true pairing (including the C2 × C1 block), ✗ everywhere else. */
export function solutionGrid(step: PuzzleLike): LogicGrid {
  const cats = step.categories.length;
  const size = step.categories[0].items.length;
  const idx = solutionIndexes(step);
  return logicBlocks(cats).map((blk, b) =>
    Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c): Mark => {
        if (blk.graded) return idx[r][b] === c ? 'o' : 'x';
        // Block 2: row r is a C2 item, column c a C1 item. They match if one C0 row has both.
        return idx.some((row) => row[1] === r && row[0] === c) ? 'o' : 'x';
      }),
    ),
  );
}

export const cellKey = (b: number, r: number, c: number) => `${b}:${r}:${c}`;

/** Every ✓ that disagrees with the solution, as cellKey strings. */
export function wrongTicks(grid: LogicGrid, step: PuzzleLike): Set<string> {
  const want = solutionGrid(step);
  const out = new Set<string>();
  grid.forEach((block, b) => block.forEach((row, r) => row.forEach((m, c) => m === 'o' && want[b][r][c] !== 'o' && out.add(cellKey(b, r, c)))));
  return out;
}

export interface SummaryCell {
  /** Index into that category's items, or null while unknown. */
  item: number | null;
  /** Known only by chaining through the C2 × C1 block, not from a ✓ in the row itself. */
  inferred: boolean;
}

/**
 * The "solution so far" table: for each first-category item, its match in every other category.
 * With three categories a missing match is filled in through the C2 × C1 block when that block pins it down.
 */
export function gridSummary(grid: LogicGrid, cats: number): SummaryCell[][] {
  return derivePicks(grid, cats).map((picks) => {
    const cells: SummaryCell[] = picks.map((item) => ({ item, inferred: false }));
    if (cats === 3) {
      const third = grid[2];
      const [c1, c2] = picks;
      if (c1 !== null && c2 === null) {
        const rows = third.flatMap((row, r) => (row[c1] === 'o' ? [r] : []));
        if (rows.length === 1) cells[1] = { item: rows[0], inferred: true };
      } else if (c2 !== null && c1 === null) {
        const col = onlyTick(third[c2]);
        if (col !== null) cells[0] = { item: col, inferred: true };
      }
    }
    return cells;
  });
}

// ---------- staircase coordinates and keyboard movement ----------

/** Which block cell a staircase position is, or null for the empty corner (C2 rows × C2 columns). */
export function cellAt(pos: GridPos, cats: number, size: number): { b: number; r: number; c: number } | null {
  const { gr, gc } = pos;
  if (gr < 0 || gc < 0 || gc >= (cats - 1) * size) return null;
  if (gr < size) return { b: Math.floor(gc / size), r: gr, c: gc % size };
  if (cats === 3 && gr < 2 * size && gc < size) return { b: 2, r: gr - size, c: gc };
  return null;
}

export function posOf(b: number, r: number, c: number, size: number): GridPos {
  return b === 2 ? { gr: size + r, gc: c } : { gr: r, gc: b * size + c };
}

/** Arrow keys, Home and End over the staircase. Moves that would leave the grid stay put. Null for other keys. */
export function logicMove(pos: GridPos, key: string, cats: number, size: number): GridPos | null {
  const exists = (p: GridPos) => cellAt(p, cats, size) !== null;
  const tryMove = (p: GridPos) => (exists(p) ? p : pos);
  const rowEnd = pos.gr < size ? (cats - 1) * size - 1 : size - 1;
  switch (key) {
    case 'ArrowUp':
      return tryMove({ gr: pos.gr - 1, gc: pos.gc });
    case 'ArrowDown':
      return tryMove({ gr: pos.gr + 1, gc: pos.gc });
    case 'ArrowLeft':
      return tryMove({ gr: pos.gr, gc: pos.gc - 1 });
    case 'ArrowRight':
      return tryMove({ gr: pos.gr, gc: pos.gc + 1 });
    case 'Home':
      return { gr: pos.gr, gc: 0 };
    case 'End':
      return { gr: pos.gr, gc: rowEnd };
    default:
      return null;
  }
}

/** What a key does to the focused cell: X / O toggle that mark, Space cycles, Backspace / Delete clear. */
export function logicKey(key: string): 'x' | 'o' | 'cycle' | 'clear' | null {
  switch (key) {
    case 'x':
    case 'X':
      return 'x';
    case 'o':
    case 'O':
    case 'v':
    case 'V':
      return 'o';
    case ' ':
    case 'Spacebar':
      return 'cycle';
    case 'Backspace':
    case 'Delete':
      return 'clear';
    default:
      return null;
  }
}
