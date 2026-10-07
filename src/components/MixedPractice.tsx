import { useMemo, useState } from 'react';
import { allQuestions, courses, getCourse } from '../content';
import {
  describeReason,
  MIN_LESSONS,
  planMix,
  reachedLessons,
  SESSION_SIZES,
  summarize,
  DEFAULT_SIZE,
  type MixPlan,
  type PlannedTopic,
  type Topic,
  type TopicStatus,
} from '../lib/interleave';
import { href } from '../lib/router';
import { courseStats } from '../lib/stats';
import { getProgress, useProgress, type Progress } from '../lib/storage';
import type { Course } from '../types';
import { CourseIcon } from './CourseIcon';
import { Page, PageHeader } from './Layout';
import { Session, type SessionResult } from './Session';
import { Icon } from './icons';
import { accentStyle, Notice } from './ui';
import type { MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';
import './MixedPractice.css';

const STATUS_LABEL: Record<TopicStatus, MessageKey | null> = {
  weak: 'practice.status.weak',
  due: 'practice.status.due',
  new: 'practice.status.new',
  ok: null,
  strong: 'practice.status.strong',
};

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0;
const minutes = (n: number) => Math.max(1, Math.round(n * 0.4));

/**
 * A topic's name read from the live course objects, so a plan built before a language switch (the running session's
 * plan is frozen) still shows names in the current language.
 */
const topicLabel = (t: Topic) =>
  t.kind === 'concept' ? (t.course.concepts?.find((c) => `${t.course.id}/${c.id}` === t.id)?.label ?? t.label) : t.lesson.title;

function build(p: Progress, seed: number, size: number, courseId?: string, conceptId?: string): MixPlan {
  return planMix({ courses, questions: allQuestions, progress: p, courseId, conceptId, size, seed });
}

/** Where to point a learner who hasn't done enough lessons yet. */
function nextLesson(p: Progress, course?: Course) {
  const order = course
    ? [course]
    : [p.last ? getCourse(p.last.course) : undefined, ...courses.filter((c) => courseStats(c, p).started), ...courses];
  for (const c of order) {
    if (!c) continue;
    const next = courseStats(c, p).next;
    if (next) return { course: c, lesson: next };
  }
  return undefined;
}

/** #/practice, #/practice/<course> and #/practice/<course>/<concept>: an interleaved session over what you've met. */
export function MixedPractice({ courseId, conceptId }: { courseId?: string; conceptId?: string }) {
  const { t, tx, locale } = useT();
  const course = courseId ? getCourse(courseId) : undefined;
  const p = useProgress();
  const [seed, setSeed] = useState(newSeed);
  const [size, setSize] = useState<number>(DEFAULT_SIZE);
  const [running, setRunning] = useState<{ plan: MixPlan; run: number } | null>(null);
  // While a session runs, answers change progress; the running plan stays frozen in `running`.
  // The plan holds course text (topic names, link sentences), so it is rebuilt on a language switch (same seed: same mix).
  const planned = useMemo(
    () => (running ? null : build(p, seed, size, course?.id, conceptId)),
    [running, p, seed, size, course?.id, conceptId, locale],
  );

  if (courseId && !course) {
    return (
      <Page>
        <section className="center empty-state">
          <h1>{t('practice.notFound')}</h1>
          <a className="btn primary" href="#/practice">
            {t('practice.mixAll')}
          </a>
        </section>
      </Page>
    );
  }

  const exitHref = course ? href('course', course.id) : '#/review';
  const title = course ? t('practice.titleCourse', { course: course.title }) : t('practice.title');

  if (running) {
    const again = () => {
      const s = newSeed();
      setSeed(s);
      const next = build(getProgress(), s, size, course?.id, conceptId);
      setRunning(next.picks.length ? { plan: next, run: running.run + 1 } : null);
    };
    // Never put the locale in this key: it would restart the session. Session keys the current question by locale itself.
    return (
      <Session
        key={running.run}
        ritual={{ kind: 'practice', title, course: course?.id }}
        questions={running.plan.picks.map((x) => x.q)}
        exitHref={exitHref}
        renderEnd={(results, xp) => <MixEnd plan={running.plan} results={results} xp={xp} course={course} onAgain={again} />}
      />
    );
  }

  const plan = planned ?? build(p, seed, size, course?.id, conceptId);
  if (plan.reachedLessons < MIN_LESSONS || !plan.picks.length) {
    const recentOnly = plan.reachedLessons >= MIN_LESSONS && plan.recentCount > 0;
    return <MixEmpty p={p} course={course} reached={plan.reachedLessons} recentOnly={recentOnly} />;
  }

  const n = plan.picks.length;
  const inMix = [...new Map(plan.topics.map((x) => [x.course.id, x.course])).values()];
  const started = course ? [] : courses.filter((c) => reachedLessons(allQuestions, p, [c.id]).size >= MIN_LESSONS);

  return (
    <Page>
      <div className="mix-start" style={accentStyle(course?.color)}>
        <PageHeader title={title} subtitle={t('practice.intro')} />

        {plan.focus && (
          <p className="mix-focus">{tx('practice.focus', { label: plan.focus.label }, { b: (c) => <strong>{c}</strong> })}</p>
        )}
        {plan.focusFallback && <Notice>{t('practice.focusFallback')}</Notice>}

        <section className="panel mix-panel" aria-labelledby="mix-title">
          <div className="panel-head">
            <h2 id="mix-title">{t('practice.yourMix')}</h2>
            <span className="muted small">
              {t('common.questions', { count: n })} ·{' '}
              {plan.usesGraph ? t('practice.ideas', { count: plan.topics.length }) : t('common.lessons', { count: plan.topics.length })}
            </span>
          </div>
          <ul className="mix-chips" aria-label={t(plan.usesGraph ? 'practice.ideasAria' : 'practice.lessonsAria')}>
            {plan.topics.map((x) => (
              <TopicChip key={x.id} topic={x} />
            ))}
          </ul>
          {inMix.length > 1 && (
            <p className="mix-courses small muted">
              {tx('practice.from', {
                courses: (
                  <>
                    {inMix.map((c, i) => (
                      <span key={c.id} className="mix-course">
                        <CourseIcon icon={c.icon} color={c.color} size={18} /> {c.title}
                        {i < inMix.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </>
                ),
              })}
            </p>
          )}
          {!plan.usesGraph && <p className="small muted">{t('practice.byLesson')}</p>}
          <details className="mix-why">
            <summary>{t('practice.whyThese')}</summary>
            <ul>
              {plan.topics.map((x) => (
                <li key={x.id}>
                  <strong>{x.label}</strong>
                  <span className="muted">{x.reasons.length ? x.reasons.map(describeReason).join(' · ') : t('practice.defaultReason')}</span>
                </li>
              ))}
            </ul>
          </details>
        </section>

        <div className="mix-controls">
          <div className="mix-sizes" role="group" aria-label={t('practice.lengthAria')}>
            <span className="muted small">{t('practice.length')}</span>
            {SESSION_SIZES.map((s) => (
              <button key={s} type="button" className={`chip-btn${s === size ? ' on' : ''}`} aria-pressed={s === size} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
          <span className="muted small" aria-live="polite">
            {n < size ? `${t('practice.onlyQualify', { count: n })} · ` : ''}
            {t('practice.aboutMin', { count: minutes(n) })}
          </span>
          <button type="button" className="btn primary big mix-go" onClick={() => setRunning({ plan, run: 0 })}>
            {t('practice.start')}
          </button>
        </div>

        {course ? (
          <p className="small muted mix-scope">
            <a href="#/practice">{t('practice.mixAllInstead')}</a>
          </p>
        ) : (
          started.length > 1 && (
            <div className="mix-scope">
              <span className="muted small">{t('practice.orOneCourse')}</span>
              <div className="mix-scope-links">
                {started.map((c) => (
                  <a key={c.id} className="chip" href={href('practice', c.id)}>
                    <CourseIcon icon={c.icon} color={c.color} size={18} /> {c.title}
                  </a>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </Page>
  );
}

function TopicChip({ topic: x }: { topic: PlannedTopic }) {
  const { t } = useT();
  const status = STATUS_LABEL[x.status];
  return (
    <li className={`mix-chip ${x.status}`} style={accentStyle(x.course.color)} title={x.reasons.map(describeReason).join('\n')}>
      <span className="mix-dot" aria-hidden />
      <span>{x.label}</span>
      {status && <span className="mix-status">{t(status)}</span>}
      <span className="mix-count" aria-label={t('common.questions', { count: x.count })}>
        {x.count}
      </span>
    </li>
  );
}

function MixEmpty({ p, course, reached, recentOnly }: { p: Progress; course?: Course; reached: number; recentOnly: boolean }) {
  const { t } = useT();
  const next = nextLesson(p, course);
  return (
    <Page>
      <section className="center empty-state" style={accentStyle(course?.color)}>
        <div className="celebrate" aria-hidden>
          <Icon name={recentOnly ? 'clock' : 'seedling'} size={56} />
        </div>
        {recentOnly ? (
          <>
            <h1>{t('practice.empty.recentTitle')}</h1>
            <p className="lead">{t('practice.empty.recentLead')}</p>
          </>
        ) : (
          <>
            <h1>{t('practice.empty.lockedTitle', { count: MIN_LESSONS })}</h1>
            <p className="lead">
              {course
                ? t('practice.empty.lockedLeadCourse', { count: reached, course: course.title })
                : t('practice.empty.lockedLead', { count: reached })}
            </p>
          </>
        )}
        <div className="actions center">
          <a className="btn ghost" href="#/review">
            {t('nav.review')}
          </a>
          {next ? (
            <a className="btn primary big" href={href('course', next.course.id, 'lesson', next.lesson.id)}>
              {t('practice.empty.nextLesson', { title: next.lesson.title })}
            </a>
          ) : (
            <a className="btn primary big" href="#/courses">
              {t('nav.courses')}
            </a>
          )}
        </div>
      </section>
    </Page>
  );
}

function MixEnd({ plan, results, xp, course, onAgain }: { plan: MixPlan; results: SessionResult[]; xp: number; course?: Course; onAgain: () => void }) {
  const { t, n, pct } = useT();
  const rows = summarize(
    plan,
    results.map((r) => ({ key: r.ref.key, ok: r.ok })),
  );
  const right = results.filter((r) => r.ok).length;
  const multiCourse = new Set(rows.map((r) => r.topic.course.id)).size > 1;
  return (
    <>
      <div className="celebrate" aria-hidden>
        <Icon name={right === results.length ? 'target' : 'check'} size={56} />
      </div>
      <h1>{t('practice.end.title')}</h1>
      <p className="lead">
        {t(plan.usesGraph ? 'practice.end.leadIdeas' : 'practice.end.leadLessons', { right, total: results.length, count: rows.length })}
      </p>
      <div className="result-tiles">
        <div className="result-tile xp">
          <span>{t('practice.end.xp')}</span>
          <strong>+{n(xp)}</strong>
        </div>
        <div className="result-tile">
          <span>{t('practice.end.right')}</span>
          <strong>{pct(right / Math.max(1, results.length))}</strong>
        </div>
      </div>
      <ul className="mix-results" aria-label={t('practice.end.resultsAria')}>
        {rows.map(({ topic: x, right: r, total }) => (
          <li key={x.id} className={r === total ? 'ok' : 'miss'} style={accentStyle(x.course.color)}>
            <span className="mix-dot" aria-hidden />
            <span className="mix-result-name">
              <strong>{topicLabel(x)}</strong>
              {multiCourse && <span className="muted small">{x.course.title}</span>}
            </span>
            <span className="mix-score">
              {r}/{total}
            </span>
            {r < total ? (
              <a className="btn small" href={href('course', x.course.id, 'lesson', x.lesson.id)}>
                {t('practice.end.reviewLesson', { title: x.lesson.title })}
              </a>
            ) : (
              <span className="mix-solid small">{t('practice.end.solid')}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="muted small">{t('practice.end.note')}</p>
      <div className="actions center">
        <a className="btn ghost" href="#/review">
          {t('review.overview')}
        </a>
        {course && (
          <a className="btn ghost" href={href('course', course.id)}>
            {t('practice.end.backToCourse')}
          </a>
        )}
        <button type="button" className="btn primary big" onClick={onAgain}>
          {t('practice.end.again')}
        </button>
      </div>
    </>
  );
}

/** Entry card for the Review page. */
export function MixedPracticeCard() {
  const { t } = useT();
  const p = useProgress();
  const { reached, started } = useMemo(
    () => ({
      reached: reachedLessons(allQuestions, p).size,
      started: courses.filter((c) => reachedLessons(allQuestions, p, [c.id]).size >= MIN_LESSONS),
    }),
    [p],
  );
  const ready = reached >= MIN_LESSONS;
  return (
    <section className="mix-card" aria-labelledby="mix-card-title">
      <div className="mix-card-icon" aria-hidden>
        <Icon name="sparkle" size={26} />
      </div>
      <div className="mix-card-text">
        <span className="eyebrow">{t('practice.title')}</span>
        <h2 id="mix-card-title">{t('practice.card.title')}</h2>
        <p className="muted">{ready ? t('practice.card.ready') : t('practice.card.locked', { count: MIN_LESSONS })}</p>
        {started.length > 1 && (
          <div className="mix-scope-links">
            {started.map((c) => (
              <a key={c.id} className="chip" href={href('practice', c.id)} aria-label={t('practice.titleCourse', { course: c.title })}>
                <CourseIcon icon={c.icon} color={c.color} size={18} /> {c.title}
              </a>
            ))}
          </div>
        )}
      </div>
      <a className={`btn big${ready ? '' : ' ghost'}`} href="#/practice">
        {ready ? t('practice.start') : t('practice.card.howItWorks')}
      </a>
    </section>
  );
}
