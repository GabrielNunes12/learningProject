// Development-only page (#/dev/games): open any mini-game or simulator step directly, in learn or test mode.
import { courses } from '../content';
import { href } from '../lib/router';
import { isQuestion, type Step } from '../types';
import { Page } from './Layout';
import { QuestionView } from './QuestionView';
import { SimStepView } from './sims/SimStepView';
import { accentStyle } from './ui';

const VISUAL = new Set(['order', 'buckets', 'trace', 'sim', 'truthtable', 'logicgrid', 'balance']);

const entries = courses.flatMap((course) =>
  course.lessons.flatMap((lesson) =>
    lesson.steps
      .map((step, i) => ({ course, lesson, step, i }))
      .filter((e) => VISUAL.has(e.step.type)),
  ),
);

const label = (s: Step) => (s.type === 'sim' ? `sim: ${s.sim}` : s.type);

export function DevGames({ index, mode }: { index?: string; mode?: string }) {
  const n = index === undefined ? -1 : Number(index);
  const entry = entries[n];
  const testMode = mode === 'test';

  if (!entry) {
    return (
      <Page>
        <h1>Mini-games & simulators</h1>
        <p className="muted">{entries.length} visual steps in the courses. Development only.</p>
        <ol className="dev-games-list">
          {entries.map((e, i) => (
            <li key={i}>
              <a href={href('dev', 'games', String(i))}>
                <strong>{label(e.step)}</strong> · {e.course.title} → {e.lesson.title} (step {e.i + 1})
              </a>{' '}
              <a className="muted small" href={href('dev', 'games', String(i), 'test')}>
                test mode
              </a>
            </li>
          ))}
        </ol>
      </Page>
    );
  }

  const next = () => {
    window.location.hash = href('dev', 'games', String(n + 1 < entries.length ? n + 1 : 0), ...(testMode ? ['test'] : []));
  };
  const step = entry.step;
  return (
    <div className="player" style={accentStyle(entry.course.color)}>
      <main className="player-body" key={`${n}-${mode}`}>
        <div className="lesson-crumb">
          <a href={href('dev', 'games')}>← All</a> · {label(step)} · {entry.course.title} → {entry.lesson.title}
          {testMode ? ' · test mode' : ''}
        </div>
        {isQuestion(step) && (
          <article className="step-card">
            <QuestionView step={step} mode={testMode ? 'test' : 'learn'} shuffle={testMode} onDone={next} />
          </article>
        )}
        {step.type === 'sim' && <SimStepView step={step} onContinue={next} />}
      </main>
    </div>
  );
}
