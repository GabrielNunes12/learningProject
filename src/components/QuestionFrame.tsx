// The shared shell of every graded step: prompt, hint, "Why" feedback and the bottom check bar.
// Classic questions and the mini-games all use it, so they look and behave the same and all feed spaced review.
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Confidence } from '../lib/mastery';
import { probeFor } from '../lib/socratic';
import { XP } from '../lib/storage';
import type { Concept, QuestionStep } from '../types';
import { InlineMarkdown, Markdown } from './Markdown';
import { Icon } from './icons';
import { SocraticProbe } from './SocraticProbe';
import { useT } from '../i18n/react';

export type Status = 'answering' | 'wrong' | 'correct' | 'revealed';

/** The course's concept graph, for the Socratic step-back (lib/socratic.ts). `seed` makes each question's probe stable. */
export const ConceptGraphContext = createContext<{ concepts: Concept[]; prereqs: Map<string, string[]>; seed: string } | null>(null);

/** What QuestionView passes to every graded step component. */
export interface QuestionProps<S extends QuestionStep = QuestionStep> {
  step: S;
  /** learn: retries + hints allowed. test: one attempt, then the answer is shown. */
  mode: 'learn' | 'test';
  shuffle?: boolean;
  context?: ReactNode;
  /** Called when the learner presses Continue. Reports whether the *first* attempt was right, and how sure they were. */
  onDone: (firstTryCorrect: boolean, confidence: Confidence) => void;
}

export interface CheckFlow {
  status: Status;
  /** Result of the first attempt; null until the learner has attempted. */
  first: boolean | null;
  /** How sure the learner was on the first attempt (set when it's made). */
  confidence: Confidence;
  /** The "I'm guessing" toggle, before the first attempt. */
  guessing: boolean;
  setGuessing: (on: boolean) => void;
  /** Wrong attempts so far. */
  misses: number;
  finished: boolean;
  tone: 'right' | 'wrong' | 'revealed' | 'neutral';
  /** Record an attempt: correct, or wrong (learn: retry allowed; test: answer revealed). */
  grade: (ok: boolean) => void;
  /** Back to answering after a wrong attempt. */
  retry: () => void;
  /** Give up and show the answer. */
  reveal: () => void;
  /** "I don't know" before any attempt (test mode): an honest miss, the answer is shown. */
  dontKnow: () => void;
  done: () => void;
}

export function useCheckFlow(mode: 'learn' | 'test', onDone: (firstTryCorrect: boolean, confidence: Confidence) => void): CheckFlow {
  const [status, setStatus] = useState<Status>('answering');
  const [first, setFirst] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<Confidence>('sure');
  const [guessing, setGuessing] = useState(false);
  const [misses, setMisses] = useState(0);
  return {
    status,
    first,
    confidence,
    guessing,
    setGuessing,
    misses,
    finished: status === 'correct' || status === 'revealed',
    tone: status === 'correct' ? 'right' : status === 'wrong' ? 'wrong' : status === 'revealed' ? 'revealed' : 'neutral',
    grade: (ok) => {
      if (first === null) {
        setFirst(ok);
        setConfidence(guessing ? 'guess' : 'sure');
      }
      if (!ok) setMisses((n) => n + 1);
      setStatus(ok ? 'correct' : mode === 'test' ? 'revealed' : 'wrong');
    },
    retry: () => setStatus('answering'),
    reveal: () => {
      if (first === null) setFirst(false);
      setStatus('revealed');
    },
    dontKnow: () => {
      if (first !== null) return;
      setFirst(false);
      setConfidence('unknown');
      setStatus('revealed');
    },
    done: () => onDone(first ?? false, confidence),
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
  // The step-back is for learning only: it appears after the first miss and stays until the question is finished.
  const graph = useContext(ConceptGraphContext);
  const probe = useMemo(
    () => (graph && mode === 'learn' ? probeFor(step.concepts, graph.concepts, graph.prereqs, `${graph.seed}/${step.id}`) : null),
    [graph, mode, step],
  );
  const [probePick, setProbePick] = useState<number | null>(null);

  useEffect(() => {
    if (status !== 'answering') feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [status]);

  // Effort first: the hint is offered only after a real attempt, and the answer only once the learner is stuck
  // (missed again after the hint was available, or missed with no hint to try).
  const retry = () => {
    flow.retry();
    onRetry?.();
  };
  const canShowAnswer = flow.misses >= (step.hint ? 2 : 1);
  const beforeFirstTry = status === 'answering' && first === null;
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

        {probe && flow.misses > 0 && !finished && <SocraticProbe probe={probe} pick={probePick} onPick={setProbePick} />}

        {mode === 'learn' && step.hint && status === 'answering' && first !== null && !showHint && (
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
          {beforeFirstTry && (
            <button
              type="button"
              className={`guess-toggle${flow.guessing ? ' on' : ''}`}
              aria-pressed={flow.guessing}
              title={t('lesson.frame.guessingTip')}
              onClick={() => flow.setGuessing(!flow.guessing)}
            >
              <span className="guess-box" aria-hidden>
                {flow.guessing ? '✓' : ''}
              </span>
              {t('lesson.frame.guessing')}
            </button>
          )}
          {status === 'correct' && (
            <>
              <span className="bb-icon">✓</span>
              <div>
                <strong>{first ? (flow.confidence === 'guess' ? t('lesson.frame.guessedRight') : t('common.correct')) : t('lesson.frame.gotIt')}</strong>
                <span>
                  {first
                    ? flow.confidence === 'guess'
                      ? t('lesson.frame.guessedRightNote')
                      : t('lesson.frame.xpGained', { xp: XP.correct })
                    : t('lesson.frame.secondTries')}
                </span>
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
                <strong>
                  {flow.confidence === 'unknown'
                    ? t('lesson.frame.honestMiss')
                    : mode === 'test' && first === false
                      ? t('lesson.frame.incorrect')
                      : t('lesson.frame.heresAnswer')}
                </strong>
                <span>{t('lesson.frame.readWhy')}</span>
              </div>
            </>
          )}
        </div>
        <div className="bb-actions">
          {status === 'wrong' && canShowAnswer && (
            <button className="btn ghost" onClick={flow.reveal}>
              {t('lesson.frame.showAnswer')}
            </button>
          )}
          {mode === 'test' && beforeFirstTry && (
            <button className="btn ghost" onClick={flow.dontKnow}>
              {t('lesson.frame.dontKnow')}
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
