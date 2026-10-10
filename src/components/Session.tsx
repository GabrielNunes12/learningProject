import { useState, type ReactNode } from 'react';
import { questionStep, useCourseContent, type QuestionRef } from '../content';
import type { Confidence } from '../lib/mastery';
import { conceptsFor, type ClerkItem } from '../lib/clerk';
import { creditAnswer, getProgress, recordAnswer, saveSheet, XP } from '../lib/storage';
import { dueSheet, finishShorter, sessionSheetKey } from '../lib/thinking';
import type { Concept } from '../types';
import { AgainPhase, ShorterPhase } from './paper/Ritual';
import { SessionNotes } from './SessionNotes';
import { PlayerHeader, PlayerLoading } from './Layout';
import { QuestionView } from './QuestionView';
import { accentStyle, useBodyAccent } from './ui';
import { CourseIcon } from './CourseIcon';
import { useT } from '../i18n/react';
import { useStudyTimer } from './useStudyTimer';

export interface SessionResult {
  ref: QuestionRef;
  ok: boolean;
  /** How the learner answered: sure, "I'm guessing" or "I don't know". */
  confidence: Confidence;
}

/** Every session is a thinking session: it closes with "make it shorter" and then "make it again" (when a sheet is due). */
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
  /** Ends the questions early when true after an answer (the find-your-level quiz stops once the learner guesses). */
  stopWhen?: (results: SessionResult[]) => boolean;
  /** Harder questions asked in place of a known card: question key → the card it stands in for. */
  standIn?: Record<string, string>;
}

/** Runs a list of questions one at a time in test mode (quiz and review share this). */
export function Session(props: Props) {
  // Questions arrive as catalog refs; their steps load with their courses.
  const status = useCourseContent(props.questions.map((q) => q.course.id));
  if (status !== 'ready')
    return <PlayerLoading exitHref={props.exitHref} total={props.questions.length} color={props.questions[0]?.course.color} failed={status === 'error'} />;
  return <SessionRun {...props} />;
}

function SessionRun({ ritual, questions, exitHref, onFinish, renderEnd, stopWhen, standIn }: Props) {
  const { t, locale } = useT();
  const [againSheet] = useState(() => dueSheet(getProgress().sheets ?? {}));
  const [phase, setPhase] = useState<'questions' | 'shorter' | 'again' | 'end'>('questions');
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [thinkXp, setThinkXp] = useState(0);
  useBodyAccent(questions[Math.min(idx, questions.length - 1)]?.course.color);
  // Study time goes to the course of the question on screen (a mixed session moves between courses).
  useStudyTimer((phase === 'again' && againSheet?.course) || questions[Math.min(idx, questions.length - 1)]?.course.id);
  const xp = results.reduce((s, r) => s + (r.ok ? XP.correct : XP.attempt), 0) + thinkXp;
  // Progress bar: questions + shorter + [again].
  const total = questions.length + 1 + (againSheet ? 1 : 0);

  if (phase === 'end') {
    const items: ClerkItem[] = results.map((r) => ({
      courseId: r.ref.course.id,
      concepts: conceptsFor(r.ref.step.concepts, r.ref.course.concepts),
      ok: r.ok,
      confidence: r.confidence,
    }));
    return (
      <div className="player">
        <PlayerHeader exitHref={exitHref} done={1} total={1} />
        <main className="player-body complete">
          {renderEnd(results, xp)}
          <SessionNotes items={items} />
        </main>
      </div>
    );
  }

  if (phase === 'again' || phase === 'shorter') {
    const color = questions[0]?.course.color;
    return (
      <div className="player" style={accentStyle(color)}>
        <PlayerHeader exitHref={exitHref} done={phase === 'shorter' ? questions.length : total - 1} total={total} />
        <main className="player-body">
          {phase === 'again' && againSheet && (
            <AgainPhase
              sheet={againSheet}
              onDone={(gained) => {
                setThinkXp((x) => x + gained);
                setPhase('end');
              }}
            />
          )}
          {phase === 'shorter' && (
            <ShorterPhase
              heading={t('lesson.session.shorterHeading')}
              intro={t('lesson.session.shorterIntro')}
              concepts={sessionConcepts(questions)}
              focus={missedConcepts(results)}
              doneLabel={t('lesson.session.seeResults')}
              onDone={(anchors) => {
                const now = Date.now();
                const sheet = finishShorter({ key: sessionSheetKey(ritual.kind, now), course: ritual.course, title: ritual.title, again: [], createdAt: now, updatedAt: now }, anchors, now);
                setThinkXp((x) => x + saveSheet(sheet));
                setPhase(againSheet ? 'again' : 'end');
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
        done={idx}
        total={total}
        right={
          <span className="xp-pill" aria-label={t('lesson.session.correctSoFar', { count: right })}>
            ✓ {right}/{idx}
          </span>
        }
      />
      <main className="player-body">
        {/* The locale in the key remounts the current question in the new language; idx and results are kept. */}
        <article className="step-card" key={`${idx}-${locale}`}>
          <QuestionView
            step={questionStep(q.key)!}
            mode="test"
            shuffle
            context={
              <div className="context-chip">
                <CourseIcon icon={q.course.icon} color={q.course.color} size={18} /> {q.course.title} · {q.lesson.title}
                {standIn?.[q.key] && <span className="harder-chip">{t('lesson.session.harder')}</span>}
              </div>
            }
            onDone={(ok, confidence) => {
              recordAnswer(q.key, ok, confidence);
              if (standIn?.[q.key]) creditAnswer(standIn[q.key], ok, confidence);
              const next = [...results, { ref: q, ok, confidence }];
              setResults(next);
              if (idx + 1 >= questions.length || stopWhen?.(next)) {
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
