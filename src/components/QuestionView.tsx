import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { answerLabel, checkAnswer, shuffled } from '../lib/answers';
import { XP } from '../lib/storage';
import type { QuestionStep } from '../types';
import { InlineMarkdown, Markdown } from './Markdown';

type Status = 'answering' | 'wrong' | 'correct' | 'revealed';

interface Props {
  step: QuestionStep;
  /** learn: retries + hints allowed. test: one attempt, then the answer is shown. */
  mode: 'learn' | 'test';
  shuffle?: boolean;
  context?: ReactNode;
  /** Called when the learner presses Continue. Reports whether the *first* attempt was right. */
  onDone: (firstTryCorrect: boolean) => void;
}

const KIND_LABEL = { mcq: 'Choose one', numeric: 'Enter a number', text: 'Type your answer' };

export function QuestionView({ step, mode, shuffle = false, context, onDone }: Props) {
  const order = useMemo(() => {
    if (step.type !== 'mcq') return [];
    const idx = step.choices.map((_, i) => i);
    return shuffle ? shuffled(idx) : idx;
  }, [step, shuffle]);

  const [selected, setSelected] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('answering');
  const [first, setFirst] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const finished = status === 'correct' || status === 'revealed';
  const canCheck = status === 'answering' && (step.type === 'mcq' ? selected !== null : input.trim() !== '');

  useEffect(() => {
    if (status !== 'answering') feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [status]);

  function check() {
    if (!canCheck) return;
    const ok = checkAnswer(step, step.type === 'mcq' ? selected : input);
    if (first === null) setFirst(ok);
    setStatus(ok ? 'correct' : mode === 'test' ? 'revealed' : 'wrong');
  }

  function retry() {
    setStatus('answering');
    if (step.type === 'mcq') setSelected(null);
    if (step.hint) setShowHint(true);
  }

  const primary = finished ? () => onDone(first ?? false) : status === 'wrong' ? retry : check;

  // Keyboard: 1-9 picks a choice, Enter checks / continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        primary();
      } else if (step.type === 'mcq' && status === 'answering' && /^[1-9]$/.test(e.key) && !(e.target instanceof HTMLInputElement)) {
        const pos = Number(e.key) - 1;
        if (pos < order.length) setSelected(order[pos]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tone = status === 'correct' ? 'right' : status === 'wrong' ? 'wrong' : status === 'revealed' ? 'revealed' : 'neutral';

  return (
    <>
      <div className="question">
        {context}
        <span className="q-kind">{KIND_LABEL[step.type]}</span>
        <div className="q-prompt">
          <Markdown text={step.prompt} />
        </div>

        {step.type === 'mcq' ? (
          <div className="choices" role="radiogroup">
            {order.map((orig, pos) => {
              let cls = 'choice';
              if (selected === orig) cls += ' selected';
              if (finished && orig === step.answer) cls += ' correct';
              if (status !== 'answering' && status !== 'correct' && selected === orig && orig !== step.answer) cls += ' incorrect';
              return (
                <button
                  key={orig}
                  className={cls}
                  role="radio"
                  aria-checked={selected === orig}
                  disabled={status !== 'answering'}
                  onClick={() => setSelected(orig)}
                >
                  <span className="choice-key">{pos + 1}</span>
                  <InlineMarkdown text={step.choices[orig]} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className={`answer-input ${tone}`}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== 'answering'}
              placeholder={step.type === 'numeric' ? 'e.g. 0.25, 1/4 or 42' : 'Type your answer'}
              inputMode={step.type === 'numeric' ? 'decimal' : 'text'}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {step.type === 'numeric' && step.unit && <span className="answer-unit">{step.unit}</span>}
          </div>
        )}

        {mode === 'learn' && step.hint && status === 'answering' && !showHint && (
          <button className="link hint-link" onClick={() => setShowHint(true)}>
            💡 Need a hint?
          </button>
        )}
        {showHint && step.hint && status !== 'correct' && (
          <div className="hint">
            <strong>Hint:</strong> <InlineMarkdown text={step.hint} />
          </div>
        )}

        <div ref={feedbackRef}>
          {finished && (
            <div className={`explanation ${tone}`}>
              {status === 'revealed' && (
                <p className="answer-line">
                  <strong>Correct answer:</strong> <InlineMarkdown text={answerLabel(step)} />
                </p>
              )}
              <span className="eyebrow">Why</span>
              <Markdown text={step.explanation} />
            </div>
          )}
        </div>
      </div>

      <BottomBar tone={tone}>
        <div className="bb-status" role="status">
          {status === 'correct' && (
            <>
              <span className="bb-icon">✓</span>
              <div>
                <strong>{first ? 'Correct!' : 'Got it!'}</strong>
                <span>{first ? `+${XP.correct} XP` : 'Second tries count too.'}</span>
              </div>
            </>
          )}
          {status === 'wrong' && (
            <>
              <span className="bb-icon">✗</span>
              <div>
                <strong>Not quite.</strong>
                <span>Think it through once more — retries are where learning happens.</span>
              </div>
            </>
          )}
          {status === 'revealed' && (
            <>
              <span className="bb-icon">i</span>
              <div>
                <strong>{mode === 'test' && first === false ? 'Incorrect' : 'Here’s the answer'}</strong>
                <span>Read why, and it'll come back in your reviews.</span>
              </div>
            </>
          )}
        </div>
        <div className="bb-actions">
          {status === 'wrong' && (
            <button className="btn ghost" onClick={() => setStatus('revealed')}>
              Show answer
            </button>
          )}
          <button className="btn primary big" onClick={primary} disabled={status === 'answering' && !canCheck}>
            {finished ? 'Continue' : status === 'wrong' ? 'Try again' : 'Check'}
          </button>
        </div>
      </BottomBar>
    </>
  );
}

/** Fixed action bar at the bottom of the screen. Portaled to <body> so animated ancestors can't trap it. */
export function BottomBar({ tone = 'neutral', children }: { tone?: string; children: ReactNode }) {
  return createPortal(
    <div className={`bottom-bar ${tone}`}>
      <div className="bottom-bar-inner">{children}</div>
    </div>,
    document.body,
  );
}
