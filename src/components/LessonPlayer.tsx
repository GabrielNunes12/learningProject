import { useEffect, useState } from 'react';
import { lessonKey, lessonSteps, questionKey, unitOf, useCourseContent } from '../content';
import { useAuth } from '../lib/auth';
import { href } from '../lib/router';
import { completeLesson, getProgress, openLesson, recordAnswer, saveSheet, streak, useProgress, xpToday, XP, type SheetDraft } from '../lib/storage';
import { dueSheet, emptyDraft, finishShorter, lessonSheetKey, startLessonSheet } from '../lib/thinking';
import { AgainPhase, ShorterPhase, WrongPhase } from './paper/Ritual';
import { isQuestion, type Course, type ExampleStep, type LessonInfo, type Step } from '../types';
import { PlayerHeader, PlayerLoading } from './Layout';
import { Markdown } from './Markdown';
import { BottomBar, QuestionView } from './QuestionView';
import { SimStepView } from './sims/SimStepView';
import { accentStyle, Ring, useBodyAccent } from './ui';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';

type Phase = 'again' | 'wrong' | 'steps' | 'shorter' | 'done';

export function LessonPlayer({ course, lesson }: { course: Course; lesson: LessonInfo }) {
  const status = useCourseContent([course.id]);
  const steps = lessonSteps(course.id, lesson.id);
  if (status !== 'ready' || !steps)
    return <PlayerLoading exitHref={href('course', course.id)} total={lesson.stepCount} color={course.color} failed={status === 'error'} />;
  return <LessonRun course={course} lesson={lesson} steps={steps} />;
}

function LessonRun({ course, lesson, steps }: { course: Course; lesson: LessonInfo; steps: Step[] }) {
  const sheetKey = lessonSheetKey(course.id, lesson.id);
  // Every lesson is a thinking session: redo an earlier sheet if one is due, guess first, squeeze at the end.
  const [againSheet] = useState(() => dueSheet(getProgress().sheets ?? {}, Date.now(), sheetKey));
  const [phase, setPhase] = useState<Phase>(againSheet ? 'again' : 'wrong');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [xp, setXp] = useState(0);
  const [firstGuesses, setFirstGuesses] = useState<SheetDraft | undefined>();
  const courseHref = href('course', course.id);
  useBodyAccent(course.color);

  useEffect(() => openLesson(course.id, lesson.id), [course.id, lesson.id]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [index, phase]);

  const next = () => {
    if (index + 1 === steps.length) setPhase('shorter');
    else setIndex(index + 1);
  };

  if (phase === 'done') return <LessonComplete course={course} lesson={lesson} score={score} xp={xp} />;

  // Progress bar: [again] + wrong + steps + shorter.
  const lead = againSheet ? 2 : 1;
  const total = steps.length + lead + 1;
  const done = phase === 'again' ? 0 : phase === 'wrong' ? lead - 1 : phase === 'steps' ? lead + index : total - 1;
  const step = steps[index];

  return (
    <div className="player" style={accentStyle(course.color)}>
      <PlayerHeader
        exitHref={courseHref}
        done={done}
        total={total}
        right={
          <span className="xp-pill" aria-label={`${xp} XP earned this lesson`}>
            <Icon name="star" size={15} className="star" /> {xp}
          </span>
        }
      />
      <main className="player-body">
        <div className="lesson-crumb">
          <CourseIcon icon={course.icon} color={course.color} size={20} /> {unitOf(course, lesson).title} · <strong>{lesson.title}</strong>
        </div>

        {phase === 'again' && againSheet && (
          <AgainPhase
            sheet={againSheet}
            onDone={(gained) => {
              setXp((x) => x + gained);
              setPhase('wrong');
            }}
          />
        )}

        {phase === 'wrong' && (
          <WrongPhase
            topic={lesson.title}
            onDone={(draft) => {
              setFirstGuesses(draft);
              const prev = getProgress().sheets?.[sheetKey];
              setXp((x) => x + saveSheet(startLessonSheet(prev, course.id, lesson.id, lesson.title, draft)));
              setPhase('steps');
            }}
          />
        )}

        {phase === 'shorter' && (
          <ShorterPhase
            heading={`Squeeze “${lesson.title}” into anchors`}
            intro="Two or three anchors, four words at most each: the cues that will bring this lesson back to you. Fragments beat full sentences."
            concepts={course.concepts ?? []}
            lessonId={lesson.id}
            firstGuesses={firstGuesses}
            doneLabel="Finish the lesson"
            onDone={(anchors) => {
              const sheet = getProgress().sheets?.[sheetKey];
              const base = sheet ?? startLessonSheet(undefined, course.id, lesson.id, lesson.title, firstGuesses ?? emptyDraft());
              const gained = saveSheet(finishShorter(base, anchors));
              setXp((x) => x + gained + completeLesson(lessonKey(course.id, lesson.id)));
              setPhase('done');
            }}
          />
        )}

        {phase === 'steps' && step.type === 'explain' && (
          <>
            <article className="step-card" key={index}>
              {step.title && <h2>{step.title}</h2>}
              <Markdown text={step.body} />
            </article>
            <BottomBar>
              <div className="bb-status" />
              <div className="bb-actions">
                <button className="btn primary big" onClick={next} autoFocus>
                  Continue
                </button>
              </div>
            </BottomBar>
          </>
        )}

        {phase === 'steps' && step.type === 'example' && <ExampleView key={index} step={step} onContinue={next} />}

        {phase === 'steps' && step.type === 'sim' && <SimStepView key={index} step={step} onContinue={next} />}

        {phase === 'steps' && isQuestion(step) && (
          <article className="step-card" key={index}>
            <QuestionView
              step={step}
              mode="learn"
              onDone={(ok) => {
                recordAnswer(questionKey(course.id, lesson.id, step.id), ok);
                setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
                setXp((x) => x + (ok ? XP.correct : XP.attempt));
                next();
              }}
            />
          </article>
        )}
      </main>
    </div>
  );
}

/**
 * A worked example the learner has to attempt: they write their own answer first, then reveal the
 * solution one step at a time, and finally compare their answer with the worked one.
 */
function ExampleView({ step, onContinue }: { step: ExampleStep; onContinue: () => void }) {
  const [attempt, setAttempt] = useState('');
  const [locked, setLocked] = useState(false);
  const [shown, setShown] = useState(0);
  const total = step.steps.length + (step.answer ? 1 : 0);
  const all = shown >= total;
  const label = shown === 0 ? 'Show first step' : shown < step.steps.length ? 'Next step' : 'Show answer';
  const lock = () => attempt.trim() && setLocked(true);

  return (
    <>
      <article className="step-card example">
        <span className="eyebrow">Worked example</span>
        {step.title && <h2>{step.title}</h2>}
        <Markdown text={step.problem} />
        {!locked ? (
          <div className="attempt">
            <label htmlFor="example-attempt" className="attempt-label">
              <Icon name="pencil" size={16} /> Your answer first. A rough guess counts; the steps unlock after you commit to one.
            </label>
            <textarea
              id="example-attempt"
              rows={2}
              value={attempt}
              maxLength={300}
              placeholder="Work it out and write your answer"
              autoFocus
              onChange={(e) => setAttempt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  lock();
                }
              }}
            />
          </div>
        ) : (
          <p className="attempt-locked">
            <span className="eyebrow">Your answer</span>
            {attempt.trim()}
          </p>
        )}
        {shown > 0 && (
          <ol className="solution">
            {step.steps.slice(0, shown).map((s, i) => (
              <li key={i}>
                <Markdown text={s} />
              </li>
            ))}
          </ol>
        )}
        {all && step.answer && (
          <div className="answer-box">
            <Markdown text={step.answer} />
          </div>
        )}
        {all && <p className="small muted">Compare it with your answer above. Where did your reasoning go a different way?</p>}
      </article>
      <BottomBar>
        <div className="bb-status">
          {locked && !all && (
            <span className="muted small">
              Step {shown} of {step.steps.length}
            </span>
          )}
          {!locked && <span className="muted small">{attempt.trim() ? 'Ready when you are.' : 'Write your answer to unlock the steps.'}</span>}
        </div>
        <div className="bb-actions">
          {!locked ? (
            <button className="btn primary big" disabled={!attempt.trim()} onClick={lock}>
              Lock in my answer
            </button>
          ) : !all ? (
            <button className="btn primary big" onClick={() => setShown(shown + 1)} autoFocus>
              {label}
            </button>
          ) : (
            <>
              <button className="btn big" onClick={onContinue}>
                Not quite
              </button>
              <button className="btn primary big" onClick={onContinue} autoFocus>
                I had it
              </button>
            </>
          )}
        </div>
      </BottomBar>
    </>
  );
}

function LessonComplete({ course, lesson, score, xp }: { course: Course; lesson: LessonInfo; score: { right: number; total: number }; xp: number }) {
  const p = useProgress();
  const { user } = useAuth();
  const pos = course.lessons.findIndex((l) => l.id === lesson.id);
  // Suggest the next core lesson first (80/20), then the next lesson in order.
  const nextLesson =
    course.lessons.slice(pos + 1).find((l) => l.pareto === 'core' && !p.completed[lessonKey(course.id, l.id)]) ?? course.lessons[pos + 1];
  const today = xpToday(p);
  // Finishing a unit's last lesson invites a unit checkpoint on the knowledge map.
  const unit = unitOf(course, lesson);
  const checkpoint =
    unit.lessons[unit.lessons.length - 1]?.id === lesson.id && course.concepts?.some((c) => unit.lessons.some((l) => l.id === c.lesson))
      ? course.units.length > 1
        ? href('course', course.id, 'map', unit.id)
        : href('course', course.id, 'map')
      : undefined;

  return (
    <div className="player" style={accentStyle(course.color)}>
      <PlayerHeader exitHref={href('course', course.id)} done={1} total={1} />
      <main className="player-body complete">
        <div className="celebrate" aria-hidden>
          <Icon name="medal" size={72} />
        </div>
        <h1>Lesson complete!</h1>
        <p className="lead">{lesson.title}</p>

        <div className="result-tiles">
          <div className="result-tile xp">
            <span>Total XP</span>
            <strong>+{xp}</strong>
          </div>
          <div className="result-tile">
            <span>Accuracy</span>
            <strong>{score.total ? `${Math.round((score.right / score.total) * 100)}%` : '—'}</strong>
          </div>
          <div className="result-tile">
            <span>Streak</span>
            <strong>
              <Icon name="flame" size={18} className="flame" /> {streak(p)}
            </strong>
          </div>
          <div className="result-tile">
            <Ring value={today / Math.max(p.dailyGoal, 1)} size={44} stroke={5} label="Daily goal" />
            <span>
              {today}/{p.dailyGoal} today
            </span>
          </div>
        </div>

        <div className="takeaway">
          <span className="eyebrow">Key takeaway</span>
          <Markdown text={lesson.takeaway} />
        </div>

        {checkpoint && (
          <p>
            <a className="btn" href={checkpoint}>
              <Icon name="target" size={18} /> Unit checkpoint: map what you know
            </a>
          </p>
        )}

        {!user && (
          <p className="small muted">
            <a href="#/signup">Create a free profile</a> to keep your progress on every device.
          </p>
        )}

        <div className="actions center">
          <a className="btn ghost" href={href('course', course.id)}>
            Back to course
          </a>
          {nextLesson ? (
            <a className="btn primary big" href={href('course', course.id, 'lesson', nextLesson.id)} autoFocus>
              Next: {nextLesson.title} →
            </a>
          ) : (
            <a className="btn primary big" href={href('course', course.id, 'quiz')} autoFocus>
              Take the course quiz →
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
