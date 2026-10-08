// The listener, at the end of a lesson: explain it back in your own words, then see which of the lesson's ideas you
// covered and which one you missed (lib/listener.ts). It points; the learner fixes and compares again.
import { useState } from 'react';
import { explainBack, MIN_EXPLAIN_WORDS, wordCount, type ExplainBack as Result } from '../lib/listener';
import type { Concept } from '../types';
import { InlineMarkdown } from './Markdown';
import { useT } from '../i18n/react';

export function ExplainBack({ ideas }: { ideas: Concept[] }) {
  const { t } = useT();
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [compared, setCompared] = useState('');
  const count = wordCount(text);
  const ready = count >= MIN_EXPLAIN_WORDS && text !== compared;

  const compare = () => {
    if (!ready) return;
    setResult(explainBack(text, ideas));
    setCompared(text);
  };

  return (
    <section className="explain-back">
      <span className="eyebrow">{t('lesson.explain.eyebrow')}</span>
      <p>{t('lesson.explain.intro')}</p>
      <textarea
        value={text}
        rows={4}
        placeholder={t('lesson.explain.placeholder')}
        aria-label={t('lesson.explain.eyebrow')}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) compare();
        }}
      />
      <div className="explain-bar">
        <span className={`small ${count >= MIN_EXPLAIN_WORDS ? 'muted' : ''}`}>{t('lesson.explain.words', { count, min: MIN_EXPLAIN_WORDS })}</span>
        <button type="button" className="btn primary" disabled={!ready} onClick={compare}>
          {result ? t('lesson.explain.compareAgain') : t('lesson.explain.compare')}
        </button>
      </div>

      {result && (
        <div className="explain-result" role="status">
          <strong className="explain-score">{t('lesson.explain.score', { covered: result.covered.length, count: result.ideas.length })}</strong>
          {result.covered.length > 0 && (
            <ul className="explain-covered">
              {result.covered.map((c) => (
                <li key={c.id}>✓ {c.label}</li>
              ))}
            </ul>
          )}
          {result.missed.length > 0 ? (
            <>
              <span className="eyebrow">{t('lesson.explain.missed', { count: result.missed.length })}</span>
              <ul className="explain-missed">
                {result.missed.map((c) => (
                  <li key={c.id}>
                    <strong>{c.label}</strong>
                    {c.summary && (
                      <>
                        {' · '}
                        <InlineMarkdown text={c.summary} />
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <p className="small">{t('lesson.explain.fix')}</p>
            </>
          ) : (
            <p className="small">{t('lesson.explain.all')}</p>
          )}
          <details className="explain-model">
            <summary>{t('lesson.explain.model')}</summary>
            <ul>
              {ideas.map((c) => (
                <li key={c.id}>
                  <strong>{c.label}</strong>
                  {c.summary && (
                    <>
                      {' · '}
                      <InlineMarkdown text={c.summary} />
                    </>
                  )}
                </li>
              ))}
            </ul>
            <p className="small muted">{t('lesson.explain.modelNote')}</p>
          </details>
          <p className="small muted">{t('lesson.explain.note')}</p>
        </div>
      )}
    </section>
  );
}
