// Dice / coin simulator: roll in batches and watch the observed frequencies settle onto the exact ones
// (the law of large numbers). Logic lives in src/lib/dicesim.ts.
import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { emptyState, exactLabel, exactProbability, makeRng, pct, rollBatch, totalCounts, totalsRange, type DiceState, type RatePoint } from '../../lib/dicesim';
import type { SimProps } from './SimStepView';
import { useChartWidth } from './useChartWidth';
import './DiceSim.css';

const BATCHES = [1, 10, 100, 1000];
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

const fmt = (n: number) => n.toLocaleString('en-US');

function listOr(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;
}

export function DiceSim({ step, onGoal }: SimProps<'dice'>) {
  const { dice, sides, target, goalRolls } = step;
  const coin = dice === 1 && sides === 2;
  const faceName = (f: number) => (coin ? (f === 1 ? 'Heads' : 'Tails') : String(f));
  const totalName = (t: number) => (coin ? (t === 1 ? 'H' : 'T') : String(t));

  const cfg = `${dice}/${sides}/${target.join(',')}`;
  const [state, setState] = useState<DiceState>(() => emptyState(dice, sides));
  const [rollId, setRollId] = useState(0);
  const [lastBatch, setLastBatch] = useState(0);
  const [announce, setAnnounce] = useState('');
  const rng = useRef(makeRng());

  const exact = useMemo(() => exactProbability(dice, sides, target), [dice, sides, target]);
  const expected = useMemo(() => {
    const c = totalCounts(dice, sides);
    return c.map((w) => w / exact.outcomes);
  }, [dice, sides, exact.outcomes]);
  const targets = useMemo(() => new Set(target), [target]);

  const hitWord = coin ? listOr(target.map((t) => faceName(t).toLowerCase())) : dice === 1 ? `a ${listOr(target.map(String))}` : `a total of ${listOr(target.map(String))}`;

  // a new configuration starts from scratch
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setState(emptyState(dice, sides));
    setLastBatch(0);
    setAnnounce('');
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
      const shown = coin ? faceName(next.last[0]) : dice === 1 ? `a ${total}` : `${next.last.join(' + ')} = ${total}`;
      setAnnounce(`Rolled ${shown}. ${newHits ? 'Hit!' : 'Miss.'} Observed ${pct(next.hits / next.rolls)} after ${fmt(next.rolls)} roll${next.rolls === 1 ? '' : 's'}.`);
    } else {
      setAnnounce(`${fmt(times)} more ${coin ? 'flips' : 'rolls'}: ${fmt(newHits)} hit${newHits === 1 ? '' : 's'}. Observed ${pct(next.hits / next.rolls)} after ${fmt(next.rolls)}.`);
    }
  }

  function reset() {
    setState(emptyState(dice, sides));
    setLastBatch(0);
    setAnnounce('Reset. No rolls yet.');
  }

  const observed = state.rolls ? state.hits / state.rolls : 0;
  const gap = state.rolls ? Math.abs(observed - exact.p) * 100 : 0;
  const unit = coin ? 'flip' : 'roll';

  return (
    <div className="dice-sim">
      <div className="ds-top">
        <div className="ds-tray" aria-hidden>
          {(state.last.length ? state.last : new Array(dice).fill(0)).map((f, i) =>
            coin ? (
              <span key={`${rollId}-${i}`} className={`ds-coin${f === 2 ? ' tails' : ''}${f === 0 ? ' blank' : ''}${lastBatch === 1 ? ' anim' : ''}`}>
                {f === 0 ? '?' : f === 1 ? 'H' : 'T'}
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
              {targets.has(state.last.reduce((s, f) => s + f, 0)) && <b> hit</b>}
            </span>
          )}
        </div>
        <div className="ds-buttons" role="group" aria-label={coin ? 'Flip the coin' : 'Roll the dice'}>
          {BATCHES.map((b) => (
            <button key={b} className={`btn small${b === 1 ? ' primary' : ''}`} onClick={() => roll(b)}>
              {coin ? 'Flip' : 'Roll'} ×{fmt(b)}
            </button>
          ))}
          <button className="btn small ghost" onClick={reset} disabled={state.rolls === 0}>
            Reset
          </button>
        </div>
      </div>

      <p className="ds-announce" role="status" aria-live="polite">
        {announce || `Target: ${hitWord}. ${coin ? 'Flip' : 'Roll'} to start.`}
      </p>

      <dl className="ds-stats">
        <div>
          <dt>{coin ? 'Flips' : 'Rolls'}</dt>
          <dd>{fmt(state.rolls)}</dd>
        </div>
        <div>
          <dt>Hits ({hitWord})</dt>
          <dd>{fmt(state.hits)}</dd>
        </div>
        <div>
          <dt>Observed</dt>
          <dd>{state.rolls ? pct(observed) : '–'}</dd>
        </div>
        <div className="exact">
          <dt>Exact</dt>
          <dd>{exactLabel(exact)}</dd>
        </div>
      </dl>
      <p className="ds-gap small muted">
        {state.rolls
          ? `After ${fmt(state.rolls)} ${unit}${state.rolls === 1 ? '' : 's'}, observed is ${gap.toFixed(1)} percentage points from exact.`
          : `${exact.outcomes} equally likely ${dice > 1 ? 'ordered outcomes' : 'outcomes'}, ${exact.hits} of them hit${exact.hits === 1 ? 's' : ''}.`}
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
      <RateChart series={state.series} p={exact.p} label={pct(exact.p)} hitWord={hitWord} unit={unit} />
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
  const share = (t: number) => (rolls ? counts[t] / rolls : 0);
  const max = Math.max(...totals.map((t) => Math.max(expected[t], share(t)))) * 1.08 || 1;
  const labelEvery = totals.length <= 13 ? 1 : totals.length <= 26 ? 2 : 5;
  return (
    <figure className="ds-hist" aria-label={coin ? 'How often each side came up, against the exact share' : 'How often each total came up, against the exact share'}>
      <figcaption className="ds-legend">
        <span>
          <i className="sw obs" /> observed
        </span>
        <span>
          <i className="sw hit" /> target
        </span>
        <span>
          <i className="sw exp" /> exact
        </span>
      </figcaption>
      <div className="ds-bars" style={{ gap: totals.length > 26 ? 1 : 3 }}>
        {totals.map((t) => (
          <div
            key={t}
            className="ds-slot tip"
            data-tip={`${name(t)}: ${rolls ? `${pct(share(t))} seen` : 'not rolled yet'} · exact ${pct(expected[t])}`}
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
      <table className="sr-only">
        <thead>
          <tr>
            <th>{coin ? 'Side' : 'Total'}</th>
            <th>Times seen</th>
            <th>Observed share</th>
            <th>Exact share</th>
          </tr>
        </thead>
        <tbody>
          {totals.map((t) => (
            <tr key={t}>
              <th>
                {name(t)}
                {targets.has(t) ? ' (target)' : ''}
              </th>
              <td>{counts[t]}</td>
              <td>{rolls ? pct(share(t)) : '–'}</td>
              <td>{pct(expected[t])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const NICE = [0.05, 0.1, 0.2, 0.25, 0.5, 1];

function RateChart({ series, p, label, hitWord, unit }: { series: RatePoint[]; p: number; label: string; hitWord: string; unit: string }) {
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
  const tickLabel = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v));

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
        Hit rate so far <span className="muted small">({unit}s on a log scale)</span>
      </figcaption>
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={
          last
            ? `Running hit rate for ${hitWord}: ${pct(last.rate)} after ${fmt(last.rolls)} ${unit}s; the exact probability is ${label}.`
            : `Running hit rate: no ${unit}s yet. The exact probability is ${label}.`
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
              {Math.round(v * 100)}%
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
          exact {label}
        </text>
        {series.length > 0 && (
          <g clipPath={`url(#${clipId})`}>
            <path className="ds-line" d={series.length === 1 ? `${path}h1` : path} />
            {last && <circle className="ds-dot" cx={x(last.rolls)} cy={y(Math.min(last.rate, yMax))} r={4} />}
          </g>
        )}
        {!series.length && (
          <text className="ds-axis" x={pad.l + plotW / 2} y={pad.t + plotH / 2 + 18} textAnchor="middle">
            {unit === 'flip' ? 'Flip' : 'Roll'} to draw the line
          </text>
        )}
        {hover && (
          <g className="ds-hover" pointerEvents="none">
            <line x1={x(hover.rolls)} x2={x(hover.rolls)} y1={pad.t} y2={pad.t + plotH} />
            <circle cx={x(hover.rolls)} cy={y(Math.min(hover.rate, yMax))} r={4.5} />
            <text x={Math.min(Math.max(x(hover.rolls), pad.l + 70), pad.l + plotW - 70)} y={pad.t + 12} textAnchor="middle">
              {`${fmt(hover.rolls)} ${unit}${hover.rolls === 1 ? '' : 's'}: ${pct(hover.rate)}`}
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}
