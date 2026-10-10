// The sparring partner, before a right answer's "Why": the learner argues against a wrong choice in their own words
// (lib/sparring.ts). It's never a gate: Skip or Continue reveals the reasoning. Nothing about the argument is stored.
import { useState, type KeyboardEvent } from 'react';
import { wordCount } from '../lib/listener';
import { SPAR_MIN_WORDS } from '../lib/sparring';
import { InlineMarkdown } from './Markdown';
import { useT } from '../i18n/react';

interface SparringProps {
  /** The choice to argue against. */
  choice: string;
  /** True when it is the learner's own earlier wrong pick; false when it is a wrong choice picked for them. */
  yours: boolean;
  /** Called once: with the argument, or null when the learner skips. */
  onDone: (argument: string | null) => void;
}

export function Sparring({ choice, yours, onDone }: SparringProps) {
  const { t, tx } = useT();
  const [text, setText] = useState('');
  const count = wordCount(text);
  const ready = count >= SPAR_MIN_WORDS;

  const argue = () => {
    if (ready) onDone(text.trim());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/⌘+Enter argues. Stop it here so the frame's window listener doesn't read it as Continue.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      argue();
    }
  };

  return (
    <section className="sparring">
      <span className="eyebrow">{t('lesson.spar.eyebrow')}</span>
      <p>{tx(yours ? 'lesson.spar.yours' : 'lesson.spar.friend', { choice: <InlineMarkdown text={choice} /> })}</p>
      <textarea
        value={text}
        rows={3}
        placeholder={t('lesson.spar.placeholder')}
        aria-label={t('lesson.spar.eyebrow')}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="sparring-bar">
        <span className="small muted">{t('lesson.spar.words', { count, min: SPAR_MIN_WORDS })}</span>
        <div className="sparring-actions">
          <button type="button" className="link small" onClick={() => onDone(null)}>
            {t('lesson.spar.skip')}
          </button>
          <button type="button" className="btn primary" disabled={!ready} onClick={argue}>
            {t('lesson.spar.argue')}
          </button>
        </div>
      </div>
    </section>
  );
}

/** After arguing: the lesson's reasoning comes next, and the learner rates their own argument. Nothing is stored. */
export function SparCompare({ argument }: { argument: string }) {
  const { t } = useT();
  const [pick, setPick] = useState<'holds' | 'missed' | null>(null);
  return (
    <div className="spar-rate">
      <p>{t('lesson.spar.compare')}</p>
      <blockquote className="spar-argument">{argument}</blockquote>
      <div className="spar-rate-buttons">
        <button
          type="button"
          className={`btn${pick === 'holds' ? ' on' : ''}`}
          aria-pressed={pick === 'holds'}
          onClick={() => setPick('holds')}
        >
          {t('lesson.spar.holds')}
        </button>
        <button
          type="button"
          className={`btn${pick === 'missed' ? ' on' : ''}`}
          aria-pressed={pick === 'missed'}
          onClick={() => setPick('missed')}
        >
          {t('lesson.spar.missed')}
        </button>
      </div>
      {pick && (
        <p className="small spar-note" role="status">
          {t(pick === 'holds' ? 'lesson.spar.holdsNote' : 'lesson.spar.missedNote')}
        </p>
      )}
    </div>
  );
}
