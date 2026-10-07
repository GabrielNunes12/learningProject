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
import { accentStyle, Notice, plural } from './ui';
import './MixedPractice.css';

const INTRO =
  'Mixed practice interleaves related ideas instead of drilling one topic at a time. It tends to feel harder while you do it, but studies suggest it improves how well you tell similar ideas apart and how long you remember them.';

const STATUS_LABEL: Record<TopicStatus, string> = { weak: 'Weak', due: 'Due', new: 'New', ok: '', strong: 'Strong' };

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0;
const minutes = (n: number) => Math.max(1, Math.round(n * 0.4));

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
  const course = courseId ? getCourse(courseId) : undefined;
  const p = useProgress();
  const [seed, setSeed] = useState(newSeed);
  const [size, setSize] = useState<number>(DEFAULT_SIZE);
  const [running, setRunning] = useState<{ plan: MixPlan; run: number } | null>(null);
  // While a session runs, answers change progress; the running plan stays frozen in `running`.
  const planned = useMemo(() => (running ? null : build(p, seed, size, course?.id, conceptId)), [running, p, seed, size, course?.id, conceptId]);

  if (courseId && !course) {
    return (
      <Page>
        <section className="center empty-state">
          <h1>Course not found</h1>
          <a className="btn primary" href="#/practice">
            Mix all my courses
          </a>
        </section>
      </Page>
    );
  }

  const exitHref = course ? href('course', course.id) : '#/review';

  if (running) {
    const again = () => {
      const s = newSeed();
      setSeed(s);
      const next = build(getProgress(), s, size, course?.id, conceptId);
      setRunning(next.picks.length ? { plan: next, run: running.run + 1 } : null);
    };
    return (
      <Session
        key={running.run}
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
  const inMix = [...new Map(plan.topics.map((t) => [t.course.id, t.course])).values()];
  const started = course ? [] : courses.filter((c) => reachedLessons(allQuestions, p, [c.id]).size >= MIN_LESSONS);

  return (
    <Page>
      <div className="mix-start" style={accentStyle(course?.color)}>
        <PageHeader title={course ? `Mixed practice: ${course.title}` : 'Mixed practice'} subtitle={INTRO} />

        {plan.focus && (
          <p className="mix-focus">
            Focused on <strong>{plan.focus.label}</strong> and the ideas linked to it.
          </p>
        )}
        {plan.focusFallback && (
          <Notice>That concept doesn't have enough questions you've met yet, so this session mixes the whole course.</Notice>
        )}

        <section className="panel mix-panel" aria-labelledby="mix-title">
          <div className="panel-head">
            <h2 id="mix-title">Your mix</h2>
            <span className="muted small">
              {plural(n, 'question')} · {plural(plan.topics.length, plan.usesGraph ? 'idea' : 'lesson')}
            </span>
          </div>
          <ul className="mix-chips" aria-label={plan.usesGraph ? 'Ideas in this session' : 'Lessons in this session'}>
            {plan.topics.map((t) => (
              <TopicChip key={t.id} topic={t} />
            ))}
          </ul>
          {inMix.length > 1 && (
            <p className="mix-courses small muted">
              From{' '}
              {inMix.map((c, i) => (
                <span key={c.id} className="mix-course">
                  <CourseIcon icon={c.icon} color={c.color} size={18} /> {c.title}
                  {i < inMix.length - 1 ? ',' : ''}
                </span>
              ))}
            </p>
          )}
          {!plan.usesGraph && <p className="small muted">These questions are mixed by lesson: this course doesn't have a concept map yet.</p>}
          <details className="mix-why">
            <summary>Why these?</summary>
            <ul>
              {plan.topics.map((t) => (
                <li key={t.id}>
                  <strong>{t.label}</strong>
                  <span className="muted">{t.reasons.length ? t.reasons.map(describeReason).join(' · ') : 'Part of what you have learned so far'}</span>
                </li>
              ))}
            </ul>
          </details>
        </section>

        <div className="mix-controls">
          <div className="mix-sizes" role="group" aria-label="Session length">
            <span className="muted small">Length</span>
            {SESSION_SIZES.map((s) => (
              <button key={s} type="button" className={`chip-btn${s === size ? ' on' : ''}`} aria-pressed={s === size} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
          <span className="muted small" aria-live="polite">
            {n < size ? `Only ${n} questions qualify right now · ` : ''}about {minutes(n)} min
          </span>
          <button type="button" className="btn primary big mix-go" onClick={() => setRunning({ plan, run: 0 })}>
            Start mixed practice
          </button>
        </div>

        {course ? (
          <p className="small muted mix-scope">
            <a href="#/practice">Mix all my courses instead</a>
          </p>
        ) : (
          started.length > 1 && (
            <div className="mix-scope">
              <span className="muted small">Or practise one course:</span>
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

function TopicChip({ topic: t }: { topic: PlannedTopic }) {
  const status = STATUS_LABEL[t.status];
  return (
    <li className={`mix-chip ${t.status}`} style={accentStyle(t.course.color)} title={t.reasons.map(describeReason).join('\n')}>
      <span className="mix-dot" aria-hidden />
      <span>{t.label}</span>
      {status && <span className="mix-status">{status}</span>}
      <span className="mix-count" aria-label={plural(t.count, 'question')}>
        {t.count}
      </span>
    </li>
  );
}

function MixEmpty({ p, course, reached, recentOnly }: { p: Progress; course?: Course; reached: number; recentOnly: boolean }) {
  const next = nextLesson(p, course);
  return (
    <Page>
      <section className="center empty-state" style={accentStyle(course?.color)}>
        <div className="celebrate" aria-hidden>
          <Icon name={recentOnly ? 'clock' : 'seedling'} size={56} />
        </div>
        {recentOnly ? (
          <>
            <h1>You just practised all of it</h1>
            <p className="lead">
              Questions you answered right in the last 10 minutes sit out for a while, so the next round is real recall, not repetition. Try again in a
              few minutes, or learn something new.
            </p>
          </>
        ) : (
          <>
            <h1>Mixed practice opens after {MIN_LESSONS} lessons</h1>
            <p className="lead">
              Mixing needs a few ideas to tell apart. You've done {plural(reached, 'lesson')}
              {course ? ` in ${course.title}` : ''} so far.
            </p>
          </>
        )}
        <div className="actions center">
          <a className="btn ghost" href="#/review">
            Review
          </a>
          {next ? (
            <a className="btn primary big" href={href('course', next.course.id, 'lesson', next.lesson.id)}>
              Next lesson: {next.lesson.title}
            </a>
          ) : (
            <a className="btn primary big" href="#/courses">
              Courses
            </a>
          )}
        </div>
      </section>
    </Page>
  );
}

function MixEnd({ plan, results, xp, course, onAgain }: { plan: MixPlan; results: SessionResult[]; xp: number; course?: Course; onAgain: () => void }) {
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
      <h1>Mixed practice done</h1>
      <p className="lead">
        {right} of {results.length} right across {plural(rows.length, plan.usesGraph ? 'idea' : 'lesson')}.
      </p>
      <div className="result-tiles">
        <div className="result-tile xp">
          <span>XP earned</span>
          <strong>+{xp}</strong>
        </div>
        <div className="result-tile">
          <span>Right</span>
          <strong>{Math.round((100 * right) / Math.max(1, results.length))}%</strong>
        </div>
      </div>
      <ul className="mix-results" aria-label="Results by idea">
        {rows.map(({ topic: t, right: r, total }) => (
          <li key={t.id} className={r === total ? 'ok' : 'miss'} style={accentStyle(t.course.color)}>
            <span className="mix-dot" aria-hidden />
            <span className="mix-result-name">
              <strong>{t.label}</strong>
              {multiCourse && <span className="muted small">{t.course.title}</span>}
            </span>
            <span className="mix-score">
              {r}/{total}
            </span>
            {r < total ? (
              <a className="btn small" href={href('course', t.course.id, 'lesson', t.lesson.id)}>
                Review lesson: {t.lesson.title}
              </a>
            ) : (
              <span className="mix-solid small">Solid</span>
            )}
          </li>
        ))}
      </ul>
      <p className="muted small">Misses come back in your Review queue; right answers wait longer.</p>
      <div className="actions center">
        <a className="btn ghost" href="#/review">
          Review overview
        </a>
        {course && (
          <a className="btn ghost" href={href('course', course.id)}>
            Back to course
          </a>
        )}
        <button type="button" className="btn primary big" onClick={onAgain}>
          Again
        </button>
      </div>
    </>
  );
}

/** Entry card for the Review page. */
export function MixedPracticeCard() {
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
        <span className="eyebrow">Mixed practice</span>
        <h2 id="mix-card-title">Mix related ideas</h2>
        <p className="muted">
          {ready
            ? 'Questions from different lessons side by side, weighted toward your weak spots, so you learn to tell similar ideas apart.'
            : `Opens after ${MIN_LESSONS} lessons: mixing needs a few ideas to tell apart.`}
        </p>
        {started.length > 1 && (
          <div className="mix-scope-links">
            {started.map((c) => (
              <a key={c.id} className="chip" href={href('practice', c.id)} aria-label={`Mixed practice: ${c.title}`}>
                <CourseIcon icon={c.icon} color={c.color} size={18} /> {c.title}
              </a>
            ))}
          </div>
        )}
      </div>
      <a className={`btn big${ready ? '' : ' ghost'}`} href="#/practice">
        {ready ? 'Start mixed practice' : 'See how it works'}
      </a>
    </section>
  );
}
