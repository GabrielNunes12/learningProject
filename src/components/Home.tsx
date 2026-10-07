import { useEffect } from 'react';
import { courses, getCourse, preloadCourses, unitOf } from '../content';
import { useAuth } from '../lib/auth';
import { href } from '../lib/router';
import { courseStats } from '../lib/stats';
import { levelInfo, streak, useProgress, xpToday, type Progress } from '../lib/storage';
import { WeekXpChart } from './charts';
import { Page, useDueCount } from './Layout';
import { CourseCard } from './Courses';
import { RoadmapTeaser } from './Roadmap';
import { accentStyle, ProgressBar, Ring } from './ui';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { InsightsTeaser } from './Insights';
import { ThinkingTeaser } from './Notebook';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function WeekDots({ p }: { p: Progress }) {
  const days = new Set(p.days);
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push(
      <span key={i} className={`week-dot${days.has(key) ? ' on' : ''}${i === 0 ? ' today' : ''}`} title={d.toDateString()}>
        {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
      </span>,
    );
  }
  return <div className="week-dots">{out}</div>;
}

function ContinueCard({ p }: { p: Progress }) {
  // The course you touched last; otherwise the first course you started; otherwise the first course.
  const lastCourse = p.last ? getCourse(p.last.course) : undefined;
  const course = lastCourse ?? courses.find((c) => courseStats(c, p).started) ?? courses[0];
  // The Continue button opens a lesson: fetch its course ahead of the click.
  useEffect(() => {
    if (course) preloadCourses([course.id]);
  }, [course]);
  if (!course) return null;
  const s = courseStats(course, p);
  const lesson = s.next;

  return (
    <section className="continue-card" style={accentStyle(course.color)}>
      <div className="continue-icon">
        <CourseIcon icon={course.icon} color={course.color} size={76} />
      </div>
      <div className="continue-body">
        <span className="eyebrow">{s.started ? 'Continue learning' : 'Start here'}</span>
        <h2>{lesson ? lesson.title : `${course.title} — complete!`}</h2>
        <p className="muted">
          {course.title}
          {lesson && ` · ${unitOf(course, lesson).title}`}
          {lesson && (
            <>
              {' · '}
              <span className={`tag ${lesson.pareto}`}>{lesson.pareto === 'core' ? 'Core' : 'Deep dive'}</span>
            </>
          )}
        </p>
        <ProgressBar value={s.total ? s.completed / s.total : 0} label={`${s.completed} of ${s.total} lessons`} />
        <span className="small muted">
          Core {s.coreDone}/{s.coreTotal} · {s.completed}/{s.total} lessons
        </span>
      </div>
      <div className="continue-actions">
        {lesson ? (
          <a className="btn primary big" href={href('course', course.id, 'lesson', lesson.id)}>
            {s.started ? 'Continue' : 'Start'} →
          </a>
        ) : (
          <a className="btn primary big" href={href('course', course.id, 'quiz')}>
            Take the quiz
          </a>
        )}
      </div>
    </section>
  );
}

export function Home() {
  const p = useProgress();
  const { user } = useAuth();
  const due = useDueCount();
  const lvl = levelInfo(p.xp);
  const today = xpToday(p);
  const days = streak(p);
  const started = courses.filter((c) => courseStats(c, p).started);
  const fresh = p.xp === 0;

  return (
    <Page wide>
      {fresh && !user ? (
        <section className="hero">
          <span className="eyebrow">Learn smarter, not longer</span>
          <h1>
            Master the <span className="hl">20%</span> that gives you <span className="hl">80%</span>.
          </h1>
          <p className="lead">
            Every course starts with its core ideas, teaches them through worked examples and exercises, then keeps them in
            your memory with quizzes and spaced review.
          </p>
          <div className="hero-actions">
            <a className="btn primary big" href={href('course', courses[0]?.id ?? '', 'lesson', courses[0]?.lessons[0]?.id ?? '')}>
              Try a lesson — no account needed
            </a>
            <a className="btn big" href="#/signup">
              Create a free profile
            </a>
          </div>
        </section>
      ) : (
        <div className="greeting">
          <h1>
            {greeting()}
            {user ? `, ${user.username}` : ''}!
          </h1>
          <p className="lead">
            {today >= p.dailyGoal
              ? "Daily goal reached. Anything more is a bonus."
              : due > 0
                ? `Start with your ${due} review${due === 1 ? '' : 's'}, then learn something new.`
                : 'Pick up where you left off.'}
          </p>
        </div>
      )}

      <div className="stat-grid">
        <a className="stat-card" href="#/profile">
          <Ring value={today / Math.max(p.dailyGoal, 1)} size={64} label="Daily goal">
            <strong>{Math.min(100, Math.round((today / Math.max(p.dailyGoal, 1)) * 100))}%</strong>
          </Ring>
          <div>
            <span className="stat-label">Daily goal</span>
            <span className="stat-value">
              {today} / {p.dailyGoal} XP
            </span>
          </div>
        </a>
        <a className="stat-card" href="#/profile">
          <div className="stat-emoji flame" aria-hidden>
            <Icon name="flame" size={30} />
          </div>
          <div>
            <span className="stat-label">Streak</span>
            <span className="stat-value">
              {days} day{days === 1 ? '' : 's'}
            </span>
            <WeekDots p={p} />
          </div>
        </a>
        <a className="stat-card" href="#/profile">
          <div className="level-badge" aria-hidden>
            {lvl.level}
          </div>
          <div className="grow">
            <span className="stat-label">Level {lvl.level} · {lvl.title}</span>
            <span className="stat-value">{p.xp} XP</span>
            <ProgressBar value={lvl.into / lvl.needed} thin label="Progress to next level" />
            <span className="small muted">{lvl.end - p.xp} XP to level {lvl.level + 1}</span>
          </div>
        </a>
        <a className={`stat-card${due ? ' attention' : ''}`} href="#/review">
          <div className="stat-emoji" aria-hidden>
            <Icon name={due ? 'review' : 'seedling'} size={30} />
          </div>
          <div>
            <span className="stat-label">Reviews</span>
            <span className="stat-value">{due ? `${due} due now` : 'All caught up'}</span>
            <span className="small muted">{due ? 'Before you forget' : 'Nothing due'}</span>
          </div>
        </a>
      </div>

      <ContinueCard p={p} />
      <ThinkingTeaser />
      <InsightsTeaser />
      <RoadmapTeaser />

      {!user && !fresh && (
        <div className="save-banner">
          <span>
            <strong>Your progress lives only in this browser.</strong> Create a free profile to keep it safe and use it on any
            device.
          </span>
          <a className="btn primary small" href="#/signup">
            Save my progress
          </a>
        </div>
      )}

      <div className="home-columns">
        <section className="panel">
          <div className="panel-head">
            <h2>This week</h2>
            <span className="muted small">{Object.entries(p.xpByDay).filter(([d]) => Date.now() - new Date(d).getTime() < 7 * 86_400_000).reduce((s, [, x]) => s + x, 0)} XP</span>
          </div>
          <WeekXpChart p={p} />
        </section>
        <section className="panel method">
          <h2>The 80/20 method</h2>
          <ol>
            <li>
              <strong>Core first.</strong> Finish a course's <span className="tag core">Core</span> lessons before any{' '}
              <span className="tag extra">Deep dive</span>.
            </li>
            <li>
              <strong>Test out.</strong> Take the quiz first — it tells you which lessons to skip.
            </li>
            <li>
              <strong>Review daily.</strong> 5–10 minutes keeps everything you've learned.
            </li>
            <li>
              <strong>Two courses at a time.</strong> Finish their core, then add the next.
            </li>
          </ol>
        </section>
      </div>

      <section>
        <div className="section-head">
          <h2>{started.length ? 'Your courses' : 'Recommended courses'}</h2>
          <a href="#/courses">All courses →</a>
        </div>
        <div className="course-grid">
          {(started.length ? started : courses.slice(0, 3)).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>
    </Page>
  );
}
