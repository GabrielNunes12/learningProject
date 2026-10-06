import { useEffect, useMemo, useRef, useState } from 'react';
import { answerLabel, checkAnswer, isBugLine, shuffled } from '../lib/answers';
import type { ClassicQuestionStep } from '../types';
import { BucketsGame } from './games/BucketsGame';
import { OrderGame } from './games/OrderGame';
import { TraceGame } from './games/TraceGame';
import { CodeBlock, highlightLines, InlineMarkdown } from './Markdown';
import { AnswerLine, QuestionFrame, useCheckFlow, type QuestionProps } from './QuestionFrame';

export { BottomBar } from './QuestionFrame';

/** Renders any graded step: a classic question or a mini-game. */
export function QuestionView(props: QuestionProps) {
  const { step } = props;
  switch (step.type) {
    case 'order':
      return <OrderGame {...props} step={step} />;
    case 'buckets':
      return <BucketsGame {...props} step={step} />;
    case 'trace':
      return <TraceGame {...props} step={step} />;
    default:
      return <ClassicQuestion {...props} step={step} />;
  }
}

const KIND_LABEL = {
  mcq: 'Choose one',
  numeric: 'Enter a number',
  text: 'Type your answer',
  output: 'Predict the output',
  bug: 'Find the bug: click the broken line',
};

function ClassicQuestion({ step, mode, shuffle = false, context, onDone }: QuestionProps<ClassicQuestionStep>) {
  // Multiple-choice options: the choices of an mcq, or the candidate fixes of a bug hunt.
  const choices = step.type === 'mcq' ? step.choices : step.type === 'bug' ? step.fixes : null;
  const order = useMemo(() => {
    if (!choices) return [];
    const idx = choices.map((_, i) => i);
    // Fixes are always shuffled: authors tend to write the right one first.
    return shuffle || step.type === 'bug' ? shuffled(idx) : idx;
  }, [choices, shuffle, step.type]);
  const codeLines = useMemo(() => (step.type === 'bug' ? highlightLines(step.code, step.language) : []), [step]);

  const flow = useCheckFlow(mode, onDone);
  const { status, finished, tone } = flow;
  const [selected, setSelected] = useState<number | null>(null);
  const [input, setInput] = useState('');
  // Bug hunts have two parts: find the line, then pick the fix.
  const [line, setLine] = useState<number | null>(null);
  const [lineFound, setLineFound] = useState(false);
  const fixesRef = useRef<HTMLParagraphElement>(null);

  const pickingLine = step.type === 'bug' && !lineFound;
  const showChoices = step.type === 'mcq' || (step.type === 'bug' && (lineFound || finished));
  const choiceAnswer = step.type === 'mcq' || step.type === 'bug' ? step.answer : -1;
  const canCheck = pickingLine ? line !== null : choices ? selected !== null : input.trim() !== '';

  useEffect(() => {
    if (lineFound) fixesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [lineFound]);

  function check() {
    if (step.type === 'bug' && pickingLine) {
      if (isBugLine(step, line)) setLineFound(true);
      else flow.grade(false);
      return;
    }
    flow.grade(checkAnswer(step, choices ? selected : input));
  }

  function retry() {
    if (pickingLine) setLine(null);
    else if (choices) setSelected(null);
  }

  // Keyboard: 1-9 picks a choice (Enter is handled by the frame).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        showChoices &&
        status === 'answering' &&
        /^[1-9]$/.test(e.key) &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        const pos = Number(e.key) - 1;
        if (pos < order.length) setSelected(order[pos]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <QuestionFrame
      step={step}
      flow={flow}
      mode={mode}
      context={context}
      kind={step.type === 'bug' && lineFound ? 'Now pick the fix' : KIND_LABEL[step.type]}
      canCheck={canCheck}
      onCheck={check}
      onRetry={retry}
      answer={
        step.type === 'output' ? (
          <div className="answer-line">
            <strong>It prints:</strong>
            <pre className="code">{step.output}</pre>
          </div>
        ) : (
          <AnswerLine text={answerLabel(step)} />
        )
      }
    >
        {step.type === 'output' && <CodeBlock code={step.code} lang={step.language} />}

        {step.type === 'bug' && (
          <>
            <div className="code code-lines" role="group" aria-label="Code: pick the line with the bug">
              {codeLines.map((nodes, i) => {
                const n = i + 1;
                const isBug = step.lines.includes(n);
                let cls = 'code-line';
                if (line === n) cls += ' selected';
                if ((lineFound || finished) && isBug) cls += ' correct';
                if (status !== 'answering' && !lineFound && line === n && !isBug) cls += ' incorrect';
                return (
                  <button
                    key={n}
                    className={cls}
                    aria-pressed={line === n}
                    aria-label={`Line ${n}`}
                    disabled={!pickingLine || status !== 'answering'}
                    onClick={() => setLine(n)}
                  >
                    <span className="line-no" aria-hidden>
                      {n}
                    </span>
                    <code>{step.code.split('\n')[i] === '' ? '\u200b' : nodes}</code>
                  </button>
                );
              })}
            </div>
            {step.error && (
              <div className="run-result">
                <span className="eyebrow">When you run it</span>
                <pre className="code">{step.error}</pre>
              </div>
            )}
            {lineFound && !finished && (
              <p className="line-found" ref={fixesRef}>
                ✓ Line {line} is the culprit. Which change fixes it?
              </p>
            )}
          </>
        )}

        {showChoices && choices ? (
          <div className="choices" role="radiogroup">
            {order.map((orig, pos) => {
              let cls = 'choice';
              if (selected === orig) cls += ' selected';
              if (finished && orig === choiceAnswer) cls += ' correct';
              if (status !== 'answering' && status !== 'correct' && selected === orig && orig !== choiceAnswer) cls += ' incorrect';
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
                  <InlineMarkdown text={choices[orig]} />
                </button>
              );
            })}
          </div>
        ) : step.type === 'output' ? (
          <div className={`answer-input ${tone}`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== 'answering'}
              placeholder="Type exactly what it prints"
              rows={Math.max(2, input.split('\n').length)}
              aria-label="Output"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </div>
        ) : step.type === 'numeric' || step.type === 'text' ? (
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
        ) : null}
        {step.type === 'output' && status === 'answering' && (
          <p className="muted small kbd-tip">One line per printed line. Press Ctrl/⌘ + Enter to check.</p>
        )}

    </QuestionFrame>
  );
}
