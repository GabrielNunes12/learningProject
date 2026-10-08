// The clerk, at the end of a session: what the answers showed (solid, lucky guesses, to fix), the foundation behind
// repeated misses (lib/clerk.ts), and what is due next. Written from the session's own answers, no AI. Copyable.
import { useMemo, useState } from 'react';
import { prerequisiteGraph } from '../content';
import { sessionNotes, type ClerkConcept, type ClerkItem } from '../lib/clerk';
import { dueKeys, useProgress } from '../lib/storage';
import { href } from '../lib/router';
import { InlineMarkdown } from './Markdown';
import { useT } from '../i18n/react';

const DAY = 86_400_000;
const key = ({ courseId, concept }: ClerkConcept) => `${courseId}/${concept.id}`;

export function SessionNotes({ items }: { items: ClerkItem[] }) {
  const { t, tx, list } = useT();
  const p = useProgress();
  const [copied, setCopied] = useState(false);
  const notes = useMemo(() => sessionNotes(items, prerequisiteGraph), [items]);
  const tagged = items.some((i) => i.concepts.length > 0);

  const now = Date.now();
  const dueNow = dueKeys(p, now).length;
  const dueLater = dueKeys(p, now + DAY).length - dueNow;
  const next = (
    <ul className="clerk-next">
      {dueNow > 0 && (
        <li>
          <a href={href('review')}>{t('lesson.clerk.dueNow', { count: dueNow })}</a>
        </li>
      )}
      {dueLater > 0 && <li>{t('lesson.clerk.dueTomorrow', { count: dueLater })}</li>}
      {dueNow === 0 && dueLater === 0 && <li>{t('lesson.clerk.upToDate')}</li>}
    </ul>
  );

  // The same notes as plain text, one line per item. Root line tags are dropped.
  const copyText = () => {
    const base = window.location.href.split('#')[0];
    const labels = (xs: ClerkConcept[]) => list(xs.map((x) => x.concept.label));
    const lines = [t('lesson.clerk.eyebrow')];
    if (notes.solid.length) lines.push(t('lesson.clerk.line', { label: t('lesson.clerk.solid'), value: labels(notes.solid) }));
    if (notes.guessed.length) lines.push(t('lesson.clerk.line', { label: t('lesson.clerk.guessed'), value: labels(notes.guessed) }), t('lesson.clerk.guessedNote'));
    if (notes.missed.length) {
      lines.push(t('lesson.clerk.missed'));
      const open = t('lesson.clerk.openLesson');
      for (const m of notes.missed) {
        const url = base + href('course', m.courseId, 'lesson', m.concept.lesson);
        const line = m.concept.summary
          ? t('lesson.clerk.toFix', { label: m.concept.label, summary: m.concept.summary, open, url })
          : t('lesson.clerk.line', { label: m.concept.label, value: `${open} (${url})` });
        lines.push(`- ${line}`);
      }
    }
    if (notes.root) {
      const { root, explains } = notes.root;
      lines.push(t('lesson.clerk.root', { count: explains.length, items: list(explains.map((c) => c.label)), root: root.label }).replace(/<\/?b>/g, ''));
    }
    if (dueNow) lines.push(t('lesson.clerk.dueNow', { count: dueNow }));
    if (dueLater) lines.push(t('lesson.clerk.dueTomorrow', { count: dueLater }));
    if (!dueNow && !dueLater) lines.push(t('lesson.clerk.upToDate'));
    return lines.join('\n');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard (insecure page or permission denied): the notes stay on screen.
    }
  };

  // Nothing tagged to learn from: only what is due next.
  if (!tagged) return <section className="session-notes">{next}</section>;

  return (
    <section className="session-notes">
      <span className="eyebrow">{t('lesson.clerk.eyebrow')}</span>
      {notes.solid.length > 0 && (
        <div className="clerk-group">
          <strong>{t('lesson.clerk.solid')}</strong>
          <ul className="clerk-list clerk-solid">
            {notes.solid.map((c) => (
              <li key={key(c)}>{c.concept.label}</li>
            ))}
          </ul>
        </div>
      )}
      {notes.guessed.length > 0 && (
        <div className="clerk-group">
          <strong>{t('lesson.clerk.guessed')}</strong>
          <p>{t('lesson.clerk.guessedNote')}</p>
          <ul className="clerk-list clerk-guessed">
            {notes.guessed.map((c) => (
              <li key={key(c)}>{c.concept.label}</li>
            ))}
          </ul>
        </div>
      )}
      {notes.missed.length > 0 && (
        <div className="clerk-group">
          <strong>{t('lesson.clerk.missed')}</strong>
          <ul className="clerk-list clerk-missed">
            {notes.missed.map((c) => (
              <li key={key(c)}>
                <strong>{c.concept.label}</strong>
                {c.concept.summary && (
                  <>
                    {' · '}
                    <InlineMarkdown text={c.concept.summary} />
                  </>
                )}
                <br />
                <a href={href('course', c.courseId, 'lesson', c.concept.lesson)}>{t('lesson.clerk.openLesson')}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {notes.root && (
        <p className="clerk-root">
          {tx('lesson.clerk.root', { count: notes.root.explains.length, items: list(notes.root.explains.map((c) => c.label)), root: notes.root.root.label }, {
            b: (text) => <strong>{text}</strong>,
          })}
        </p>
      )}
      {next}
      <div className="clerk-bar">
        <button type="button" className="btn" onClick={copy}>
          {copied ? t('lesson.clerk.copied') : t('lesson.clerk.copy')}
        </button>
      </div>
    </section>
  );
}
