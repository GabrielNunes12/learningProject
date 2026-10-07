// The lesson card around every simulator: title, task text, the playground itself and Continue.
// A simulator reports progress toward its goal through onGoal; with no goal, Continue is always available.
import { useState } from 'react';
import { t } from '../../i18n/core';
import { useT } from '../../i18n/react';
import type { SimConfig, SimStep } from '../../types';
import { Markdown } from '../Markdown';
import { BottomBar } from '../QuestionFrame';
import { DiceSim } from './DiceSim';
import { GitSim } from './GitSim';
import { GrowthSim } from './GrowthSim';
import { JoinSim } from './JoinSim';

/** Props every simulator component receives. */
export interface SimProps<K extends SimConfig['sim']> {
  step: SimStep & Extract<SimConfig, { sim: K }>;
  /** Call with true once the goal is reached (and false if it's lost again). */
  onGoal: (met: boolean) => void;
}

export function goalText(step: SimStep): string | null {
  if (step.sim === 'git') return step.goal?.text ?? null;
  if (step.sim === 'dice' && step.goalRolls) return t('sims.goal.rollAtLeast', { count: step.goalRolls });
  return null;
}

export function SimStepView({ step, onContinue }: { step: SimStep; onContinue: () => void }) {
  useT(); // re-render on a language switch (goalText uses the active language)
  const goal = goalText(step);
  const [met, setMet] = useState(false);
  const ready = !goal || met;

  return (
    <>
      <article className="step-card sim-card">
        <span className="eyebrow">{t('sims.playground')}</span>
        {step.title && <h2>{step.title}</h2>}
        {step.body && <Markdown text={step.body} />}
        <div className="sim-stage">
          {step.sim === 'git' && <GitSim step={step} onGoal={setMet} />}
          {step.sim === 'dice' && <DiceSim step={step} onGoal={setMet} />}
          {step.sim === 'growth' && <GrowthSim step={step} onGoal={setMet} />}
          {step.sim === 'join' && <JoinSim step={step} onGoal={setMet} />}
        </div>
      </article>
      <BottomBar tone={goal && met ? 'right' : 'neutral'}>
        <div className="bb-status" role="status">
          {goal && met && (
            <>
              <span className="bb-icon">✓</span>
              <div>
                <strong>{t('sims.goal.reached')}</strong>
                <span>{t('sims.goal.keepPlaying')}</span>
              </div>
            </>
          )}
          {goal && !met && (
            <div>
              <strong>{t('sims.goal.label')}</strong>
              <span>{goal}</span>
            </div>
          )}
        </div>
        <div className="bb-actions">
          {!ready && (
            <button className="btn ghost" onClick={onContinue}>
              {t('common.skip')}
            </button>
          )}
          <button className="btn primary big" onClick={onContinue} disabled={!ready}>
            {t('common.continue')}
          </button>
        </div>
      </BottomBar>
    </>
  );
}
