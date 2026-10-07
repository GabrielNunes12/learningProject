import { useState, type ReactNode } from 'react';
import type { QuestionRef } from '../content';
import { getProgress, recordAnswer, saveSheet, XP } from '../lib/storage';
import { dueSheet, finishShorter, sessionSheetKey } from '../lib/thinking';
import type { Concept } from '../types';
import { AgainPhase, ShorterPhase } from './paper/Ritual';
import { useStudyTimer } from './useStudyTimer';
import { PlayerHeader } from './Layout';
import { QuestionView } from './QuestionView';
import { accentStyle, useBodyAccent } from './ui';
import { CourseIcon } from './CourseIcon';

export interface SessionResult {
  ref: QuestionRef;
  ok: boolean;
}

/** Every session is a thinking session: it opens with "make it again" (when a sheet is due) and closes with "make it shorter". */
export interface SessionRitual {
  kind: 'review' | 'practice' | 'quiz';
  /** Shown in the notebook, e.g. "Review" or "Mixed practice: Python". */
  title: string;
  course?: string;
}

interface Props {
  ritual: SessionRitual;
  questions: QuestionRef[];
  exitHref: string;
  onFinish?: (results: SessionResult[]) => void;
  renderEnd: (results: SessionResult[], xp: number) => ReactNode;
}

/** Runs a list of questions one at a time in test mode (quiz and review share this). */
export function Session({ ritual, questions, exitHref, onFinish, renderEnd }: Props) {
  const [againSheet] = useState(() => dueSheet(getProgress().sheets ?? {}));
  const [phase, setPhase] = useState<'again' | 'questions' | 'shorter' | 'end'>(againSheet ? 'again' : 'questions');
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [thinkXp, setThinkXp] = useState(0);
  useBodyAccent(questions[Math.min(idx, questions.length - 1)]?.course.color);
  // Study time goes to the course of the question on screen (a mixed session moves between courses).
  useStudyTimer((phase === 'again' && againSheet?.course) || questions[Math.min(idx, questions.length - 1)]?.course.id);
  const xp = results.reduce((s, r) => s + (r.ok ? XP.correct : XP.attempt), 0) + thinkXp;
  const lead = againSheet ? 1 : 0;
  const total = questions.length + lead + 1;

  if (phase === 'end') {
    return (
      <div className="player">
        <PlayerHeader exitHref={exitHref} done={1} total={1} />
        <main className="player-body complete">{renderEnd(results, xp)}</main>
      </div>
    );
  }

  if (phase === 'again' || phase === 'shorter') {
    const color = questions[0]?.course.color;
    return (
      <div className="player" style={accentStyle(color)}>
        <PlayerHeader exitHref={exitHref} done={phase === 'again' ? 0 : total - 1} total={total} />
        <main className="player-body">
          {phase === 'again' && againSheet && (
            <AgainPhase
              sheet={againSheet}
              onDone={(gained) => {
                setThinkXp((x) => x + gained);
                setPhase('questions');
              }}
            />
          )}
          {phase === 'shorter' && (
            <ShorterPhase
              heading="Squeeze this session into anchors"
              intro="What will you remember, or do differently next time? Two or three anchors, four words at most each."
              concepts={sessionConcepts(questions)}
              focus={missedConcepts(results)}
              doneLabel="See results"
              onDone={(anchors) => {
                const now = Date.now();
                const sheet = finishShorter({ key: sessionSheetKey(ritual.kind, now), course: ritual.course, title: ritual.title, again: [], createdAt: now, updatedAt: now }, anchors, now);
                setThinkXp((x) => x + saveSheet(sheet));
                setPhase('end');
              }}
            />
          )}
        </main>
      </div>
    );
  }

  const q = questions[idx];
  const right = results.filter((r) => r.ok).length;
  return (
    <div className="player" style={accentStyle(q.course.color)}>
      <PlayerHeader
        exitHref={exitHref}
        done={lead + idx}
        total={total}
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
                <CourseIcon icon={q.course.icon} color={q.course.color} size={18} /> {q.course.title} · {q.lesson.title}
              </div>
            }
            onDone={(ok) => {
              recordAnswer(q.key, ok);
              const next = [...results, { ref: q, ok }];
              setResults(next);
              if (idx + 1 >= questions.length) {
                onFinish?.(next); // record the score now, even if the learner leaves during "make it shorter"
                setPhase('shorter');
              } else setIdx(idx + 1);
            }}
          />
        </article>
      </main>
    </div>
  );
}

/** The concept graphs of the courses in a session (deduplicated), for comparing anchors. */
function sessionConcepts(questions: QuestionRef[]): Concept[] {
  const seen = new Map<string, Concept>();
  for (const q of questions) for (const c of q.course.concepts ?? []) if (!seen.has(`${q.course.id}/${c.id}`)) seen.set(`${q.course.id}/${c.id}`, c);
  return [...seen.values()];
}

/** Concepts tagged on the questions that were missed, most-missed first. */
function missedConcepts(results: SessionResult[]): Concept[] {
  const count = new Map<string, { c: Concept; n: number }>();
  for (const r of results.filter((x) => !x.ok)) {
    for (const id of r.ref.step.concepts ?? []) {
      const c = r.ref.course.concepts?.find((k) => k.id === id);
      if (c) count.set(`${r.ref.course.id}/${id}`, { c, n: (count.get(`${r.ref.course.id}/${id}`)?.n ?? 0) + 1 });
    }
  }
  return [...count.values()].sort((a, b) => b.n - a.n).map((x) => x.c).slice(0, 6);
}
