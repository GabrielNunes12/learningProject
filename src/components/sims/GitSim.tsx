// The Git playground: type real Git commands into a small terminal and watch the commit graph redraw.
// The model (commits, branches, HEAD, merges) lives in src/lib/gitsim.ts.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import {
  checkGoal,
  describeGraph,
  GRAPH,
  initialState,
  labelText,
  layoutGraph,
  runCommand,
  setupState,
  type GitGoal,
  type GitState,
  type OutLine,
  type Orientation,
} from '../../lib/gitsim';
import type { SimProps } from './SimStepView';
import './GitSim.css';

interface Entry {
  id: number;
  branch: string;
  cmd: string;
  lines: OutLine[];
}

const COMMIT_PLACEHOLDER = 'Describe your change';
const NARROW = 520;

export function GitSim(props: SimProps<'git'>) {
  // Remount (fresh repo) whenever the step's setup or goal changes.
  const key = JSON.stringify([props.step.setup ?? [], props.step.goal ?? null]);
  return <GitPlayground key={key} {...props} />;
}

function startState(setup: string[] | undefined): GitState {
  try {
    return setupState(setup);
  } catch (e) {
    console.warn(e);
    return initialState();
  }
}

function GitPlayground({ step, onGoal }: SimProps<'git'>) {
  const start = useMemo(() => startState(step.setup), [step.setup]);
  const [state, setState] = useState(start);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const histPos = useRef<number | null>(null);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = useWidth(wrapRef);
  const orientation: Orientation = width > 0 && width < NARROW ? 'vertical' : 'horizontal';

  useEffect(() => {
    onGoal(checkGoal(state, step.goal));
  }, [state, step.goal, onGoal]);

  useLayoutEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    setInput('');
    histPos.current = null;
    if (!cmd) return;
    setHistory((h) => (h[h.length - 1] === cmd ? h : [...h, cmd]));
    const r = runCommand(state, cmd);
    if (r.clear) {
      setEntries([]);
      return;
    }
    setEntries((es) => [...es, { id: nextId.current++, branch: state.head, cmd, lines: r.lines }]);
    setState(r.state);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (history.length === 0) return;
      e.preventDefault();
      let p = histPos.current;
      if (e.key === 'ArrowUp') p = p === null ? history.length - 1 : Math.max(0, p - 1);
      else p = p === null ? null : p + 1 >= history.length ? null : p + 1;
      histPos.current = p;
      setInput(p === null ? '' : history[p]);
    } else if (e.key === 'Escape') {
      setInput('');
      histPos.current = null;
    }
  };

  const fill = (cmd: string) => {
    setInput(cmd);
    histPos.current = null;
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const i = cmd.indexOf(COMMIT_PLACEHOLDER);
      if (i >= 0) el.setSelectionRange(i, i + COMMIT_PLACEHOLDER.length);
      else el.setSelectionRange(cmd.length, cmd.length);
    });
  };

  const reset = () => {
    setState(start);
    setEntries([]);
    setInput('');
    histPos.current = null;
  };

  const chips = suggestions(state, step.goal);

  return (
    <div className="gitsim" ref={wrapRef}>
      <GitGraph state={state} orientation={orientation} />

      <div className="gs-term">
        <div className="gs-term-bar">
          <span className="gs-term-title">Terminal</span>
          <button type="button" className="btn ghost small" onClick={reset} disabled={entries.length === 0 && state === start}>
            Start over
          </button>
        </div>
        <div className="gs-screen" ref={screenRef} role="log" aria-label="Terminal output" tabIndex={0}>
          {entries.length === 0 && (
            <div className="gs-line hint">Type a Git command and press Enter. Tap a suggestion to fill it in, or type help.</div>
          )}
          {entries.map((e) => (
            <div className="gs-entry" key={e.id}>
              <div className="gs-cmd">
                <span className="gs-prompt" aria-hidden="true">
                  ({e.branch}) $
                </span>{' '}
                {e.cmd}
              </div>
              {e.lines.map((l, i) => (
                <div className={`gs-line ${l.kind}`} key={i}>
                  {l.text}
                </div>
              ))}
            </div>
          ))}
        </div>
        <form
          className="gs-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
        >
          <label className="gs-input-label">
            <span className="gs-prompt" aria-hidden="true">
              ({state.head}) $
            </span>
            <span className="sr-only">Git command (on branch {state.head})</span>
            <input
              ref={inputRef}
              className="gs-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                histPos.current = null;
              }}
              onKeyDown={onKeyDown}
              placeholder="git status"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
            />
          </label>
          <button type="submit" className="btn primary small">
            Run
          </button>
        </form>
      </div>

      <div className="gs-chips" role="group" aria-label="Command suggestions (fill the input)">
        {chips.map((c) => (
          <button type="button" key={c} className="gs-chip" onClick={() => fill(c)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Context-aware command suggestions: they only fill the input, the learner still presses Enter. */
function suggestions(s: GitState, goal: GitGoal | undefined): string[] {
  const out: string[] = [];
  const add = (c: string) => !out.includes(c) && out.push(c);
  const wanted = new Set<string>(goal?.branches ?? []);
  for (const m of goal?.merged ?? []) wanted.add(m.from).add(m.into);
  for (const b of Object.keys(goal?.minCommits ?? {})) wanted.add(b);
  for (const b of wanted) if (!(b in s.branches)) add(`git switch -c ${b}`);
  add(`git commit -m "${COMMIT_PLACEHOLDER}"`);
  for (const m of goal?.merged ?? []) {
    if (!(m.from in s.branches) || !(m.into in s.branches)) continue;
    if (s.head === m.into) add(`git merge ${m.from}`);
    else add(`git switch ${m.into}`);
  }
  for (const b of Object.keys(s.branches).sort()) if (b !== s.head && out.length < 5) add(`git switch ${b}`);
  add('git log --oneline');
  add('git branch');
  add('git status');
  return out.slice(0, 8);
}

function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

const laneColor = (lane: number) => `var(--gs-lane-${lane % 6})`;

function GitGraph({ state, orientation }: { state: GitState; orientation: Orientation }) {
  const g = useMemo(() => layoutGraph(state, orientation), [state, orientation]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const r = 9;
  const horizontal = orientation === 'horizontal';

  // Keep the newest commit in view.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && horizontal) el.scrollLeft = el.scrollWidth;
  }, [g, horizontal]);

  return (
    <div className={`gs-graph ${orientation}`} ref={scrollRef}>
      <svg width={g.width} height={g.height} viewBox={`0 0 ${g.width} ${g.height}`} role="img" aria-label={`Commit graph: ${describeGraph(state)}`}>
        <g className="gs-edges">
          {g.edges.map((e) => (
            <path key={e.key} d={e.d} className="gs-edge" style={{ stroke: laneColor(e.lane) }} />
          ))}
        </g>
        {g.nodes.map((n) => (
          <g key={n.id} className="gs-node" style={{ transform: `translate(${n.x}px, ${n.y}px)` }}>
            <title>{`${n.id} ${n.message}`}</title>
            <g className="gs-node-pop">
              {n.isHead && <circle r={r + 5} className="gs-head-ring" style={{ stroke: laneColor(n.lane) }} />}
              <circle r={r} className={`gs-dot${n.isMerge ? ' merge' : ''}`} style={{ stroke: laneColor(n.lane) }} />
              {n.isMerge && <circle r={r - 4.5} style={{ fill: laneColor(n.lane) }} />}
            </g>
            {horizontal ? (
              <text className="gs-hash" y={r + 15} textAnchor="middle">
                {n.id}
              </text>
            ) : (
              <text className="gs-row-text" x={n.textX - n.x} y={4}>
                <tspan className="gs-hash">{n.id}</tspan> {n.message}
              </text>
            )}
          </g>
        ))}
        {g.labels.map((l) => (
          <g key={l.branch} className={`gs-pill${l.head ? ' head' : ''}`} style={{ transform: `translate(${l.x}px, ${l.y}px)` }}>
            <rect width={l.width} height={GRAPH.pillH} rx={GRAPH.pillH / 2} style={l.head ? { fill: laneColor(l.lane), stroke: laneColor(l.lane) } : { stroke: laneColor(l.lane) }} />
            <text x={l.width / 2} y={GRAPH.pillH / 2 + 4} textAnchor="middle">
              {labelText(l.branch, l.head)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
