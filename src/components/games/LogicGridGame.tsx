// "Solve the logic grid": the classic deduction grid. Tap a cell to cycle blank → ✗ → ✓; long-press, right-click or
// Shift+click puts a ✓ straight in. With helpers on, a ✓ crosses out the rest of its row and column in that block.
// Keyboard: arrows move, X / O toggle ✗ / ✓, Space cycles, Backspace clears.
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { gameAnswerLabel, isLogicGridSolved } from '../../lib/answers';
import {
  autoFillAll,
  cellAt,
  cellKey,
  clearAuto,
  cycleMark,
  derivePicks,
  emptyLogicGrid,
  gridSummary,
  logicBlocks,
  logicKey,
  logicMove,
  picksComplete,
  rowsPicked,
  setMark,
  solutionGrid,
  solutionIndexes,
  toggleMark,
  wrongTicks,
  type GridPos,
  type LogicGrid,
  type Mark,
} from '../../lib/logicGrid';
import type { LogicGridStep } from '../../types';
import { InlineMarkdown } from '../Markdown';
import { AnswerLine, QuestionFrame, useCheckFlow, type QuestionProps } from '../QuestionFrame';
import './LogicGridGame.css';

const LONG_PRESS_MS = 450;
const UNDO_LIMIT = 60;
const plain = (s: string) => s.replace(/[`*_]/g, '');
const markWord = (m: Mark) => (m === 'o' ? 'yes' : m === '' ? 'blank' : 'no');
const glyph = (m: Mark) => (m === 'o' ? '✓' : m === '' ? '' : '✗');

export function LogicGridGame({ step, mode, context, onDone }: QuestionProps<LogicGridStep>) {
  const flow = useCheckFlow(mode, onDone);
  const { status } = flow;
  const cats = step.categories.length;
  const size = step.categories[0].items.length;
  const blocks = useMemo(() => logicBlocks(cats), [cats]);
  const solution = useMemo(() => solutionGrid(step), [step]);
  const solIdx = useMemo(() => solutionIndexes(step), [step]);

  const [grid, setGrid] = useState<LogicGrid>(() => emptyLogicGrid(cats, size));
  const [history, setHistory] = useState<LogicGrid[]>([]);
  const [helpers, setHelpers] = useState(true);
  const [focus, setFocus] = useState<GridPos>({ gr: 0, gc: 0 });
  /** The cell under the pointer or keyboard focus: its row and column headers light up. */
  const [hot, setHot] = useState<GridPos | null>(null);
  const [struck, setStruck] = useState<Set<number>>(() => new Set());
  /** Wrong ✓s from the last check (learn mode); cleared by Try again. */
  const [wrong, setWrong] = useState<Set<string> | null>(null);
  const [announce, setAnnounce] = useState('');

  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const press = useRef<{ timer: number; x: number; y: number } | null>(null);
  const longFired = useRef(false);
  const howtoId = useId();

  const locked = status !== 'answering';
  const revealed = status === 'revealed';
  const solved = status === 'correct';
  const shown = revealed ? solution : grid;
  const missed = useMemo(() => (revealed ? wrongTicks(grid, step) : null), [revealed, grid, step]);
  const complete = picksComplete(grid, cats);
  const picked = rowsPicked(grid, cats);
  const summary = useMemo(() => gridSummary(grid, cats), [grid, cats]);

  useEffect(
    () => () => {
      if (press.current) window.clearTimeout(press.current.timer);
    },
    [],
  );

  const itemOf = (cat: number, i: number) => plain(step.categories[cat].items[i]);

  function apply(b: number, r: number, c: number, next: Mark) {
    if (locked) return;
    const blk = blocks[b];
    const before = grid[b][r][c];
    if (before === next) return;
    const after = setMark(grid, b, r, c, next, helpers);
    setHistory((h) => [...h.slice(-UNDO_LIMIT + 1), grid]);
    setGrid(after);
    const crossed = helpers && next === 'o' ? ' The rest of its row and column are crossed out.' : '';
    setAnnounce(`${itemOf(blk.rowCat, r)} and ${itemOf(blk.colCat, c)}: ${markWord(next)}.${crossed}`);
  }

  function undo() {
    if (locked || history.length === 0) return;
    // Helpers may have been switched since that state was saved: bring its helper ✗s in line.
    const prev = history[history.length - 1];
    setGrid(helpers ? autoFillAll(prev) : clearAuto(prev));
    setHistory((h) => h.slice(0, -1));
    setAnnounce('Undone.');
  }

  function clearGrid() {
    if (locked) return;
    setHistory((h) => [...h.slice(-UNDO_LIMIT + 1), grid]);
    setGrid(emptyLogicGrid(cats, size));
    setAnnounce('Grid cleared. Undo brings it back.');
  }

  function toggleHelpers() {
    const on = !helpers;
    setHelpers(on);
    if (!locked) setGrid((g) => (on ? autoFillAll(g) : clearAuto(g)));
    setAnnounce(on ? 'Helpers on: a check mark crosses out the rest of its row and column.' : 'Helpers off.');
  }

  function toggleClue(i: number) {
    setStruck((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function moveTo(pos: GridPos) {
    setFocus(pos);
    setHot(pos);
    cellRefs.current.get(`${pos.gr}:${pos.gc}`)?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, pos: GridPos, b: number, r: number, c: number) {
    longFired.current = false;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const to = logicMove(pos, e.key, cats, size);
    if (to) {
      e.preventDefault();
      moveTo(to);
      return;
    }
    const action = logicKey(e.key);
    if (!action) return;
    e.preventDefault();
    const m = grid[b][r][c];
    apply(b, r, c, action === 'cycle' ? cycleMark(m) : action === 'clear' ? '' : toggleMark(m, action));
  }

  // Long-press (touch / pen) puts a ✓ straight in; a drag or scroll cancels it.
  function onPointerDown(e: PointerEvent<HTMLButtonElement>, b: number, r: number, c: number) {
    longFired.current = false;
    if (locked || e.pointerType === 'mouse') return;
    const timer = window.setTimeout(() => {
      press.current = null;
      longFired.current = true;
      navigator.vibrate?.(12);
      apply(b, r, c, toggleMark(grid[b][r][c], 'o'));
    }, LONG_PRESS_MS);
    press.current = { timer, x: e.clientX, y: e.clientY };
  }
  function endPress() {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  }
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const p = press.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) endPress();
  }
  function onClick(e: MouseEvent<HTMLButtonElement>, b: number, r: number, c: number) {
    if (longFired.current) {
      longFired.current = false;
      return;
    }
    const m = grid[b][r][c];
    apply(b, r, c, e.shiftKey ? toggleMark(m, 'o') : cycleMark(m));
  }
  function onContextMenu(e: MouseEvent<HTMLButtonElement>, b: number, r: number, c: number) {
    e.preventDefault();
    if (longFired.current || press.current) return;
    apply(b, r, c, toggleMark(grid[b][r][c], 'o'));
  }

  function check() {
    const ok = isLogicGridSolved(step, derivePicks(grid, cats));
    if (ok) {
      setWrong(null);
      setAnnounce('Solved! Every match is right.');
    } else {
      const bad = wrongTicks(grid, step);
      setWrong(bad);
      setAnnounce(`${bad.size} ${bad.size === 1 ? 'check mark is' : 'check marks are'} wrong. They're highlighted in the grid.`);
    }
    flow.grade(ok);
  }

  // ---------- rendering ----------

  function cell(gr: number, gc: number) {
    const at = cellAt({ gr, gc }, cats, size)!;
    const { b, r, c } = at;
    const blk = blocks[b];
    const m = shown[b][r][c];
    const k = cellKey(b, r, c);
    const isWrong = status === 'wrong' && wrong?.has(k);
    const isMissed = missed?.has(k);
    let cls = `lg-cell m-${m || 'blank'}`;
    if (gr === 0) cls += ' edge-t';
    if (gc === 0) cls += ' edge-l';
    if (c === size - 1) cls += ' edge-r';
    if (r === size - 1) cls += ' edge-b';
    if (isWrong) cls += ' wrong';
    if (isMissed) cls += ' missed';
    if (solved && m === 'o') cls += ' win';
    const label = `${itemOf(blk.rowCat, r)} and ${itemOf(blk.colCat, c)}: ${markWord(m)}${
      isWrong ? ', wrong' : isMissed ? ', you had this as a match' : ''
    }`;
    return (
      <td key={gc} className="lg-td">
        <button
          type="button"
          ref={(el) => {
            const key = `${gr}:${gc}`;
            if (el) cellRefs.current.set(key, el);
            else cellRefs.current.delete(key);
          }}
          className={cls}
          style={solved && m === 'o' ? ({ '--i': gr } as CSSProperties) : undefined}
          tabIndex={!locked && focus.gr === gr && focus.gc === gc ? 0 : -1}
          aria-label={label}
          aria-disabled={locked || undefined}
          onFocus={() => {
            setFocus({ gr, gc });
            setHot({ gr, gc });
          }}
          onBlur={() => setHot(null)}
          onPointerEnter={() => setHot({ gr, gc })}
          onPointerLeave={() => {
            setHot(null);
            endPress();
          }}
          onPointerDown={(e) => onPointerDown(e, b, r, c)}
          onPointerUp={endPress}
          onPointerCancel={endPress}
          onPointerMove={onPointerMove}
          onClick={(e) => onClick(e, b, r, c)}
          onContextMenu={(e) => onContextMenu(e, b, r, c)}
          onKeyDown={(e) => onKeyDown(e, { gr, gc }, b, r, c)}
        >
          <span key={m} className="lg-glyph" aria-hidden>
            {glyph(m)}
          </span>
        </button>
      </td>
    );
  }

  const colCats = step.categories.slice(1).map((cat, k) => ({ cat, index: k + 1 }));
  const hotCol = hot ? hot.gc : -1;
  const hotRow = hot ? hot.gr : -1;
  const pickWrong = (row: number, k: number, item: number | null) => status === 'wrong' && item !== null && item !== solIdx[row][k];

  const board = (
    <div className="lg-board-scroll" role="region" aria-label="Logic grid">
      <table className={`lg-table${solved ? ' solved' : ''}${revealed ? ' answer' : ''}`} aria-describedby={howtoId}>
        <thead>
          <tr>
            <td className="lg-corner" colSpan={2} rowSpan={2} aria-hidden />
            {colCats.map(({ cat, index }) => (
              <th key={index} scope="colgroup" colSpan={size} className="lg-cat-top">
                {cat.name}
              </th>
            ))}
          </tr>
          <tr>
            {colCats.flatMap(({ cat, index }) =>
              cat.items.map((item, i) => {
                const gc = (index - 1) * size + i;
                return (
                  <th key={gc} scope="col" className={`lg-colhead${i === size - 1 ? ' edge-r' : ''}${hotCol === gc ? ' hot' : ''}`}>
                    <span className="lg-vert">{plain(item)}</span>
                  </th>
                );
              }),
            )}
          </tr>
        </thead>
        <tbody>
          {step.categories[0].items.map((item, r) => (
            <tr key={`a${r}`}>
              {r === 0 && (
                <th scope="rowgroup" rowSpan={size} className="lg-cat-side">
                  <span className="lg-vert">{step.categories[0].name}</span>
                </th>
              )}
              <th scope="row" className={`lg-rowhead${r === size - 1 ? ' edge-b' : ''}${hotRow === r ? ' hot' : ''}`}>
                {plain(item)}
              </th>
              {Array.from({ length: (cats - 1) * size }, (_, gc) => cell(r, gc))}
            </tr>
          ))}
          {cats === 3 &&
            step.categories[2].items.map((item, r) => {
              const gr = size + r;
              return (
                <tr key={`b${r}`} className="lg-band2">
                  {r === 0 && (
                    <th scope="rowgroup" rowSpan={size} className="lg-cat-side">
                      <span className="lg-vert">{step.categories[2].name}</span>
                    </th>
                  )}
                  <th scope="row" className={`lg-rowhead${r === size - 1 ? ' edge-b' : ''}${hotRow === gr ? ' hot' : ''}`}>
                    {plain(item)}
                  </th>
                  {Array.from({ length: size }, (_, gc) => cell(gr, gc))}
                  {r === 0 && <td className="lg-void" colSpan={size} rowSpan={size} aria-hidden />}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );

  return (
    <QuestionFrame
      step={step}
      flow={flow}
      mode={mode}
      context={context}
      kind="Solve the logic grid"
      canCheck={complete}
      onCheck={check}
      onRetry={() => setWrong(null)}
      checkLabel={complete ? 'Check' : `${picked}/${size} matched`}
      answer={<AnswerLine text={gameAnswerLabel(step)} />}
    >
      <div className="lg-wrap">
        <div className="lg-layout">
          <details className="lg-clues" open>
            <summary>
              <span className="lg-clues-title">Clues</span>
              <span className="lg-clues-count">
                {struck.size}/{step.clues.length} used
              </span>
            </summary>
            <ol className="lg-clue-list">
              {step.clues.map((clue, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={`lg-clue${struck.has(i) ? ' struck' : ''}`}
                    aria-pressed={struck.has(i)}
                    onClick={() => toggleClue(i)}
                  >
                    <span className="lg-clue-n" aria-hidden>
                      {struck.has(i) ? '✓' : i + 1}
                    </span>
                    <span className="lg-clue-text">
                      <InlineMarkdown text={clue} />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="lg-clues-tip muted small">Tap a clue to cross it off once you've used it.</p>
          </details>

          <div className="lg-main">
            <div className="lg-tools">
              <button type="button" className={`lg-toggle${helpers ? ' on' : ''}`} aria-pressed={helpers} aria-label="Auto cross-out helper" onClick={toggleHelpers}>
                <span className="lg-switch" aria-hidden />
                Auto-✗
              </button>
              {status === 'answering' && (
                <>
                  <button type="button" className="btn ghost small" onClick={undo} disabled={history.length === 0}>
                    ↶ Undo
                  </button>
                  <button type="button" className="btn ghost small" onClick={clearGrid} disabled={grid.every((b) => b.every((row) => row.every((m) => m === '')))}>
                    Clear
                  </button>
                </>
              )}
              <span className="lg-tip muted small">Tap: ✗ → ✓ · hold or right-click: ✓</span>
            </div>
            {board}

            <div className="lg-summary-wrap">
              <span className="eyebrow">{revealed ? 'Solution' : 'Solution so far'}</span>
              <table className={`lg-summary${solved ? ' solved' : ''}`}>
                <thead>
                  <tr>
                    {step.categories.map((cat, ci) => (
                      <th key={ci} scope="col">
                        {cat.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {step.categories[0].items.map((item, row) => (
                    <tr key={row} style={{ '--i': row } as CSSProperties}>
                      <th scope="row">{plain(item)}</th>
                      {step.categories.slice(1).map((cat, k) => {
                        const s = revealed ? { item: solIdx[row][k], inferred: false } : summary[row][k];
                        const isBad = pickWrong(row, k, s.inferred ? null : s.item);
                        return (
                          <td key={k} className={`${s.item === null ? 'empty' : 'known'}${s.inferred ? ' inferred' : ''}${isBad ? ' wrong' : ''}`}>
                            {s.item === null ? (
                              <span aria-label="unknown">?</span>
                            ) : (
                              <span key={s.item} className="lg-sum-item">
                                {plain(cat.items[s.item])}
                                {isBad && <span className="sr-only"> (wrong)</span>}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {cats === 3 && !revealed && summary.some((row) => row.some((s) => s.inferred)) && (
                <p className="muted small lg-sum-note">Faded entries come from the bottom block: tick them in the rows above too.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {revealed && missed && missed.size > 0 && (
        <p className="lg-legend muted small">
          <span className="lg-legend-swatch" aria-hidden /> Matches you had wrong.
        </p>
      )}
      {solved && (
        <p className="lg-result" role="status">
          🧩 Solved! All {size} rows matched from {step.clues.length} {step.clues.length === 1 ? 'clue' : 'clues'}.
        </p>
      )}

      <p id={howtoId} className="sr-only">
        Each cell pairs the item of its row with the item of its column. Use the arrow keys to move. Press O for a match, X
        to rule it out, Space to cycle, Backspace to clear.
        {helpers ? ' Helpers are on: a match crosses out the rest of its row and column.' : ''}
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </QuestionFrame>
  );
}
