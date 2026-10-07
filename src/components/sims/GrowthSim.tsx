// Big-O race: drag n and watch each complexity class's operation count (and the time at 1 µs per operation)
// pull apart. Logic lives in src/lib/growthsim.ts.
import { useId, useMemo, useState, type PointerEvent } from 'react';
import {
  axisLog10,
  barExtent,
  CURVE_LABEL,
  CURVE_ORDER,
  curveName,
  formatCount,
  formatFactor,
  formatOps,
  LOG_AXIS_CAP,
  linearReference,
  nToSlider,
  opsLog10,
  quickSizes,
  sliderToN,
  superscript,
  timeFor,
  type Curve,
} from '../../lib/growthsim';
import { useT } from '../../i18n/react';
import type { SimProps } from './SimStepView';
import { useChartWidth } from './useChartWidth';
import './GrowthSim.css';

/** Fixed colour slot per class, so a class looks the same in every lesson. */
const SLOT: Record<Curve, number> = { '1': 1, 'log n': 2, n: 3, 'n log n': 4, 'n^2': 5, '2^n': 6 };
const color = (c: Curve) => `var(--gs-${SLOT[c]})`;
const STEPS = 1000;

export function GrowthSim({ step }: SimProps<'growth'>) {
  const { t, tx, n: fmt } = useT();
  const maxN = step.maxN ?? 1000;
  const curves = useMemo(() => CURVE_ORDER.filter((c) => step.curves.includes(c)), [step.curves]);
  const [n, setN] = useState(() => Math.min(10, maxN));
  const [scale, setScale] = useState<'linear' | 'log'>('linear');
  const sizes = quickSizes(maxN);
  const presets = sizes.includes(maxN) ? sizes : [...sizes, maxN];

  const sliderId = useId();
  const axis = axisLog10(curves, n, scale);
  const ref = linearReference(curves);

  return (
    <div className="growth-sim">
      <div className="gs-controls">
        <label className="gs-n" htmlFor={sliderId}>
          {t('sims.growth.inputSize')} <span className="gs-n-value">n = {fmt(n)}</span>
        </label>
        <input
          id={sliderId}
          className="gs-slider"
          type="range"
          min={0}
          max={STEPS}
          step={1}
          value={nToSlider(n, maxN, STEPS)}
          onChange={(e) => setN(sliderToN(Number(e.target.value), maxN, STEPS))}
          aria-valuetext={`n = ${fmt(n)}`}
          style={{ ['--fill' as string]: `${(nToSlider(n, maxN, STEPS) / STEPS) * 100}%` }}
        />
        <div className="gs-row">
          <div className="gs-presets" role="group" aria-label={t('sims.growth.presets')}>
            {presets.map((v) => (
              <button key={v} className={`chip-btn${v === n ? ' on' : ''}`} aria-pressed={v === n} onClick={() => setN(v)}>
                {fmt(v)}
              </button>
            ))}
          </div>
          <div className="gs-scale" role="group" aria-label={t('sims.growth.barScale')}>
            {(['linear', 'log'] as const).map((s) => (
              <button key={s} className={`chip-btn${scale === s ? ' on' : ''}`} aria-pressed={scale === s} onClick={() => setScale(s)}>
                {s === 'linear' ? t('sims.growth.linear') : t('sims.growth.log')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ol className="gs-lanes" aria-label={t('sims.growth.lanesLabel', { n: fmt(n) })}>
        {curves.map((c) => {
          const log = opsLog10(c, n);
          const { frac, overLog } = barExtent(log, axis, scale);
          const offText =
            overLog > 0 ? (scale === 'linear' ? t('sims.growth.pastEdge', { factor: formatFactor(overLog) }) : t('sims.growth.offChart')) : '';
          return (
            <li key={c} className="gs-lane" style={{ ['--c' as string]: color(c) }}>
              <span className="gs-label">
                <i className="gs-swatch" aria-hidden />
                <strong>{CURVE_LABEL[c]}</strong> <span className="muted">{curveName(c)}</span>
              </span>
              <span className="gs-value">
                {tx('sims.growth.opsAndTime', { ops: <strong>{formatOps(c, n)}</strong>, time: <strong>{timeFor(c, n)}</strong> })}
              </span>
              <span className={`gs-track${overLog > 0 ? ' over' : ''}`} aria-hidden>
                <span className="gs-bar" style={{ width: `${frac * 100}%` }} />
                {overLog > 0 && <span className="gs-off">{offText} →</span>}
              </span>
              {overLog > 0 && <span className="sr-only">{offText}.</span>}
            </li>
          );
        })}
      </ol>
      <p className="gs-caption small muted">
        {scale === 'linear'
          ? t('sims.growth.captionLinear', { curve: CURVE_LABEL[ref], count: formatCount(axis) })
          : t('sims.growth.captionLog', { max: `10${superscript(axis)}` })}{' '}
        {t('sims.growth.timesAssume')}
      </p>

      <GrowthChart curves={curves} n={n} maxN={maxN} onPick={setN} />
    </div>
  );
}

function GrowthChart({ curves, n, maxN, onPick }: { curves: Curve[]; n: number; maxN: number; onPick: (n: number) => void }) {
  const { t, n: fmt, list } = useT();
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const clipId = useId();
  const H = 220;
  const pad = { l: 46, r: 14, t: 12, b: 28 };
  const plotW = width - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const xMaxLog = Math.log10(maxN);
  const yTop = Math.min(LOG_AXIS_CAP, Math.max(1, Math.ceil(Math.max(...curves.map((c) => opsLog10(c, maxN))))));
  const x = (v: number) => pad.l + (Math.log10(v) / xMaxLog) * plotW;
  const y = (log: number) => pad.t + plotH * (1 - Math.max(log, -0.3) / yTop);

  const pts = 160;
  const paths = curves.map((c) => {
    let d = '';
    for (let i = 0; i <= pts; i++) {
      const v = Math.max(1, maxN ** (i / pts));
      const log = opsLog10(c, v);
      const yy = y(log === -Infinity ? -0.3 : Math.min(log, yTop + 1));
      d += `${i ? 'L' : 'M'}${x(v).toFixed(1)},${yy.toFixed(1)}`;
    }
      return { c, d };
  });

  const yStep = Math.max(1, Math.ceil(yTop / 5 / 3) * 3);
  const yTicks: number[] = [];
  for (let k = 0; k <= yTop; k += yStep) yTicks.push(k);
  const xStep = Math.max(1, Math.ceil(xMaxLog / 6));
  const xTicks: number[] = [];
  for (let k = 0; k <= Math.floor(xMaxLog); k += xStep) xTicks.push(k);
  const pow = (k: number) => (k === 0 ? '1' : k === 1 ? '10' : `10${superscript(k)}`);

  function pick(e: PointerEvent<SVGSVGElement>) {
    if (e.type === 'pointermove' && e.buttons === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const t = Math.min(Math.max((e.clientX - rect.left - pad.l) / plotW, 0), 1);
    onPick(Math.max(1, Math.min(maxN, Math.round(maxN ** t))));
  }

  return (
    <figure className="gs-chart" ref={ref}>
      <figcaption className="gs-chart-title">
        {t('sims.growth.chartTitle')} <span className="muted small">{t('sims.growth.chartNote')}</span>
      </figcaption>
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={t('sims.growth.chartLabel', { max: fmt(maxN), curves: list(curves.map((c) => CURVE_LABEL[c])), n: fmt(n) })}
        onPointerDown={pick}
        onPointerMove={pick}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={pad.l} y={pad.t - 4} width={plotW + 6} height={plotH + 8} />
          </clipPath>
        </defs>
        {yTicks.map((k) => (
          <g key={k}>
            <line className="gs-grid" x1={pad.l} x2={pad.l + plotW} y1={y(k)} y2={y(k)} />
            <text className="gs-axis" x={pad.l - 6} y={y(k) + 4} textAnchor="end">
              {pow(k)}
            </text>
          </g>
        ))}
        {xTicks.map((k) => (
          <text key={k} className="gs-axis" x={x(10 ** k)} y={H - 8} textAnchor={k === 0 ? 'start' : 'middle'}>
            {pow(k)}
          </text>
        ))}
        <text className="gs-axis" x={pad.l + plotW} y={H - 8} textAnchor="end">
          n
        </text>
        <g clipPath={`url(#${clipId})`}>
          {paths.map(({ c, d }) => (
            <path key={c} className="gs-line" d={d} style={{ stroke: color(c) }} />
          ))}
          <line className="gs-marker" x1={x(n)} x2={x(n)} y1={pad.t} y2={pad.t + plotH} />
          {curves.map((c) => {
            const log = opsLog10(c, n);
            if (log > yTop) return null;
            return <circle key={c} className="gs-dot" cx={x(n)} cy={y(log === -Infinity ? -0.3 : log)} r={4.5} style={{ fill: color(c) }} />;
          })}
        </g>
      </svg>
      <div className="gs-legend" aria-hidden>
        {curves.map((c) => (
          <span key={c} style={{ ['--c' as string]: color(c) }}>
            <i className="gs-swatch" /> {CURVE_LABEL[c]}
          </span>
        ))}
      </div>
    </figure>
  );
}
