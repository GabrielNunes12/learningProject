// Dice / coin simulator: roll in batches and watch the observed frequencies settle onto the exact ones
// (the law of large numbers). Logic lives in src/lib/dicesim.ts.
import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { emptyState, exactLabel, exactProbability, makeRng, pct, rollBatch, totalCounts, totalsRange, type DiceState, type RatePoint } from '../../lib/dicesim';
import { useT } from '../../i18n/react';
import type { SimProps } from './SimStepView';
import { useChartWidth } from './useChartWidth';
import './DiceSim.css';

const BATCHES = [1, 10, 100, 1000];
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

/** What the status line says after an action; kept as data so it is worded in the current language. */
type Announce =
  | { kind: 'one'; faces: number[]; total: number; hit: boolean; hits: number; rolls: number }
  | { kind: 'batch'; times: number; newHits: number; hits: number; rolls: number }
  | { kind: 'reset' }
  | null;

export function DiceSim({ step, onGoal }: SimProps<'dice'>) {
  // pct() from dicesim keeps one decimal (16.7%) and is formatted for the active language.
  const { t, n, list } = useT();
  const { dice, sides, target, goalRolls } = step;
  const coin = dice === 1 && sides === 2;
  const faceName = (f: number) => (coin ? (f === 1 ? t('sims.dice.heads') : t('sims.dice.tails')) : String(f));
  const totalName = (v: number) => (coin ? (v === 1 ? t('sims.dice.headsShort') : t('sims.dice.tailsShort')) : String(v));

  const cfg = `${dice}/${sides}/${target.join(',')}`;
  const [state, setState] = useState<DiceState>(() => emptyState(dice, sides));
  const [rollId, setRollId] = useState(0);
  const [lastBatch, setLastBatch] = useState(0);
  const [announce, setAnnounce] = useState<Announce>(null);
  const rng = useRef(makeRng());

  const exact = useMemo(() => exactProbability(dice, sides, target), [dice, sides, target]);
  const expected = useMemo(() => {
    const c = totalCounts(dice, sides);
    return c.map((w) => w / exact.outcomes);
  }, [dice, sides, exact.outcomes]);
  const targets = useMemo(() => new Set(target), [target]);

  const hitWord = coin
    ? list(target.map((f) => (f === 1 ? t('sims.dice.headsLower') : t('sims.dice.tailsLower'))), 'disjunction')
    : t(dice === 1 ? 'sims.dice.targetFace' : 'sims.dice.targetTotal', { values: list(target.map(String), 'disjunction') });

  // a new configuration starts from scratch
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setState(emptyState(dice, sides));
    setLastBatch(0);
    setAnnounce(null);
  }, [cfg, dice, sides]);

  useEffect(() => {
    if (goalRolls) onGoal(state.rolls >= goalRolls);
  }, [goalRolls, state.rolls, onGoal]);

  function roll(times: number) {
    const next = rollBatch(state, dice, sides, target, times, rng.current);
    const newHits = next.hits - state.hits;
    setState(next);
    setRollId((id) => id + 1);
    setLastBatch(times);
    if (times === 1) {
      const total = next.last.reduce((s, f) => s + f, 0);
      setAnnounce({ kind: 'one', faces: next.last, total, hit: newHits > 0, hits: next.hits, rolls: next.rolls });
    } else {
      setAnnounce({ kind: 'batch', times, newHits, hits: next.hits, rolls: next.rolls });
    }
  }

  function reset() {
    setState(emptyState(dice, sides));
    setLastBatch(0);
    setAnnounce({ kind: 'reset' });
  }

  function announceText(a: Announce): string {
    if (!a) return t(coin ? 'sims.dice.startFlip' : 'sims.dice.startRoll', { target: hitWord });
    if (a.kind === 'reset') return t('sims.dice.resetDone');
    const observedNow = pct(a.hits / a.rolls);
    if (a.kind === 'one') {
      const rolled =
        coin ? t('sims.dice.rolledFace', { face: faceName(a.faces[0]) })
        : dice === 1 ? t('sims.dice.rolledOne', { total: a.total })
        : t('sims.dice.rolledSum', { sum: a.faces.join(' + '), total: a.total });
      return [rolled, t(a.hit ? 'sims.dice.hit' : 'sims.dice.miss'), t('sims.dice.observedAfterRolls', { observed: observedNow, count: a.rolls })].join(' ');
    }
    const hits = t('sims.dice.hits', { count: a.newHits });
    return [
      t(coin ? 'sims.dice.moreFlips' : 'sims.dice.moreRolls', { count: a.times, hits }),
      t('sims.dice.observedAfter', { observed: observedNow, count: a.rolls }),
    ].join(' ');
  }

  const observed = state.rolls ? state.hits / state.rolls : 0;
  const gap = state.rolls ? Math.abs(observed - exact.p) * 100 : 0;

  return (
    <div className="dice-sim">
      <div className="ds-top">
        <div className="ds-tray" aria-hidden>
          {(state.last.length ? state.last : new Array(dice).fill(0)).map((f, i) =>
            coin ? (
              <span key={`${rollId}-${i}`} className={`ds-coin${f === 2 ? ' tails' : ''}${f === 0 ? ' blank' : ''}${lastBatch === 1 ? ' anim' : ''}`}>
                {f === 0 ? '?' : totalName(f)}
              </span>
            ) : (
              <span
                key={`${rollId}-${i}`}
                className={`ds-die${sides > 6 ? ' num' : ''}${f === 0 ? ' blank' : ''}${lastBatch === 1 ? ' anim' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {f === 0 ? '?' : sides > 6 ? f : Array.from({ length: 9 }, (_, k) => <i key={k} className={PIPS[f]?.includes(k) ? 'pip' : ''} />)}
              </span>
            ),
          )}
          {state.last.length > 0 && (
            <span className={`ds-total${targets.has(state.last.reduce((s, f) => s + f, 0)) ? ' hit' : ''}`}>
              {coin ? faceName(state.last[0]) : dice > 1 ? `= ${state.last.reduce((s, f) => s + f, 0)}` : ''}
              {targets.has(state.last.reduce((s, f) => s + f, 0)) && <b> {t('sims.dice.hitBadge')}</b>}
            </span>
          )}
        </div>
        <div className="ds-buttons" role="group" aria-label={coin ? t('sims.dice.flipGroup') : t('sims.dice.rollGroup')}>
          {BATCHES.map((b) => (
            <button key={b} className={`btn small${b === 1 ? ' primary' : ''}`} onClick={() => roll(b)}>
              {t(coin ? 'sims.dice.flipTimes' : 'sims.dice.rollTimes', { count: b })}
            </button>
          ))}
          <button className="btn small ghost" onClick={reset} disabled={state.rolls === 0}>
            {t('sims.dice.reset')}
          </button>
        </div>
      </div>

      <p className="ds-announce" role="status" aria-live="polite">
        {announceText(announce)}
      </p>

      <dl className="ds-stats">
        <div>
          <dt>{coin ? t('sims.dice.flips') : t('sims.dice.rolls')}</dt>
          <dd>{n(state.rolls)}</dd>
        </div>
        <div>
          <dt>{t('sims.dice.hitsOf', { target: hitWord })}</dt>
          <dd>{n(state.hits)}</dd>
        </div>
        <div>
          <dt>{t('sims.dice.observed')}</dt>
          <dd>{state.rolls ? pct(observed) : '–'}</dd>
        </div>
        <div className="exact">
          <dt>{t('sims.dice.exact')}</dt>
          <dd>{exactLabel(exact)}</dd>
        </div>
      </dl>
      <p className="ds-gap small muted">
        {state.rolls
          ? t(coin ? 'sims.dice.gapFlips' : 'sims.dice.gapRolls', {
              count: state.rolls,
              gap: n(gap, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            })
          : t(dice > 1 ? 'sims.dice.orderedOutcomes' : 'sims.dice.outcomes', { outcomes: exact.outcomes, count: exact.hits })}
      </p>

      <Histogram
        totals={totalsRange(dice, sides)}
        counts={state.counts}
        rolls={state.rolls}
        expected={expected}
        targets={targets}
        name={totalName}
        coin={coin}
      />
      <RateChart series={state.series} p={exact.p} label={pct(exact.p)} hitWord={hitWord} coin={coin} />
    </div>
  );
}

function Histogram({
  totals,
  counts,
  rolls,
  expected,
  targets,
  name,
  coin,
}: {
  totals: number[];
  counts: number[];
  rolls: number;
  expected: number[];
  targets: Set<number>;
  name: (t: number) => string;
  coin: boolean;
}) {
  const { t: tr, n } = useT();
  const share = (t: number) => (rolls ? counts[t] / rolls : 0);
  const max = Math.max(...totals.map((t) => Math.max(expected[t], share(t)))) * 1.08 || 1;
  const labelEvery = totals.length <= 13 ? 1 : totals.length <= 26 ? 2 : 5;
  return (
    <figure className="ds-hist" aria-label={coin ? tr('sims.dice.histSides') : tr('sims.dice.histTotals')}>
      <figcaption className="ds-legend">
        <span>
          <i className="sw obs" /> {tr('sims.dice.legendObserved')}
        </span>
        <span>
          <i className="sw hit" /> {tr('sims.dice.legendTarget')}
        </span>
        <span>
          <i className="sw exp" /> {tr('sims.dice.legendExact')}
        </span>
      </figcaption>
      <div className="ds-bars" style={{ gap: totals.length > 26 ? 1 : 3 }}>
        {totals.map((t) => (
          <div
            key={t}
            className="ds-slot tip"
            data-tip={
              rolls
                ? tr('sims.dice.barTipSeen', { name: name(t), observed: pct(share(t)), exact: pct(expected[t]) })
                : tr('sims.dice.barTipNotRolled', { name: name(t), exact: pct(expected[t]) })
            }
          >
            <div className={`ds-bar${targets.has(t) ? ' hit' : ''}`} style={{ height: `${(share(t) / max) * 100}%` }} />
            <div className="ds-ghost" style={{ height: `${(expected[t] / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="ds-labels" aria-hidden style={{ gap: totals.length > 26 ? 1 : 3 }}>
        {totals.map((t, i) => (
          <span key={t} className={targets.has(t) ? 'hit' : ''}>
            {(i % labelEvery === 0 || targets.has(t)) && name(t)}
          </span>
        ))}
      </div>
      <div className="sr-only"><table>
        <thead>
          <tr>
            <th>{coin ? tr('sims.dice.colSide') : tr('sims.dice.colTotal')}</th>
            <th>{tr('sims.dice.colSeen')}</th>
            <th>{tr('sims.dice.colObserved')}</th>
            <th>{tr('sims.dice.colExact')}</th>
          </tr>
        </thead>
        <tbody>
          {totals.map((t) => (
            <tr key={t}>
              <th>{targets.has(t) ? tr('sims.dice.targetRow', { name: name(t) }) : name(t)}</th>
              <td>{n(counts[t])}</td>
              <td>{rolls ? pct(share(t)) : '–'}</td>
              <td>{pct(expected[t])}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </figure>
  );
}

const NICE = [0.05, 0.1, 0.2, 0.25, 0.5, 1];

function RateChart({ series, p, label, hitWord, coin }: { series: RatePoint[]; p: number; label: string; hitWord: string; coin: boolean }) {
  const { t, n, pct: pctWhole } = useT();
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const clipId = useId();
  const [hover, setHover] = useState<RatePoint | null>(null);
  const H = 190;
  const pad = { l: 40, r: 12, t: 14, b: 26 };
  const plotW = width - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const rolls = series.length ? series[series.length - 1].rolls : 0;
  const xMaxLog = Math.max(1, Math.ceil(Math.log10(Math.max(rolls, 1)) - 1e-9));
  const yMax = NICE.find((v) => v >= Math.max(p * 2.2, 0.05)) ?? 1;
  const x = (r: number) => pad.l + (Math.log10(r) / xMaxLog) * plotW;
  const y = (v: number) => pad.t + plotH * (1 - v / yMax);
  const path = series.map((pt, i) => `${i ? 'L' : 'M'}${x(pt.rolls).toFixed(1)},${y(pt.rate).toFixed(1)}`).join('');
  const xTicks = Array.from({ length: xMaxLog + 1 }, (_, i) => 10 ** i);
  const yTicks = [0, yMax / 2, yMax];
  const tickLabel = (v: number) => (v >= 1000 ? t('sims.dice.thousands', { count: v / 1000 }) : n(v));

  function onMove(e: PointerEvent<SVGSVGElement>) {
    if (!series.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const r = 10 ** (((px - pad.l) / plotW) * xMaxLog);
    let best = series[0];
    for (const pt of series) if (Math.abs(Math.log10(pt.rolls) - Math.log10(r)) < Math.abs(Math.log10(best.rolls) - Math.log10(r))) best = pt;
    setHover(best);
  }

  const last = series[series.length - 1];
  return (
    <figure className="ds-rate" ref={ref}>
      <figcaption className="ds-rate-title">
        {t('sims.dice.rateTitle')} <span className="muted small">{coin ? t('sims.dice.logScaleFlips') : t('sims.dice.logScaleRolls')}</span>
      </figcaption>
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={
          last
            ? t(coin ? 'sims.dice.rateAriaFlips' : 'sims.dice.rateAriaRolls', { target: hitWord, rate: pct(last.rate), count: last.rolls, exact: label })
            : t(coin ? 'sims.dice.rateAriaNoFlips' : 'sims.dice.rateAriaNoRolls', { exact: label })
        }
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={pad.l} y={pad.t - 2} width={plotW + 4} height={plotH + 4} />
          </clipPath>
        </defs>
        {yTicks.map((v) => (
          <g key={v}>
            <line className="ds-grid" x1={pad.l} x2={pad.l + plotW} y1={y(v)} y2={y(v)} />
            <text className="ds-axis" x={pad.l - 6} y={y(v) + 4} textAnchor="end">
              {pctWhole(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={v} className="ds-axis" x={x(v)} y={H - 8} textAnchor={v === 1 ? 'start' : 'middle'}>
            {tickLabel(v)}
          </text>
        ))}
        <line className="ds-exact" x1={pad.l} x2={pad.l + plotW} y1={y(p)} y2={y(p)} />
        <text className="ds-exact-label" x={pad.l + plotW} y={y(p) - 6} textAnchor="end">
          {t('sims.dice.exactLine', { exact: label })}
        </text>
        {series.length > 0 && (
          <g clipPath={`url(#${clipId})`}>
            <path className="ds-line" d={series.length === 1 ? `${path}h1` : path} />
            {last && <circle className="ds-dot" cx={x(last.rolls)} cy={y(Math.min(last.rate, yMax))} r={4} />}
          </g>
        )}
        {!series.length && (
          <text className="ds-axis" x={pad.l + plotW / 2} y={pad.t + plotH / 2 + 18} textAnchor="middle">
            {coin ? t('sims.dice.flipToDraw') : t('sims.dice.rollToDraw')}
          </text>
        )}
        {hover && (
          <g className="ds-hover" pointerEvents="none">
            <line x1={x(hover.rolls)} x2={x(hover.rolls)} y1={pad.t} y2={pad.t + plotH} />
            <circle cx={x(hover.rolls)} cy={y(Math.min(hover.rate, yMax))} r={4.5} />
            <text x={Math.min(Math.max(x(hover.rolls), pad.l + 70), pad.l + plotW - 70)} y={pad.t + 12} textAnchor="middle">
              {t(coin ? 'sims.dice.hoverFlips' : 'sims.dice.hoverRolls', { count: hover.rolls, rate: pct(hover.rate) })}
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}
