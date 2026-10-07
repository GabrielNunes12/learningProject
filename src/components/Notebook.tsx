// The notebook: every thinking sheet, grouped by course, and the thinking habit at a glance.
import { useMemo, useState } from 'react';
import { courses, getCourse } from '../content';
import { href } from '../lib/router';
import { thinkingStreak, useProgress, type Sheet } from '../lib/storage';
import { thinkingStats } from '../lib/thinking';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { Page, PageHeader } from './Layout';
import { PaperSheet } from './paper/PaperSheet';
import './paper/Paper.css';

const DAY = 86_400_000;

function when(t: number, now = Date.now()) {
  const days = Math.round((t - now) / DAY);
  if (t <= now) return 'due now';
  return days <= 0 ? 'later today' : days === 1 ? 'tomorrow' : `in ${days} days`;
}

export function Notebook() {
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
      <PageHeader
        title="Notebook"
        subtitle="Every sheet you thought on: your first guesses, your anchors, and the clean versions you rebuilt from memory."
      />

      <div className="stat-grid two">
        <div className="stat-card">
          <div className="stat-emoji" aria-hidden>
            <Icon name="pencil" size={28} />
          </div>
          <div>
            <span className="stat-label">Thinking streak</span>
            <span className="stat-value">
              {streak} day{streak === 1 ? '' : 's'}
            </span>
            <span className="small muted">{stats.daysThisWeek} of the last 7 days</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-emoji" aria-hidden>
            <Icon name="review" size={28} />
          </div>
          <div>
            <span className="stat-label">Rebuilt from memory</span>
            <span className="stat-value">{stats.recallRate === null ? '—' : `${Math.round(stats.recallRate * 100)}%`}</span>
            <span className="small muted">
              {stats.redos} redo{stats.redos === 1 ? '' : 's'}
              {stats.dueNow ? ` · ${stats.dueNow} due` : ''}
            </span>
          </div>
        </div>
      </div>

      <section className="panel method">
        <h2>How every session works</h2>
        <ol>
          <li>
            <strong>Make it wrong.</strong> Before a lesson, put what you think you know on paper and sort it, even if it's wrong.
          </li>
          <li>
            <strong>Make it shorter.</strong> After every session, squeeze it into 2–3 anchors of four words or fewer.
          </li>
          <li>
            <strong>Make it again.</strong> Next session, rebuild an old sheet from a blank page, then fix and reorganise it. The gap grows
            each time.
          </li>
        </ol>
      </section>

      {groups.byCourse.length === 0 && (
        <section className="panel center">
          <p className="lead">No sheets yet. Your first lesson starts with one.</p>
          <a className="btn primary" href="#/courses">
            Pick a lesson
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
          <h2>Session anchors</h2>
          <ul className="notebook-list">
            {groups.sessions.map((s) => (
              <li key={s.key} className="notebook-row">
                <div className="grow">
                  <strong>{s.title}</strong>
                  <span className="small muted">{new Date(s.createdAt).toLocaleDateString()}</span>
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
  const last = sheet.again.at(-1);
  const draft = sheet.clean ?? sheet.wrong;
  const course = sheet.course ? getCourse(sheet.course) : undefined;
  return (
    <li className="notebook-row">
      <div className="grow">
        <a className="notebook-title" href={course && sheet.lesson ? href('course', course.id, 'lesson', sheet.lesson) : undefined}>
          {sheet.title}
        </a>
        <span className="small muted">
          {[
            last ? `rebuilt ${sheet.again.length}×, last time ${last.remembered}/${last.total} from memory` : 'first draft',
            sheet.due !== undefined && sheet.anchors?.length ? `next redo ${when(sheet.due)}` : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <Anchors anchors={sheet.anchors} />
        {open && draft && (
          <div className="notebook-sheet">
            <PaperSheet draft={draft} label={`${sheet.clean ? 'Clean sheet' : 'First draft'} for ${sheet.title}`} readOnly />
          </div>
        )}
      </div>
      {draft && (
        <button type="button" className="btn small" aria-expanded={open} onClick={onToggle}>
          {open ? 'Hide sheet' : 'Show sheet'}
        </button>
      )}
    </li>
  );
}

/** Home card: the thinking streak and any redo waiting. Hidden until the first sheet exists. */
export function ThinkingTeaser() {
  const p = useProgress();
  const sheets = p.sheets ?? {};
  if (!Object.keys(sheets).length) return null;
  const stats = thinkingStats(sheets, p.thinkDays ?? []);
  const streak = thinkingStreak(p);
  const line = stats.dueNow
    ? `${stats.dueNow} sheet${stats.dueNow === 1 ? '' : 's'} ready to rebuild from memory. Your next session opens with one.`
    : `Thinking streak: ${streak} day${streak === 1 ? '' : 's'}. ${stats.lessonSheets} sheet${stats.lessonSheets === 1 ? '' : 's'} in your notebook.`;
  return (
    <a className="ins-teaser" href={href('notebook')}>
      <span className="ins-teaser-icon" aria-hidden>
        <Icon name="pencil" size={24} />
      </span>
      <span className="grow">
        <span className="eyebrow">Thinking on paper</span>
        <span className="ins-teaser-line">{line}</span>
      </span>
      <span className="ins-teaser-go" aria-hidden>
        →
      </span>
    </a>
  );
}
