import { useState } from 'react';
import { categories, courses } from '../content';
import { href } from '../lib/router';
import { courseStats } from '../lib/stats';
import { useProgress } from '../lib/storage';
import type { Course } from '../types';
import { Page, PageHeader } from './Layout';
import { accentStyle, ProgressBar } from './ui';
import { CourseIcon } from './CourseIcon';

export function CourseCard({ course }: { course: Course }) {
  const p = useProgress();
  const s = courseStats(course, p);
  return (
    <a className="course-card" href={href('course', course.id)} style={accentStyle(course.color)}>
      <div className="course-banner">
        <CourseIcon icon={course.icon} color={course.color} size={60} />
        {course.level && <span className="level-pill">{course.level}</span>}
      </div>
      <div className="course-body">
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <span>{s.total} lessons</span>
          <span>
            {s.coreTotal} core · ~{s.coreMinutes} min
          </span>
        </div>
        {s.started ? (
          <>
            <ProgressBar value={s.total ? s.completed / s.total : 0} label={`${course.title} progress`} />
            <div className="course-meta">
              <span>
                Core {s.coreDone}/{s.coreTotal}
              </span>
              <span>{Math.round(s.mastery * 100)}% mastered</span>
            </div>
          </>
        ) : (
          <span className="course-cta">Start course →</span>
        )}
      </div>
    </a>
  );
}

export function Courses() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const q = query.trim().toLowerCase();
  const shown = courses.filter(
    (c) =>
      (category === 'All' || c.category === category) &&
      (!q || `${c.title} ${c.description} ${c.keyIdeas.join(' ')} ${c.lessons.map((l) => l.title).join(' ')}`.toLowerCase().includes(q)),
  );

  return (
    <Page wide>
      <PageHeader
        title="Courses"
        subtitle="Each course starts with the core 20% — the ideas you'll use 80% of the time. Deep dives are optional."
      />
      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search courses and lessons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search courses"
        />
        <div className="chips" role="tablist" aria-label="Category">
          {['All', ...categories].map((cat) => (
            <button key={cat} role="tab" aria-selected={category === cat} className={`chip-btn${category === cat ? ' on' : ''}`} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      {shown.length ? (
        <div className="course-grid">
          {shown.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <p className="muted center">No courses match “{query}”.</p>
      )}
    </Page>
  );
}
