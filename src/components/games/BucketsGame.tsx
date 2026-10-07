// "Sort the cards": deal a shuffled deck one card at a time; drag the card onto a bucket, tap a bucket, or press 1–4.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { gameAnswerLabel, isRightBucket } from '../../lib/answers';
import { formatClock, hitTest, isCleanRun, shuffledIndexes } from '../../lib/sortGames';
import type { BucketsStep } from '../../types';
import { InlineMarkdown } from '../Markdown';
import { AnswerLine, QuestionFrame, useCheckFlow, type QuestionProps } from '../QuestionFrame';
import './BucketsGame.css';
import { Icon } from '../icons';
import { useT } from '../../i18n/react';

interface Drag {
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  moved: boolean;
  /** Bucket under the pointer, or -1. */
  over: number;
}

interface Fly {
  item: number;
  bucket: number;
  x: number;
  y: number;
}

/** One placed card: which item, and whether it took a miss to get there. */
interface Placed {
  item: number;
  missed: boolean;
}

const FLY_MS = 340;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const plain = (s: string) => s.replace(/`/g, '');

export function BucketsGame({ step, mode, context, onDone }: QuestionProps<BucketsStep>) {
  const { t, tx } = useT();
  const flow = useCheckFlow(mode, onDone);
  const { status } = flow;
  const total = step.items.length;
  const nb = step.buckets.length;

  const [deck, setDeck] = useState(() => shuffledIndexes(total));
  const [pos, setPos] = useState(0);
  const [placed, setPlaced] = useState<Placed[][]>(() => step.buckets.map(() => []));
  const [misses, setMisses] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [fly, setFly] = useState<Fly | null>(null);
  /** Retriggers the card's shake and a bucket's red flash / green pulse (the counter changes the element key). */
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState<{ bucket: number; tone: 'bad' | 'good'; n: number } | null>(null);
  const [announce, setAnnounce] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const bucketRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const busy = useRef(false);
  const missesRef = useRef(0);
  const graded = useRef(false);
  const timers = useRef<number[]>([]);

  const done = pos >= total;
  const locked = status !== 'answering';
  const current = done ? null : deck[pos];
  const elapsed = (finishedAt ?? now) - startedAt;

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Live timer while the deck is being sorted.
  useEffect(() => {
    if (finishedAt !== null) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [finishedAt, startedAt]);

  function finish() {
    if (graded.current) return;
    graded.current = true;
    flow.grade(isCleanRun(total, total, missesRef.current));
  }

  /** Send the current card into `bucket`; `missed` marks a test-mode miss that was put in the right bucket for you. */
  function flyTo(item: number, bucket: number, missed: boolean, from: Drag | null) {
    busy.current = true;
    const card = cardRef.current?.getBoundingClientRect();
    const target = bucketRefs.current[bucket]?.getBoundingClientRect();
    const x = card && target ? (from?.dx ?? 0) + target.left + target.width / 2 - (card.left + card.width / 2) : 0;
    const y = card && target ? (from?.dy ?? 0) + target.top + target.height / 2 - (card.top + card.height / 2) : 0;
    setFly({ item, bucket, x, y });
    later(() => {
      setPlaced((p) => p.map((list, bi) => (bi === bucket ? [...list, { item, missed }] : list)));
      setFly(null);
      setFlash((f) => ({ bucket, tone: missed ? 'bad' : 'good', n: (f?.n ?? 0) + 1 }));
      const next = pos + 1;
      setPos(next);
      busy.current = false;
      if (next >= total) {
        setFinishedAt(Date.now());
        later(finish, reducedMotion() ? 0 : 450);
      }
    }, reducedMotion() ? 0 : FLY_MS);
  }

  function place(bucket: number, from: Drag | null = null) {
    if (locked || busy.current || current === null || bucket < 0 || bucket >= nb) return;
    const item = current;
    const text = plain(step.items[item].text);
    const nextText =
      pos + 1 < total ? t('games.buckets.announce.next', { text: plain(step.items[deck[pos + 1]].text) }) : t('games.buckets.announce.last');
    if (isRightBucket(step, item, bucket)) {
      setAnnounce(`${t('games.buckets.announce.right', { text, bucket: step.buckets[bucket] })} ${nextText}`);
      flyTo(item, bucket, false, from);
      return;
    }
    missesRef.current += 1;
    setMisses(missesRef.current);
    setFlash((f) => ({ bucket, tone: 'bad', n: (f?.n ?? 0) + 1 }));
    if (mode === 'test') {
      // One attempt per card: it goes where it belongs, marked as a miss, and the deck moves on.
      const right = step.items[item].bucket;
      setAnnounce(`${t('games.buckets.announce.miss', { text, bucket: step.buckets[right] })} ${nextText}`);
      flyTo(item, right, true, from);
    } else {
      setShake((s) => s + 1);
      setAnnounce(t('games.buckets.announce.tryAnother', { bucket: step.buckets[bucket], text }));
    }
  }

  // Keys 1–4 drop the card into that bucket (Enter is handled by the frame).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !/^[1-4]$/.test(e.key)) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const b = Number(e.key) - 1;
      if (b < nb) {
        e.preventDefault();
        place(b);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (locked || busy.current || current === null || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, moved: false, over: -1 });
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    const boxes = bucketRefs.current.map((el) => {
      const r = el?.getBoundingClientRect();
      return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : { left: 0, top: 0, width: 0, height: 0 };
    });
    setDrag({ ...drag, dx, dy, moved: true, over: hitTest(boxes, e.clientX, e.clientY) });
    // The buckets may sit below the fold on a phone: scroll toward them while dragging near the bottom.
    if (e.clientY > window.innerHeight - 120) window.scrollBy(0, 14);
    else if (e.clientY < 80) window.scrollBy(0, -14);
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    setDrag(null);
    if (!cancelled && d.moved && d.over >= 0) place(d.over, d);
  }

  function retry() {
    const fresh = shuffledIndexes(total);
    setDeck(fresh);
    setPos(0);
    setPlaced(step.buckets.map(() => []));
    setMisses(0);
    missesRef.current = 0;
    graded.current = false;
    const at = Date.now();
    setStartedAt(at);
    setNow(at);
    setFinishedAt(null);
    setFlash(null);
    setAnnounce(t('games.buckets.announce.newDeck', { text: plain(step.items[fresh[0]].text) }));
  }

  // The card's transform: following the pointer, flying into a bucket, or resting.
  let cardStyle: CSSProperties | undefined;
  let cardCls = 'bg-card';
  if (fly) {
    cardStyle = { transform: `translate(${fly.x}px, ${fly.y}px) scale(0.18) rotate(${fly.x > 0 ? 8 : -8}deg)`, opacity: 0 };
    cardCls += ' flying';
  } else if (drag?.moved) {
    cardStyle = { transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(${Math.max(-6, Math.min(6, drag.dx / 25))}deg) scale(1.04)` };
    cardCls += ' dragging';
  }

  const remaining = total - pos;

  return (
    <QuestionFrame
      step={step}
      flow={flow}
      mode={mode}
      context={context}
      kind={t('games.buckets.kind')}
      canCheck={done && finishedAt !== null && !graded.current}
      onCheck={finish}
      onRetry={retry}
      checkLabel={done ? t('games.buckets.finish') : t('games.buckets.sortedCount', { done: pos, total })}
      answer={<AnswerLine text={gameAnswerLabel(step)} />}
    >
      <div className="bg-hud" aria-hidden>
        <span className="bg-stat">{tx('games.buckets.cardOf', { n: <strong>{Math.min(pos + 1, total)}</strong>, total })}</span>
        <span className={`bg-stat${misses ? ' bad' : ''}`}>
          {tx('games.buckets.misses', {
            misses: (
              <strong key={misses} className={misses ? 'bump' : undefined}>
                {misses}
              </strong>
            ),
          })}
        </span>
        <span className="bg-stat bg-clock">
          <Icon name="clock" size={14} /> {formatClock(elapsed)}
        </span>
      </div>
      <div className="bg-progress" role="progressbar" aria-label={t('games.buckets.cardsSorted')} aria-valuemin={0} aria-valuemax={total} aria-valuenow={pos}>
        <span style={{ width: `${(pos / total) * 100}%` }} />
      </div>

      <div className="bg-stage">
        {current !== null ? (
          <div className="bg-deck" data-left={Math.min(remaining - 1, 2)}>
            <div
              key={current}
              ref={cardRef}
              className={cardCls}
              style={cardStyle}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => onPointerUp(e, false)}
              onPointerCancel={(e) => onPointerUp(e, true)}
              aria-label={t('games.buckets.cardLabel', { n: pos + 1, total, text: plain(step.items[current].text) })}
              role="group"
            >
              <div key={`${current}-${shake}`} className={`bg-face${shake && !fly ? ' shake' : ''}`}>
                <span className="bg-face-text">
                  <InlineMarkdown text={step.items[current].text} />
                </span>
                {!locked && <span className="bg-face-tip">{t('games.buckets.dragMe')}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className={`bg-done${misses ? ' missed' : ''}`} role="status">
            <strong>{misses ? t('games.buckets.deckSorted') : t('games.buckets.cleanSweep')}</strong>
            <span>
              {t('games.buckets.doneStats', {
                cards: t('games.buckets.cards', { count: total }),
                misses: t('games.buckets.missCount', { count: misses }),
                time: formatClock(elapsed),
              })}
            </span>
            {misses > 0 && mode === 'learn' && status !== 'revealed' && <span className="small">{t('games.buckets.perfectRun')}</span>}
          </div>
        )}
      </div>

      <div className={`bg-buckets n${nb}`}>
        {step.buckets.map((label, bi) => {
          const list = placed[bi];
          let cls = 'bg-bucket';
          if (drag?.moved && drag.over === bi) cls += ' over';
          // Alternating animation names restart the flash without remounting (and unfocusing) the button.
          if (flash?.bucket === bi) cls += ` flash-${flash.tone} f${flash.n % 2}`;
          return (
            <button
              key={bi}
              ref={(el) => {
                bucketRefs.current[bi] = el;
              }}
              type="button"
              className={cls}
              disabled={locked || current === null}
              onClick={() => place(bi)}
              aria-label={t('games.buckets.bucketLabel', { n: bi + 1, label: plain(label), count: list.length })}
            >
              <span className="bg-bucket-head">
                <span className="choice-key" aria-hidden>
                  {bi + 1}
                </span>
                <span className="bg-bucket-label">
                  <InlineMarkdown text={label} />
                </span>
                <span key={list.length} className={`bg-count${list.length ? ' bump' : ''}`} aria-hidden>
                  {list.length}
                </span>
              </span>
              {list.length > 0 && (
                <span className="bg-stack" aria-hidden>
                  {list.map((p) => (
                    <span key={p.item} className={`bg-chip${p.missed ? ' missed' : ''}`}>
                      <InlineMarkdown text={step.items[p.item].text} />
                    </span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {status === 'answering' && !done && (
        <p className="muted small bg-howto">{t('games.buckets.howto', { max: nb })}</p>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </QuestionFrame>
  );
}
