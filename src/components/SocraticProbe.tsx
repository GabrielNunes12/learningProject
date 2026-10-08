// The step-back panel inside a question after the first wrong attempt: "which sentence describes the foundation?".
// It's a nudge: the learner still retries, and the panel stays (with its result) until the question is finished.
import type { ReactNode } from 'react';
import type { Probe } from '../lib/socratic';
import { InlineMarkdown } from './Markdown';
import { useT } from '../i18n/react';

interface SocraticProbeProps {
  probe: Probe;
  /** The choice the learner picked, or null before a pick. */
  pick: number | null;
  onPick: (index: number) => void;
}

export function SocraticProbe({ probe, pick, onPick }: SocraticProbeProps) {
  const { t, tx } = useT();
  const { concept, foundation, choices, answer } = probe;
  const picked = pick !== null;
  const right = pick === answer;

  let result: ReactNode = null;
  if (picked && right) result = t(foundation ? 'lesson.socratic.right' : 'lesson.socratic.rightSelf');
  if (picked && !right)
    result = (
      <>
        {tx(
          foundation ? 'lesson.socratic.gap' : 'lesson.socratic.gapSelf',
          { concept: concept.label, summary: <InlineMarkdown text={choices[answer]} /> },
          { b: (c) => <strong>{c}</strong> },
        )}{' '}
        {t('lesson.socratic.tryAgain')}
      </>
    );

  return (
    <div className="socratic">
      <span className="eyebrow">{t('lesson.socratic.eyebrow')}</span>
      <p className="socratic-question">
        {tx(
          foundation ? 'lesson.socratic.foundation' : 'lesson.socratic.self',
          { concept: concept.label },
          { b: (c) => <strong>{c}</strong> },
        )}
      </p>
      <div className="socratic-choices">
        {choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            className={[
              'socratic-choice',
              pick === i && 'picked',
              picked && i === answer && 'right',
              pick === i && i !== answer && 'wrong',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={picked}
            onClick={() => onPick(i)}
          >
            <InlineMarkdown text={choice} />
          </button>
        ))}
      </div>
      {picked && (
        <p className={`socratic-result ${right ? 'right' : 'wrong'}`} role="status">
          {result}
        </p>
      )}
    </div>
  );
}
