import { useState } from 'react';
import { allQuestions, courses, getCourse, questionByKey, type QuestionRef } from '../content';
import { href } from '../lib/router';
import { dueKeys, getProgress, useProgress, type Progress } from '../lib/storage';
import { MemoryStrength, ReviewForecast } from './charts';
import { Page, PageHeader } from './Layout';
import { Session } from './Session';
import { accentStyle } from './ui';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { MixedPracticeCard } from './MixedPractice';
import { useT } from '../i18n/react';

const SESSION_SIZE = 20;

const refsFor = (keys: string[]) => keys.map((k) => questionByKey.get(k)).filter((q): q is QuestionRef => q !== undefined);

function weakest(p: Progress, courseId?: string) {
  return Object.entries(p.cards)
    .filter(([k]) => questionByKey.has(k) && (!courseId || k.startsWith(`${courseId}/`)))
    .sort((a, b) => a[1].box - b[1].box || a[1].right / a[1].seen - b[1].right / b[1].seen)
    .slice(0, 10)
    .map(([k]) => k);
}

/** Overview page: what's due, the forecast, and memory strength. */
export function Review() {
  const { t, date } = useT();
  const p = useProgress();
  const due = refsFor(dueKeys(p));
  const seenKeys = Object.keys(p.cards).filter((k) => questionByKey.has(k));
  const nextDue = seenKeys.length ? Math.min(...seenKeys.map((k) => p.cards[k].due)) : null;

  const perCourse = courses
    .map((c) => ({ course: c, due: due.filter((q) => q.course.id === c.id).length, seen: seenKeys.filter((k) => k.startsWith(`${c.id}/`)).length }))
    .filter((x) => x.seen > 0);

  return (
    <Page wide>
      <PageHeader title={t('review.title')} subtitle={t('review.subtitle')} />

      <section className={`review-hero${due.length ? ' has-due' : ''}`}>
        <div>
          <span className="eyebrow">{t(due.length ? 'review.dueNow' : 'review.allCaughtUp')}</span>
          <h2>{due.length ? t('common.questions', { count: due.length }) : t('review.nothingToReview')}</h2>
          <p className="muted">
            {due.length
              ? t('review.sessionInfo', { minutes: Math.max(1, Math.round(Math.min(due.length, SESSION_SIZE) * 0.4)), size: SESSION_SIZE })
              : seenKeys.length
                ? nextDue && nextDue - Date.now() < 86_400_000
                  ? t('review.nextToday')
                  : t('review.nextOn', { date: date(nextDue!, { year: 'numeric', month: 'numeric', day: 'numeric' }) })
                : t('review.emptyHint')}
          </p>
        </div>
        <div className="review-hero-actions">
          {due.length > 0 ? (
            <a className="btn primary big" href={href('review', 'start')}>
              {t('review.start')}
            </a>
          ) : seenKeys.length > 0 ? (
            <a className="btn big" href={href('review', 'weak')}>
              {t('review.practiseWeakest', { count: Math.min(10, seenKeys.length) })}
            </a>
          ) : (
            <a className="btn primary big" href="#/courses">
              {t('review.browseCourses')}
            </a>
          )}
        </div>
      </section>

      <MixedPracticeCard />

      {seenKeys.length > 0 && (
        <div className="review-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>{t('review.next7Days')}</h2>
              <span className="muted small">{t('review.duePerDay')}</span>
            </div>
            <ReviewForecast p={p} />
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>{t('review.memoryStrength')}</h2>
              <span className="muted small">{t('review.seen', { count: seenKeys.length })}</span>
            </div>
            <MemoryStrength p={p} keys={seenKeys} />
            <p className="small muted">{t('review.levelsNote')}</p>
          </section>
        </div>
      )}

      {perCourse.length > 0 && (
        <section>
          <h2 className="section-title">{t('review.byCourse')}</h2>
          <div className="review-courses">
            {perCourse.map(({ course, due: d, seen }) => (
              <div key={course.id} className="review-course" style={accentStyle(course.color)}>
                <CourseIcon icon={course.icon} color={course.color} size={44} />
                <div className="grow">
                  <strong>{course.title}</strong>
                  <span className="muted small">
                    {t('review.courseDue', { count: d })} ·{' '}
                    {t('review.courseSeen', { seen, total: allQuestions.filter((q) => q.course.id === course.id).length })}
                  </span>
                </div>
                {d > 0 ? (
                  <a className="btn small primary" href={href('review', 'start', course.id)}>
                    {t('review.reviewButton')}
                  </a>
                ) : (
                  <a className="btn small" href={href('review', 'weak', course.id)}>
                    {t('review.practiseButton')}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

/** A review session: due questions (optionally for one course), or the weakest ones. */
export function ReviewSession({ mode, courseId }: { mode: 'start' | 'weak'; courseId?: string }) {
  const { t, n, pct } = useT();
  const [questions] = useState(() => {
    const p = getProgress();
    const keys = mode === 'weak' ? weakest(p, courseId) : dueKeys(p).filter((k) => !courseId || k.startsWith(`${courseId}/`));
    return refsFor(keys).slice(0, SESSION_SIZE);
  });
  const course = courseId ? getCourse(courseId) : undefined;

  if (!questions.length) {
    return (
      <Page>
        <section className="center empty-state">
          <div className="celebrate" aria-hidden>
            <Icon name="seedling" size={56} />
          </div>
          <h1>{course ? t('review.empty.titleIn', { course: course.title }) : t('review.nothingToReview')}</h1>
          <p className="lead">{t('review.empty.lead')}</p>
          <div className="actions center">
            <a className="btn" href="#/review">
              {t('review.overview')}
            </a>
            <a className="btn primary" href="#/courses">
              {t('nav.courses')}
            </a>
          </div>
        </section>
      </Page>
    );
  }

  // Session keys the current question by locale itself, so a language switch keeps the learner's place.
  return (
    <Session
      ritual={{ kind: 'review', title: course ? t('review.ritualTitleCourse', { course: course.title }) : t('review.ritualTitle'), course: course?.id }}
      questions={questions}
      exitHref="#/review"
      renderEnd={(results, xp) => {
        const right = results.filter((r) => r.ok).length;
        return (
          <>
            <div className="celebrate" aria-hidden>
              <Icon name="check" size={56} />
            </div>
            <h1>{t('review.done.title')}</h1>
            <p className="lead">{t('review.done.lead', { right, total: results.length })}</p>
            <div className="result-tiles">
              <div className="result-tile xp">
                <span>{t('review.done.xp')}</span>
                <strong>+{n(xp)}</strong>
              </div>
              <div className="result-tile">
                <span>{t('review.done.remembered')}</span>
                <strong>{pct(right / results.length)}</strong>
              </div>
            </div>
            <div className="actions center">
              <a className="btn ghost" href="#/review">
                {t('review.overview')}
              </a>
              <a className="btn primary big" href="#/">
                {t('nav.home')}
              </a>
            </div>
          </>
        );
      }}
    />
  );
}
