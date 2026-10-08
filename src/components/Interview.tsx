// The interviewer (#/start): for learners starting out who aren't sure what they need. Three questions, one per
// screen, then a plan: a track, the first step and a daily goal (lib/interview.ts).
import { useState } from 'react';
import { getCourse, tracks } from '../content';
import { EXPERIENCE, GOALS, interviewPlan, PACE_GOAL, PACES, type Experience, type Goal, type Pace } from '../lib/interview';
import { href } from '../lib/router';
import { setDailyGoal } from '../lib/storage';
import type { MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';
import { Page } from './Layout';
import { CourseIcon } from './CourseIcon';

export function Interview() {
  const { t } = useT();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [pace, setPace] = useState<Pace | null>(null);
  const available = GOALS.filter((g) => tracks.some((tr) => tr.id === g));
  const track = goal ? tracks.find((tr) => tr.id === goal) : undefined;
  // The thinking track doesn't depend on programming experience.
  const askExperience = goal !== 'thinking-tools';
  const step = !goal ? 0 : askExperience && !experience ? 1 : !pace ? 2 : 3;
  const total = askExperience ? 3 : 2;
  const restart = () => {
    setGoal(null);
    setExperience(null);
    setPace(null);
  };

  if (step === 3 && track && pace) {
    const plan = interviewPlan(track, experience ?? 'none', pace);
    const course = getCourse(plan.start.course);
    const startHref = plan.start.kind === 'level' ? href('course', plan.start.course, 'quiz') : href('course', plan.start.course);
    return (
      <Page>
        <section className="interview">
          <span className="eyebrow">{t('roadmap.start.plan.eyebrow')}</span>
          <h1>{track.title}</h1>
          <p className="lead">{track.description}</p>
          <ol className="interview-plan">
            <li>
              {course && <CourseIcon icon={course.icon} color={course.color} size={28} />}
              <div>
                <strong>{plan.start.kind === 'level' ? t('roadmap.start.plan.levelTitle', { course: course?.title ?? '' }) : t('roadmap.start.plan.learnTitle', { course: course?.title ?? '' })}</strong>
                <span className="muted small">{plan.start.kind === 'level' ? t('roadmap.start.plan.levelWhy') : t('roadmap.start.plan.learnWhy')}</span>
              </div>
            </li>
            <li>
              <span className="interview-goal">{plan.dailyGoal}</span>
              <div>
                <strong>{t('roadmap.start.plan.goalTitle', { xp: plan.dailyGoal })}</strong>
                <span className="muted small">{t('roadmap.start.plan.goalWhy', { minutes: t('common.minutes', { count: pace }) })}</span>
              </div>
            </li>
          </ol>
          <div className="actions">
            <a className="btn primary big" href={startHref} onClick={() => setDailyGoal(plan.dailyGoal)}>
              {plan.start.kind === 'level' ? t('roadmap.start.plan.startLevel') : t('roadmap.start.plan.startLearn')}
            </a>
            <a className="btn big" href={href('roadmap', track.id)} onClick={() => setDailyGoal(plan.dailyGoal)}>
              {t('roadmap.start.plan.seeTrack')}
            </a>
          </div>
          <button type="button" className="link small" onClick={restart}>
            {t('roadmap.start.restart')}
          </button>
        </section>
      </Page>
    );
  }

  // Question number as the learner sees it (the experience question is skipped for the thinking track).
  const shown = step === 0 ? 1 : step === 1 ? 2 : total;
  const progress = t('roadmap.start.progress', { step: shown, total });
  return (
    <Page>
      <section className="interview">
        <span className="eyebrow">{progress}</span>
        {step === 0 && (
          <>
            <h1>{t('roadmap.start.goal.question')}</h1>
            <p className="lead">{t('roadmap.start.intro')}</p>
            <div className="interview-options">
              {available.map((g) => (
                <button key={g} type="button" className="interview-option" onClick={() => setGoal(g)}>
                  <strong>{t(`roadmap.start.goal.${g}` as MessageKey)}</strong>
                  <span className="muted small">{tracks.find((tr) => tr.id === g)?.title}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h1>{t('roadmap.start.experience.question')}</h1>
            <div className="interview-options">
              {EXPERIENCE.map((e) => (
                <button key={e} type="button" className="interview-option" onClick={() => setExperience(e)}>
                  <strong>{t(`roadmap.start.experience.${e}` as MessageKey)}</strong>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1>{t('roadmap.start.pace.question')}</h1>
            <div className="interview-options pace">
              {PACES.map((m) => (
                <button key={m} type="button" className="interview-option" onClick={() => setPace(m)}>
                  <strong>{t('common.minutes', { count: m })}</strong>
                  <span className="muted small">{t('roadmap.start.pace.goal', { xp: PACE_GOAL[m] })}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step > 0 && (
          <button type="button" className="link small" onClick={restart}>
            {t('roadmap.start.restart')}
          </button>
        )}
      </section>
    </Page>
  );
}
