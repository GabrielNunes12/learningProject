// The thinking-on-paper phases that close every study session (see lib/thinking.ts).
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
import type { MessageKey } from '../../i18n/core';
import { useT } from '../../i18n/react';
import type { Concept } from '../../types';
import { sheetTitle } from '../Notebook';
import { BottomBar } from '../QuestionFrame';
import { PaperSheet } from './PaperSheet';
import './Paper.css';

type Principle = 'wrong' | 'shorter' | 'again';
const PRINCIPLES: { id: Principle; label: MessageKey }[] = [
  { id: 'wrong', label: 'thinking.phase.wrong' },
  { id: 'shorter', label: 'thinking.phase.shorter' },
  { id: 'again', label: 'thinking.phase.again' },
];

function PhaseTag({ on }: { on: Principle }) {
  const { t } = useT();
  return (
    <div className="ritual-steps" aria-hidden>
      {PRINCIPLES.map((p) => (
        <span key={p.id} className={p.id === on ? 'on' : ''}>
          {t(p.label)}
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

/** End of a lesson, after the steps: put what you remember on paper from memory, sort it, sketch. Nothing is graded. */
export function WrongPhase({ topic, onDone }: { topic: string; onDone: (draft: SheetDraft) => void }) {
  const { t } = useT();
  const [draft, setDraft] = useState<SheetDraft>(() => emptyDraft());
  const ready = wrongReady(draft);
  const elapsed = useElapsed();
  return (
    <>
      <article className="step-card ritual-card">
        <PhaseTag on="wrong" />
        <h2>{t('thinking.wrong.heading', { topic })}</h2>
        <p className="lead">{t('thinking.wrong.lead')}</p>
        <PaperSheet draft={draft} onChange={setDraft} label={t('thinking.wrong.sheetLabel', { topic })} autoFocus />
      </article>
      <BottomBar>
        <div className="bb-status">
          <span className="small muted">{ready.ok ? t('thinking.wrong.ready', { time: elapsed }) : ready.missing}</span>
        </div>
        <div className="bb-actions">
          <button className="btn primary big" disabled={!ready.ok} onClick={() => onDone({ ...draft, at: Date.now() })}>
            {t('thinking.wrong.start')}
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
  /** The "make it wrong" keyword sheet from just before this phase, shown next to the result. */
  keywordSheet?: SheetDraft;
  doneLabel: string;
  onDone: (anchors: string[]) => void;
}

/** End of a session: squeeze it into 2–3 anchors of at most 4 words, then see what they cover. */
export function ShorterPhase({ heading, intro, concepts, lessonId, focus, keywordSheet, doneLabel, onDone }: ShorterProps) {
  const { t } = useT();
  const [anchors, setAnchors] = useState<string[]>(() => Array.from({ length: ANCHORS_MAX }, () => ''));
  const [shown, setShown] = useState(false);
  const ready = anchorsReady(anchors);
  const feedback = useMemo(() => (shown ? anchorFeedback(anchors, concepts, lessonId) : null), [shown, anchors, concepts, lessonId]);
  const notYet = feedback ? (focus ?? feedback.missed).filter((c) => !feedback.hit.some((h) => h.id === c.id)) : [];

  return (
    <>
      <article className="step-card ritual-card">
        <PhaseTag on="shorter" />
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
                  placeholder={i < 2 ? t('thinking.shorter.placeholder') : t('thinking.shorter.placeholderOptional')}
                  aria-label={t('thinking.shorter.anchorLabel', { n: i + 1, count: ANCHOR_MAX_WORDS })}
                  onChange={(e) => {
                    const text = limitWords(e.target.value);
                    setAnchors((all) => all.map((x, j) => (j === i ? text : x)));
                  }}
                />
                <span className={`word-count${n >= ANCHOR_MAX_WORDS ? ' full' : ''}`} aria-live="polite">
                  {t('thinking.shorter.wordCount', { n, count: ANCHOR_MAX_WORDS })}
                </span>
              </li>
            );
          })}
        </ol>
        {feedback && (
          <div className="ritual-feedback" aria-live="polite">
            {feedback.hit.length > 0 ? (
              <>
                <strong>{t('thinking.shorter.hitHeading')}</strong>
                <ul className="cover-list hit">
                  {feedback.hit.map((c) => (
                    <li key={c.id}>{c.label}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="small muted">{t('thinking.shorter.ownWords')}</p>
            )}
            {notYet.length > 0 && (
              <>
                <strong>{focus ? t('thinking.shorter.missedHeading') : t('thinking.shorter.alsoHeading')}</strong>
                <ul className="cover-list miss">
                  {notYet.map((c) => (
                    <li key={c.id}>{c.label}</li>
                  ))}
                </ul>
                <p className="small muted">{t('thinking.shorter.notMistake')}</p>
              </>
            )}
            {keywordSheet && keywordSheet.chips.length > 0 && (
              <>
                <strong>{t('thinking.shorter.beforeHeading')}</strong>
                <PaperSheet draft={keywordSheet} label={t('thinking.shorter.firstGuesses')} readOnly />
                <p className="small muted">{t('thinking.shorter.rebuildNext')}</p>
              </>
            )}
          </div>
        )}
      </article>
      <BottomBar>
        <div className="bb-status">
          <span className="small muted">{shown ? '' : ready.ok ? t('thinking.shorter.ready') : ready.missing}</span>
        </div>
        <div className="bb-actions">
          {shown ? (
            <button className="btn primary big" autoFocus onClick={() => onDone(anchors.map((a) => a.trim()).filter(Boolean))}>
              {doneLabel}
            </button>
          ) : (
            <button className="btn primary big" disabled={!ready.ok} onClick={() => setShown(true)}>
              {t('thinking.shorter.squeeze')}
            </button>
          )}
        </div>
      </BottomBar>
    </>
  );
}

// ---------- make it again ----------

const VERDICT_LABEL: Record<Verdict, MessageKey> = { keep: 'thinking.again.keep', fix: 'thinking.again.fix', drop: 'thinking.again.drop' };

/** End of a session, after make it shorter: rebuild an earlier sheet from a blank page, then compare, fix and keep a clean version. */
export function AgainPhase({ sheet, onDone }: { sheet: Sheet; onDone: (xp: number) => void }) {
  const { t } = useT();
  const old = sheet.clean ?? sheet.wrong;
  const title = sheetTitle(sheet);
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
        <PhaseTag on="again" />
        {stage === 'recall' && (
          <>
            <h2>{t('thinking.again.heading', { title })}</h2>
            <p className="lead">{t('thinking.again.lead')}</p>
            <PaperSheet draft={draft} onChange={setDraft} label={t('thinking.again.sheetLabel', { title })} autoFocus />
          </>
        )}
        {stage === 'compare' && (
          <>
            <h2>{t('thinking.again.compareHeading')}</h2>
            <p className="lead">{t('thinking.again.compareLead')}</p>
            <div className="compare">
              <section>
                <h3>{t('thinking.again.oldSheet')}</h3>
                {old && <PaperSheet draft={old} label={t('thinking.again.oldSheet')} readOnly />}
              </section>
              <section>
                <h3>{t('thinking.again.verdictHeading')}</h3>
                <ul className="verdicts">
                  {items.map((item) => {
                    const v = verdicts[item]?.verdict ?? 'keep';
                    const isAnchor = sheet.anchors?.includes(item);
                    return (
                      <li key={item} className={`verdict-row ${v}`}>
                        <div className="top">
                          <span className="text">
                            {item}
                            {isAnchor && <span className="small muted"> · {t('thinking.again.anchorTag')}</span>}
                          </span>
                          {got.has(item) && <span className="got">{t('thinking.again.remembered')}</span>}
                          <span className="seg" role="group" aria-label={t('thinking.again.verdictGroup', { item })}>
                            {(['keep', 'fix', 'drop'] as const).map((k) => (
                              <button key={k} type="button" className={v === k ? 'on' : ''} aria-pressed={v === k} onClick={() => setVerdict(item, k)}>
                                {t(VERDICT_LABEL[k])}
                              </button>
                            ))}
                          </span>
                        </div>
                        {v === 'fix' && (
                          <input
                            value={verdicts[item]?.text ?? ''}
                            maxLength={32}
                            aria-label={t('thinking.again.fixLabel', { item })}
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
                <h3>{t('thinking.again.cleanSheet')}</h3>
                <p className="small muted">{t('thinking.again.cleanNote')}</p>
                <PaperSheet draft={draft} onChange={setDraft} label={t('thinking.again.cleanSheet')} />
              </section>
            </div>
          </>
        )}
        {stage === 'saved' && result && (
          <>
            <h2>{t('thinking.again.savedHeading')}</h2>
            <div className="result-tiles think-summary">
              <div className="result-tile">
                <span>{t('thinking.again.tileRemembered')}</span>
                <strong>
                  {result.sheet.again.at(-1)!.remembered}/{result.sheet.again.at(-1)!.total}
                </strong>
              </div>
              <div className="result-tile">
                <span>{t('thinking.again.tileFixed')}</span>
                <strong>{result.sheet.again.at(-1)!.fixed}</strong>
              </div>
              <div className="result-tile xp">
                <span>{t('thinking.again.tileXp')}</span>
                <strong>+{result.xp}</strong>
              </div>
            </div>
            <p className="small muted">
              {t('thinking.again.nextRedo', { count: Math.max(1, Math.round(((result.sheet.due ?? 0) - Date.now()) / 86_400_000)) })}
            </p>
          </>
        )}
      </article>
      <BottomBar>
        <div className="bb-status">
          <span className="small muted">
            {stage === 'recall'
              ? ready.ok
                ? t('thinking.again.recalled', { count: draft.chips.length })
                : ready.missing
              : stage === 'compare'
                ? t('thinking.again.broughtBack', { got: got.size, total: items.length })
                : ''}
          </span>
        </div>
        <div className="bb-actions">
          {stage === 'recall' && (
            <button className="btn primary big" disabled={!ready.ok} onClick={() => setStage('compare')}>
              {t('thinking.again.compare')}
            </button>
          )}
          {stage === 'compare' && (
            <button className="btn primary big" onClick={save}>
              {t('thinking.again.save')}
            </button>
          )}
          {stage === 'saved' && (
            <button className="btn primary big" autoFocus onClick={() => onDone(result?.xp ?? 0)}>
              {t('common.continue')}
            </button>
          )}
        </div>
      </BottomBar>
    </>
  );
}
