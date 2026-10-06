// "Put these in order": drag the shuffled pieces (or nudge them with ↑/↓ and the arrow keys) into the right sequence.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { gameAnswerLabel, isOrderCorrect, orderMarks } from '../../lib/answers';
import { dragShift, dragTarget, minMoves, moveItem, scrambledOrder } from '../../lib/sortGames';
import type { OrderStep } from '../../types';
import { InlineMarkdown } from '../Markdown';
import { AnswerLine, QuestionFrame, useCheckFlow, type QuestionProps } from '../QuestionFrame';
import './OrderGame.css';
import { Icon } from '../icons';

interface Drag {
  item: number;
  pointerId: number;
  from: number;
  to: number;
  /** Resting slots of every card, list-relative, measured when the drag started. */
  tops: number[];
  heights: number[];
  /** How far neighbours slide to make room: the dragged card's height plus the gap. */
  step: number;
  /** Pointer position inside the grabbed card. */
  grab: number;
  startY: number;
  dy: number;
  moved: boolean;
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
/** Piece text without Markdown backticks, for screen-reader announcements. */
const plain = (s: string) => s.replace(/`/g, '');

export function OrderGame({ step, mode, context, onDone }: QuestionProps<OrderStep>) {
  const flow = useCheckFlow(mode, onDone);
  const { status } = flow;
  const n = step.items.length;

  const [start] = useState(() => scrambledOrder(n));
  const [order, setOrder] = useState(start);
  const [moves, setMoves] = useState(0);
  /** The arrangement at the last wrong check: its marks stay on every card that hasn't moved since. */
  const [checked, setChecked] = useState<number[] | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [answerShown, setAnswerShown] = useState(false);
  const [announce, setAnnounce] = useState('');
  const fewest = useMemo(() => minMoves(start), [start]);

  const listRef = useRef<HTMLOListElement>(null);
  const cards = useRef(new Map<number, HTMLLIElement>());
  /** Each card's resting top (offsetTop, so transforms don't count) after the last render. */
  const lastTop = useRef(new Map<number, number>());
  /** Visual offsets the cards had when a drag was dropped, so they glide from there instead of jumping. */
  const dropOffsets = useRef(new Map<number, number>());
  /** The card being nudged with keys/buttons: consecutive nudges of one card count as a single move. */
  const nudging = useRef<number | null>(null);
  const refocus = useRef<{ item: number; dir?: 'up' | 'down' } | null>(null);
  /** The drag that already ended (pointerup and lostpointercapture both fire). */
  const ended = useRef<Drag | null>(null);

  const howtoId = useId();
  const locked = status !== 'answering';
  const identity = useMemo(() => step.items.map((_, i) => i), [step.items]);
  const shown = answerShown ? identity : order;

  // Revealed (test-mode miss or "Show answer"): let the marks register for a moment, then slide into the answer.
  useEffect(() => {
    if (status !== 'revealed') return;
    const t = window.setTimeout(() => setAnswerShown(true), reducedMotion() ? 0 : 650);
    return () => window.clearTimeout(t);
  }, [status]);

  // FLIP: when cards change places, animate each from where it was to where it now rests.
  useLayoutEffect(() => {
    const animate = !drag && !reducedMotion();
    for (const [item, el] of cards.current) {
      const now = el.offsetTop;
      const before = lastTop.current.get(item);
      const extra = dropOffsets.current.get(item) ?? 0;
      lastTop.current.set(item, now);
      if (!animate || before === undefined) continue;
      const from = before + extra - now;
      if (Math.abs(from) < 1) continue;
      el.getAnimations?.().forEach((a) => a.cancel());
      el.animate?.([{ transform: `translateY(${from}px)` }, { transform: 'translateY(0)' }], {
        duration: 280,
        easing: 'cubic-bezier(.2,.9,.25,1.15)',
      });
    }
    dropOffsets.current.clear();

    const f = refocus.current;
    if (f) {
      refocus.current = null;
      const el = cards.current.get(f.item);
      const btn = f.dir ? el?.querySelector<HTMLButtonElement>(`button[data-dir="${f.dir}"]`) : null;
      (btn && !btn.disabled ? btn : el)?.focus();
    }
  });

  function commit(next: number[], item: number, to: number) {
    setOrder(next);
    setAnnounce(`${plain(step.items[item])}: now position ${to + 1} of ${n}.`);
  }

  function nudge(item: number, pos: number, to: number, dir?: 'up' | 'down') {
    if (locked) return;
    const target = Math.max(0, Math.min(n - 1, to));
    if (target === pos) return;
    if (nudging.current !== item) {
      setMoves((m) => m + 1);
      nudging.current = item;
    }
    refocus.current = { item, dir };
    commit(moveItem(order, pos, target), item, target);
  }

  function onKeyDown(e: KeyboardEvent<HTMLLIElement>, item: number, pos: number) {
    if (e.target !== e.currentTarget) return;
    const to =
      e.key === 'ArrowUp' ? pos - 1 : e.key === 'ArrowDown' ? pos + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
    if (to === null) return;
    e.preventDefault();
    nudge(item, pos, to);
  }

  function onPointerDown(e: PointerEvent<HTMLLIElement>, item: number, pos: number) {
    if (locked || drag || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    // On touch, only the handle drags, so swiping over the cards still scrolls the page.
    if (e.pointerType !== 'mouse' && !target.closest('.og-handle')) return;
    const els = order.map((i) => cards.current.get(i)!);
    const tops = els.map((el) => el.offsetTop);
    const heights = els.map((el) => el.offsetHeight);
    const gap = n > 1 ? tops[1] - tops[0] - heights[0] : 0;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const listTop = listRef.current!.getBoundingClientRect().top;
    setDrag({
      item,
      pointerId: e.pointerId,
      from: pos,
      to: pos,
      tops,
      heights,
      step: heights[pos] + gap,
      grab: e.clientY - listTop - tops[pos],
      startY: e.clientY,
      dy: 0,
      moved: false,
    });
  }

  function onPointerMove(e: PointerEvent<HTMLLIElement>) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.abs(e.clientY - drag.startY) < 4) return;
    const list = listRef.current!;
    const last = drag.tops.length - 1;
    const min = -drag.heights[drag.from] / 2;
    const max = drag.tops[last] + drag.heights[last] - drag.heights[drag.from] / 2;
    const top = Math.max(min, Math.min(max, e.clientY - list.getBoundingClientRect().top - drag.grab));
    setDrag({ ...drag, dy: top - drag.tops[drag.from], to: dragTarget(drag.tops, drag.heights, drag.from, top), moved: true });
    // Keep the drop target reachable on small screens (the bottom bar covers the last ~100px).
    if (e.clientY < 80) window.scrollBy(0, -14);
    else if (e.clientY > window.innerHeight - 120) window.scrollBy(0, 14);
  }

  function endDrag(e: PointerEvent<HTMLLIElement>, drop: boolean) {
    if (!drag || e.pointerId !== drag.pointerId || ended.current === drag) return;
    ended.current = drag;
    const { item, from, to, dy, moved, step: size } = drag;
    // Remember where everything is on screen right now; the FLIP pass glides each card home from there.
    order.forEach((it, i) => dropOffsets.current.set(it, it === item ? dy : dragShift(i, from, to, size)));
    setDrag(null);
    nudging.current = null;
    if (drop && moved && to !== from) {
      setMoves((m) => m + 1);
      commit(moveItem(order, from, to), item, to);
    }
  }

  function check() {
    const ok = isOrderCorrect(step, order);
    setChecked(ok ? null : order);
    if (!ok) {
      const right = orderMarks(step, order).filter(Boolean).length;
      setAnnounce(`${right} of ${n} pieces are in the right place.`);
    }
    flow.grade(ok);
  }

  // Which mark each slot shows: right/wrong from the last check, only while that card hasn't moved.
  const markAt = (pos: number, item: number): 'right' | 'wrong' | null => {
    if (status === 'correct') return 'right';
    if (answerShown) return null;
    if (!checked || checked[pos] !== item) return null;
    return item === pos ? 'right' : 'wrong';
  };
  const inPlace = checked ? orderMarks(step, checked).filter(Boolean).length : 0;

  return (
    <QuestionFrame
      step={step}
      flow={flow}
      mode={mode}
      context={context}
      kind="Put these in order"
      canCheck={!drag}
      onCheck={check}
      onRetry={() => (nudging.current = null)}
      answer={<AnswerLine text={gameAnswerLabel(step)} />}
    >
      <div className="og-bar">
        <span className="og-chip" aria-label={`${moves} moves`}>
          Moves <strong>{moves}</strong>
        </span>
        {checked && status !== 'correct' && !answerShown && (
          <span className="og-chip og-score">
            {inPlace}/{n} in place
          </span>
        )}
        {status === 'answering' && <span className="og-tip muted small">Drag the ⠿ handle, or use ↑ ↓</span>}
      </div>

      <ol
        ref={listRef}
        className={`og-list${drag?.moved ? ' dragging' : ''}${status === 'correct' ? ' solved' : ''}${answerShown ? ' answer' : ''}`}
        aria-label="Pieces in your order"
        aria-describedby={howtoId}
      >
        {shown.map((item, pos) => {
          const mark = markAt(pos, item);
          const isDragged = drag?.item === item;
          const shift = drag?.moved && !isDragged ? dragShift(pos, drag.from, drag.to, drag.step) : 0;
          const transform = isDragged && drag.moved ? `translateY(${drag.dy}px) scale(1.02)` : shift ? `translateY(${shift}px)` : undefined;
          let cls = 'og-card';
          if (isDragged && drag.moved) cls += ' lifted';
          if (mark) cls += ` ${mark}`;
          if (locked) cls += ' locked';
          return (
            <li
              key={item}
              ref={(el) => {
                if (el) cards.current.set(item, el);
                else cards.current.delete(item);
              }}
              className={cls}
              style={{ transform, '--i': pos } as CSSProperties}
              tabIndex={locked ? -1 : 0}
              aria-label={`Position ${pos + 1}: ${plain(step.items[item])}${mark === 'right' ? ', in place' : mark === 'wrong' ? ', in the wrong place' : ''}`}
              onKeyDown={(e) => onKeyDown(e, item, pos)}
              onPointerDown={(e) => onPointerDown(e, item, pos)}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => endDrag(e, true)}
              onPointerCancel={(e) => endDrag(e, false)}
              onLostPointerCapture={(e) => endDrag(e, false)}
            >
              <span className="og-handle" aria-hidden>
                <svg viewBox="0 0 10 16" width="10" height="16">
                  {[3, 8, 13].flatMap((y) => [<circle key={`a${y}`} cx="2.5" cy={y} r="1.5" />, <circle key={`b${y}`} cx="7.5" cy={y} r="1.5" />])}
                </svg>
              </span>
              <span className="og-pos" aria-hidden>
                {status === 'correct' ? '✓' : pos + 1}
              </span>
              <span className="og-body">
                <InlineMarkdown text={step.items[item]} />
                {mark && status !== 'correct' && (
                  <span className={`og-mark ${mark}`} aria-hidden>
                    {mark === 'right' ? '✓ in place' : '✗ wrong spot'}
                  </span>
                )}
              </span>
              {!locked && (
                <span className="og-nudges">
                  <button
                    type="button"
                    className="og-nudge"
                    data-dir="up"
                    tabIndex={-1}
                    aria-label={`Move “${plain(step.items[item])}” up`}
                    disabled={pos === 0}
                    onClick={() => nudge(item, pos, pos - 1, 'up')}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="og-nudge"
                    data-dir="down"
                    tabIndex={-1}
                    aria-label={`Move “${plain(step.items[item])}” down`}
                    disabled={pos === n - 1}
                    onClick={() => nudge(item, pos, pos + 1, 'down')}
                  >
                    ↓
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <p id={howtoId} className="sr-only">
        Focus a piece and press the up or down arrow key to move it, Home or End to send it to the top or bottom.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {status === 'correct' && (
        <p className="og-result" role="status">
          {moves <= fewest ? (
            <>
              <Icon name="target" size={16} /> Sorted in <strong>{moves}</strong> {moves === 1 ? 'move' : 'moves'}: the fewest possible!
            </>
          ) : (
            <>
              Sorted in <strong>{moves}</strong> moves. The fewest possible was {fewest}.
            </>
          )}
        </p>
      )}
    </QuestionFrame>
  );
}
