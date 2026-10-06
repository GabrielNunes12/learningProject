// The JOIN playground: two tables, lines between matching rows, and the result of the chosen join type.
// Join semantics (NULL never matches, one-to-many repeats rows, NULL padding) live in src/lib/joinsim.ts.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  describeJoin,
  formatCell,
  JOIN_KEYWORD,
  JOIN_TYPES,
  joinSql,
  joinTables,
  keepsUnmatched,
  type Cell,
  type JoinTable,
  type JoinType,
} from '../../lib/joinsim';
import { CodeBlock } from '../Markdown';
import type { SimProps } from './SimStepView';
import './JoinSim.css';

type Focus = { kind: 'result' | 'left' | 'right'; idx: number } | null;

const SHORT: Record<JoinType, string> = { inner: 'INNER', left: 'LEFT', right: 'RIGHT', full: 'FULL' };

export function JoinSim(props: SimProps<'join'>) {
  const s = props.step;
  return <JoinPlayground key={JSON.stringify([s.left, s.right, s.on, s.joins])} {...props} />;
}

function JoinPlayground({ step, onGoal }: SimProps<'join'>) {
  const types = step.joins?.length ? JOIN_TYPES.filter((t) => step.joins!.includes(t)) : JOIN_TYPES;
  const [type, setType] = useState<JoinType>(types[0]);
  const [tried, setTried] = useState<Set<JoinType>>(() => new Set([types[0]]));
  const [focus, setFocus] = useState<Focus>(null);
  const left = step.left as JoinTable;
  const right = step.right as JoinTable;
  const on = step.on;

  const result = useMemo(() => joinTables(left, right, on, type), [left, right, on, type]);
  const summary = useMemo(() => describeJoin(left, right, on, type), [left, right, on, type]);

  useEffect(() => {
    if (tried.size >= 2) onGoal(true);
  }, [tried, onGoal]);

  const choose = (t: JoinType) => {
    setType(t);
    setFocus(null);
    setTried((s) => (s.has(t) ? s : new Set(s).add(t)));
  };

  // What is highlighted, derived from the focused row.
  const hl = useMemo(() => {
    const L = new Set<number>();
    const R = new Set<number>();
    const res = new Set<number>();
    if (focus?.kind === 'result') {
      const row = result.rows[focus.idx];
      if (row) {
        if (row.left !== null) L.add(row.left);
        if (row.right !== null) R.add(row.right);
        res.add(focus.idx);
      }
    } else if (focus) {
      const side = focus.kind;
      (side === 'left' ? L : R).add(focus.idx);
      result.rows.forEach((row, k) => {
        if (row[side] === focus.idx) {
          res.add(k);
          if (row.left !== null) L.add(row.left);
          if (row.right !== null) R.add(row.right);
        }
      });
    }
    return { L, R, res, any: focus !== null };
  }, [focus, result]);

  const pairOn = (i: number, j: number) => {
    if (!focus) return false;
    if (focus.kind === 'result') {
      const row = result.rows[focus.idx];
      return row?.left === i && row?.right === j;
    }
    return focus.kind === 'left' ? focus.idx === i : focus.idx === j;
  };

  // Line geometry: measured from the rendered rows so it follows fonts and wrapping.
  const wrapRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const leftRows = useRef<(HTMLTableRowElement | null)[]>([]);
  const rightRows = useRef<(HTMLTableRowElement | null)[]>([]);
  const [geo, setGeo] = useState<{ l: number[]; r: number[]; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const g = gutterRef.current;
      if (!g || g.clientWidth === 0) return setGeo(null);
      const top = g.getBoundingClientRect().top;
      const mid = (el: HTMLElement | null) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top - top + r.height / 2;
      };
      setGeo({
        l: left.rows.map((_, i) => mid(leftRows.current[i])),
        r: right.rows.map((_, j) => mid(rightRows.current[j])),
        w: g.clientWidth,
        h: g.clientHeight,
      });
    };
    measure();
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [left, right]);

  const rowState = (side: 'left' | 'right', i: number): 'matched' | 'kept' | 'dropped' => {
    const matched = result.pairs.some((p) => (side === 'left' ? p[0] : p[1]) === i);
    if (matched) return 'matched';
    return keepsUnmatched(type, side) ? 'kept' : 'dropped';
  };
  const stateText = { matched: 'has a match', kept: 'no match, kept with NULLs', dropped: 'no match, dropped' };

  const onSegKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = types.indexOf(type);
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % types.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + types.length) % types.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = types.length - 1;
    if (n < 0) return;
    e.preventDefault();
    choose(types[n]);
    (e.currentTarget.querySelectorAll('button')[n] as HTMLButtonElement | undefined)?.focus();
  };

  const table = (t: JoinTable, side: 'left' | 'right', key: string) => {
    const keyIdx = t.columns.indexOf(key);
    const refs = side === 'left' ? leftRows : rightRows;
    const lit = side === 'left' ? hl.L : hl.R;
    return (
      <div className={`js-src js-${side}`}>
        <div className="js-src-name">
          <span className="js-tname">{t.name}</span>
          <span className="js-side muted small">{side === 'left' ? 'left' : 'right'}</span>
        </div>
        <div className="js-frame">
          <table aria-label={`${t.name} (${side} table)`}>
            <thead>
              <tr>
                {t.columns.map((c, ci) => (
                  <th key={c} scope="col" className={ci === keyIdx ? 'key' : undefined}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row, i) => {
                const st = rowState(side, i);
                return (
                  <tr
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    className={`js-row ${st}${lit.has(i) ? ' lit' : ''}${hl.any && !lit.has(i) ? ' faded' : ''}`}
                    aria-label={`${t.name} row ${row.map(formatCell).join(', ')}: ${stateText[st]}`}
                    onMouseEnter={() => setFocus({ kind: side, idx: i })}
                    onMouseLeave={() => setFocus(null)}
                  >
                    {row.map((v, ci) => (
                      <td key={ci} className={cellClass(v, ci === keyIdx)}>
                        {formatCell(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="joinsim">
      {types.length > 1 && (
        <div className="js-seg" role="radiogroup" aria-label="Join type" onKeyDown={onSegKey}>
          {types.map((t) => (
            <button
              type="button"
              key={t}
              role="radio"
              aria-checked={t === type}
              tabIndex={t === type ? 0 : -1}
              className={t === type ? 'on' : undefined}
              onClick={() => choose(t)}
            >
              <VennIcon type={t} />
              {SHORT[t]}
            </button>
          ))}
        </div>
      )}

      <CodeBlock code={joinSql(left, right, on, type)} lang="sql" className="js-sql" />

      <div className="js-tables" ref={wrapRef}>
        {table(left, 'left', on[0])}
        <div className="js-gutter" ref={gutterRef} aria-hidden="true">
          {geo && (
            <svg width={geo.w} height={geo.h}>
              {result.pairs.map(([i, j]) => {
                const y1 = geo.l[i];
                const y2 = geo.r[j];
                const w = geo.w;
                const active = pairOn(i, j);
                return (
                  <g key={`${i}-${j}`} className={`js-link${active ? ' lit' : ''}${hl.any && !active ? ' faded' : ''}`}>
                    <path d={`M4 ${y1} C${w / 2} ${y1} ${w / 2} ${y2} ${w - 4} ${y2}`} />
                    <circle cx={4} cy={y1} r={3.5} />
                    <circle cx={w - 4} cy={y2} r={3.5} />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        {table(right, 'right', on[1])}
      </div>

      <ul className="js-summary">
        {summary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="js-result">
        <div className="js-result-head">
          <span className="js-tname">Result</span>
          <span className="js-count" role="status">
            {JOIN_KEYWORD[type]}: {result.rows.length} row{result.rows.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="js-frame js-scroll">
          <table aria-label={`Result of the ${JOIN_KEYWORD[type]}`}>
            <thead>
              <tr>
                {result.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, k) => {
                const lit = hl.res.has(k);
                const nL = left.columns.length;
                return (
                  <tr
                    key={`${type}-${k}`}
                    className={`js-row${lit ? ' lit' : ''}${hl.any && !lit ? ' faded' : ''}`}
                    tabIndex={0}
                    aria-label={`Result row ${k + 1}: ${row.values.map(formatCell).join(', ')}`}
                    onMouseEnter={() => setFocus({ kind: 'result', idx: k })}
                    onMouseLeave={() => setFocus(null)}
                    onFocus={() => setFocus({ kind: 'result', idx: k })}
                    onBlur={() => setFocus(null)}
                    onClick={() => setFocus({ kind: 'result', idx: k })}
                  >
                    {row.values.map((v, ci) => (
                      <td key={ci} className={`${cellClass(v, false)}${ci === nL ? ' split' : ''}`}>
                        {formatCell(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {result.rows.length === 0 && <p className="muted small js-empty">No rows.</p>}
        </div>
        <p className="muted small js-note">Hover or tap a result row to see where it came from. Without ORDER BY, row order isn't guaranteed.</p>
      </div>
    </div>
  );
}

function cellClass(v: Cell, key: boolean): string {
  const cls: string[] = [];
  if (v === null) cls.push('null');
  else if (typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(v)) cls.push('num');
  if (key) cls.push('key');
  return cls.join(' ');
}

/** Two overlapping circles with the kept parts filled. */
function VennIcon({ type }: { type: JoinType }) {
  const fillL = type === 'left' || type === 'full';
  const fillR = type === 'right' || type === 'full';
  return (
    <svg className="js-venn" width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
      <defs>
        <clipPath id={`jsv-l-${type}`}>
          <circle cx="9" cy="8" r="7" />
        </clipPath>
      </defs>
      {fillL && <circle cx="9" cy="8" r="7" className="fill" />}
      {fillR && <circle cx="17" cy="8" r="7" className="fill" />}
      <circle cx="17" cy="8" r="7" className="fill" clipPath={`url(#jsv-l-${type})`} />
      <circle cx="9" cy="8" r="7" className="ring" />
      <circle cx="17" cy="8" r="7" className="ring" />
    </svg>
  );
}
