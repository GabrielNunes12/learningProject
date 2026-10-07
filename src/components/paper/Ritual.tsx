// The thinking-on-paper phases that open and close every study session (see lib/thinking.ts).
import { useEffect, useMemo, useState } from 'react';
import type { Sheet, SheetDraft } from '../../lib/storage';
import { saveSheet } from '../../lib/storage';
import {
  againItems,
  anchorFeedback,
  ANCHOR_MAX_WORDS,
  ANCHORS_MAX,
  anchorsReady,
  emptyDraft,
  finishAgain,
  limitWords,
  recallReady,
  remembered,
  wordCount,
  wrongReady,
  type Verdict,
} from '../../lib/thinking';
import type { Concept } from '../../types';
import { BottomBar } from '../QuestionFrame';
import { PaperSheet } from './PaperSheet';
import './Paper.css';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

const PRINCIPLES = ['Make it wrong', 'Make it shorter', 'Make it again'] as const;

function PhaseTag({ on }: { on: (typeof PRINCIPLES)[number] }) {
  return (
    <div className="ritual-steps" aria-hidden>
      {PRINCIPLES.map((p) => (
        <span key={p} className={p === on ? 'on' : ''}>
          {p}
        </span>
      ))}
    </div>
  );
}

/** Seconds since the phase opened, shown as a gentle pace guide (never enforced). */
function useElapsed() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor((now - start) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- make it wrong ----------

/** Start of a lesson: dump what you think you know about the topic, sort it, sketch. Nothing is graded. */
export function WrongPhase({ topic, onDone }: { topic: string; onDone: (draft: SheetDraft) => void }) {
  const [draft, setDraft] = useState<SheetDraft>(() => emptyDraft());
  const ready = wrongReady(draft);
  const elapsed = useElapsed();
  return (
    <>
      <article className="step-card ritual-card">
        <PhaseTag on="Make it wrong" />
        <h2>What do you already think about “{topic}”?</h2>
        <p className="lead">
          Put keywords on the paper before the lesson: guesses, half-memories, even wrong ones. Then sort them into piles that feel
          related. Nothing here is graded; a messy first try gives the lesson something to hook onto.
        </p>
        <PaperSheet draft={draft} onChange={setDraft} label={`Your first guesses about ${topic}`} autoFocus />
      </article>
      <BottomBar>
        <div className="bb-status">
          <span className="small muted">{ready.ok ? `Good. ${elapsed} on paper.` : ready.missing}</span>
        </div>
        <div className="bb-actions">
          <button className="btn primary big" disabled={!ready.ok} onClick={() => onDone({ ...draft, at: Date.now() })}>
            Start the lesson
          </button>
        </div>
      </BottomBar>
    </>
  );
}

// ---------- make it shorter ----------

interface ShorterProps {
  heading: string;
  intro: string;
  /** Concepts to compare the anchors with (the course graph). */
  concepts: Concept[];
  /** The lesson these anchors summarise: its concepts not named in the anchors are listed as "also here". */
  lessonId?: string;
  /** For sessions: concepts behind missed questions, listed when the anchors don't name them. */
  focus?: Concept[];
  /** The "make it wrong" sheet from the start of the lesson, shown next to the result. */
  firstGuesses?: SheetDraft;
  doneLabel: string;
  onDone: (anchors: string[]) => void;
}

/** End of a session: squeeze it into 2–3 anchors of at most 4 words, then see what they cover. */
export function ShorterPhase({ heading, intro, concepts, lessonId, focus, firstGuesses, doneLabel, onDone }: ShorterProps) {
  const [anchors, setAnchors] = useState<string[]>(() => Array.from({ length: ANCHORS_MAX }, () => ''));
  const [shown, setShown] = useState(false);
  const ready = anchorsReady(anchors);
  const feedback = useMemo(() => (shown ? anchorFeedback(anchors, concepts, lessonId) : null), [shown, anchors, concepts, lessonId]);
  const notYet = feedback ? (focus ?? feedback.missed).filter((c) => !feedback.hit.some((h) => h.id === c.id)) : [];

  return (
    <>
      <article className="step-card ritual-card">
        <PhaseTag on="Make it shorter" />
        <h2>{heading}</h2>
        <p className="lead">{intro}</p>
        <ol className="anchor-list">
          {anchors.map((a, i) => {
            const n = wordCount(a);
            return (
              <li key={i} className="anchor-row">
                <span className="num" aria-hidden>
                  {i + 1}
                </span>
                <input
                  value={a}
                  readOnly={shown}
                  autoFocus={i === 0}
                  placeholder={i < 2 ? 'a few words' : 'optional third anchor'}
                  aria-label={`Anchor ${i + 1}, ${ANCHOR_MAX_WORDS} words at most`}
                  onChange={(e) => {
                    const text = limitWords(e.target.value);
                    setAnchors((all) => all.map((x, j) => (j === i ? text : x)));
                  }}
                />
                <span className={`word-count${n >= ANCHOR_MAX_WORDS ? ' full' : ''}`} aria-live="polite">
                  {n}/{ANCHOR_MAX_WORDS} words
                </span>
              </li>
            );
          })}
        </ol>
        {feedback && (
          <div className="ritual-feedback" aria-live="polite">
            {feedback.hit.length > 0 ? (
              <>
                <strong>Your anchors name</strong>
                <ul className="cover-list hit">
                  {feedback.hit.map((c) => (
                    <li key={c.id}>{c.label}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="small muted">Your anchors are in your own words, which is fine: they only have to bring the idea back for you.</p>
            )}
            {notYet.length > 0 && (
              <>
                <strong>{focus ? 'Behind the questions you missed' : 'Also in this lesson'}</strong>
                <ul className="cover-list miss">
                  {notYet.map((c) => (
                    <li key={c.id}>{c.label}</li>
                  ))}
                </ul>
                <p className="small muted">Not a mistake: worth one more look before you move on.</p>
              </>
            )}
            {firstGuesses && firstGuesses.chips.length > 0 && (
              <>
                <strong>Before the lesson you wrote</strong>
                <PaperSheet draft={firstGuesses} label="Your first guesses" readOnly />
                <p className="small muted">You'll rebuild this sheet from memory at the start of your next session, and fix what's wrong.</p>
              </>
            )}
          </div>
        )}
      </article>
      <BottomBar>
        <div className="bb-status">
          <span className="small muted">{shown ? '' : ready.ok ? 'Short enough. Messy is fine.' : ready.missing}</span>
        </div>
        <div className="bb-actions">
          {shown ? (
            <button className="btn primary big" autoFocus onClick={() => onDone(anchors.map((a) => a.trim()).filter(Boolean))}>
              {doneLabel}
            </button>
          ) : (
            <button className="btn primary big" disabled={!ready.ok} onClick={() => setShown(true)}>
              Squeeze it
            </button>
          )}
        </div>
      </BottomBar>
    </>
  );
}

// ---------- make it again ----------

/** Start of a session: rebuild an earlier sheet from a blank page, then compare, fix and keep a clean version. */
export function AgainPhase({ sheet, onDone }: { sheet: Sheet; onDone: (xp: number) => void }) {
  const old = sheet.clean ?? sheet.wrong;
  const [draft, setDraft] = useState<SheetDraft>(() => emptyDraft(old?.piles.length ? old.piles.map(() => '') : ['', '']));
  const [stage, setStage] = useState<'recall' | 'compare' | 'saved'>('recall');
  const [verdicts, setVerdicts] = useState<Record<string, { verdict: Verdict; text?: string }>>({});
  const [result, setResult] = useState<{ xp: number; sheet: Sheet } | null>(null);
  const items = useMemo(() => againItems(sheet), [sheet]);
  const got = useMemo(() => new Set(remembered(draft.chips.map((c) => c.text), items)), [draft.chips, items]);
  const ready = recallReady(draft);

  const save = () => {
    const next = finishAgain(sheet, draft, verdicts);
    setResult({ xp: saveSheet(next), sheet: next });
    setStage('saved');
  };
  const setVerdict = (item: string, verdict: Verdict) =>
    setVerdicts((all) => ({ ...all, [item]: { verdict, text: verdict === 'fix' ? (all[item]?.text ?? item) : undefined } }));

  return (
    <>
      <article className="step-card ritual-card">
        <PhaseTag on="Make it again" />
        {stage === 'recall' && (
          <>
            <h2>Rebuild “{sheet.title}” from memory</h2>
            <p className="lead">
              Blank paper, no peeking. Write the keywords and anchors you remember from that sheet, and arrange them the way they connect
              now. Pulling it back out is what makes it stick.
            </p>
            <PaperSheet draft={draft} onChange={setDraft} label={`Rebuilding ${sheet.title} from memory`} autoFocus />
          </>
        )}
        {stage === 'compare' && (
          <>
            <h2>Compare and clean it up</h2>
            <p className="lead">
              Here's your old sheet. Keep what still holds, fix what was wrong, drop what doesn't matter. Your clean version replaces
              the old one.
            </p>
            <div className="compare">
              <section>
                <h3>Your old sheet</h3>
                {old && <PaperSheet draft={old} label="Your old sheet" readOnly />}
              </section>
              <section>
                <h3>Keep, fix or drop</h3>
                <ul className="verdicts">
                  {items.map((item) => {
                    const v = verdicts[item]?.verdict ?? 'keep';
                    const isAnchor = sheet.anchors?.includes(item);
                    return (
                      <li key={item} className={`verdict-row ${v}`}>
                        <div className="top">
                          <span className="text">
                            {item}
                            {isAnchor && <span className="small muted"> · anchor</span>}
                          </span>
                          {got.has(item) && <span className="got">remembered</span>}
                          <span className="seg" role="group" aria-label={`What to do with ${item}`}>
                            {(['keep', 'fix', 'drop'] as const).map((k) => (
                              <button key={k} type="button" className={v === k ? 'on' : ''} aria-pressed={v === k} onClick={() => setVerdict(item, k)}>
                                {k === 'keep' ? 'Keep' : k === 'fix' ? 'Fix' : 'Drop'}
                              </button>
                            ))}
                          </span>
                        </div>
                        {v === 'fix' && (
                          <input
                            value={verdicts[item]?.text ?? ''}
                            maxLength={32}
                            aria-label={`Corrected version of ${item}`}
                            onChange={(e) => {
                              const text = isAnchor ? limitWords(e.target.value) : e.target.value;
                              setVerdicts((all) => ({ ...all, [item]: { verdict: 'fix', text } }));
                            }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section>
                <h3>Your clean sheet</h3>
                <p className="small muted">What you wrote from memory. Re-sort it, add what you just fixed, draw how it connects.</p>
                <PaperSheet draft={draft} onChange={setDraft} label="Your clean sheet" />
              </section>
            </div>
          </>
        )}
        {stage === 'saved' && result && (
          <>
            <h2>Clean sheet saved</h2>
            <div className="result-tiles think-summary">
              <div className="result-tile">
                <span>Remembered</span>
                <strong>
                  {result.sheet.again.at(-1)!.remembered}/{result.sheet.again.at(-1)!.total}
                </strong>
              </div>
              <div className="result-tile">
                <span>Fixed</span>
                <strong>{result.sheet.again.at(-1)!.fixed}</strong>
              </div>
              <div className="result-tile xp">
                <span>XP</span>
                <strong>+{result.xp}</strong>
              </div>
            </div>
            <p className="small muted">
              Next redo of this sheet in {plural(Math.max(1, Math.round(((result.sheet.due ?? 0) - Date.now()) / 86_400_000)), 'day')}. Each time,
              the gap grows.
            </p>
          </>
        )}
      </article>
      <BottomBar>
        <div className="bb-status">
          <span className="small muted">
            {stage === 'recall' ? (ready.ok ? `${draft.chips.length} keywords from memory.` : ready.missing) : stage === 'compare' ? `You brought back ${got.size} of ${items.length}.` : ''}
          </span>
        </div>
        <div className="bb-actions">
          {stage === 'recall' && (
            <button className="btn primary big" disabled={!ready.ok} onClick={() => setStage('compare')}>
              Compare with my old sheet
            </button>
          )}
          {stage === 'compare' && (
            <button className="btn primary big" onClick={save}>
              Save the clean sheet
            </button>
          )}
          {stage === 'saved' && (
            <button className="btn primary big" autoFocus onClick={() => onDone(result?.xp ?? 0)}>
              Continue
            </button>
          )}
        </div>
      </BottomBar>
    </>
  );
}
