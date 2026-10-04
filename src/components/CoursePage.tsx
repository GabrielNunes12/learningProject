import { useState } from 'react';
import { href } from '../lib/router';
import { courseStats } from '../lib/stats';
import { useProgress } from '../lib/storage';
import type { Course, Lesson } from '../types';
import { Page } from './Layout';
import { InlineMarkdown } from './Markdown';
import { accentStyle, plural, ProgressBar, Ring } from './ui';

const FAST_KEY = 'projectlearn:fasttrack';

export function CoursePage({ course }: { course: Course }) {
  const p = useProgress();
  const s = courseStats(course, p);
  const [fast, setFast] = useState(() => {
    try {
      return localStorage.getItem(FAST_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleFast = () => {
    setFast(!fast);
    try {
      localStorage.setItem(FAST_KEY, fast ? '0' : '1');
    } catch {
      /* ignore */
    }
  };
  const quizBest = p.quizBest[course.id];
  let n = 0;

  const row = (l: Lesson) => {
    n++;
    const done = s.done(l);
    const isNext = s.next?.id === l.id;
    return (
      <li key={l.id}>
        <a className={`lesson-row${done ? ' done' : ''}${isNext ? ' next' : ''}`} href={href('course', course.id, 'lesson', l.id)}>
          <span className="lesson-node" aria-hidden>
            {done ? '✓' : n}
          </span>
          <span className="lesson-text">
            <strong>{l.title}</strong>
            <small>
              {l.minutes ?? 5} min · {plural(l.steps.length, 'step')}
              {done && ' · completed'}
            </small>
          </span>
          <span className={`tag ${l.pareto}`}>{l.pareto === 'core' ? 'Core' : 'Deep dive'}</span>
          {isNext && <span className="btn primary small">Start</span>}
        </a>
      </li>
    );
  };

  return (
    <Page wide>
      <div style={accentStyle(course.color)}>
        <a className="back" href="#/courses">
          ← All courses
        </a>
        <header className="course-hero">
          <div className="course-hero-icon" aria-hidden>
            {course.icon}
          </div>
          <div className="course-hero-text">
            <span className="eyebrow">
              {course.category}
              {course.level && ` · ${course.level}`}
            </span>
            <h1>{course.title}</h1>
            <p className="lead">{course.description}</p>
            <div className="hero-actions">
              {s.next && (
                <a className="btn primary big" href={href('course', course.id, 'lesson', s.next.id)}>
                  {s.started ? 'Continue' : 'Start learning'} →
                </a>
              )}
              <a className="btn big" href={href('course', course.id, 'quiz')}>
                {s.started ? 'Take the quiz' : 'Test out with the quiz'}
              </a>
            </div>
          </div>
        </header>

        <div className="course-layout">
          <div className="course-path">
            <div className="path-toolbar">
              <h2>Learning path</h2>
              <label className="switch">
                <input type="checkbox" checked={fast} onChange={toggleFast} />
                <span className="switch-track" aria-hidden />
                Fast track: core only
              </label>
            </div>
            {fast && (
              <p className="muted small">
                Showing the {s.coreTotal} core lessons (~{s.coreMinutes} min) that cover most of what you'll use.
              </p>
            )}
            {course.units.map((u, ui) => {
              const lessons = fast ? u.lessons.filter((l) => l.pareto === 'core') : u.lessons;
              const doneCount = u.lessons.filter(s.done).length;
              if (!lessons.length) {
                return null;
              }
              return (
                <section key={u.id} className="unit">
                  <header className="unit-head">
                    <span className="unit-num">Unit {ui + 1}</span>
                    <h3>{u.title}</h3>
                    <span className="muted small">
                      {doneCount}/{u.lessons.length}
                    </span>
                  </header>
                  {u.description && <p className="muted small unit-desc">{u.description}</p>}
                  <ol className="lesson-list">{lessons.map(row)}</ol>
                </section>
              );
            })}
          </div>

          <aside className="course-side">
            <div className="panel">
              <div className="side-stats">
                <Ring value={s.total ? s.completed / s.total : 0} size={72} stroke={8} label="Lessons completed">
                  <strong>{Math.round((s.total ? s.completed / s.total : 0) * 100)}%</strong>
                </Ring>
                <div>
                  <div>
                    <strong>
                      {s.coreDone}/{s.coreTotal}
                    </strong>{' '}
                    core lessons
                  </div>
                  <div>
                    <strong>{Math.round(s.mastery * 100)}%</strong> mastered
                  </div>
                  <div>
                    <strong>{quizBest !== undefined ? `${quizBest}%` : '—'}</strong> best quiz
                  </div>
                </div>
              </div>
              <ProgressBar value={s.mastery} thin label="Mastery" />
              <p className="small muted">Mastered = remembered across several spaced reviews.</p>
            </div>

            <div className="panel key-ideas">
              <h2>The 20% that matters</h2>
              <ul>
                {course.keyIdeas.map((idea, i) => (
                  <li key={i}>
                    <InlineMarkdown text={idea} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel side-links">
              <a href={href('course', course.id, 'quiz')}>
                <strong>Quiz</strong>
                <span>{Math.min(12, s.questionCount)} mixed questions — find your gaps</span>
              </a>
              <a href={href('review', 'start', course.id)}>
                <strong>Review this course</strong>
                <span>Practise what's due from {course.title}</span>
              </a>
              <a href={href('course', course.id, 'cheatsheet')}>
                <strong>Cheat sheet</strong>
                <span>The whole course on one printable page</span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </Page>
  );
}
