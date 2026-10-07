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
import { t, type MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 5 ? 'late' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return name ? t(`home.greet.${part}Name` as MessageKey, { name }) : t(`home.greet.${part}` as MessageKey);
}

function WeekDots({ p }: { p: Progress }) {
  const { date } = useT();
  const days = new Set(p.days);
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push(
      <span key={i} className={`week-dot${days.has(key) ? ' on' : ''}${i === 0 ? ' today' : ''}`} title={date(d, { weekday: 'long', month: 'long', day: 'numeric' })}>
        {date(d, { weekday: 'narrow' })}
      </span>,
    );
  }
  return <div className="week-dots">{out}</div>;
}

function ContinueCard({ p }: { p: Progress }) {
  const { t } = useT();
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
        <span className="eyebrow">{s.started ? t('home.continue.eyebrow') : t('home.continue.startHere')}</span>
        <h2>{lesson ? lesson.title : t('home.continue.complete', { course: course.title })}</h2>
        <p className="muted">
          {course.title}
          {lesson && ` · ${unitOf(course, lesson).title}`}
          {lesson && (
            <>
              {' · '}
              <span className={`tag ${lesson.pareto}`}>{lesson.pareto === 'core' ? t('common.core') : t('common.deepDive')}</span>
            </>
          )}
        </p>
        <ProgressBar value={s.total ? s.completed / s.total : 0} label={t('home.continue.progress', { done: s.completed, total: s.total })} />
        <span className="small muted">
          {t('home.continue.counts', { coreDone: s.coreDone, coreTotal: s.coreTotal, done: s.completed, total: s.total })}
        </span>
      </div>
      <div className="continue-actions">
        {lesson ? (
          <a className="btn primary big" href={href('course', course.id, 'lesson', lesson.id)}>
            {s.started ? t('home.continue.continue') : t('home.continue.start')}
          </a>
        ) : (
          <a className="btn primary big" href={href('course', course.id, 'quiz')}>
            {t('home.continue.quiz')}
          </a>
        )}
      </div>
    </section>
  );
}

export function Home() {
  const { t, tx, pct } = useT();
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
          <span className="eyebrow">{t('home.hero.eyebrow')}</span>
          <h1>{tx('home.hero.title', {}, { hl: (c) => <span className="hl">{c}</span> })}</h1>
          <p className="lead">{t('home.hero.lead')}</p>
          <div className="hero-actions">
            <a className="btn primary big" href={href('course', courses[0]?.id ?? '', 'lesson', courses[0]?.lessons[0]?.id ?? '')}>
              {t('home.hero.tryLesson')}
            </a>
            <a className="btn big" href="#/signup">
              {t('common.createProfile')}
            </a>
          </div>
        </section>
      ) : (
        <div className="greeting">
          <h1>{greeting(user?.username)}</h1>
          <p className="lead">
            {today >= p.dailyGoal ? t('home.goalReached') : due > 0 ? t('home.startWithReviews', { count: due }) : t('home.pickUp')}
          </p>
        </div>
      )}

      <div className="stat-grid">
        <a className="stat-card" href="#/profile">
          <Ring value={today / Math.max(p.dailyGoal, 1)} size={64} label={t('common.dailyGoal')}>
            <strong>{pct(Math.min(1, today / Math.max(p.dailyGoal, 1)))}</strong>
          </Ring>
          <div>
            <span className="stat-label">{t('common.dailyGoal')}</span>
            <span className="stat-value">{t('home.stat.goalValue', { today, goal: p.dailyGoal })}</span>
          </div>
        </a>
        <a className="stat-card" href="#/profile">
          <div className="stat-emoji flame" aria-hidden>
            <Icon name="flame" size={30} />
          </div>
          <div>
            <span className="stat-label">{t('common.streak')}</span>
            <span className="stat-value">{t('home.stat.streakValue', { count: days })}</span>
            <WeekDots p={p} />
          </div>
        </a>
        <a className="stat-card" href="#/profile">
          <div className="level-badge" aria-hidden>
            {lvl.level}
          </div>
          <div className="grow">
            <span className="stat-label">{t('home.stat.level', { level: lvl.level, title: lvl.title })}</span>
            <span className="stat-value">{t('common.xp', { count: p.xp })}</span>
            <ProgressBar value={lvl.into / lvl.needed} thin label={t('home.stat.levelProgress')} />
            <span className="small muted">{t('home.stat.toNext', { xp: lvl.end - p.xp, level: lvl.level + 1 })}</span>
          </div>
        </a>
        <a className={`stat-card${due ? ' attention' : ''}`} href="#/review">
          <div className="stat-emoji" aria-hidden>
            <Icon name={due ? 'review' : 'seedling'} size={30} />
          </div>
          <div>
            <span className="stat-label">{t('common.reviews')}</span>
            <span className="stat-value">{due ? t('home.stat.dueNow', { count: due }) : t('home.stat.caughtUp')}</span>
            <span className="small muted">{due ? t('home.stat.beforeForget') : t('home.stat.nothingDue')}</span>
          </div>
        </a>
      </div>

      <ContinueCard p={p} />
      <ThinkingTeaser />
      <InsightsTeaser />
      <RoadmapTeaser />

      {!user && !fresh && (
        <div className="save-banner">
          <span>{tx('home.save.text', {}, { b: (c) => <strong>{c}</strong> })}</span>
          <a className="btn primary small" href="#/signup">
            {t('home.save.button')}
          </a>
        </div>
      )}

      <div className="home-columns">
        <section className="panel">
          <div className="panel-head">
            <h2>{t('home.week.title')}</h2>
            <span className="muted small">
              {t('common.xp', { count: Object.entries(p.xpByDay).filter(([d]) => Date.now() - new Date(d).getTime() < 7 * 86_400_000).reduce((s, [, x]) => s + x, 0) })}
            </span>
          </div>
          <WeekXpChart p={p} />
        </section>
        <section className="panel method">
          <h2>{t('home.method.title')}</h2>
          <ol>
            <li>
              {tx(
                'home.method.core',
                {},
                {
                  b: (c) => <strong>{c}</strong>,
                  core: (c) => <span className="tag core">{c}</span>,
                  extra: (c) => <span className="tag extra">{c}</span>,
                },
              )}
            </li>
            <li>{tx('home.method.testOut', {}, { b: (c) => <strong>{c}</strong> })}</li>
            <li>{tx('home.method.daily', {}, { b: (c) => <strong>{c}</strong> })}</li>
            <li>{tx('home.method.two', {}, { b: (c) => <strong>{c}</strong> })}</li>
          </ol>
        </section>
      </div>

      <section>
        <div className="section-head">
          <h2>{started.length ? t('home.yourCourses') : t('home.recommended')}</h2>
          <a href="#/courses">{t('home.allCourses')}</a>
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
