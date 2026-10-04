import { dayString, type Progress } from '../lib/storage';

// Small single-series charts. One hue (the accent), thin rounded bars anchored to the baseline,
// recessive axes, labels in text colors, and a hover tooltip on every mark (data-tip).

const DAY_MS = 86_400_000;
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface BarDatum {
  label: string;
  value: number;
  tip: string;
  highlight?: boolean;
}

function Bars({ data, goal, unit, ariaLabel }: { data: BarDatum[]; goal?: number; unit: string; ariaLabel: string }) {
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1);
  return (
    <figure className="chart" aria-label={ariaLabel}>
      <div className="bars">
        {goal !== undefined && (
          <div className="goal-line" style={{ bottom: `${(goal / max) * 100}%` }}>
            <span>goal {goal}</span>
          </div>
        )}
        {data.map((d, i) => (
          <div key={i} className="bar-slot tip" data-tip={d.tip} tabIndex={0}>
            {d.highlight && d.value > 0 && <span className="bar-value">{d.value}</span>}
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
      <table className="sr-only">
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th>{d.tip.split(':')[0]}</th>
              <td>
                {d.value} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function WeekXpChart({ p }: { p: Progress }) {
  const data: BarDatum[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const v = p.xpByDay[dayString(d)] ?? 0;
    data.push({
      label: i === 0 ? 'Today' : WEEKDAY[d.getDay()].slice(0, 1),
      value: v,
      tip: `${i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${v} XP`,
      highlight: i === 0,
    });
  }
  return <Bars data={data} goal={p.dailyGoal} unit="XP" ariaLabel="XP earned over the last 7 days" />;
}

export function ReviewForecast({ p }: { p: Progress }) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const counts = new Array(7).fill(0);
  for (const c of Object.values(p.cards)) {
    const idx = Math.max(0, Math.floor((c.due - start.getTime()) / DAY_MS));
    if (idx < 7) counts[idx]++;
  }
  const data = counts.map((v, i) => {
    const d = new Date(start.getTime() + i * DAY_MS);
    const name = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'long' });
    return { label: i === 0 ? 'Today' : WEEKDAY[d.getDay()].slice(0, 3), value: v, tip: `${name}: ${v} due`, highlight: i === 0 };
  });
  return <Bars data={data} unit="reviews" ariaLabel="Reviews due over the next 7 days" />;
}

export const BOX_NAMES = ['Relearning', 'New', 'Familiar', 'Solid', 'Strong', 'Mastered'];

export function MemoryStrength({ p, keys }: { p: Progress; keys: string[] }) {
  const counts = new Array(6).fill(0);
  for (const k of keys) {
    const c = p.cards[k];
    if (c) counts[c.box - 1]++;
  }
  const max = Math.max(...counts, 1);
  return (
    <figure className="hbars" aria-label="Questions by memory strength">
      {counts.map((n, i) => (
        <div key={i} className="hbar-row tip" data-tip={`${BOX_NAMES[i]}: ${n} question${n === 1 ? '' : 's'}`} tabIndex={0}>
          <span className="hbar-label">{BOX_NAMES[i]}</span>
          <span className="hbar-track">
            <span className="hbar-mark" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="hbar-value">{n}</span>
        </div>
      ))}
    </figure>
  );
}

/** GitHub-style activity grid: one column per week, darker = more XP. */
export function ActivityHeatmap({ p, weeks = 18 }: { p: Progress; weeks?: number }) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const end = new Date(today.getTime() + (6 - today.getDay()) * DAY_MS);
  const cells: { date: Date; xp: number }[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(end.getTime() - i * DAY_MS);
    cells.push({ date, xp: p.xpByDay[dayString(date)] ?? 0 });
  }
  const goal = Math.max(p.dailyGoal, 1);
  const level = (xp: number) => (xp <= 0 ? 0 : xp < goal * 0.5 ? 1 : xp < goal ? 2 : xp < goal * 2 ? 3 : 4);
  const active = cells.filter((c) => c.xp > 0 && c.date <= today).length;

  return (
    <figure className="heatmap-wrap" aria-label={`Activity over the last ${weeks} weeks: ${active} active days`}>
      <div className="heatmap" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 16px))` }}>
        {cells.map((c, i) => {
          const future = c.date > today;
          return (
            <span
              key={i}
              className={`cell l${future ? 'x' : level(c.xp)} tip`}
              data-tip={future ? '' : `${c.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${c.xp} XP`}
            />
          );
        })}
      </div>
      <figcaption className="heatmap-legend">
        <span>{active} active days</span>
        <span className="legend-scale" aria-hidden>
          Less <i className="cell l0" />
          <i className="cell l1" />
          <i className="cell l2" />
          <i className="cell l3" />
          <i className="cell l4" /> More
        </span>
      </figcaption>
    </figure>
  );
}
