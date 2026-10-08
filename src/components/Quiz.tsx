import { useState } from 'react';
import { questionByKey, type QuestionRef } from '../content';
import { levelQuizPlan, levelResult, shouldStopLevel, type LevelQuestion } from '../lib/mastery';
import { href } from '../lib/router';
import { recordQuiz, XP } from '../lib/storage';
import type { Course } from '../types';
import { Page } from './Layout';
import { Session, type SessionResult } from './Session';
import { Icon } from './icons';
import { useT } from '../i18n/react';

export function Quiz({ course }: { course: Course }) {
  const [run, setRun] = useState(0);
  return <QuizRun key={run} course={course} onRetake={() => setRun(run + 1)} />;
}

/**
 * Find your level: one question per lesson, easy to hard (course order), stopping once the learner starts guessing
 * or missing. Where it stops is where they should start (the edge of what they know).
 */
function QuizRun({ course, onRetake }: { course: Course; onRetake: () => void }) {
  const { t } = useT();
  const [plan] = useState(() => levelQuizPlan(course).filter((q) => questionByKey.has(q.key)));
  const questions = plan.map((q) => questionByKey.get(q.key)!);
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
      stopWhen={(results) => shouldStopLevel(results.map((r) => ({ ok: r.ok, conf: r.confidence })))}
      onFinish={(results) => recordQuiz(course.id, Math.round((100 * results.filter((r) => r.ok).length) / results.length))}
      renderEnd={(results, xp) => <QuizEnd course={course} plan={plan} results={results} xp={xp} onRetake={onRetake} />}
    />
  );
}

function QuizEnd({ course, plan, results, xp, onRetake }: { course: Course; plan: LevelQuestion[]; results: SessionResult[]; xp: number; onRetake: () => void }) {
  const { t } = useT();
  const level = levelResult(
    plan,
    results.map((r) => ({ lesson: r.ref.lesson, ok: r.ok, conf: r.confidence })),
  );
  const perfect = results.length === plan.length && level.shaky.length === 0;
  const why = (r: SessionResult) =>
    r.confidence === 'unknown' ? t('quiz.level.reason.unknown') : !r.ok ? t('quiz.level.reason.missed') : t('quiz.level.reason.guessed');
  const study: { lesson: QuestionRef['lesson']; reason: string }[] = results
    .filter((r) => !r.ok || r.confidence !== 'sure')
    .map((r) => ({ lesson: r.ref.lesson, reason: why(r) }));

  const title = level.stopped && level.start ? t('quiz.level.startAt', { lesson: level.start.title }) : perfect ? t('quiz.level.allTitle') : t('quiz.level.patchTitle');
  const lead = level.stopped
    ? level.solid.length
      ? t('quiz.level.stoppedLead', { count: level.solid.length })
      : t('quiz.level.stoppedFirst')
    : perfect
      ? t('quiz.level.allLead')
      : t('quiz.level.patchLead');

  return (
    <>
      <div className="celebrate" aria-hidden>
        <Icon name={perfect ? 'target' : level.solid.length ? 'trendUp' : 'seedling'} size={72} />
      </div>
      <span className="eyebrow">{t('quiz.level.eyebrow')}</span>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      <div className="result-tiles">
        <div className="result-tile xp">
          <span>{t('quiz.end.xpEarned')}</span>
          <strong>{t('quiz.end.xpGain', { xp: xp + (perfect ? XP.quizPerfect : 0) })}</strong>
        </div>
        <div className="result-tile">
          <span>{t('quiz.end.toStudy')}</span>
          <strong>{study.length + level.untested.length}</strong>
        </div>
        <div className="result-tile">
          <span>{t('quiz.end.solid')}</span>
          <strong>{level.solid.length}</strong>
        </div>
      </div>

      {level.start && (
        <div className="actions center">
          <a className="btn primary big" href={href('course', course.id, 'lesson', level.start.id)}>
            {t('quiz.level.startButton')}
          </a>
        </div>
      )}

      {study.length > 0 && (
        <div className="diagnosis">
          <h2>{t('quiz.end.studyThese')}</h2>
          <ul>
            {study.map(({ lesson, reason }) => (
              <li key={lesson.id}>
                <a href={href('course', course.id, 'lesson', lesson.id)}>{lesson.title}</a>
                <span className={`tag ${lesson.pareto}`}>{lesson.pareto === 'core' ? t('common.core') : t('common.deepDive')}</span>
                <span className="muted small">{reason}</span>
              </li>
            ))}
          </ul>
          {level.untested.length > 0 && <p className="muted small">{t('quiz.level.notReached', { count: level.untested.length })}</p>}
        </div>
      )}
      {level.solid.length > 0 && (
        <div className="diagnosis ok">
          <h2>{t('quiz.end.solidTitle')}</h2>
          <ul>
            {level.solid.map((lesson) => (
              <li key={lesson.id}>{lesson.title}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small">{t('quiz.level.howItWorks')}</p>
      <p className="muted small">{t('quiz.end.reviewNote')}</p>
      <div className="actions center">
        <a className="btn ghost" href={href('course', course.id)}>
          {t('quiz.end.backToCourse')}
        </a>
        <button className="btn big" onClick={onRetake}>
          {t('quiz.end.retake')}
        </button>
      </div>
    </>
  );
}
