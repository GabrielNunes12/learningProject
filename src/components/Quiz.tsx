import { useState } from 'react';
import { allQuestions } from '../content';
import { shuffled } from '../lib/answers';
import { href } from '../lib/router';
import { recordQuiz, XP } from '../lib/storage';
import type { Course } from '../types';
import { Page } from './Layout';
import { Session, type SessionResult } from './Session';

const QUIZ_SIZE = 12;

export function Quiz({ course }: { course: Course }) {
  const [run, setRun] = useState(0);
  return <QuizRun key={run} course={course} onRetake={() => setRun(run + 1)} />;
}

function QuizRun({ course, onRetake }: { course: Course; onRetake: () => void }) {
  // Interleaved: questions from every lesson, mixed together.
  const [questions] = useState(() => shuffled(allQuestions.filter((q) => q.course.id === course.id)).slice(0, QUIZ_SIZE));
  const courseHref = href('course', course.id);

  if (questions.length === 0) {
    return (
      <Page>
        <p>This course has no questions yet.</p>
        <a href={courseHref}>← Back</a>
      </Page>
    );
  }

  return (
    <Session
      questions={questions}
      exitHref={courseHref}
      onFinish={(results) => recordQuiz(course.id, Math.round((100 * results.filter((r) => r.ok).length) / results.length))}
      renderEnd={(results, xp) => <QuizEnd course={course} results={results} xp={xp} onRetake={onRetake} />}
    />
  );
}

function QuizEnd({ course, results, xp, onRetake }: { course: Course; results: SessionResult[]; xp: number; onRetake: () => void }) {
  const right = results.filter((r) => r.ok).length;
  const pct = Math.round((100 * right) / results.length);

  // Per-lesson diagnosis: which lessons to study, which you can skip.
  const byLesson = course.lessons
    .map((lesson) => {
      const rs = results.filter((r) => r.ref.lesson.id === lesson.id);
      return { lesson, total: rs.length, missed: rs.filter((r) => !r.ok).length };
    })
    .filter((x) => x.total > 0);
  const study = byLesson.filter((x) => x.missed > 0);
  const solid = byLesson.filter((x) => x.missed === 0);

  return (
    <>
      <div className="celebrate" aria-hidden>
        {pct >= 80 ? '🎯' : pct >= 50 ? '💪' : '🌱'}
      </div>
      <h1>{pct}%</h1>
      <p className="lead">
        {right} of {results.length} correct.{' '}
        {pct >= 80 ? "You've got the core of this course." : pct >= 50 ? 'Solid start — focus on the gaps below.' : 'Great diagnostic: now you know exactly where to start.'}
      </p>
      <div className="result-tiles">
        <div className="result-tile xp">
          <span>XP earned</span>
          <strong>+{xp + (pct === 100 ? XP.quizPerfect : 0)}</strong>
        </div>
        <div className="result-tile">
          <span>To study</span>
          <strong>{study.length}</strong>
        </div>
        <div className="result-tile">
          <span>Solid</span>
          <strong>{solid.length}</strong>
        </div>
      </div>

      {study.length > 0 && (
        <div className="diagnosis">
          <h2>Study these</h2>
          <ul>
            {study.map(({ lesson, missed, total }) => (
              <li key={lesson.id}>
                <a href={href('course', course.id, 'lesson', lesson.id)}>{lesson.title}</a>
                <span className={`tag ${lesson.pareto}`}>{lesson.pareto === 'core' ? 'Core' : 'Deep dive'}</span>
                <span className="muted small">
                  missed {missed} of {total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {solid.length > 0 && (
        <div className="diagnosis ok">
          <h2>Looking solid — you can skip these</h2>
          <ul>
            {solid.map(({ lesson }) => (
              <li key={lesson.id}>{lesson.title}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small">Missed questions come back in your Review queue.</p>
      <div className="actions center">
        <a className="btn ghost" href={href('course', course.id)}>
          Back to course
        </a>
        <button className="btn primary big" onClick={onRetake}>
          Retake quiz
        </button>
      </div>
    </>
  );
}
