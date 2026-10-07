import { useState } from 'react';
import { allQuestions } from '../content';
import { shuffled } from '../lib/answers';
import { href } from '../lib/router';
import { recordQuiz, XP } from '../lib/storage';
import type { Course } from '../types';
import { Page } from './Layout';
import { Session, type SessionResult } from './Session';
import { Icon } from './icons';
import { useT } from '../i18n/react';

const QUIZ_SIZE = 12;

export function Quiz({ course }: { course: Course }) {
  const [run, setRun] = useState(0);
  return <QuizRun key={run} course={course} onRetake={() => setRun(run + 1)} />;
}

function QuizRun({ course, onRetake }: { course: Course; onRetake: () => void }) {
  const { t } = useT();
  // Interleaved: questions from every lesson, mixed together.
  const [questions] = useState(() => shuffled(allQuestions.filter((q) => q.course.id === course.id)).slice(0, QUIZ_SIZE));
  const courseHref = href('course', course.id);

  if (questions.length === 0) {
    return (
      <Page>
        <p>{t('quiz.noQuestions')}</p>
        <a href={courseHref}>{t('quiz.back')}</a>
      </Page>
    );
  }

  return (
    <Session
      ritual={{ kind: 'quiz', title: t('quiz.ritualTitle', { title: course.title }), course: course.id }}
      questions={questions}
      exitHref={courseHref}
      onFinish={(results) => recordQuiz(course.id, Math.round((100 * results.filter((r) => r.ok).length) / results.length))}
      renderEnd={(results, xp) => <QuizEnd course={course} results={results} xp={xp} onRetake={onRetake} />}
    />
  );
}

function QuizEnd({ course, results, xp, onRetake }: { course: Course; results: SessionResult[]; xp: number; onRetake: () => void }) {
  const { t, pct } = useT();
  const right = results.filter((r) => r.ok).length;
  const score = Math.round((100 * right) / results.length);

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
        <Icon name={score >= 80 ? 'target' : score >= 50 ? 'trendUp' : 'seedling'} size={72} />
      </div>
      <h1>{pct(score / 100)}</h1>
      <p className="lead">
        {t(score >= 80 ? 'quiz.end.summaryHigh' : score >= 50 ? 'quiz.end.summaryMid' : 'quiz.end.summaryLow', { right, total: results.length })}
      </p>
      <div className="result-tiles">
        <div className="result-tile xp">
          <span>{t('quiz.end.xpEarned')}</span>
          <strong>{t('quiz.end.xpGain', { xp: xp + (score === 100 ? XP.quizPerfect : 0) })}</strong>
        </div>
        <div className="result-tile">
          <span>{t('quiz.end.toStudy')}</span>
          <strong>{study.length}</strong>
        </div>
        <div className="result-tile">
          <span>{t('quiz.end.solid')}</span>
          <strong>{solid.length}</strong>
        </div>
      </div>

      {study.length > 0 && (
        <div className="diagnosis">
          <h2>{t('quiz.end.studyThese')}</h2>
          <ul>
            {study.map(({ lesson, missed, total }) => (
              <li key={lesson.id}>
                <a href={href('course', course.id, 'lesson', lesson.id)}>{lesson.title}</a>
                <span className={`tag ${lesson.pareto}`}>{lesson.pareto === 'core' ? t('common.core') : t('common.deepDive')}</span>
                <span className="muted small">{t('quiz.end.missed', { missed, total })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {solid.length > 0 && (
        <div className="diagnosis ok">
          <h2>{t('quiz.end.solidTitle')}</h2>
          <ul>
            {solid.map(({ lesson }) => (
              <li key={lesson.id}>{lesson.title}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small">{t('quiz.end.reviewNote')}</p>
      <div className="actions center">
        <a className="btn ghost" href={href('course', course.id)}>
          {t('quiz.end.backToCourse')}
        </a>
        <button className="btn primary big" onClick={onRetake}>
          {t('quiz.end.retake')}
        </button>
      </div>
    </>
  );
}
