import type { MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';
import { dayString, type Progress } from '../lib/storage';

// Small single-series charts. One hue (the accent), thin rounded bars anchored to the baseline,
// recessive axes, labels in text colors, and a hover tooltip on every mark (data-tip).

const DAY_MS = 86_400_000;

interface BarDatum {
  label: string;
  /** What the bar is (a day), for the screen-reader table. */
  name: string;
  value: number;
  tip: string;
  highlight?: boolean;
}

function Bars({ data, goal, valueText, ariaLabel }: { data: BarDatum[]; goal?: number; valueText: (v: number) => string; ariaLabel: string }) {
  const { t, n } = useT();
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1);
  return (
    <figure className="chart" aria-label={ariaLabel}>
      <div className="bars">
        {goal !== undefined && (
          <div className="goal-line" style={{ bottom: `${(goal / max) * 100}%` }}>
            <span>{t('insights.chart.goal', { goal })}</span>
          </div>
        )}
        {data.map((d, i) => (
          <div key={i} className="bar-slot tip" data-tip={d.tip} tabIndex={0}>
            {d.highlight && d.value > 0 && <span className="bar-value">{n(d.value)}</span>}
            <div className={`bar-mark${d.highlight ? ' strong' : ''}`} style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="bar-labels" aria-hidden>
        {data.map((d, i) => (
          <span key={i} className={d.highlight ? 'today' : ''}>
            {d.label}
          </span>
        ))}
      </div>
      <div className="sr-only"><table>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th>{d.name}</th>
              <td>{valueText(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </figure>
  );
}

export function WeekXpChart({ p }: { p: Progress }) {
  const { t, date } = useT();
  const data: BarDatum[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const v = p.xpByDay[dayString(d)] ?? 0;
    const name = i === 0 ? t('common.today') : date(d, { weekday: 'short', month: 'short', day: 'numeric' });
    data.push({
      label: i === 0 ? t('common.today') : date(d, { weekday: 'narrow' }),
      name,
      value: v,
      tip: t('insights.chart.xpTip', { day: name, count: v }),
      highlight: i === 0,
    });
  }
  return <Bars data={data} goal={p.dailyGoal} valueText={(v) => t('common.xp', { count: v })} ariaLabel={t('insights.chart.xpLabel')} />;
}

export function ReviewForecast({ p }: { p: Progress }) {
  const { t, date } = useT();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const counts = new Array(7).fill(0);
  for (const c of Object.values(p.cards)) {
    const idx = Math.max(0, Math.floor((c.due - start.getTime()) / DAY_MS));
    if (idx < 7) counts[idx]++;
  }
  const data = counts.map((v, i) => {
    const d = new Date(start.getTime() + i * DAY_MS);
    const name = i === 0 ? t('common.today') : i === 1 ? t('insights.chart.tomorrow') : date(d, { weekday: 'long' });
    return {
      label: i === 0 ? t('common.today') : date(d, { weekday: 'short' }),
      name,
      value: v,
      tip: t('insights.chart.dueTip', { day: name, count: v }),
      highlight: i === 0,
    };
  });
  return <Bars data={data} valueText={(v) => t('insights.chart.reviews', { count: v })} ariaLabel={t('insights.chart.forecastLabel')} />;
}

/** Memory strength names by Leitner box (1–6). */
const BOX_KEYS: MessageKey[] = ['insights.box.1', 'insights.box.2', 'insights.box.3', 'insights.box.4', 'insights.box.5', 'insights.box.6'];

export function MemoryStrength({ p, keys }: { p: Progress; keys: string[] }) {
  const { t, n } = useT();
  const counts = new Array(6).fill(0);
  for (const k of keys) {
    const c = p.cards[k];
    if (c) counts[c.box - 1]++;
  }
  const max = Math.max(...counts, 1);
  return (
    <figure className="hbars" aria-label={t('insights.chart.strengthLabel')}>
      {counts.map((count, i) => (
        <div key={i} className="hbar-row tip" data-tip={t('insights.chart.strengthTip', { box: t(BOX_KEYS[i]), count })} tabIndex={0}>
          <span className="hbar-label">{t(BOX_KEYS[i])}</span>
          <span className="hbar-track">
            <span className="hbar-mark" style={{ width: `${(count / max) * 100}%` }} />
          </span>
          <span className="hbar-value">{n(count)}</span>
        </div>
      ))}
    </figure>
  );
}

/** GitHub-style activity grid: one column per week, darker = more XP. */
export function ActivityHeatmap({ p, weeks = 18 }: { p: Progress; weeks?: number }) {
  const { t, date } = useT();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const end = new Date(today.getTime() + (6 - today.getDay()) * DAY_MS);
  const cells: { date: Date; xp: number }[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const day = new Date(end.getTime() - i * DAY_MS);
    cells.push({ date: day, xp: p.xpByDay[dayString(day)] ?? 0 });
  }
  const goal = Math.max(p.dailyGoal, 1);
  const level = (xp: number) => (xp <= 0 ? 0 : xp < goal * 0.5 ? 1 : xp < goal ? 2 : xp < goal * 2 ? 3 : 4);
  const active = cells.filter((c) => c.xp > 0 && c.date <= today).length;

  return (
    <figure className="heatmap-wrap" aria-label={t('insights.chart.heatmapLabel', { weeks, count: active })}>
      <div className="heatmap" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 16px))` }}>
        {cells.map((c, i) => {
          const future = c.date > today;
          return (
            <span
              key={i}
              className={`cell l${future ? 'x' : level(c.xp)} tip`}
              data-tip={future ? '' : t('insights.chart.xpTip', { day: date(c.date, { month: 'short', day: 'numeric' }), count: c.xp })}
            />
          );
        })}
      </div>
      <figcaption className="heatmap-legend">
        <span>{t('insights.chart.activeDays', { count: active })}</span>
        <span className="legend-scale" aria-hidden>
          {t('insights.chart.less')} <i className="cell l0" />
          <i className="cell l1" />
          <i className="cell l2" />
          <i className="cell l3" />
          <i className="cell l4" /> {t('insights.chart.more')}
        </span>
      </figcaption>
    </figure>
  );
}
