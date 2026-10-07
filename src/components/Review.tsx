import { useState } from 'react';
import { allQuestions, courses, getCourse, questionByKey, type QuestionRef } from '../content';
import { href } from '../lib/router';
import { dueKeys, getProgress, useProgress, type Progress } from '../lib/storage';
import { MemoryStrength, ReviewForecast } from './charts';
import { Page, PageHeader } from './Layout';
import { Session } from './Session';
import { accentStyle, plural } from './ui';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { MixedPracticeCard } from './MixedPractice';

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
  const p = useProgress();
  const due = refsFor(dueKeys(p));
  const seenKeys = Object.keys(p.cards).filter((k) => questionByKey.has(k));
  const nextDue = seenKeys.length ? Math.min(...seenKeys.map((k) => p.cards[k].due)) : null;

  const perCourse = courses
    .map((c) => ({ course: c, due: due.filter((q) => q.course.id === c.id).length, seen: seenKeys.filter((k) => k.startsWith(`${c.id}/`)).length }))
    .filter((x) => x.seen > 0);

  return (
    <Page wide>
      <PageHeader
        title="Review"
        subtitle="Spaced repetition brings each question back right before you'd forget it. Right answers wait longer; misses come back soon."
      />

      <section className={`review-hero${due.length ? ' has-due' : ''}`}>
        <div>
          <span className="eyebrow">{due.length ? 'Due now' : 'All caught up'}</span>
          <h2>{due.length ? plural(due.length, 'question') : 'Nothing to review'}</h2>
          <p className="muted">
            {due.length
              ? `About ${Math.max(1, Math.round(Math.min(due.length, SESSION_SIZE) * 0.4))} min. Sessions hold up to ${SESSION_SIZE} questions.`
              : seenKeys.length
                ? `Next review ${nextDue && nextDue - Date.now() < 86_400_000 ? 'later today' : `on ${new Date(nextDue!).toLocaleDateString('en-US')}`}.`
                : 'Answer questions in a lesson — they land here automatically.'}
          </p>
        </div>
        <div className="review-hero-actions">
          {due.length > 0 ? (
            <a className="btn primary big" href={href('review', 'start')}>
              Start review →
            </a>
          ) : seenKeys.length > 0 ? (
            <a className="btn big" href={href('review', 'weak')}>
              Practise weakest {Math.min(10, seenKeys.length)}
            </a>
          ) : (
            <a className="btn primary big" href="#/courses">
              Browse courses
            </a>
          )}
        </div>
      </section>

      <MixedPracticeCard />

      {seenKeys.length > 0 && (
        <div className="review-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>Next 7 days</h2>
              <span className="muted small">reviews due per day</span>
            </div>
            <ReviewForecast p={p} />
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Memory strength</h2>
              <span className="muted small">{plural(seenKeys.length, 'question')} seen</span>
            </div>
            <MemoryStrength p={p} keys={seenKeys} />
            <p className="small muted">Each correct review moves a question one level up and waits longer: 1 → 3 → 7 → 16 → 35 days.</p>
          </section>
        </div>
      )}

      {perCourse.length > 0 && (
        <section>
          <h2 className="section-title">By course</h2>
          <div className="review-courses">
            {perCourse.map(({ course, due: d, seen }) => (
              <div key={course.id} className="review-course" style={accentStyle(course.color)}>
                <CourseIcon icon={course.icon} color={course.color} size={44} />
                <div className="grow">
                  <strong>{course.title}</strong>
                  <span className="muted small">
                    {d ? `${d} due` : 'Nothing due'} · {seen} seen of {allQuestions.filter((q) => q.course.id === course.id).length}
                  </span>
                </div>
                {d > 0 ? (
                  <a className="btn small primary" href={href('review', 'start', course.id)}>
                    Review
                  </a>
                ) : (
                  <a className="btn small" href={href('review', 'weak', course.id)}>
                    Practise
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
          <h1>Nothing to review{course ? ` in ${course.title}` : ''}</h1>
          <p className="lead">You're all caught up. Come back later, or learn something new.</p>
          <div className="actions center">
            <a className="btn" href="#/review">
              Review overview
            </a>
            <a className="btn primary" href="#/courses">
              Courses
            </a>
          </div>
        </section>
      </Page>
    );
  }

  return (
    <Session
      ritual={{ kind: 'review', title: course ? `Review: ${course.title}` : 'Review', course: course?.id }}
      questions={questions}
      exitHref="#/review"
      renderEnd={(results, xp) => {
        const right = results.filter((r) => r.ok).length;
        return (
          <>
            <div className="celebrate" aria-hidden>
              <Icon name="check" size={56} />
            </div>
            <h1>Review done</h1>
            <p className="lead">
              {right} of {results.length} remembered. Correct answers now wait longer; misses come back soon.
            </p>
            <div className="result-tiles">
              <div className="result-tile xp">
                <span>XP earned</span>
                <strong>+{xp}</strong>
              </div>
              <div className="result-tile">
                <span>Remembered</span>
                <strong>{Math.round((right / results.length) * 100)}%</strong>
              </div>
            </div>
            <div className="actions center">
              <a className="btn ghost" href="#/review">
                Review overview
              </a>
              <a className="btn primary big" href="#/">
                Home
              </a>
            </div>
          </>
        );
      }}
    />
  );
}
