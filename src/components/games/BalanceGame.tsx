// "Balance the equation": a·x + b = c·x + d sits on a balance scale. Pick a move (+ − × ÷ an amount), do it to both
// sides, and keep going until x stands alone. Solved within par (the fewest moves possible) counts as first-try right.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { gameAnswerLabel } from '../../lib/answers';
import {
  applyMove,
  describeMove,
  formatEquation,
  formatSide,
  isSolved,
  moveAmount,
  panGroups,
  previewMove,
  quickAmounts,
  shortMove,
  solve,
  solvedSide,
  solvedValue,
  starsFor,
  type Equation,
  type Move,
  type Op,
  type PanGroup,
  type Side,
} from '../../lib/balance';
import type { BalanceStep } from '../../types';
import { AnswerLine, QuestionFrame, useCheckFlow, type QuestionProps } from '../QuestionFrame';
import './BalanceGame.css';

interface Entry {
  eq: Equation;
  /** The move that led here (null for the starting equation). */
  move: Move | null;
}

const OPS: { op: Op; sym: string; name: string }[] = [
  { op: '+', sym: '+', name: 'Add' },
  { op: '-', sym: '−', name: 'Subtract' },
  { op: '*', sym: '×', name: 'Multiply' },
  { op: '/', sym: '÷', name: 'Divide' },
];
const KEY_OPS: Record<string, Op> = { '+': '+', '-': '-', '*': '*', '/': '/' };
const MAX_AMOUNT = 99;
const SETTLE_MS = 650;
const REPLAY_MS = 900;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
/** A typed amount as a whole number, or NaN. Accepts a real minus sign too. */
const parseAmount = (s: string) => {
  const t = s.trim().replace('−', '-');
  return /^-?\d{1,3}$/.test(t) ? Number(t) : NaN;
};
const isAddSub = (op: Op) => op === '+' || op === '-';

/** A pan's load in words, for screen readers: "2 x-tiles and 3 one-weights", "4 minus-one balloons", "empty". */
function describePan(side: Side, v: string) {
  const parts = panGroups(side).map((g) => {
    const what = g.kind === 'x' ? `${v}-tile` : 'one-weight';
    if (g.negative) return `${g.count} minus-${g.kind === 'x' ? v : 'one'} balloon${g.count === 1 ? '' : 's'}`;
    return `${g.count} ${what}${g.count === 1 ? '' : 's'}`;
  });
  return parts.length ? parts.join(' and ') : 'empty';
}

function Piece({ group, v, hero, index }: { group: PanGroup; v: string; hero: boolean; index: number }) {
  const label = group.kind === 'x' ? (group.negative ? `−${v}` : v) : group.negative ? '−1' : '1';
  const cls = `bal-piece ${group.kind}${group.negative ? ' neg' : ''}${hero ? ' hero' : ''}`;
  return (
    <span className={cls} style={{ '--i': index } as CSSProperties}>
      <span className="bal-piece-label">{label}</span>
    </span>
  );
}

function Pan({ side, v, which, hero }: { side: Side; v: string; which: 'left' | 'right'; hero: boolean }) {
  const groups = panGroups(side);
  const pieces = groups.reduce((n, g) => n + (g.stacked ? 1 : g.count), 0);
  return (
    <div className={`bal-pan ${which}`}>
      <svg className="bal-strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line x1="50" y1="0" x2="3" y2="100" vectorEffect="non-scaling-stroke" />
        <line x1="50" y1="0" x2="97" y2="100" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className={`bal-load${pieces > 10 ? ' dense' : ''}`} aria-hidden>
        {groups.length === 0 && <span className="bal-empty">0</span>}
        {groups.map((g) =>
          g.stacked ? (
            <span key={`${g.kind}${g.negative}s`} className="bal-stack">
              <Piece group={g} v={v} hero={false} index={0} />
              <b>×{g.count}</b>
            </span>
          ) : (
            Array.from({ length: g.count }, (_, i) => (
              <Piece key={`${g.kind}${g.negative}${i}`} group={g} v={v} hero={hero && g.kind === 'x'} index={i} />
            ))
          ),
        )}
      </div>
      <div className="bal-dish" aria-hidden />
    </div>
  );
}

export function BalanceGame({ step, mode, context, onDone }: QuestionProps<BalanceStep>) {
  const flow = useCheckFlow(mode, onDone);
  const { status } = flow;
  const v = step.variable ?? 'x';
  const start = useMemo<Equation>(() => ({ left: step.left, right: step.right }), [step.left, step.right]);
  const solution = useMemo(() => solve(start) ?? [], [start]);
  const par = solution.length;
  /** The optimal solution as equations, from the start. */
  const howSteps = useMemo(() => {
    const steps: Entry[] = [{ eq: start, move: null }];
    for (const m of solution) {
      const r = applyMove(steps[steps.length - 1].eq, m, v);
      if (r.ok) steps.push({ eq: r.eq, move: m });
    }
    return steps;
  }, [start, solution, v]);

  const [history, setHistory] = useState<Entry[]>(() => [{ eq: start, move: null }]);
  const [moves, setMoves] = useState(0);
  const [op, setOp] = useState<Op>('-');
  const [amountText, setAmountText] = useState('1');
  const [useX, setUseX] = useState(false);
  const [wobble, setWobble] = useState(0);
  const [shake, setShake] = useState(0);
  const [announce, setAnnounce] = useState('');
  const [replaying, setReplaying] = useState(false);
  /** Moves used when the learner solved it themselves (null until then). */
  const [solvedIn, setSolvedIn] = useState<number | null>(null);

  const graded = useRef(false);
  /** Solved over par: graded as a miss first, then as "Got it!" once the frame has recorded the miss. */
  const settleAsGotIt = useRef(false);
  const timers = useRef<number[]>([]);
  const opRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const padId = useId();
  const previewId = useId();

  const current = history[history.length - 1].eq;
  const solved = isSolved(current);
  const locked = status !== 'answering' || solved || replaying;
  const k = parseAmount(amountText);
  const move: Move = { op, k, x: isAddSub(op) && useX };
  const result = Number.isNaN(k) ? null : applyMove(current, move, v);
  const quick = useMemo(() => quickAmounts(current, op), [current, op]);
  const xSide = solvedSide(current);
  const value = solvedValue(current);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // The frame has no "solved, but not first try" grade: record the miss, then mark it solved before paint.
  useLayoutEffect(() => {
    if (settleAsGotIt.current && (status === 'wrong' || status === 'revealed')) {
      settleAsGotIt.current = false;
      flow.grade(true);
    }
  });

  function finish(used: number) {
    if (graded.current) return;
    graded.current = true;
    const ok = used <= par;
    if (!ok) settleAsGotIt.current = true;
    flow.grade(ok);
  }

  function apply() {
    if (locked) return;
    if (!result || !result.ok) {
      setShake((s) => s + 1);
      setAnnounce(result ? result.reason : 'Type a whole number for the amount.');
      return;
    }
    const next = result.eq;
    const used = moves + 1;
    setHistory((h) => [...h, { eq: next, move }]);
    setMoves(used);
    setWobble((w) => w + 1);
    if (isSolved(next)) {
      setSolvedIn(used);
      setAnnounce(`${describeMove(move, v)}. ${formatEquation(next, v)}. Solved: ${v} = ${solvedValue(next)}, in ${used} ${used === 1 ? 'move' : 'moves'}.`);
      later(() => finish(used), reducedMotion() ? 0 : SETTLE_MS);
    } else {
      setAnnounce(`${describeMove(move, v)}. Now ${formatEquation(next, v)}.`);
    }
  }

  function undo() {
    if (locked || history.length < 2) return;
    const prev = history[history.length - 2].eq;
    setHistory((h) => h.slice(0, -1));
    setWobble((w) => w + 1);
    setAnnounce(`Undone. Back to ${formatEquation(prev, v)}.`);
  }

  function restart() {
    if (locked || history.length < 2) return;
    setHistory([{ eq: start, move: null }]);
    setWobble((w) => w + 1);
    setAnnounce(`Back to the start: ${formatEquation(start, v)}.`);
  }

  // "Show me how": give up, then replay an optimal solution on the scale from the start.
  function showHow() {
    if (status !== 'answering' || solved) return;
    flow.reveal();
    const steps = howSteps;
    if (reducedMotion()) {
      setHistory(steps);
      return;
    }
    setReplaying(true);
    setHistory(steps.slice(0, 1));
    setWobble((w) => w + 1);
    steps.slice(1).forEach((_, i) => {
      later(() => {
        setHistory(steps.slice(0, i + 2));
        setWobble((w) => w + 1);
        if (i === steps.length - 2) setReplaying(false);
      }, REPLAY_MS * (i + 1));
    });
  }

  function chooseOp(next: Op, focus = false) {
    setOp(next);
    if (!isAddSub(next)) setUseX(false);
    if (focus) opRefs.current[OPS.findIndex((o) => o.op === next)]?.focus();
  }

  function onOpsKey(e: KeyboardEvent<HTMLDivElement>) {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = OPS.findIndex((o) => o.op === op);
    chooseOp(OPS[(i + dir + OPS.length) % OPS.length].op, true);
  }

  function nudgeAmount(d: number) {
    let n = (Number.isNaN(k) ? 0 : k) + d;
    if (n === 0) n += d;
    if (isAddSub(op) && n < 1) n = 1;
    n = Math.max(-MAX_AMOUNT, Math.min(MAX_AMOUNT, n));
    setAmountText(String(n));
  }

  function pick(m: Move) {
    setAmountText(String(m.k));
    setUseX(!!m.x);
  }

  // Enter does the move (or continues once finished); + − * / pick the operation; the variable's key toggles x-terms.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (e.key === 'Enter') {
        // Pad controls (operation, amount, quick picks) apply the move on Enter; other buttons keep their own click.
        const padControl = t instanceof HTMLElement && t.closest('[data-enter-applies]');
        if (!padControl && (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement || t instanceof HTMLTextAreaElement)) return;
        e.preventDefault();
        if (flow.finished) flow.done();
        else apply();
        return;
      }
      if (locked || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      const nextOp = KEY_OPS[e.key];
      if (nextOp) {
        e.preventDefault();
        chooseOp(nextOp);
      } else if (e.key.toLowerCase() === v.toLowerCase() && isAddSub(op)) {
        e.preventDefault();
        setUseX((x) => !x);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stars = solvedIn !== null ? starsFor(solvedIn, par) : 0;
  const finishedHere = solved && solvedIn !== null;
  const showAnswer = status === 'revealed' && solvedIn === null;
  let scaleCls = 'bal-scale';
  if (wobble) scaleCls += ` wob${wobble % 2}`;
  if (solved) scaleCls += ' solved';
  const dir = wobble % 2 ? 1 : -1;

  return (
    <QuestionFrame
      step={step}
      flow={flow}
      mode={mode}
      context={context}
      kind="Balance the equation"
      canCheck={false}
      onCheck={() => {}}
      enterKey={false}
      checkLabel={solved ? 'Solved!' : 'Solve it to continue'}
      answer={
        <>
          <AnswerLine text={gameAnswerLabel(step)} />
          <ol className="bal-howto">
            {howSteps.map((h, i) => (
              <li key={i}>
                {h.move && <span className="bal-howto-move">{describeMove(h.move, v)}</span>}
                <span className="bal-howto-eq">{formatEquation(h.eq, v)}</span>
              </li>
            ))}
          </ol>
        </>
      }
    >
      <div className="bal-bar">
        <span className="bal-chip">
          Moves <strong key={moves} className={moves ? 'bal-bump' : undefined}>{moves}</strong>
        </span>
        <span className="bal-chip">
          Par <strong>{par}</strong> {par === 1 ? 'move' : 'moves'}
        </span>
        {finishedHere && (
          <span className="bal-stars" role="img" aria-label={`${stars} of 3 stars`}>
            {[1, 2, 3].map((s) => (
              <span key={s} className={s <= stars ? 'on' : undefined} style={{ '--i': s } as CSSProperties}>
                ★
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="bal-main">
        <div className="bal-board">
          <figure
            className={scaleCls}
            style={{ '--dir': dir } as CSSProperties}
            aria-label={`Balance scale, level. Left pan: ${describePan(current.left, v)}. Right pan: ${describePan(current.right, v)}.`}
          >
            <div className="bal-beam" aria-hidden>
              <span className="bal-pivot" />
            </div>
            <div className="bal-pans">
              <Pan side={current.left} v={v} which="left" hero={solved && xSide === 'left'} />
              <div className="bal-post" aria-hidden />
              <Pan side={current.right} v={v} which="right" hero={solved && xSide === 'right'} />
            </div>
            <div className="bal-base" aria-hidden />
            {solved && value !== null && (
              <span className="bal-badge" aria-hidden>
                {v} = {value}
              </span>
            )}
          </figure>

          <p className={`bal-eq${solved ? ' solved' : ''}`}>
            <span>{formatSide(current.left, v)}</span>
            <span className="bal-eq-sign">=</span>
            <span>{formatSide(current.right, v)}</span>
          </p>

          {history.length > 1 && (
            <ol className="bal-history" aria-label="Your steps">
              {history.map((h, i) => (
                <li key={i} className={i === history.length - 1 ? 'last' : undefined}>
                  {h.move && (
                    <>
                      <span className="bal-arrow" title={describeMove(h.move, v)} aria-hidden>
                        <small>{shortMove(h.move, v)}</small>→
                      </span>
                      <span className="sr-only">then {describeMove(h.move, v)}: </span>
                    </>
                  )}
                  <span className="bal-hist-eq">{formatEquation(h.eq, v)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {!solved && !showAnswer && (
          <div className="bal-pad" role="group" aria-labelledby={padId}>
            <span id={padId} className="eyebrow">
              Do the same to both sides
            </span>

            <div className="bal-ops" role="radiogroup" aria-label="Operation" onKeyDown={onOpsKey} data-enter-applies>
              {OPS.map((o, i) => (
                <button
                  key={o.op}
                  ref={(el) => {
                    opRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={op === o.op}
                  aria-label={o.name}
                  tabIndex={op === o.op ? 0 : -1}
                  className={`bal-op${op === o.op ? ' on' : ''}`}
                  disabled={locked}
                  onClick={() => chooseOp(o.op)}
                >
                  {o.sym}
                </button>
              ))}
            </div>

            <div className="bal-amount" data-enter-applies>
              <button type="button" className="bal-step" aria-label="Smaller amount" disabled={locked} onClick={() => nudgeAmount(-1)}>
                −
              </button>
              <label className="bal-input">
                <span className="sr-only">Amount</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={amountText}
                  disabled={locked}
                  aria-describedby={previewId}
                  onChange={(e) => setAmountText(e.target.value.replace(/[^\d\-−]/g, '').slice(0, 4))}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      nudgeAmount(e.key === 'ArrowUp' ? 1 : -1);
                    }
                  }}
                />
                {isAddSub(op) && useX && <span className="bal-input-x" aria-hidden>{v}</span>}
              </label>
              <button type="button" className="bal-step" aria-label="Bigger amount" disabled={locked} onClick={() => nudgeAmount(1)}>
                +
              </button>
              {isAddSub(op) && (
                <button
                  type="button"
                  className={`bal-xtoggle${useX ? ' on' : ''}`}
                  aria-pressed={useX}
                  aria-label={`Amount is ${v}-terms`}
                  title={`Use ${v}-terms (key ${v})`}
                  disabled={locked}
                  onClick={() => setUseX((x) => !x)}
                >
                  {v}
                </button>
              )}
            </div>

            {quick.length > 0 && (
              <div className="bal-quick" role="group" aria-label="Quick amounts from the scale" data-enter-applies>
                {quick.map((m) => {
                  const on = m.k === k && !!m.x === move.x;
                  return (
                    <button
                      key={`${m.k}${m.x ? 'x' : ''}`}
                      type="button"
                      className={`bal-qchip${on ? ' on' : ''}`}
                      aria-pressed={on}
                      disabled={locked}
                      onClick={() => pick(m)}
                    >
                      {moveAmount(m, v)}
                    </button>
                  );
                })}
              </div>
            )}

            <div
              key={shake}
              id={previewId}
              className={`bal-preview${result && !result.ok ? ' refused' : ''}${shake ? ' shake' : ''}`}
            >
              {!result ? (
                <span className="muted">Type a whole number for the amount.</span>
              ) : result.ok ? (
                <>
                  <span className="bal-preview-move">{describeMove(move, v)}</span>
                  <span className="bal-preview-work">{previewMove(current, move, v)}</span>
                  <span className="bal-preview-next">→ {formatEquation(result.eq, v)}</span>
                </>
              ) : (
                <span>{result.reason}</span>
              )}
            </div>

            <button type="button" className={`btn primary full bal-do${result?.ok ? '' : ' soft'}`} disabled={locked} onClick={apply}>
              Do it to both sides
            </button>

            <div className="bal-actions">
              <button type="button" className="btn small" disabled={locked || history.length < 2} onClick={undo}>
                ↶ Undo
              </button>
              <button type="button" className="btn small" disabled={locked || history.length < 2} onClick={restart}>
                Restart
              </button>
              <button type="button" className="btn ghost small bal-how" disabled={locked} onClick={showHow}>
                Show me how
              </button>
            </div>
            <p className="muted small bal-tip">Every move counts, even ones you undo. Enter does the move.</p>
          </div>
        )}
      </div>

      {finishedHere && (
        <p className="bal-result" role="status">
          {solvedIn! <= par ? (
            <>
              ⚖️ {v} = {value} in <strong>{solvedIn}</strong> {solvedIn === 1 ? 'move' : 'moves'}: right on par!
            </>
          ) : (
            <>
              {v} = {value} in <strong>{solvedIn}</strong> moves. Par is {par}: can you see the shortcut?
            </>
          )}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </QuestionFrame>
  );
}
