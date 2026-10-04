import { href } from '../lib/router';
import type { Course } from '../types';
import { Page } from './Layout';
import { InlineMarkdown, Markdown } from './Markdown';
import { accentStyle } from './ui';

export function CheatSheet({ course }: { course: Course }) {
  return (
    <Page>
      <article className="cheatsheet" style={accentStyle(course.color)}>
        <div className="no-print row between">
          <a className="back" href={href('course', course.id)}>
            ← {course.title}
          </a>
          <button className="btn small" onClick={() => window.print()}>
            Print / save as PDF
          </button>
        </div>
        <h1>
          {course.icon} {course.title} — cheat sheet
        </h1>
        <p className="muted">Try this first: cover the page and explain each idea out loud. Wherever you get stuck is what to review.</p>

        <section className="panel key-ideas">
          <h2>Key ideas</h2>
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
                    {l.title} <span className={`tag ${l.pareto}`}>{l.pareto === 'core' ? 'Core' : 'Deep dive'}</span>
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
