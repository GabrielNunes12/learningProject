import { useState, type ReactNode } from 'react';
import type { QuestionRef } from '../content';
import { recordAnswer, XP } from '../lib/storage';
import { PlayerHeader } from './Layout';
import { QuestionView } from './QuestionView';
import { accentStyle, useBodyAccent } from './ui';

export interface SessionResult {
  ref: QuestionRef;
  ok: boolean;
}

interface Props {
  questions: QuestionRef[];
  exitHref: string;
  onFinish?: (results: SessionResult[]) => void;
  renderEnd: (results: SessionResult[], xp: number) => ReactNode;
}

/** Runs a list of questions one at a time in test mode (quiz and review share this). */
export function Session({ questions, exitHref, onFinish, renderEnd }: Props) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  useBodyAccent(questions[Math.min(idx, questions.length - 1)]?.course.color);
  const xp = results.reduce((s, r) => s + (r.ok ? XP.correct : XP.attempt), 0);

  if (idx >= questions.length) {
    return (
      <div className="player">
        <PlayerHeader exitHref={exitHref} done={1} total={1} />
        <main className="player-body complete">{renderEnd(results, xp)}</main>
      </div>
    );
  }

  const q = questions[idx];
  const right = results.filter((r) => r.ok).length;
  return (
    <div className="player" style={accentStyle(q.course.color)}>
      <PlayerHeader
        exitHref={exitHref}
        done={idx}
        total={questions.length}
        right={
          <span className="xp-pill" aria-label={`${right} correct so far`}>
            ✓ {right}/{idx}
          </span>
        }
      />
      <main className="player-body">
        <article className="step-card" key={idx}>
          <QuestionView
            step={q.step}
            mode="test"
            shuffle
            context={
              <div className="context-chip">
                <span aria-hidden>{q.course.icon}</span> {q.course.title} · {q.lesson.title}
              </div>
            }
            onDone={(ok) => {
              recordAnswer(q.key, ok);
              const next = [...results, { ref: q, ok }];
              setResults(next);
              setIdx(idx + 1);
              if (idx + 1 >= questions.length) onFinish?.(next);
            }}
          />
        </article>
      </main>
    </div>
  );
}
