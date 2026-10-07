import { href } from '../lib/router';
import type { Course } from '../types';
import { Page } from './Layout';
import { InlineMarkdown, Markdown } from './Markdown';
import { accentStyle } from './ui';
import { CourseIcon } from './CourseIcon';
import { useT } from '../i18n/react';

export function CheatSheet({ course }: { course: Course }) {
  const { t } = useT();
  return (
    <Page>
      <article className="cheatsheet" style={accentStyle(course.color)}>
        <div className="no-print row between">
          <a className="back" href={href('course', course.id)}>
            {t('course.cheatSheet.back', { title: course.title })}
          </a>
          <button className="btn small" onClick={() => window.print()}>
            {t('course.cheatSheet.print')}
          </button>
        </div>
        <h1>
          <CourseIcon icon={course.icon} color={course.color} size={40} className="title-icon" /> {t('course.cheatSheet.title', { title: course.title })}
        </h1>
        <p className="muted">{t('course.cheatSheet.intro')}</p>

        <section className="panel key-ideas">
          <h2>{t('course.cheatSheet.keyIdeas')}</h2>
          <ul>
            {course.keyIdeas.map((idea, i) => (
              <li key={i}>
                <InlineMarkdown text={idea} />
              </li>
            ))}
          </ul>
        </section>

        {course.units.map((u) => (
          <section key={u.id}>
            <h2>{u.title}</h2>
            <dl className="takeaways">
              {u.lessons.map((l) => (
                <div key={l.id}>
                  <dt>
                    {l.title} <span className={`tag ${l.pareto}`}>{l.pareto === 'core' ? t('common.core') : t('common.deepDive')}</span>
                  </dt>
                  <dd>
                    <Markdown text={l.takeaway} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </article>
    </Page>
  );
}
