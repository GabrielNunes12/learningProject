import { useState } from 'react';
import { categories, courses } from '../content';
import { href } from '../lib/router';
import { courseStats } from '../lib/stats';
import { useProgress } from '../lib/storage';
import type { Course } from '../types';
import { Page, PageHeader } from './Layout';
import { accentStyle, ProgressBar } from './ui';
import { CourseIcon } from './CourseIcon';
import { categoryLabel, levelLabel } from '../i18n/core';
import { useT } from '../i18n/react';

/** The "all categories" filter. A logic id, never shown: the chip shows courses.filter.all. */
const ALL = 'All';

export function CourseCard({ course }: { course: Course }) {
  const { t, pct } = useT();
  const p = useProgress();
  const s = courseStats(course, p);
  return (
    <a className="course-card" href={href('course', course.id)} style={accentStyle(course.color)}>
      <div className="course-banner">
        <CourseIcon icon={course.icon} color={course.color} size={60} />
        {course.level && <span className="level-pill">{levelLabel(course.level)}</span>}
      </div>
      <div className="course-body">
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <span>{t('common.lessons', { count: s.total })}</span>
          <span>{t('courses.card.coreMeta', { count: s.coreTotal, minutes: s.coreMinutes })}</span>
        </div>
        {s.started ? (
          <>
            <ProgressBar value={s.total ? s.completed / s.total : 0} label={t('courses.card.progressLabel', { title: course.title })} />
            <div className="course-meta">
              <span>{t('courses.card.coreDone', { done: s.coreDone, total: s.coreTotal })}</span>
              <span>{t('courses.card.mastered', { pct: pct(s.mastery) })}</span>
            </div>
          </>
        ) : (
          <span className="course-cta">{t('courses.card.start')}</span>
        )}
      </div>
    </a>
  );
}

export function Courses() {
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  // Case- and accent-insensitive, so "licao" finds "lição".
  const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = fold(query.trim());
  const shown = courses.filter(
    (c) =>
      (category === ALL || c.category === category) &&
      (!q || fold(`${c.title} ${c.description} ${c.keyIdeas.join(' ')} ${c.lessons.map((l) => l.title).join(' ')}`).includes(q)),
  );

  return (
    <Page wide>
      <PageHeader title={t('courses.title')} subtitle={t('courses.subtitle')} />
      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder={t('courses.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('courses.searchLabel')}
        />
        <div className="chips" role="tablist" aria-label={t('courses.filter.label')}>
          {[ALL, ...categories].map((cat) => (
            <button key={cat} role="tab" aria-selected={category === cat} className={`chip-btn${category === cat ? ' on' : ''}`} onClick={() => setCategory(cat)}>
              {cat === ALL ? t('courses.filter.all') : categoryLabel(cat)}
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
        <p className="muted center">{t('courses.noMatch', { query })}</p>
      )}
    </Page>
  );
}
