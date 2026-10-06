// "Trace the code": step through a program line by line while a memory panel shows every variable.
// At some frames the new value is hidden and the learner predicts it. Graded once, when the last frame is reached:
// right only if every prediction was right on the first try.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { checkTraceValue, gameAnswerLabel } from '../../lib/answers';
import {
  allFirstTriesRight,
  changedItems,
  changedVars,
  hiddenVars,
  initialTrace,
  parseTraceValue,
  shownFrame,
  traceFinished,
  traceStep,
  type TraceAction,
  type TraceState,
} from '../../lib/trace';
import type { TraceStep } from '../../types';
import { highlightLines, InlineMarkdown } from '../Markdown';
import { AnswerLine, QuestionFrame, useCheckFlow, type QuestionProps } from '../QuestionFrame';
import './TraceGame.css';

const PLAY_DELAY_MS = 1100;

export function TraceGame({ step, mode, context, onDone }: QuestionProps<TraceStep>) {
  const flow = useCheckFlow(mode, onDone);
  const test = mode === 'test';
  const frames = step.frames;
  const last = frames.length - 1;
  const codeLines = useMemo(() => step.code.split('\n'), [step.code]);
  const highlighted = useMemo(() => highlightLines(step.code, step.language), [step.code, step.language]);

  const [state, setState] = useState<TraceState>(initialTrace);
  const stateRef = useRef(state);
  const [input, setInput] = useState('');
  const [playing, setPlaying] = useState(false);
  const stepRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const askRowRef = useRef<HTMLDivElement>(null);

  function dispatch(action: TraceAction) {
    const prev = stateRef.current;
    const next = traceStep(prev, action, frames);
    if (next === prev) return;
    stateRef.current = next;
    setState(next);
    if (next.asking !== null && prev.asking === null) {
      setInput('');
      setPlaying(false);
    }
    if (prev.asking !== null && next.asking === null) requestAnimationFrame(() => stepRef.current?.focus());
    // Reaching the end grades the whole trace, once.
    if (!traceFinished(prev, frames) && traceFinished(next, frames) && flow.status === 'answering') {
      flow.grade(allFirstTriesRight(next, frames));
    }
  }

  function reset() {
    stateRef.current = initialTrace;
    setState(initialTrace);
    setInput('');
    setPlaying(false);
  }

  function submit() {
    const s = stateRef.current;
    if (s.asking === null || input.trim() === '') return;
    const ok = checkTraceValue(frames[s.asking], input);
    dispatch({ type: 'answer', ok, test });
    if (!ok && !test) {
      inputRef.current?.select();
      if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        askRowRef.current?.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
          { duration: 320 },
        );
      }
    }
  }

  function togglePlay() {
    if (playing) return setPlaying(false);
    if (stateRef.current.pos >= last) dispatch({ type: 'seek', to: -1 });
    setPlaying(true);
  }

  // Learn mode: if every prediction was eventually right (some after a retry), the inline retries already were the
  // second attempt, so turn the miss straight into "Got it" instead of making the learner replay the whole trace.
  // The first attempt (recorded as wrong) still decides XP and spaced review.
  useLayoutEffect(() => {
    if (flow.status !== 'wrong' || !traceFinished(state, frames)) return;
    if (frames.every((f, i) => !f.ask || state.outcomes[i] !== 'missed')) flow.grade(true);
  }, [flow.status]);

  // Auto-step: stops at a prediction and at the end.
  useEffect(() => {
    if (!playing) return;
    if (state.asking !== null || state.pos >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => dispatch({ type: 'forward' }), PLAY_DELAY_MS);
    return () => window.clearTimeout(t);
  });

  // Keyboard: ← / → step, Enter steps (or continues / retries once graded). The prediction form handles its own Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const typing = (t instanceof HTMLInputElement && t.type !== 'range') || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;
      if (typing) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        dispatch({ type: e.key === 'ArrowRight' ? 'forward' : 'back' });
      } else if (e.key === 'Enter') {
        if (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement) return;
        e.preventDefault();
        if (flow.finished) flow.done();
        else if (flow.status === 'wrong') {
          flow.retry();
          reset();
        } else if (stateRef.current.asking !== null) inputRef.current?.focus();
        else dispatch({ type: 'forward' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const shown = shownFrame(state);
  const frame = shown >= 0 ? frames[shown] : null;
  const prevFrame = shown >= 1 ? frames[shown - 1] : null;
  const asking = state.asking !== null;
  const hidden = hiddenVars(frames, state);
  const changed = frame ? changedVars(prevFrame?.vars, frame.vars) : new Set<string>();
  const outcome = frame?.ask && !asking ? state.outcomes[shown] : undefined;
  const output = asking ? prevFrame?.out : frame?.out;
  const tries = asking ? (state.tries[shown] ?? 0) : 0;
  const finished = traceFinished(state, frames);
  const currentLine = frame?.line;
  const previousLine = prevFrame && prevFrame.line !== currentLine ? prevFrame.line : undefined;
  const askFrames = frames.map((f, i) => (f.ask ? i : -1)).filter((i) => i >= 0);

  const announce = !frame
    ? `Nothing has run yet. ${frames.length} steps.`
    : asking
      ? `Line ${frame.line} ran. Predict the value of ${frame.ask}.`
      : `Step ${shown + 1} of ${frames.length}: line ${frame.line} ran.` +
        ([...changed].length ? ` Changed: ${[...changed].map((k) => `${k} = ${frame.vars[k]}`).join(', ')}.` : ' Nothing changed.');

  return (
    <QuestionFrame
      step={step}
      flow={flow}
      mode={mode}
      context={context}
      kind="Trace the code"
      canCheck={false}
      onCheck={() => {}}
      onRetry={reset}
      enterKey={false}
      checkLabel="Step to the end"
      answer={<AnswerLine text={gameAnswerLabel(step)} />}
    >
      <div className="trace">
        <div className="trace-main">
          <div className="trace-code-col">
            <div className="trace-code" role="group" aria-label="Code">
              {highlighted.map((nodes, i) => {
                const n = i + 1;
                const cls = n === currentLine ? ' current' : n === previousLine ? ' previous' : '';
                return (
                  <div key={n} className={`trace-line${cls}`} aria-current={n === currentLine ? 'step' : undefined}>
                    <span className="trace-gutter" aria-hidden>
                      {n === currentLine ? '➜' : n === previousLine ? '•' : ''}
                    </span>
                    <span className="trace-no" aria-hidden>
                      {n}
                    </span>
                    <code>{codeLines[i] === '' ? '​' : nodes}</code>
                  </div>
                );
              })}
            </div>
            {frame?.note && !asking && (
              <p className="trace-note" key={shown}>
                <InlineMarkdown text={frame.note} />
              </p>
            )}
          </div>

          <div className="trace-mem-col">
            <section className="trace-memory" aria-label="Memory">
              <span className="eyebrow">Memory</span>
              {!frame ? (
                <p className="muted small trace-empty">Nothing has run yet. Press Step to run line {frames[0].line}.</p>
              ) : Object.keys(frame.vars).length === 0 ? (
                <p className="muted small trace-empty">No variables yet.</p>
              ) : (
                <ul className="trace-vars">
                  {Object.entries(frame.vars).map(([name, value]) => {
                    const isAsk = asking && frame.ask === name;
                    const isHidden = hidden.has(name);
                    let cls = 'trace-var';
                    if (isAsk) cls += ' asking';
                    else if (isHidden) cls += ' pending';
                    else if (changed.has(name)) cls += ' changed';
                    if (outcome && frame.ask === name) cls += outcome === 'missed' ? ' missed' : ' right';
                    return (
                      <li key={name} className={cls}>
                        <code className="trace-name">{name}</code>
                        <span className="trace-value" key={changed.has(name) ? `${name}@${shown}` : name}>
                          {isHidden ? (
                            <span className={isAsk ? 'tv-q' : 'tv-q soft'} aria-label={isAsk ? 'unknown: predict it' : 'hidden for now'}>
                              ?
                            </span>
                          ) : (
                            <ValueView value={value} prev={prevFrame?.vars[name]} />
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {output !== undefined && (
              <section className="trace-console" aria-label="Output">
                <span className="eyebrow">Output</span>
                <pre>{output}</pre>
              </section>
            )}
          </div>
        </div>

        {asking && frame?.ask && (
          <form
            className={`trace-ask${tries > 0 ? ' wrong' : ''}`}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label htmlFor={`trace-in-${step.id}`}>
              Line {frame.line} just ran. What is <code>{frame.ask}</code> now?
            </label>
            <div className="trace-ask-row" ref={askRowRef}>
              <input
                id={`trace-in-${step.id}`}
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type the value"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
              />
              <button type="submit" className="btn primary" disabled={input.trim() === ''}>
                Check
              </button>
            </div>
            {tries > 0 && (
              <p className="trace-ask-msg" role="alert">
                <span>✗ Not quite. Look at line {frame.line} again and retry.</span>
                <button type="button" className="link" onClick={() => dispatch({ type: 'reveal' })}>
                  Show me
                </button>
              </p>
            )}
          </form>
        )}

        {outcome && frame?.ask && (
          <p className={`trace-result ${outcome === 'missed' ? 'missed' : 'right'}`} role="status">
            {outcome === 'right' ? '✓ Right: ' : outcome === 'retried' ? '✓ Got it: ' : test ? '✗ Not this time: ' : 'Here it is: '}
            <code>
              {frame.ask} = {frame.vars[frame.ask]}
            </code>
          </p>
        )}

        <div className="trace-controls">
          <button
            className="btn small"
            onClick={() => {
              setPlaying(false);
              dispatch({ type: 'back' });
            }}
            disabled={shown < 0}
            aria-label="Back one step"
          >
            ← Back
          </button>
          <button className="btn small" onClick={togglePlay} disabled={asking} aria-pressed={playing}>
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          <button
            ref={stepRef}
            className="btn primary small"
            onClick={() => {
              setPlaying(false);
              dispatch({ type: 'forward' });
            }}
            disabled={asking || state.pos >= last}
            aria-label="Step forward"
          >
            Step →
          </button>
          <span className="trace-count" aria-hidden>
            {shown < 0 ? `Ready · ${frames.length} steps` : `Step ${shown + 1} of ${frames.length}`}
            {finished && ' · done'}
          </span>
        </div>

        <div
          className="trace-scrub"
          style={{ ['--reached' as string]: `${((state.reached + 1) / frames.length) * 100}%` }}
        >
          <input
            type="range"
            min={0}
            max={frames.length}
            value={shown + 1}
            onChange={(e) => {
              setPlaying(false);
              dispatch({ type: 'seek', to: Number(e.target.value) - 1 });
            }}
            onKeyDown={(e) => {
              // Arrow keys step like everywhere else (and can step into new frames, which the slider alone can't).
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                setPlaying(false);
                dispatch({ type: e.key === 'ArrowRight' ? 'forward' : 'back' });
              }
            }}
            aria-label="Frame"
            aria-valuetext={shown < 0 ? 'Not started' : `Step ${shown + 1} of ${frames.length}, line ${frame?.line}`}
          />
          <div className="trace-ticks" aria-hidden>
            {askFrames.map((i) => (
              <span
                key={i}
                className={`trace-tick ${state.outcomes[i] ?? ''}`}
                style={{ ['--at' as string]: (i + 1) / frames.length }}
                title="Prediction"
              />
            ))}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
        <p className="muted small trace-tip">
          {askFrames.length === 1 ? 'One value to predict' : `${askFrames.length} values to predict`} (marked on the timeline). Keys: ← →
          to step.
        </p>
      </div>
    </QuestionFrame>
  );
}

/** A printed value: lists as indexed boxes, maps as key → value chips, anything else as text. */
function ValueView({ value, prev }: { value: string; prev?: string }) {
  const v = parseTraceValue(value);
  if (v.kind === 'list') {
    if (v.items.length === 0) return <code className="tv-text">[]</code>;
    const fresh = changedItems(prev, value);
    return (
      <>
        <span className="sr-only">{value}</span>
        <span className="tv-list" aria-hidden>
          {v.items.map((item, i) => (
            <span key={i} className={`tv-cell${fresh[i] ? ' fresh' : ''}`}>
              <span className="tv-item">{item}</span>
              <span className="tv-idx">{i}</span>
            </span>
          ))}
        </span>
      </>
    );
  }
  if (v.kind === 'dict') {
    if (v.entries.length === 0) return <code className="tv-text">{value}</code>;
    return (
      <>
        <span className="sr-only">{value}</span>
        <span className="tv-dict" aria-hidden>
          {v.entries.map(([k, val], i) => (
            <span key={i} className="tv-chip">
              <span className="tv-key">{k}</span>
              <span className="tv-arrow">→</span>
              <span className="tv-item">{val}</span>
            </span>
          ))}
        </span>
      </>
    );
  }
  return <code className="tv-text">{v.text}</code>;
}
