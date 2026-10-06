// "Fill in the truth table": the input columns are pre-filled; tap each empty cell to cycle it blank → T → F.
// Keyboard: arrows move, T/F (or 1/0) set and step down the column, Space cycles, Backspace clears.
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { gameAnswerLabel, isTruthTableCorrect, truthTableKey, truthTableMarks } from '../../lib/answers';
import { truthRows } from '../../lib/logic';
import {
  allTruthFilled,
  cycleTruth,
  editableColumns,
  emptyTruthCells,
  filledCount,
  nextTruthPos,
  prettyLogic,
  rowsRight,
  setTruthCell,
  spokenLogic,
  truthKey,
  type TruthCell,
  type TruthPos,
} from '../../lib/truthTableUi';
import type { TruthTableStep } from '../../types';
import { AnswerLine, QuestionFrame, useCheckFlow, type QuestionProps } from '../QuestionFrame';
import './TruthTableGame.css';

const LIGHT_MS = 130;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const tf = (v: boolean) => (v ? 'T' : 'F');
const spoken = (v: TruthCell) => (v === null ? 'blank' : v ? 'true' : 'false');

export function TruthTableGame({ step, mode, context, onDone }: QuestionProps<TruthTableStep>) {
  const flow = useCheckFlow(mode, onDone);
  const { status } = flow;
  const rows = useMemo(() => truthRows(step.vars), [step.vars]);
  const key = useMemo(() => truthTableKey(step), [step]);
  const editable = useMemo(() => editableColumns(step.columns), [step.columns]);
  const nRows = rows.length;
  const nEdit = editable.length;
  const total = nRows * nEdit;

  const [cells, setCells] = useState<TruthCell[][]>(() => emptyTruthCells(nRows, step.columns.length));
  const [focus, setFocus] = useState<TruthPos>({ r: 0, c: 0 });
  /** Per-cell marks from the last wrong check (learn mode). They stay through Try again until that cell is edited. */
  const [marks, setMarks] = useState<(boolean | null)[][] | null>(null);
  /** Rows lit up so far in the "solved" sweep. */
  const [lit, setLit] = useState(0);
  const [announce, setAnnounce] = useState('');
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const howtoId = useId();

  const locked = status !== 'answering';
  const revealed = status === 'revealed';
  const filled = filledCount(cells, editable);
  const complete = allTruthFilled(cells, editable);
  /** Learner's mistakes, shown against the answer once it's revealed. */
  const revealMarks = useMemo(() => (revealed ? truthTableMarks(step, cells) : null), [revealed, step, cells]);

  // Solved: light the rows up one after another, with the counter ticking along.
  useEffect(() => {
    if (status !== 'correct') {
      setLit(0);
      return;
    }
    if (reducedMotion()) {
      setLit(nRows);
      return;
    }
    const timers = Array.from({ length: nRows }, (_, i) => window.setTimeout(() => setLit(i + 1), 120 + i * LIGHT_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [status, nRows]);

  const colSpoken = (c: number) => step.columns[c].label ?? spokenLogic(step.columns[c].expr);
  const rowSpoken = (r: number) => `Row ${r + 1}: ${step.vars.map((v) => `${v} ${spoken(rows[r][v])}`).join(', ')}`;

  function put(r: number, ci: number, v: TruthCell) {
    if (locked) return;
    const c = editable[ci];
    setCells((prev) => setTruthCell(prev, r, c, v));
    setMarks((prev) => (prev ? prev.map((row, ri) => row.map((m, mc) => (ri === r && mc === c ? null : m))) : prev));
    setAnnounce(`${colSpoken(c)}, row ${r + 1}: ${spoken(v)}.`);
  }

  function moveTo(pos: TruthPos) {
    setFocus(pos);
    cellRefs.current.get(`${pos.r}:${pos.c}`)?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, r: number, ci: number) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const action = truthKey(e.key, { r, c: ci }, nRows, nEdit);
    if (!action) return;
    e.preventDefault();
    if (action.kind === 'move') return moveTo(action.to);
    if (locked) return;
    if (action.kind === 'cycle') return put(r, ci, cycleTruth(cells[r][editable[ci]]));
    put(r, ci, action.value);
    if (action.advance) moveTo(nextTruthPos({ r, c: ci }, nRows, nEdit));
  }

  function check() {
    const ok = isTruthTableCorrect(step, cells);
    if (ok) {
      setMarks(null);
      setAnnounce(`All ${nRows} rows are right.`);
    } else {
      const m = truthTableMarks(step, cells);
      setMarks(m);
      const wrong = m.reduce((n, row) => n + editable.filter((c) => !row[c]).length, 0);
      setAnnounce(`${rowsRight(m)} of ${nRows} rows right. ${wrong} ${wrong === 1 ? 'cell needs' : 'cells need'} fixing.`);
    }
    flow.grade(ok);
  }

  function clearAll() {
    setCells(emptyTruthCells(nRows, step.columns.length));
    setAnnounce('Table cleared.');
    moveTo({ r: 0, c: 0 });
  }

  const shownMarks = status === 'wrong' || status === 'answering' ? marks : null;
  const right = status === 'wrong' && marks ? rowsRight(marks as boolean[][]) : 0;

  return (
    <QuestionFrame
      step={step}
      flow={flow}
      mode={mode}
      context={context}
      kind="Fill in the truth table"
      canCheck={complete}
      onCheck={check}
      checkLabel={complete ? 'Check' : `${filled}/${total} filled`}
      answer={<AnswerLine text={gameAnswerLabel(step)} />}
    >
      <div className="tt-hud">
        {status === 'correct' ? (
          <span className={`tt-stat good${lit === nRows ? ' done' : ''}`} aria-hidden>
            Rows ✓{' '}
            <strong key={lit} className={lit ? 'bump' : undefined}>
              {lit}/{nRows}
            </strong>
          </span>
        ) : status === 'wrong' && marks ? (
          <span className="tt-stat warn" aria-hidden>
            Rows right <strong>{right}/{nRows}</strong>
          </span>
        ) : (
          <span className="tt-stat" aria-hidden>
            Filled <strong>{filled}/{total}</strong>
          </span>
        )}
        {status === 'answering' && filled > 0 && (
          <button type="button" className="btn ghost small tt-clear" onClick={clearAll}>
            Clear
          </button>
        )}
        {status === 'answering' && <span className="tt-tip muted small">Tap a cell: T → F → blank</span>}
      </div>
      <div className={`tt-progress${status === 'correct' ? ' good' : ''}`} aria-hidden>
        <span style={{ width: `${(status === 'correct' ? lit / nRows : filled / total) * 100}%` }} />
      </div>

      <div className="tt-scroll" role="region" aria-label="Truth table">
        <table className={`tt-table${status === 'correct' ? ' solved' : ''}${revealed ? ' answer' : ''}`} aria-describedby={howtoId}>
          <thead>
            <tr>
              {step.vars.map((v, i) => (
                <th key={v} scope="col" className={`tt-var${i === step.vars.length - 1 ? ' last' : ''}`}>
                  {v}
                </th>
              ))}
              {step.columns.map((col, c) => {
                const pretty = prettyLogic(col.expr);
                return (
                  <th key={c} scope="col" className={`tt-head${col.given ? ' given' : ''}`} aria-label={`${colSpoken(c)}${col.given ? ' (given)' : ''}`}>
                    <span className="tt-head-main">{col.label ?? pretty}</span>
                    {col.label && col.label !== pretty && <span className="tt-head-expr">{pretty}</span>}
                    {col.given && <span className="tt-given-tag">given</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((env, r) => (
              <tr key={r} className={r < lit ? 'lit' : undefined} style={{ '--r': r } as CSSProperties}>
                {step.vars.map((v, i) => (
                  <td key={v} className={`tt-in${i === step.vars.length - 1 ? ' last' : ''}`}>
                    <span className={`tt-chip ${env[v] ? 't' : 'f'}`}>{tf(env[v])}</span>
                  </td>
                ))}
                {step.columns.map((col, c) => {
                  if (col.given) {
                    return (
                      <td key={c} className="tt-given">
                        <span className={`tt-chip ghost ${key[r][c] ? 't' : 'f'}`}>{tf(key[r][c])}</span>
                      </td>
                    );
                  }
                  const ci = editable.indexOf(c);
                  const mine = cells[r][c];
                  const m = shownMarks?.[r][c];
                  const mark = m === true ? 'right' : m === false ? 'wrong' : null;
                  const missed = revealMarks ? !revealMarks[r][c] : false;
                  const value: TruthCell = revealed ? key[r][c] : mine;
                  let cls = 'tt-cell';
                  if (value !== null) cls += value ? ' t' : ' f';
                  if (mark) cls += ` ${mark}`;
                  if (missed) cls += ' missed';
                  const label = `${rowSpoken(r)}. ${colSpoken(c)}: ${spoken(value)}${
                    mark === 'right' ? ', right' : mark === 'wrong' ? ', wrong' : missed ? `, you had ${spoken(mine)}` : ''
                  }`;
                  return (
                    <td key={c} className="tt-slot">
                      <button
                        type="button"
                        ref={(el) => {
                          const k = `${r}:${ci}`;
                          if (el) cellRefs.current.set(k, el);
                          else cellRefs.current.delete(k);
                        }}
                        className={cls}
                        tabIndex={!locked && focus.r === r && focus.c === ci ? 0 : -1}
                        aria-label={label}
                        aria-disabled={locked || undefined}
                        onFocus={() => setFocus({ r, c: ci })}
                        onClick={() => put(r, ci, cycleTruth(mine))}
                        onKeyDown={(e) => onKeyDown(e, r, ci)}
                      >
                        <span key={String(value)} className="tt-val" aria-hidden>
                          {value === null ? '' : tf(value)}
                        </span>
                        {mark && (
                          <span className={`tt-mark ${mark}`} aria-hidden>
                            {mark === 'right' ? '✓' : '✗'}
                          </span>
                        )}
                        {missed && (
                          <span className="tt-was" aria-hidden>
                            {mine === null ? '–' : tf(mine)}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {revealed && revealMarks && (
        <p className="tt-legend muted small">
          <span className="tt-legend-swatch" aria-hidden /> Cells you had wrong (your answer in the corner).
        </p>
      )}
      {status === 'correct' && lit === nRows && (
        <p className="tt-result" role="status">
          ✨ Every row checks out: {total} {total === 1 ? 'cell' : 'cells'}, all right.
        </p>
      )}

      <p id={howtoId} className="sr-only">
        Tab into the table, then use the arrow keys to move between empty cells. Press T or F to fill a cell and move down the
        column, Space to cycle through true, false and blank, and Backspace to clear.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </QuestionFrame>
  );
}
