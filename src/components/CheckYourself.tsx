// The checker, at the end of a lesson: true or false claims about how the lesson's ideas connect (lib/checker.ts).
// Answer them all, then check: wrong false claims show the real link, and a missed true claim shows why it holds.
import { useId, useMemo, useState } from 'react';
import { linkLabels } from '../content';
import { lessonClaims } from '../lib/checker';
import type { Course } from '../types';
import { InlineMarkdown } from './Markdown';
import { useT } from '../i18n/react';

export function CheckYourself({ course, lessonId }: { course: Course; lessonId: string }) {
  const { t } = useT();
  const uid = useId();
  const claims = useMemo(
    () =>
      lessonClaims(course.concepts ?? [], course.links ?? [], linkLabels(course.id), lessonId, `${course.id}/${lessonId}`, 6, course.lessons.map((l) => l.id)),
    [course, lessonId],
  );
  // Answers by claim index; the claims are fixed for a lesson, so the index is stable.
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [checked, setChecked] = useState(false);
  if (!claims.length) return null;

  const allAnswered = claims.every((_, i) => answers[i] !== undefined);
  // Answers can change until Check; "Try again" starts over.
  const locked = checked;
  const right = claims.filter((c, i) => answers[i] === c.truth).length;
  const concepts = new Map((course.concepts ?? []).map((c) => [c.id, c]));
  const labelOf = (id: string) => concepts.get(id)?.label ?? id;

  const pick = (i: number, value: boolean) => {
    if (!locked) setAnswers((a) => ({ ...a, [i]: value }));
  };
  const retry = () => {
    setAnswers({});
    setChecked(false);
  };

  return (
    <section className="check-yourself">
      <span className="eyebrow">{t('lesson.check.eyebrow')}</span>
      <p>{t('lesson.check.intro')}</p>
      <ol className="claims">
        {claims.map((c, i) => {
          const a = answers[i];
          const ok = a === c.truth;
          const link = course.links?.[c.link];
          const sentence = (
            <>
              <strong>{labelOf(c.from)}</strong> {link?.label} <strong>{labelOf(c.to)}</strong>
            </>
          );
          return (
            <li key={i} className={`claim ${checked ? (ok ? 'right' : 'wrong') : ''}`}>
              {checked && (
                <span className="claim-mark">
                  <span aria-hidden>{ok ? '✓' : '✗'}</span>
                  <span className="sr-only">{t(ok ? 'lesson.check.markRight' : 'lesson.check.markWrong')}</span>
                </span>
              )}
              <p className="claim-text" id={`${uid}-${i}`}>
                {sentence}
              </p>
              <div className="claim-buttons" role="group" aria-labelledby={`${uid}-${i}`}>
                <button type="button" className="btn claim-btn" aria-pressed={a === true} disabled={locked} onClick={() => pick(i, true)}>
                  {t('lesson.check.true')}
                </button>
                <button type="button" className="btn claim-btn" aria-pressed={a === false} disabled={locked} onClick={() => pick(i, false)}>
                  {t('lesson.check.false')}
                </button>
              </div>
              {checked && !ok && (
                <div className="claim-why small">
                  {!c.truth && link ? (
                    <p>
                      <strong>{t('lesson.check.actually')}</strong>{' '}
                      <strong>{labelOf(link.from)}</strong> {link.label} <strong>{labelOf(link.to)}</strong>
                    </p>
                  ) : (
                    <p>
                      <strong>{t('lesson.check.isTrue')}</strong>
                      {concepts.get(c.to)?.summary && (
                        <>
                          {' '}
                          <InlineMarkdown text={concepts.get(c.to)!.summary!} />
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="claim-bar">
        {checked ? (
          <button type="button" className="btn ghost" onClick={retry}>
            {t('lesson.check.retry')}
          </button>
        ) : (
          <button type="button" className="btn primary" disabled={!allAnswered} onClick={() => setChecked(true)}>
            {t('lesson.check.check')}
          </button>
        )}
      </div>
      <div role="status" className="claim-status">
        {checked && (
          <strong className="claim-score">{t('lesson.check.score', { right, count: claims.length })}</strong>
        )}
      </div>
    </section>
  );
}
