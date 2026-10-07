// The shared shell of every graded step: prompt, hint, "Why" feedback and the bottom check bar.
// Classic questions and the mini-games all use it, so they look and behave the same and all feed spaced review.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XP } from '../lib/storage';
import type { QuestionStep } from '../types';
import { InlineMarkdown, Markdown } from './Markdown';
import { Icon } from './icons';
import { useT } from '../i18n/react';

export type Status = 'answering' | 'wrong' | 'correct' | 'revealed';

/** What QuestionView passes to every graded step component. */
export interface QuestionProps<S extends QuestionStep = QuestionStep> {
  step: S;
  /** learn: retries + hints allowed. test: one attempt, then the answer is shown. */
  mode: 'learn' | 'test';
  shuffle?: boolean;
  context?: ReactNode;
  /** Called when the learner presses Continue. Reports whether the *first* attempt was right. */
  onDone: (firstTryCorrect: boolean) => void;
}

export interface CheckFlow {
  status: Status;
  /** Result of the first attempt; null until the learner has attempted. */
  first: boolean | null;
  finished: boolean;
  tone: 'right' | 'wrong' | 'revealed' | 'neutral';
  /** Record an attempt: correct, or wrong (learn: retry allowed; test: answer revealed). */
  grade: (ok: boolean) => void;
  /** Back to answering after a wrong attempt. */
  retry: () => void;
  /** Give up and show the answer. */
  reveal: () => void;
  done: () => void;
}

export function useCheckFlow(mode: 'learn' | 'test', onDone: (firstTryCorrect: boolean) => void): CheckFlow {
  const [status, setStatus] = useState<Status>('answering');
  const [first, setFirst] = useState<boolean | null>(null);
  return {
    status,
    first,
    finished: status === 'correct' || status === 'revealed',
    tone: status === 'correct' ? 'right' : status === 'wrong' ? 'wrong' : status === 'revealed' ? 'revealed' : 'neutral',
    grade: (ok) => {
      if (first === null) setFirst(ok);
      setStatus(ok ? 'correct' : mode === 'test' ? 'revealed' : 'wrong');
    },
    retry: () => setStatus('answering'),
    reveal: () => {
      if (first === null) setFirst(false);
      setStatus('revealed');
    },
    done: () => onDone(first ?? false),
  };
}

interface FrameProps {
  step: QuestionStep;
  flow: CheckFlow;
  mode: 'learn' | 'test';
  context?: ReactNode;
  /** The small uppercase label above the prompt, e.g. "Put these in order". */
  kind: string;
  /** Whether Check is enabled right now. */
  canCheck: boolean;
  onCheck: () => void;
  /** Reset the step's own state for another attempt (the frame handles status and hint). */
  onRetry?: () => void;
  /** Shown above "Why" when the answer is revealed. Defaults to nothing. */
  answer?: ReactNode;
  /** Set to false when the step handles Enter itself. */
  enterKey?: boolean;
  /** Label for the check button (default: common.check). */
  checkLabel?: string;
  children: ReactNode;
}

export function QuestionFrame({
  step,
  flow,
  mode,
  context,
  kind,
  canCheck,
  onCheck,
  onRetry,
  answer,
  enterKey = true,
  checkLabel,
  children,
}: FrameProps) {
  const { t, tx } = useT();
  const [showHint, setShowHint] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const { status, first, finished, tone } = flow;

  useEffect(() => {
    if (status !== 'answering') feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [status]);

  const retry = () => {
    flow.retry();
    onRetry?.();
    if (step.hint) setShowHint(true);
  };
  const check = () => {
    if (status === 'answering' && canCheck) onCheck();
  };
  const primary = finished ? flow.done : status === 'wrong' ? retry : check;

  // Enter checks / retries / continues (Ctrl/⌘+Enter inside a textarea).
  useEffect(() => {
    if (!enterKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
      if (e.target instanceof HTMLTextAreaElement && !e.metaKey && !e.ctrlKey) return;
      e.preventDefault();
      primary();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="question">
        {context}
        <span className="q-kind">{kind}</span>
        <div className="q-prompt">
          <Markdown text={step.prompt} />
        </div>

        {children}

        {mode === 'learn' && step.hint && status === 'answering' && !showHint && (
          <button className="link hint-link" onClick={() => setShowHint(true)}>
            <Icon name="bulb" size={16} /> {t('lesson.frame.needHint')}
          </button>
        )}
        {showHint && step.hint && status !== 'correct' && (
          <div className="hint">
            {tx('lesson.frame.hintLine', { hint: <InlineMarkdown text={step.hint} /> }, { b: (c) => <strong>{c}</strong> })}
          </div>
        )}

        <div ref={feedbackRef}>
          {finished && (
            <div className={`explanation ${tone}`}>
              {status === 'revealed' && answer}
              <span className="eyebrow">{t('lesson.frame.why')}</span>
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
                <strong>{first ? t('common.correct') : t('lesson.frame.gotIt')}</strong>
                <span>{first ? t('lesson.frame.xpGained', { xp: XP.correct }) : t('lesson.frame.secondTries')}</span>
              </div>
            </>
          )}
          {status === 'wrong' && (
            <>
              <span className="bb-icon">✗</span>
              <div>
                <strong>{t('lesson.frame.notQuite')}</strong>
                <span>{t('lesson.frame.retryNudge')}</span>
              </div>
            </>
          )}
          {status === 'revealed' && (
            <>
              <span className="bb-icon">i</span>
              <div>
                <strong>{mode === 'test' && first === false ? t('lesson.frame.incorrect') : t('lesson.frame.heresAnswer')}</strong>
                <span>{t('lesson.frame.readWhy')}</span>
              </div>
            </>
          )}
        </div>
        <div className="bb-actions">
          {status === 'wrong' && (
            <button className="btn ghost" onClick={flow.reveal}>
              {t('lesson.frame.showAnswer')}
            </button>
          )}
          <button className="btn primary big" onClick={primary} disabled={status === 'answering' && !canCheck}>
            {finished ? t('common.continue') : status === 'wrong' ? t('common.retry') : (checkLabel ?? t('common.check'))}
          </button>
        </div>
      </BottomBar>
    </>
  );
}

/** A "Correct answer: …" line for the revealed state. */
export function AnswerLine({ text }: { text: string }) {
  const { tx } = useT();
  return (
    <p className="answer-line">
      {tx('lesson.frame.correctAnswer', { answer: <InlineMarkdown text={text} /> }, { b: (c) => <strong>{c}</strong> })}
    </p>
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
