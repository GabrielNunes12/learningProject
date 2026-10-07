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
import { Icon } from '../icons';
import { t } from '../../i18n/core';
import { useT } from '../../i18n/react';

const LIGHT_MS = 130;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
/** The one-letter cell value: T / F in English (V / F in some languages). */
const tf = (v: boolean) => (v ? t('games.truth.t') : t('games.truth.f'));
const spoken = (v: TruthCell) => (v === null ? t('games.truth.blank') : v ? t('games.truth.true') : t('games.truth.false'));

export function TruthTableGame({ step, mode, context, onDone }: QuestionProps<TruthTableStep>) {
  const { t, tx } = useT();
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
  const rowSpoken = (r: number) =>
    t('games.truth.row', { n: r + 1, values: step.vars.map((v) => t('games.truth.varValue', { name: v, value: spoken(rows[r][v]) })).join(', ') });

  function put(r: number, ci: number, v: TruthCell) {
    if (locked) return;
    const c = editable[ci];
    setCells((prev) => setTruthCell(prev, r, c, v));
    setMarks((prev) => (prev ? prev.map((row, ri) => row.map((m, mc) => (ri === r && mc === c ? null : m))) : prev));
    setAnnounce(t('games.truth.announce.set', { col: colSpoken(c), row: r + 1, value: spoken(v) }));
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
      setAnnounce(t('games.truth.announce.allRight', { count: nRows }));
    } else {
      const m = truthTableMarks(step, cells);
      setMarks(m);
      const wrong = m.reduce((n, row) => n + editable.filter((c) => !row[c]).length, 0);
      setAnnounce(
        `${t('games.truth.announce.rowsRight', { right: rowsRight(m), total: nRows })} ${t('games.truth.announce.cellsToFix', { count: wrong })}`,
      );
    }
    flow.grade(ok);
  }

  function clearAll() {
    setCells(emptyTruthCells(nRows, step.columns.length));
    setAnnounce(t('games.truth.announce.cleared'));
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
      kind={t('games.truth.kind')}
      canCheck={complete}
      onCheck={check}
      checkLabel={complete ? t('common.check') : t('games.truth.filledCount', { done: filled, total })}
      answer={<AnswerLine text={gameAnswerLabel(step)} />}
    >
      <div className="tt-hud">
        {status === 'correct' ? (
          <span className={`tt-stat good${lit === nRows ? ' done' : ''}`} aria-hidden>
            {tx('games.truth.rowsDone', {
              n: (
                <strong key={lit} className={lit ? 'bump' : undefined}>
                  {lit}/{nRows}
                </strong>
              ),
            })}
          </span>
        ) : status === 'wrong' && marks ? (
          <span className="tt-stat warn" aria-hidden>
            {tx('games.truth.rowsRightChip', {
              n: (
                <strong>
                  {right}/{nRows}
                </strong>
              ),
            })}
          </span>
        ) : (
          <span className="tt-stat" aria-hidden>
            {tx('games.truth.filledChip', {
              n: (
                <strong>
                  {filled}/{total}
                </strong>
              ),
            })}
          </span>
        )}
        {status === 'answering' && filled > 0 && (
          <button type="button" className="btn ghost small tt-clear" onClick={clearAll}>
            {t('games.common.clear')}
          </button>
        )}
        {status === 'answering' && <span className="tt-tip muted small">{t('games.truth.tapTip', { t: tf(true), f: tf(false) })}</span>}
      </div>
      <div className={`tt-progress${status === 'correct' ? ' good' : ''}`} aria-hidden>
        <span style={{ width: `${(status === 'correct' ? lit / nRows : filled / total) * 100}%` }} />
      </div>

      <div className="tt-scroll" role="region" aria-label={t('games.truth.tableLabel')}>
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
                  <th key={c} scope="col" className={`tt-head${col.given ? ' given' : ''}`} aria-label={col.given ? t('games.truth.givenLabel', { col: colSpoken(c) }) : colSpoken(c)}>
                    <span className="tt-head-main">{col.label ?? pretty}</span>
                    {col.label && col.label !== pretty && <span className="tt-head-expr">{pretty}</span>}
                    {col.given && <span className="tt-given-tag">{t('games.truth.given')}</span>}
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
                  const label = t(
                    mark === 'right'
                      ? 'games.truth.cellRight'
                      : mark === 'wrong'
                        ? 'games.truth.cellWrong'
                        : missed
                          ? 'games.truth.cellMissed'
                          : 'games.truth.cell',
                    { row: rowSpoken(r), col: colSpoken(c), value: spoken(value), mine: spoken(mine) },
                  );
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
          <span className="tt-legend-swatch" aria-hidden /> {t('games.truth.legend')}
        </p>
      )}
      {status === 'correct' && lit === nRows && (
        <p className="tt-result" role="status">
          <Icon name="sparkle" size={16} /> {t('games.truth.result', { count: total })}
        </p>
      )}

      <p id={howtoId} className="sr-only">
        {t('games.truth.howto', { t: tf(true), f: tf(false) })}
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </QuestionFrame>
  );
}
