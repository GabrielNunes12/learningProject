// The notebook: every thinking sheet, grouped by course, and the thinking habit at a glance.
import { useMemo, useState, type ReactNode } from 'react';
import { courses, getCourse } from '../content';
import { t, type MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';
import { href } from '../lib/router';
import { thinkingStreak, useProgress, type Sheet } from '../lib/storage';
import { sessionKind, thinkingStats, type SessionKind } from '../lib/thinking';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { Page, PageHeader } from './Layout';
import { PaperSheet } from './paper/PaperSheet';
import './paper/Paper.css';

const DAY = 86_400_000;

const SESSION_TITLE: Record<SessionKind, { alone: MessageKey; course: MessageKey }> = {
  review: { alone: 'thinking.session.review', course: 'thinking.session.reviewCourse' },
  practice: { alone: 'thinking.session.practice', course: 'thinking.session.practiceCourse' },
  quiz: { alone: 'thinking.session.quiz', course: 'thinking.session.quizCourse' },
};

/**
 * A sheet's title in the current language. The stored title is the text at the time the sheet was made, so a lesson
 * sheet shows the lesson's current title and a session sheet a translated session name; the stored title is the fallback.
 */
export function sheetTitle(sheet: Sheet): string {
  const course = sheet.course ? getCourse(sheet.course) : undefined;
  if (sheet.lesson) return course?.lessons.find((l) => l.id === sheet.lesson)?.title ?? sheet.title;
  const kind = sessionKind(sheet.key);
  if (!kind || (sheet.course && !course)) return sheet.title;
  return course ? t(SESSION_TITLE[kind].course, { course: course.title }) : t(SESSION_TITLE[kind].alone);
}

function nextRedo(due: number, now = Date.now()) {
  const days = Math.round((due - now) / DAY);
  if (due <= now) return t('thinking.notebook.nextRedoNow');
  return days <= 0
    ? t('thinking.notebook.nextRedoToday')
    : days === 1
      ? t('thinking.notebook.nextRedoTomorrow')
      : t('thinking.notebook.nextRedoDays', { count: days });
}

const bold = { b: (c: ReactNode) => <strong>{c}</strong> };

export function Notebook() {
  const { t, tx, pct, date } = useT();
  const p = useProgress();
  const sheets = p.sheets ?? {};
  const stats = thinkingStats(sheets, p.thinkDays ?? []);
  const streak = thinkingStreak(p);
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const lessonSheets = Object.values(sheets).filter((s) => !s.key.startsWith('session/'));
    const byCourse = courses
      .map((c) => ({ course: c, sheets: lessonSheets.filter((s) => s.course === c.id).sort((a, b) => b.updatedAt - a.updatedAt) }))
      .filter((g) => g.sheets.length);
    const sessions = Object.values(sheets)
      .filter((s) => s.key.startsWith('session/'))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 12);
    return { byCourse, sessions };
  }, [sheets]);

  return (
    <Page>
      <PageHeader title={t('thinking.notebook.title')} subtitle={t('thinking.notebook.subtitle')} />

      <div className="stat-grid two">
        <div className="stat-card">
          <div className="stat-emoji" aria-hidden>
            <Icon name="pencil" size={28} />
          </div>
          <div>
            <span className="stat-label">{t('thinking.notebook.streak')}</span>
            <span className="stat-value">{t('common.days', { count: streak })}</span>
            <span className="small muted">{t('thinking.notebook.daysThisWeek', { days: stats.daysThisWeek })}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-emoji" aria-hidden>
            <Icon name="review" size={28} />
          </div>
          <div>
            <span className="stat-label">{t('thinking.notebook.recall')}</span>
            <span className="stat-value">{stats.recallRate === null ? '—' : pct(stats.recallRate)}</span>
            <span className="small muted">
              {t('thinking.notebook.redos', { count: stats.redos })}
              {stats.dueNow ? ` · ${t('thinking.notebook.due', { count: stats.dueNow })}` : ''}
            </span>
          </div>
        </div>
      </div>

      <section className="panel method">
        <h2>{t('thinking.notebook.methodHeading')}</h2>
        <ol>
          <li>{tx('thinking.notebook.methodWrong', { phase: t('thinking.phase.wrong') }, bold)}</li>
          <li>{tx('thinking.notebook.methodShorter', { phase: t('thinking.phase.shorter') }, bold)}</li>
          <li>{tx('thinking.notebook.methodAgain', { phase: t('thinking.phase.again') }, bold)}</li>
        </ol>
      </section>

      {groups.byCourse.length === 0 && (
        <section className="panel center">
          <p className="lead">{t('thinking.notebook.empty')}</p>
          <a className="btn primary" href="#/courses">
            {t('thinking.notebook.pickLesson')}
          </a>
        </section>
      )}

      {groups.byCourse.map(({ course, sheets: list }) => (
        <section key={course.id} className="panel notebook-course">
          <div className="panel-head">
            <h2>
              <CourseIcon icon={course.icon} color={course.color} size={24} /> {course.title}
            </h2>
          </div>
          <ul className="notebook-list">
            {list.map((s) => (
              <SheetRow key={s.key} sheet={s} open={open === s.key} onToggle={() => setOpen(open === s.key ? null : s.key)} />
            ))}
          </ul>
        </section>
      ))}

      {groups.sessions.length > 0 && (
        <section className="panel">
          <h2>{t('thinking.notebook.sessionAnchors')}</h2>
          <ul className="notebook-list">
            {groups.sessions.map((s) => (
              <li key={s.key} className="notebook-row">
                <div className="grow">
                  <strong>{sheetTitle(s)}</strong>
                  <span className="small muted">{date(s.createdAt, {})}</span>
                  <Anchors anchors={s.anchors} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}

function Anchors({ anchors }: { anchors?: string[] }) {
  if (!anchors?.length) return null;
  return (
    <ul className="cover-list">
      {anchors.map((a) => (
        <li key={a}>{a}</li>
      ))}
    </ul>
  );
}

function SheetRow({ sheet, open, onToggle }: { sheet: Sheet; open: boolean; onToggle: () => void }) {
  const { t } = useT();
  const last = sheet.again.at(-1);
  const draft = sheet.clean ?? sheet.wrong;
  const course = sheet.course ? getCourse(sheet.course) : undefined;
  const title = sheetTitle(sheet);
  return (
    <li className="notebook-row">
      <div className="grow">
        <a className="notebook-title" href={course && sheet.lesson ? href('course', course.id, 'lesson', sheet.lesson) : undefined}>
          {title}
        </a>
        <span className="small muted">
          {[
            last
              ? t('thinking.notebook.rebuilt', { count: sheet.again.length, remembered: last.remembered, total: last.total })
              : t('thinking.notebook.firstDraft'),
            sheet.due !== undefined && sheet.anchors?.length ? nextRedo(sheet.due) : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <Anchors anchors={sheet.anchors} />
        {open && draft && (
          <div className="notebook-sheet">
            <PaperSheet
              draft={draft}
              label={t(sheet.clean ? 'thinking.notebook.cleanSheetFor' : 'thinking.notebook.firstDraftFor', { title })}
              readOnly
            />
          </div>
        )}
      </div>
      {draft && (
        <button type="button" className="btn small" aria-expanded={open} onClick={onToggle}>
          {open ? t('thinking.notebook.hideSheet') : t('thinking.notebook.showSheet')}
        </button>
      )}
    </li>
  );
}

/** Home card: the thinking streak and any redo waiting. Hidden until the first sheet exists. */
export function ThinkingTeaser() {
  const { t } = useT();
  const p = useProgress();
  const sheets = p.sheets ?? {};
  if (!Object.keys(sheets).length) return null;
  const stats = thinkingStats(sheets, p.thinkDays ?? []);
  const streak = thinkingStreak(p);
  const line = stats.dueNow
    ? t('thinking.teaser.due', { count: stats.dueNow })
    : `${t('thinking.teaser.streak', { count: streak })} ${t('thinking.teaser.sheets', { count: stats.lessonSheets })}`;
  return (
    <a className="ins-teaser" href={href('notebook')}>
      <span className="ins-teaser-icon" aria-hidden>
        <Icon name="pencil" size={24} />
      </span>
      <span className="grow">
        <span className="eyebrow">{t('thinking.teaser.eyebrow')}</span>
        <span className="ins-teaser-line">{line}</span>
      </span>
      <span className="ins-teaser-go" aria-hidden>
        →
      </span>
    </a>
  );
}
