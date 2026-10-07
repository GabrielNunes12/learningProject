// The 3-layer knowledge-map canvas: recall what you know, reveal what you don't, connect the dots.
// All logic lives in src/lib/knowledgeMap.ts; this file renders and handles input.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { getCourse } from '../content';
import {
  ALL,
  addHint,
  addLink,
  addNote,
  addRecall,
  advance,
  CELL_H,
  CELL_W,
  checkMap,
  chunks as findChunks,
  edgeEnd,
  fitView,
  arrangeLayout,
  hull,
  linkMessage,
  linkVocabulary,
  matchConcept,
  mergeNote,
  moveNode,
  nextHint,
  newNoteId,
  nextSlot,
  nodeSize,
  normalizeMap,
  pairKey,
  placeMissing,
  recallMessage,
  recallScore,
  removeLink,
  removeNode,
  resetScope,
  sameText,
  scopeLayer,
  scopeOf,
  setLearned,
  toWorld,
  unrecallToNote,
  visibleNodes,
  zoomAt,
  type CheckResult,
  type Chunk,
  type Layer,
  type MapNode,
  type MapState,
  type Pos,
  type Scope,
  type View,
} from '../lib/knowledgeMap';
import { href, useRoute } from '../lib/router';
import { getProgress, saveMap, useProgress } from '../lib/storage';
import { useStudyTimer } from './useStudyTimer';
import type { ConceptLink, Course } from '../types';
import { Icon } from './icons';
import { Page } from './Layout';
import { InlineMarkdown } from './Markdown';
import { accentStyle, plural, ProgressBar, Ring } from './ui';
import './KnowledgeMap.css';

type SetMap = (f: (m: MapState) => MapState) => void;

const LAYERS: { n: Layer; title: string; short: string }[] = [
  { n: 1, title: 'What do I already know?', short: 'Recall' },
  { n: 2, title: "What don't I know yet?", short: 'Find gaps' },
  { n: 3, title: 'Connect the dots', short: 'Connect' },
];

const KIND_TEXT: Record<MapNode['kind'], string> = {
  recalled: 'recalled from memory',
  island: 'not recalled yet',
  learned: 'learned since',
  note: 'your own note',
};

const GENERIC_LABELS = ['is a', 'is part of', 'needs', 'causes', 'replaces', 'is the opposite of'];
const CHUNK_COLORS = ['var(--accent)', 'var(--tok-type)', 'var(--tok-number)', 'var(--tok-annotation)', 'var(--good)', 'var(--tok-keyword)'];
const VIEW_KEY = 'projectlearn:mapview';
const SPRINT_MS = 120_000;

export function KnowledgeMap({ courseId }: { courseId?: string }) {
  const route = useRoute();
  const course = courseId ? getCourse(courseId) : undefined;
  if (!course) {
    return (
      <Page>
        <h1>Course not found</h1>
        <a href="#/courses">All courses</a>
      </Page>
    );
  }
  // #/course/<id>/map/<unitId> scopes the map to one unit ("unit checkpoint").
  const unitId = route[0] === 'course' && route[2] === 'map' ? route[3] : undefined;
  const scopeKey = unitId && course.units.some((u) => u.id === unitId) ? unitId : ALL;
  if (!course.concepts?.length) return <ComingSoon course={course} />;
  return <MapHost course={course} scopeKey={scopeKey} />;
}

/** Courses without a concept graph yet: a friendly placeholder that still gets the learner recalling. */
function ComingSoon({ course }: { course: Course }) {
  return (
    <Page>
      <div style={accentStyle(course.color)} className="km">
        <a className="back" href={href('course', course.id)}>
          ← {course.title}
        </a>
        <span className="eyebrow">Knowledge map</span>
        <h1>The map for {course.title} is coming soon</h1>
        <p className="lead">
          This course doesn't have its concept map yet. In the meantime, here is the same idea on paper: cover the list below, write down
          every key idea you remember, then check.
        </p>
        <div className="panel key-ideas">
          <h2>The key ideas</h2>
          <ul>
            {course.keyIdeas.map((idea, i) => (
              <li key={i}>
                <InlineMarkdown text={idea} />
              </li>
            ))}
          </ul>
        </div>
        <div className="actions km-soon-actions">
          <a className="btn" href={href('course', course.id)}>
            Back to course
          </a>
          <a className="btn primary" href={href('course', course.id, 'quiz')}>
            Test yourself with the quiz
          </a>
        </div>
      </div>
    </Page>
  );
}

/** Scrolls a detail card into view when it opens or switches item: in a long side panel it can start below the fold. */
function useRevealOnOpen(key: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [key]);
  return ref;
}

/** Owns the saved map for a course (debounced auto-save) and the scope picker. */
function MapHost({ course, scopeKey }: { course: Course; scopeKey: string }) {
  useStudyTimer(course.id);
  const [map, setMapState] = useState<MapState>(() => normalizeMap(getProgress().maps?.[course.id] as MapState | undefined));
  const dirty = useRef(false);
  const latest = useRef(map);
  // updatedAt of the copy this page last loaded or saved; a different one in storage came from elsewhere.
  const savedAt = useRef(map.updatedAt);
  const stored = useProgress().maps?.[course.id];
  useEffect(() => {
    if (!stored || stored.updatedAt === savedAt.current || dirty.current) return;
    savedAt.current = stored.updatedAt;
    setMapState(normalizeMap(stored));
  }, [stored]);
  const setMap: SetMap = useCallback((f) => {
    dirty.current = true;
    setMapState(f);
  }, []);

  useEffect(() => {
    latest.current = map;
    if (!dirty.current) return;
    const t = setTimeout(() => {
      dirty.current = false;
      savedAt.current = saveMap(course.id, map);
    }, 600);
    return () => clearTimeout(t);
  }, [map, course.id]);

  // Flush a pending save when leaving the page or closing the tab.
  useEffect(() => {
    const flush = () => {
      if (!dirty.current) return;
      dirty.current = false;
      savedAt.current = saveMap(course.id, latest.current);
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [course.id]);

  const scope = useMemo(() => scopeOf(course, scopeKey), [course, scopeKey]);
  const unitIndex = course.units.findIndex((u) => u.id === scope.key);
  const unit = unitIndex >= 0 ? course.units[unitIndex] : undefined;
  const counts = useMemo(() => new Map(course.units.map((u) => [u.id, scopeOf(course, u.id).concepts.length])), [course]);

  return (
    <Page wide>
      <div style={accentStyle(course.color)} className="km">
        <a className="back" href={href('course', course.id)}>
          ← {course.title}
        </a>
        <header className="km-head">
          <div>
            <span className="eyebrow">{unit ? `Unit ${unitIndex + 1} checkpoint` : 'Knowledge map'}</span>
            <h1>{unit ? unit.title : course.title}</h1>
            <p className="lead">Map it from memory, see what's missing, then connect the dots.</p>
          </div>
          {course.units.length > 1 && (
            <label className="km-scope">
              <span>Map</span>
              <select
                value={scope.key}
                onChange={(e) => {
                  window.location.hash = e.target.value === ALL ? href('course', course.id, 'map') : href('course', course.id, 'map', e.target.value);
                }}
              >
                <option value={ALL}>Whole course ({course.concepts?.length ?? 0} ideas)</option>
                {course.units.map((u, i) => (
                  <option key={u.id} value={u.id} disabled={!counts.get(u.id)}>
                    Unit {i + 1}: {u.title} ({counts.get(u.id) ?? 0})
                  </option>
                ))}
              </select>
            </label>
          )}
        </header>
        {scope.concepts.length ? (
          <ScopeMap key={scope.key} course={course} scope={scope} map={map} setMap={setMap} />
        ) : (
          <div className="panel">
            <p>This unit has no ideas on the course map yet.</p>
            <a className="btn primary" href={href('course', course.id, 'map')}>
              Map the whole course instead
            </a>
          </div>
        )}
      </div>
    </Page>
  );
}

type Selection = { type: 'node'; id: string } | { type: 'link'; key: string } | null;
interface Feedback {
  text: string;
  tone: 'good' | 'note' | 'info';
  /** A concept matched from this typed text; offers "keep my words instead". */
  undo?: { id: string; typed: string };
}

function readListPref() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list';
  } catch {
    return false;
  }
}

/** One scope's map: the layer stepper, panels, and the canvas or list. */
function ScopeMap({ course, scope, map, setMap }: { course: Course; scope: Scope; map: MapState; setMap: SetMap }) {
  const maxLayer = scopeLayer(map, scope.key);
  const [layer, setLayer] = useState<Layer>(maxLayer);
  const [selected, setSelected] = useState<Selection>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [listMode, setListMode] = useState(readListPref);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [popId, setPopId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const nodes = useMemo(() => visibleNodes(map, scope, layer), [map, scope, layer]);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const pos = useMemo(() => placeMissing(map.pos, nodes.map((n) => n.id)), [map.pos, nodes]);
  const links = useMemo(() => map.links.filter((l) => nodeById.has(l.from) && nodeById.has(l.to)), [map.links, nodeById]);
  const result = useMemo(() => checkMap(map, scope), [map, scope]);
  const chunkList = useMemo(
    () => (checked ? findChunks(result.correct, scope.concepts.map((c) => c.id)) : []),
    [checked, result, scope],
  );
  const vocabulary = useMemo(() => {
    const v = linkVocabulary(course);
    return v.length ? v : GENERIC_LABELS;
  }, [course]);
  const labelOf = useCallback((id: string) => nodeById.get(id)?.label ?? course.concepts?.find((c) => c.id === id)?.label ?? id, [nodeById, course]);

  // Give newly shown nodes (islands, items recalled elsewhere) a saved place.
  useEffect(() => {
    if (nodes.some((n) => !map.pos[n.id])) setMap((m) => ({ ...m, pos: { ...pos, ...m.pos } }));
  }, [nodes, map.pos, pos, setMap]);

  const fit = useCallback(() => {
    if (!size.w) return;
    setView(fitView(nodes.map((n) => pos[n.id]), size.w, size.h));
  }, [nodes, pos, size]);
  const fitRef = useRef(fit);
  useEffect(() => {
    fitRef.current = fit;
  }, [fit]);
  // Re-fit when the canvas first gets a size, when the layer changes (islands appear) and when leaving list mode.
  const hasSize = size.w > 0;
  useEffect(() => {
    if (hasSize) fitRef.current();
  }, [hasSize, layer, listMode]);

  // Escape cancels a link in progress, then clears the selection.
  useEffect(() => {
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (linkFrom) setLinkFrom(null);
      else setSelected(null);
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [linkFrom]);

  useEffect(() => {
    if (!popId) return;
    const t = setTimeout(() => setPopId(null), 900);
    return () => clearTimeout(t);
  }, [popId]);

  const goLayer = (n: Layer) => {
    setMap((m) => advance(m, scope.key, n));
    setLayer(n);
    setSelected(null);
    setLinkFrom(null);
    setAnnounce(`Layer ${n}: ${LAYERS[n - 1].title}`);
  };

  const chooseList = (on: boolean) => {
    setListMode(on);
    try {
      localStorage.setItem(VIEW_KEY, on ? 'list' : 'canvas');
    } catch {
      /* ignore */
    }
  };

  /** A tidy free slot near the middle of what the learner is looking at; re-fits if it lands off-screen. */
  const placeNew = (): Pos => {
    const c = size.w ? toWorld(view, size.w / 2, size.h / 2) : { x: 0, y: 0 };
    const around = { x: Math.round(c.x / CELL_W) * CELL_W, y: Math.round(c.y / CELL_H) * CELL_H };
    const p = nextSlot(Object.values(pos), around);
    if (size.w) {
      const s = { x: p.x * view.k + view.x, y: p.y * view.k + view.y };
      if (s.x < 60 || s.y < 30 || s.x > size.w - 60 || s.y > size.h - 30) setView(fitView([...nodes.map((n) => pos[n.id]), p], size.w, size.h));
    }
    return p;
  };

  const tapNode = (id: string) => {
    if (layer === 3) {
      if (linkFrom && linkFrom !== id) {
        setMap((m) => addLink(m, linkFrom, id));
        setSelected({ type: 'link', key: pairKey(linkFrom, id) });
        setAnnounce(`Linked ${labelOf(linkFrom)} and ${labelOf(id)}. Pick a label below if you like.`);
        setLinkFrom(null);
        return;
      }
      if (linkFrom === id) {
        setLinkFrom(null);
        setAnnounce('Link cancelled.');
        return;
      }
      setLinkFrom(id);
      setSelected({ type: 'node', id });
      setAnnounce(`Linking from ${labelOf(id)}: now pick a second idea.`);
      return;
    }
    setSelected({ type: 'node', id });
  };

  const link = (a: string, b: string, label?: string) => {
    if (a === b) return;
    setMap((m) => addLink(m, a, b, label));
    setSelected({ type: 'link', key: pairKey(a, b) });
    setLinkFrom(null);
    setAnnounce(`Linked ${labelOf(a)} and ${labelOf(b)}.`);
  };

  const arrange = () => {
    const rank = { recalled: 0, learned: 1, note: 2, island: 3 };
    const ids = [...nodes].sort((a, b) => rank[a.kind] - rank[b.kind]).map((n) => n.id);
    const aspect = size.w && size.h ? size.w / size.h : undefined;
    const lay = arrangeLayout(ids, links, aspect);
    setMap((m) => ({ ...m, pos: { ...m.pos, ...lay } }));
    if (size.w) setView(fitView(Object.values(lay), size.w, size.h));
    setAnnounce('Map tidied up.');
  };

  const runCheck = () => {
    setChecked(true);
    setMap((m) => {
      const r = checkMap(m, scope);
      return { ...m, score: { found: r.found + r.withHint, total: r.total } };
    });
    setAnnounce(linkMessage(result));
  };

  const startOver = () => {
    const what = scope.key === ALL ? 'the whole course' : 'this unit';
    if (!window.confirm(`Start over for ${what}? Your recalled ideas, notes and links here will be cleared.`)) return;
    setMap((m) => resetScope(m, scope));
    setLayer(1);
    setChecked(false);
    setSelected(null);
    setLinkFrom(null);
    setAnnounce('Cleared. Start recalling from memory.');
  };

  const stage = listMode ? (
    <ListView
      nodes={nodes}
      links={links}
      layer={layer}
      checked={checked}
      result={result}
      selected={selected}
      linkFrom={linkFrom}
      labelOf={labelOf}
      onSelectNode={tapNode}
      onSelectLink={(key) => setSelected({ type: 'link', key })}
    />
  ) : (
    <Canvas
      nodes={nodes}
      pos={pos}
      links={links}
      layer={layer}
      checked={checked}
      result={result}
      chunkList={chunkList}
      selected={selected}
      linkFrom={linkFrom}
      popId={popId}
      view={view}
      setView={setView}
      onSize={setSize}
      onTapNode={tapNode}
      onTapEdge={(key) => setSelected({ type: 'link', key })}
      onTapBackground={() => {
        setSelected(null);
        if (linkFrom) {
          setLinkFrom(null);
          setAnnounce('Link cancelled.');
        }
      }}
      onMove={(id, p) => setMap((m) => moveNode(m, id, p))}
      onLink={link}
    />
  );

  return (
    <>
      <ol className="km-steps" aria-label="Layers">
        {LAYERS.map(({ n, title, short }) => {
          const done = n < maxLayer || (n === 3 && checked);
          return (
            <li key={n}>
              <button
                type="button"
                className={`km-step${n === layer ? ' on' : ''}${done ? ' done' : ''}`}
                disabled={n > maxLayer}
                aria-current={n === layer ? 'step' : undefined}
                onClick={() => {
                  setLayer(n);
                  setSelected(null);
                  setLinkFrom(null);
                }}
              >
                <span className="km-step-num" aria-hidden>
                  {done ? <Icon name="check" size={14} /> : n}
                </span>
                <span className="km-step-text">
                  <span className="km-step-short">{short}</span>
                  <span className="km-step-title">{title}</span>
                </span>
                {n > maxLayer && <span className="sr-only">(locked until you finish the layer before)</span>}
              </button>
            </li>
          );
        })}
      </ol>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <div className="km-layout">
        <div className="km-top">
          {layer === 1 && (
            <RecallPanel
              course={course}
              scope={scope}
              map={map}
              setMap={setMap}
              locked={maxLayer > 1}
              placeNew={placeNew}
              onPop={setPopId}
              onDone={() => goLayer(2)}
            />
          )}
          {layer === 2 && (
            <GapsPanel
              scope={scope}
              map={map}
              nodes={nodes}
              selected={selected}
              onSelect={(id) => setSelected({ type: 'node', id })}
              onNext={() => goLayer(3)}
              maxLayer={maxLayer}
            />
          )}
          {layer === 3 && (
            <ConnectPanel
              nodes={nodes}
              linkFrom={linkFrom}
              vocabulary={vocabulary}
              labelOf={labelOf}
              onCancelLink={() => setLinkFrom(null)}
              onLink={link}
              onCheck={runCheck}
              checked={checked}
            />
          )}
        </div>

        <div className="km-stage">
          <div className="km-toolbar">
            <div className="km-seg" role="group" aria-label="View">
              <button type="button" aria-pressed={!listMode} onClick={() => chooseList(false)}>
                Canvas
              </button>
              <button type="button" aria-pressed={listMode} onClick={() => chooseList(true)}>
                List
              </button>
            </div>
            {!listMode && (
              <div className="km-tools">
                <button type="button" className="btn small" onClick={() => setView((v) => zoomAt(v, 1 / 1.25, size.w / 2, size.h / 2))} aria-label="Zoom out">
                  −
                </button>
                <button type="button" className="btn small" onClick={() => setView((v) => zoomAt(v, 1.25, size.w / 2, size.h / 2))} aria-label="Zoom in">
                  +
                </button>
                <button type="button" className="btn small" onClick={fit}>
                  Fit
                </button>
                <button type="button" className="btn small" onClick={arrange} disabled={nodes.length < 2}>
                  Tidy up
                </button>
              </div>
            )}
          </div>
          {stage}
          <Legend layer={layer} checked={checked} />
        </div>

        <div className="km-rest">
          {selected?.type === 'node' && nodeById.has(selected.id) && (
            <NodePanel
              course={course}
              scope={scope}
              node={nodeById.get(selected.id)!}
              map={map}
              layer={layer}
              links={links}
              labelOf={labelOf}
              setMap={setMap}
              onLinkFrom={(id) => {
                setLinkFrom(id);
                setAnnounce(`Linking from ${labelOf(id)}: now pick a second idea.`);
              }}
              onClose={() => setSelected(null)}
              onAnnounce={setAnnounce}
            />
          )}
          {selected?.type === 'link' && (
            <LinkPanel
              linkKey={selected.key}
              map={map}
              checked={checked}
              result={result}
              scope={scope}
              vocabulary={vocabulary}
              labelOf={labelOf}
              setMap={setMap}
              onClose={() => setSelected(null)}
            />
          )}
          {layer === 3 && checked && (
            <ResultsPanel
              result={result}
              chunkList={chunkList}
              map={map}
              labelOf={labelOf}
              onHint={() => {
                const h = nextHint(result, map);
                if (!h) return;
                setMap((m) => addHint(m, pairKey(h.from, h.to)));
                setAnnounce(`Hint: ${labelOf(h.from)} ${h.label} ${labelOf(h.to)}.`);
              }}
              onAddHint={(l) => link(l.from, l.to, l.label)}
            />
          )}
          <div className="km-footer">
            <span className="muted small">Saved automatically.</span>
            <button type="button" className="btn small danger-outline" onClick={startOver}>
              Start over
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- layer 1 ----------

function RecallPanel({
  course,
  scope,
  map,
  setMap,
  locked,
  placeNew,
  onPop,
  onDone,
}: {
  course: Course;
  scope: Scope;
  map: MapState;
  setMap: SetMap;
  locked: boolean;
  placeNew: () => Pos;
  onPop: (id: string) => void;
  onDone: () => void;
}) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [sprintEnd, setSprintEnd] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const score = recallScore(map, scope);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sprintEnd) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= sprintEnd) {
        setSprintEnd(null);
        setFeedback({ text: "Time. That was a good retrieval workout: keep adding if more comes to mind, or see what's left.", tone: 'info' });
      }
    }, 500);
    return () => clearInterval(t);
  }, [sprintEnd]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const typed = text.trim();
    if (!typed) return;
    setText('');
    inputRef.current?.focus();
    const notRecalled = (id: string) => !map.recalled.includes(id);
    const m = matchConcept(typed, scope.concepts, notRecalled);
    if (m) {
      const label = scope.concepts.find((c) => c.id === m.id)!.label;
      onPop(m.id);
      if (map.recalled.includes(m.id)) {
        setFeedback({ text: `${label} is already on your map.`, tone: 'info' });
        return;
      }
      const k = score.recalled + 1;
      const at = placeNew();
      setMap((mm) => addRecall(mm, m.id, at));
      const cheer = k === score.total ? ' That is every idea here.' : k % 5 === 0 ? ` ${k} from memory, nice run.` : '';
      setFeedback({ text: `Recalled: ${label}.${cheer}`, tone: 'good', undo: m.kind === 'exact' ? undefined : { id: m.id, typed } });
      return;
    }
    // A concept from another unit still counts on the whole-course map.
    const elsewhere = scope.key === ALL ? null : matchConcept(typed, course.concepts ?? [], notRecalled);
    if (elsewhere) {
      const c = course.concepts!.find((x) => x.id === elsewhere.id)!;
      const unitIdx = course.units.findIndex((u) => u.lessons.some((l) => l.id === c.lesson));
      if (!map.recalled.includes(c.id)) setMap((mm) => addRecall(mm, c.id));
      setFeedback({ text: `${c.label} is from unit ${unitIdx + 1}. Good recall: it is saved on your whole-course map.`, tone: 'good' });
      return;
    }
    const dup = map.notes.find((n) => sameText(n.text, typed));
    if (dup) {
      onPop(dup.id);
      setFeedback({ text: 'You already noted that one.', tone: 'info' });
      return;
    }
    const at = placeNew();
    onPop(newNoteId(map, scope.key));
    setMap((mm) => addNote(mm, scope.key, typed, at).map);
    setFeedback({
      text: `Kept "${typed}" as your own note. If the course calls it something else, you can merge it in after the reveal.`,
      tone: 'note',
    });
  };

  const undo = () => {
    if (!feedback?.undo) return;
    const { id, typed } = feedback.undo;
    setMap((mm) => unrecallToNote(mm, id, scope.key, typed));
    setFeedback({ text: `Kept "${typed}" as your own note instead.`, tone: 'note' });
  };

  const left = sprintEnd ? Math.max(0, Math.ceil((sprintEnd - now) / 1000)) : 0;

  return (
    <section className="panel km-panel">
      <h2>What do I already know?</h2>
      <p className="small muted">
        Type the ideas you remember, one at a time, and press Enter. No peeking: trying to recall before you look tends to make what you
        read next stick better.
      </p>
      <div className="km-counter" aria-label={`Recalled ${score.recalled} of ${score.total}`}>
        <strong key={score.recalled} className="km-count">
          {score.recalled}
        </strong>
        <span>/ {score.total} recalled</span>
      </div>
      <ProgressBar value={score.fraction} thin label="Ideas recalled" />
      {locked ? (
        <p className="small km-locked">
          Recall is closed here because the rest of the map has been revealed. Start over to try again from memory, or use layers 2 and 3.
        </p>
      ) : (
        <form className="km-recall" onSubmit={submit}>
          <label className="sr-only" htmlFor="km-recall-input">
            An idea you remember
          </label>
          <input
            id="km-recall-input"
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. a term, a rule, a technique"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={80}
            autoFocus
          />
          <button className="btn primary" type="submit" disabled={!text.trim()}>
            Add
          </button>
        </form>
      )}
      <div className={`km-feedback ${feedback?.tone ?? ''}`} role="status" aria-live="polite">
        {feedback && (
          <>
            <span>{feedback.text}</span>
            {feedback.undo && (
              <button type="button" className="btn ghost small" onClick={undo}>
                Not what I meant: keep my words
              </button>
            )}
          </>
        )}
      </div>
      {!locked && (
        <div className="km-sprint">
          {sprintEnd ? (
            <>
              <span className="km-timer" aria-label={`${left} seconds left`}>
                <Icon name="clock" size={16} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
              </span>
              <button type="button" className="btn ghost small" onClick={() => setSprintEnd(null)}>
                Stop timer
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn ghost small"
              onClick={() => {
                setNow(Date.now());
                setSprintEnd(Date.now() + SPRINT_MS);
                inputRef.current?.focus();
              }}
            >
              <Icon name="clock" size={16} /> Optional: 2-minute sprint
            </button>
          )}
        </div>
      )}
      <button type="button" className="btn primary full" onClick={onDone}>
        {locked ? 'Back to the gaps' : "I'm out of ideas: show me what's left"}
      </button>
    </section>
  );
}

// ---------- layer 2 ----------

function GapsPanel({
  scope,
  map,
  nodes,
  selected,
  onSelect,
  onNext,
  maxLayer,
}: {
  scope: Scope;
  map: MapState;
  nodes: MapNode[];
  selected: Selection;
  onSelect: (id: string) => void;
  onNext: () => void;
  maxLayer: Layer;
}) {
  const score = recallScore(map, scope);
  const gaps = nodes.filter((n) => n.kind === 'island' || n.kind === 'learned');
  const learned = gaps.filter((n) => n.kind === 'learned').length;
  const notes = nodes.filter((n) => n.kind === 'note').length;
  return (
    <section className="panel km-panel">
      <h2>What don't I know yet?</h2>
      <div className="km-score">
        <Ring value={score.fraction} size={68} stroke={7} label={`Recalled ${Math.round(score.fraction * 100)}%`}>
          <strong>{Math.round(score.fraction * 100)}%</strong>
        </Ring>
        <p>{recallMessage(score)}</p>
      </div>
      {gaps.length > 0 ? (
        <>
          <p className="small muted">
            The dashed islands are the ideas you didn't recall. Open one to read what it is, follow it to its lesson, then mark it when it
            makes sense. {learned > 0 && `${learned} of ${gaps.length} marked so far.`}
          </p>
          <ul className="km-islands">
            {gaps.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`km-island-btn ${n.kind}`}
                  aria-pressed={selected?.type === 'node' && selected.id === n.id}
                  onClick={() => onSelect(n.id)}
                >
                  {n.kind === 'learned' && <Icon name="check" size={14} />}
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="small">No islands: you recalled everything in this part of the course.</p>
      )}
      {notes > 0 && <p className="small muted">Select one of your own notes to merge it into a course idea if they name the same thing.</p>}
      <button type="button" className="btn primary full" onClick={onNext}>
        {maxLayer >= 3 ? 'Back to connecting' : 'Connect the dots'} →
      </button>
    </section>
  );
}

// ---------- layer 3 ----------

function ConnectPanel({
  nodes,
  linkFrom,
  vocabulary,
  labelOf,
  onCancelLink,
  onLink,
  onCheck,
  checked,
}: {
  nodes: MapNode[];
  linkFrom: string | null;
  vocabulary: string[];
  labelOf: (id: string) => string;
  onCancelLink: () => void;
  onLink: (a: string, b: string, label?: string) => void;
  onCheck: () => void;
  checked: boolean;
}) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [label, setLabel] = useState('');
  return (
    <section className="panel km-panel">
      <h2>Connect the dots</h2>
      <p className="small muted">
        Tap one idea, then another, to link them, or drag from the dot on an idea. Draw the links you could explain in a sentence; ideas
        tied to other ideas tend to be easier to recall and use.
      </p>
      {linkFrom && (
        <p className="km-linking">
          Linking from <strong>{labelOf(linkFrom)}</strong>: now pick a second idea.{' '}
          <button type="button" className="btn ghost small" onClick={onCancelLink}>
            Cancel
          </button>
        </p>
      )}
      <details className="km-linkform">
        <summary>Or pick two ideas from a list</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (a && b && a !== b) {
              onLink(a, b, label || undefined);
              setB('');
            }
          }}
        >
          <label>
            <span>From</span>
            <select value={a} onChange={(e) => setA(e.target.value)}>
              <option value="">Choose an idea</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Link</span>
            <select value={label} onChange={(e) => setLabel(e.target.value)}>
              <option value="">(no label)</option>
              {vocabulary.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>To</span>
            <select value={b} onChange={(e) => setB(e.target.value)}>
              <option value="">Choose an idea</option>
              {nodes
                .filter((n) => n.id !== a)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
            </select>
          </label>
          <button type="submit" className="btn small" disabled={!a || !b || a === b}>
            Add link
          </button>
        </form>
      </details>
      <button type="button" className="btn primary full" onClick={onCheck}>
        {checked ? 'Check again' : 'Check my map'}
      </button>
    </section>
  );
}

function ResultsPanel({
  result,
  chunkList,
  map,
  labelOf,
  onHint,
  onAddHint,
}: {
  result: CheckResult;
  chunkList: Chunk[];
  map: MapState;
  labelOf: (id: string) => string;
  onHint: () => void;
  onAddHint: (l: ConceptLink) => void;
}) {
  const got = result.found + result.withHint;
  const extra = Object.values(result.status).filter((s) => s === 'extra').length;
  const more = nextHint(result, map);
  return (
    <section className="panel km-panel km-results" aria-label="Map check">
      <h2>Your map vs. the course map</h2>
      <div className="km-tiles">
        <div className="km-tile">
          <strong>
            {got}
            <small>/{result.total}</small>
          </strong>
          <span>links found{result.withHint ? `, ${result.withHint} with a hint` : ''}</span>
        </div>
        <div className="km-tile">
          <strong>{chunkList.length}</strong>
          <span>{chunkList.length === 1 ? 'chunk' : 'chunks'} of understanding</span>
        </div>
        <div className="km-tile">
          <strong>{extra}</strong>
          <span>links of your own</span>
        </div>
      </div>
      <ProgressBar value={result.total ? got / result.total : 0} label="Course links found" />
      <p>{linkMessage(result)}</p>
      {chunkList.length > 0 && (
        <>
          <p className="small muted">A chunk is a group of ideas joined by course links, named after its best-connected idea.</p>
          <ul className="km-chunks">
            {chunkList.map((c, i) => (
              <li key={c.name} className="km-chunk" style={{ '--chunk': CHUNK_COLORS[i % CHUNK_COLORS.length] } as CSSProperties}>
                <strong>{labelOf(c.name)}</strong>
                <span>{plural(c.members.length, 'idea')}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {extra > 0 && (
        <p className="small muted">
          {plural(extra, 'link')} you drew {extra === 1 ? "isn't" : "aren't"} in the course map. They might still be true: the course map is
          one expert's view, not the only one.
        </p>
      )}
      {result.shownHints.length > 0 && (
        <ul className="km-hints">
          {result.shownHints.map((l) => (
            <li key={pairKey(l.from, l.to)}>
              <span>
                <strong>{labelOf(l.from)}</strong> <em>{l.label}</em> <strong>{labelOf(l.to)}</strong>
              </span>
              <button type="button" className="btn small" onClick={() => onAddHint(l)}>
                Add to my map
              </button>
            </li>
          ))}
        </ul>
      )}
      {result.missed.length > 0 && (
        <button type="button" className="btn small" onClick={onHint} disabled={!more}>
          <Icon name="bulb" size={16} /> {more ? 'Show a link I missed' : 'All missed links are shown'}
        </button>
      )}
    </section>
  );
}

// ---------- details ----------

function NodePanel({
  course,
  scope,
  node,
  map,
  layer,
  links,
  labelOf,
  setMap,
  onLinkFrom,
  onClose,
  onAnnounce,
}: {
  course: Course;
  scope: Scope;
  node: MapNode;
  map: MapState;
  layer: Layer;
  links: MapState['links'];
  labelOf: (id: string) => string;
  setMap: SetMap;
  onLinkFrom: (id: string) => void;
  onClose: () => void;
  onAnnounce: (s: string) => void;
}) {
  const [mergeTo, setMergeTo] = useState('');
  const reveal = useRevealOnOpen(node.id);
  const c = node.concept;
  const lesson = c ? course.lessons.find((l) => l.id === c.lesson) : undefined;
  const mine = links.filter((l) => l.from === node.id || l.to === node.id);
  return (
    <section ref={reveal} className={`panel km-panel km-detail ${node.kind}`} aria-label={`Selected: ${node.label}`}>
      <div className="km-detail-head">
        <span className={`km-kind ${node.kind}`}>{KIND_TEXT[node.kind]}</span>
        <button type="button" className="btn ghost small" onClick={onClose} aria-label="Close details">
          ✕
        </button>
      </div>
      <h2>{node.label}</h2>
      {c?.summary && <p>{c.summary}</p>}
      {c && lesson && (node.kind !== 'recalled' || layer > 1) && (
        <p className="small">
          Taught in{' '}
          <a href={href('course', course.id, 'lesson', lesson.id)}>
            <strong>{lesson.title}</strong>
          </a>
        </p>
      )}
      <div className="km-detail-actions">
        {(node.kind === 'island' || node.kind === 'learned') && lesson && (
          <a className="btn small" href={href('course', course.id, 'lesson', lesson.id)}>
            Learn this
          </a>
        )}
        {node.kind === 'island' && (
          <button
            type="button"
            className="btn primary small"
            onClick={() => {
              setMap((m) => setLearned(m, node.id, true));
              onAnnounce(`${node.label}: marked as known now.`);
            }}
          >
            <Icon name="check" size={16} /> I know this now
          </button>
        )}
        {node.kind === 'learned' && (
          <button type="button" className="btn ghost small" onClick={() => setMap((m) => setLearned(m, node.id, false))}>
            Not yet, actually
          </button>
        )}
        {layer === 3 && (
          <button type="button" className="btn small" onClick={() => onLinkFrom(node.id)}>
            Link from here
          </button>
        )}
        {node.kind === 'recalled' && layer === 1 && (
          <button type="button" className="btn ghost small" onClick={() => setMap((m) => removeNode(m, node.id))}>
            Remove from my map
          </button>
        )}
        {node.kind === 'note' && (
          <button
            type="button"
            className="btn ghost small danger-outline"
            onClick={() => {
              setMap((m) => removeNode(m, node.id));
              onClose();
            }}
          >
            Delete note
          </button>
        )}
      </div>
      {node.kind === 'note' && layer > 1 && (
        <form
          className="km-merge"
          onSubmit={(e) => {
            e.preventDefault();
            if (!mergeTo) return;
            setMap((m) => mergeNote(m, node.id, mergeTo));
            onAnnounce(`Merged into ${labelOf(mergeTo)}: it counts as recalled.`);
            onClose();
          }}
        >
          <label>
            <span className="small">Same idea as a course concept? Merge it:</span>
            <select value={mergeTo} onChange={(e) => setMergeTo(e.target.value)}>
              <option value="">Choose a concept</option>
              {scope.concepts.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn small" disabled={!mergeTo}>
            Merge
          </button>
        </form>
      )}
      {node.kind === 'note' && layer === 1 && <p className="small muted">After the reveal you can merge a note into a course concept.</p>}
      {mine.length > 0 && (
        <ul className="km-node-links">
          {mine.map((l) => {
            const other = l.from === node.id ? l.to : l.from;
            return (
              <li key={pairKey(l.from, l.to)}>
                <span>
                  {l.label ? <em>{l.label}</em> : 'linked to'} <strong>{labelOf(other)}</strong>
                </span>
                {layer === 3 && (
                  <button type="button" className="btn ghost small" onClick={() => setMap((m) => removeLink(m, l.from, l.to))} aria-label={`Remove link to ${labelOf(other)}`}>
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {map.recalled.includes(node.id) && layer > 1 && <p className="small muted">You recalled this one from memory.</p>}
    </section>
  );
}

function LinkPanel({
  linkKey,
  map,
  checked,
  result,
  scope,
  vocabulary,
  labelOf,
  setMap,
  onClose,
}: {
  linkKey: string;
  map: MapState;
  checked: boolean;
  result: CheckResult;
  scope: Scope;
  vocabulary: string[];
  labelOf: (id: string) => string;
  setMap: SetMap;
  onClose: () => void;
}) {
  const reveal = useRevealOnOpen(linkKey);
  const l = map.links.find((x) => pairKey(x.from, x.to) === linkKey);
  if (!l) return null;
  const status = result.status[linkKey];
  const expert = scope.links.find((x) => pairKey(x.from, x.to) === linkKey);
  return (
    <section ref={reveal} className="panel km-panel km-detail" aria-label="Selected link">
      <div className="km-detail-head">
        <span className="km-kind">Link</span>
        <button type="button" className="btn ghost small" onClick={onClose} aria-label="Close details">
          ✕
        </button>
      </div>
      <p className="km-sentence">
        <strong>{labelOf(l.from)}</strong> <em>{l.label ?? 'is linked to'}</em> <strong>{labelOf(l.to)}</strong>
      </p>
      <label className="km-field">
        <span className="small">Label</span>
        <select value={l.label ?? ''} onChange={(e) => setMap((m) => addLink(m, l.from, l.to, e.target.value || undefined))}>
          <option value="">(no label)</option>
          {[...new Set([...(l.label ? [l.label] : []), ...vocabulary])].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      {checked && status && (
        <p className={`small km-status ${status}`}>
          {expert && status !== 'extra' ? (
            <>
              In the course map{status === 'hinted' ? ' (found with a hint)' : ''}: {labelOf(expert.from)} <em>{expert.label}</em>{' '}
              {labelOf(expert.to)}.
            </>
          ) : (
            "Not in the course map. It might still be true: can you say how they're related?"
          )}
        </p>
      )}
      <div className="km-detail-actions">
        <button
          type="button"
          className="btn small"
          onClick={() => setMap((m) => addLink(removeLink(m, l.from, l.to), l.to, l.from, l.label))}
          aria-label="Swap direction"
        >
          Swap direction
        </button>
        <button
          type="button"
          className="btn ghost small danger-outline"
          onClick={() => {
            setMap((m) => removeLink(m, l.from, l.to));
            onClose();
          }}
        >
          Remove link
        </button>
      </div>
    </section>
  );
}

function Legend({ layer, checked }: { layer: Layer; checked: boolean }) {
  return (
    <ul className="km-legend" aria-label="Legend">
      <li>
        <span className="km-swatch recalled" /> From memory
      </li>
      <li>
        <span className="km-swatch note" /> Your note
      </li>
      {layer > 1 && (
        <>
          <li>
            <span className="km-swatch island" /> Not yet
          </li>
          <li>
            <span className="km-swatch learned" /> Learned since
          </li>
        </>
      )}
      {layer === 3 && checked && (
        <>
          <li>
            <span className="km-line found" /> In the course map
          </li>
          <li>
            <span className="km-line extra" /> Your own link
          </li>
          <li>
            <span className="km-line hint" /> Hint
          </li>
        </>
      )}
    </ul>
  );
}

// ---------- list view (small screens, screen readers) ----------

function ListView({
  nodes,
  links,
  layer,
  checked,
  result,
  selected,
  linkFrom,
  labelOf,
  onSelectNode,
  onSelectLink,
}: {
  nodes: MapNode[];
  links: MapState['links'];
  layer: Layer;
  checked: boolean;
  result: CheckResult;
  selected: Selection;
  linkFrom: string | null;
  labelOf: (id: string) => string;
  onSelectNode: (id: string) => void;
  onSelectLink: (key: string) => void;
}) {
  const groups: { title: string; kinds: MapNode['kind'][] }[] = [
    { title: 'From memory', kinds: ['recalled'] },
    { title: 'Your own notes', kinds: ['note'] },
    { title: 'Learned since', kinds: ['learned'] },
    { title: 'Not yet', kinds: ['island'] },
  ];
  const statusText = { found: 'in the course map', hinted: 'in the course map, with a hint', extra: 'your own link' };
  return (
    <div className="km-list">
      {!nodes.length && <p className="muted small">Nothing on your map yet. Add the first idea you remember.</p>}
      {groups.map((g) => {
        const items = nodes.filter((n) => g.kinds.includes(n.kind));
        if (!items.length) return null;
        return (
          <section key={g.title}>
            <h3>
              {g.title} <span className="muted small">{items.length}</span>
            </h3>
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`km-list-node ${n.kind}${linkFrom === n.id ? ' from' : ''}`}
                    aria-pressed={selected?.type === 'node' && selected.id === n.id}
                    onClick={() => onSelectNode(n.id)}
                  >
                    {n.kind === 'note' && <Icon name="pencil" size={14} />}
                    {n.kind === 'learned' && <Icon name="check" size={14} />}
                    {n.label}
                    {layer === 3 && <span className="sr-only">{linkFrom && linkFrom !== n.id ? ' (link to this)' : ' (start a link)'}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {layer === 3 && (
        <section>
          <h3>
            Links <span className="muted small">{links.length}</span>
          </h3>
          {links.length ? (
            <ul>
              {links.map((l) => {
                const key = pairKey(l.from, l.to);
                const st = checked ? result.status[key] : undefined;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={`km-list-link ${st ?? ''}`}
                      aria-pressed={selected?.type === 'link' && selected.key === key}
                      onClick={() => onSelectLink(key)}
                    >
                      <strong>{labelOf(l.from)}</strong> <em>{l.label ?? 'linked to'}</em> <strong>{labelOf(l.to)}</strong>
                      {st && <span className="km-list-status">{statusText[st]}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted small">No links yet. Select one idea, then another.</p>
          )}
        </section>
      )}
    </div>
  );
}

// ---------- canvas ----------

type Gesture =
  | { kind: 'pan'; s: Pos; v0: View; moved: boolean }
  | { kind: 'node'; id: string; s: Pos; start: Pos; moved: boolean }
  | { kind: 'edge'; key: string; s: Pos }
  | { kind: 'link'; from: string }
  | { kind: 'pinch'; d0: number; m0: Pos; v0: View };

const EDGE_CLASSES = ['plain', 'found', 'hinted', 'extra', 'hint'];
const OFF = 5000; // the edge layer is a big SVG offset so edges can be hit-tested anywhere
const LIMIT = OFF - 200;
const dist = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pos, b: Pos) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const clampPos = (p: Pos) => ({ x: Math.max(-LIMIT, Math.min(LIMIT, p.x)), y: Math.max(-LIMIT, Math.min(LIMIT, p.y)) });

function Canvas({
  nodes,
  pos,
  links,
  layer,
  checked,
  result,
  chunkList,
  selected,
  linkFrom,
  popId,
  view,
  setView,
  onSize,
  onTapNode,
  onTapEdge,
  onTapBackground,
  onMove,
  onLink,
}: {
  nodes: MapNode[];
  pos: Record<string, Pos>;
  links: MapState['links'];
  layer: Layer;
  checked: boolean;
  result: CheckResult;
  chunkList: Chunk[];
  selected: Selection;
  linkFrom: string | null;
  popId: string | null;
  view: View;
  setView: (v: View | ((v: View) => View)) => void;
  onSize: (s: { w: number; h: number }) => void;
  onTapNode: (id: string) => void;
  onTapEdge: (key: string) => void;
  onTapBackground: () => void;
  onMove: (id: string, p: Pos) => void;
  onLink: (a: string, b: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, Pos>());
  const viewRef = useRef(view);
  const posRef = useRef(pos);
  const [temp, setTemp] = useState<{ from: string; to: Pos } | null>(null);

  useEffect(() => {
    viewRef.current = view;
    posRef.current = pos;
  }, [view, pos]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    onSize({ w: el.clientWidth, h: el.clientHeight });
    // Pinch (reported as ctrl+wheel) or ⌘/Ctrl + wheel zooms; a plain wheel keeps scrolling the page.
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      setView((v) => zoomAt(v, factor, e.clientX - r.left, e.clientY - r.top));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener('wheel', wheel);
    };
  }, [onSize, setView]);

  const local = (e: PointerEvent): Pos => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    ref.current?.setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { kind: 'pinch', d0: Math.max(1, dist(a, b)), m0: mid(a, b), v0: viewRef.current };
      setTemp(null);
      return;
    }
    if (pointers.current.size > 2) return;
    const t = e.target as Element;
    const handle = t.closest('[data-handle]');
    if (handle) {
      const from = handle.getAttribute('data-handle')!;
      gesture.current = { kind: 'link', from };
      setTemp({ from, to: toWorld(viewRef.current, p.x, p.y) });
      e.preventDefault();
      return;
    }
    const node = t.closest('[data-node]');
    if (node) {
      const id = node.getAttribute('data-node')!;
      gesture.current = { kind: 'node', id, s: p, start: posRef.current[id] ?? { x: 0, y: 0 }, moved: false };
      return;
    }
    const edge = t.closest('[data-edge]');
    if (edge) {
      gesture.current = { kind: 'edge', key: edge.getAttribute('data-edge')!, s: p };
      return;
    }
    gesture.current = { kind: 'pan', s: p, v0: viewRef.current, moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pinch') {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const m = mid(a, b);
      const z = zoomAt(g.v0, dist(a, b) / g.d0, g.m0.x, g.m0.y);
      setView({ ...z, x: z.x + m.x - g.m0.x, y: z.y + m.y - g.m0.y });
      return;
    }
    if (g.kind === 'link') {
      setTemp({ from: g.from, to: toWorld(viewRef.current, p.x, p.y) });
      return;
    }
    const dx = p.x - g.s.x;
    const dy = p.y - g.s.y;
    const far = Math.hypot(dx, dy) > 5;
    if (g.kind === 'edge') {
      if (far) gesture.current = { kind: 'pan', s: g.s, v0: viewRef.current, moved: true };
      return;
    }
    if (!g.moved && !far) return;
    g.moved = true;
    if (g.kind === 'pan') setView({ ...g.v0, x: g.v0.x + dx, y: g.v0.y + dy });
    else onMove(g.id, clampPos({ x: Math.round(g.start.x + dx / viewRef.current.k), y: Math.round(g.start.y + dy / viewRef.current.k) }));
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (g?.kind === 'pinch') {
      if (pointers.current.size < 2) gesture.current = null;
      return;
    }
    gesture.current = null;
    if (!g || e.type === 'pointercancel') {
      setTemp(null);
      return;
    }
    if (g.kind === 'node' && !g.moved) onTapNode(g.id);
    else if (g.kind === 'edge') onTapEdge(g.key);
    else if (g.kind === 'pan' && !g.moved) onTapBackground();
    else if (g.kind === 'link') {
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-node]')?.getAttribute('data-node');
      if (target && target !== g.from) onLink(g.from, target);
      else if (!target) onTapNode(g.from); // a short press on the dot works like tapping the node
      setTemp(null);
    }
  };

  const nodeKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const step = e.shiftKey ? 64 : 16;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    const p = pos[id] ?? { x: 0, y: 0 };
    onMove(id, clampPos({ x: p.x + d[0], y: p.y + d[1] }));
  };

  const chunkOf = new Map<string, number>();
  chunkList.forEach((c, i) => c.members.forEach((m) => chunkOf.set(m, i)));
  const chunkNames = new Set(chunkList.map((c) => c.name));
  const sizeOf = (id: string) => nodeSize(nodes.find((n) => n.id === id)?.label ?? '');

  const expertByKey = new Map(result.correct.map((c) => [pairKey(c.from, c.to), c]));
  type Edge = { key: string; from: string; to: string; label?: string; cls: string; arrow: boolean };
  const edges: Edge[] = links.map((l) => {
    const key = pairKey(l.from, l.to);
    const st = checked ? result.status[key] : undefined;
    // A correct link the learner didn't label shows the course's label, read in the course's direction.
    const ex = st && st !== 'extra' && !l.label ? expertByKey.get(key) : undefined;
    return { key, from: ex?.from ?? l.from, to: ex?.to ?? l.to, label: l.label ?? ex?.label, cls: st ?? 'plain', arrow: Boolean(l.label ?? ex) };
  });
  const hintEdges: Edge[] = checked
    ? result.shownHints
        .filter((l) => pos[l.from] && pos[l.to])
        .map((l) => ({ key: `hint:${pairKey(l.from, l.to)}`, from: l.from, to: l.to, label: l.label, cls: 'hint', arrow: true }))
    : [];

  const isSel = (key: string) => selected?.type === 'link' && selected.key === key;

  return (
    <div
      ref={ref}
      className={`km-viewport${linkFrom ? ' linking' : ''}`}
      style={{ backgroundPosition: `${view.x}px ${view.y}px`, backgroundSize: `${24 * view.k}px ${24 * view.k}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="group"
      aria-label="Knowledge map canvas. Drag to pan, pinch or scroll to zoom. Ideas are buttons; arrow keys move the focused idea. The List view shows the same map as lists."
    >
      <div className="km-world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
        <svg className="km-edges" width={2 * OFF} height={2 * OFF} style={{ left: -OFF, top: -OFF }} aria-hidden>
          <defs>
            {EDGE_CLASSES.map((c) => (
              <marker key={c} id={`km-arrow-${c}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className={`km-arrowhead ${c}`} />
              </marker>
            ))}
          </defs>
          <g transform={`translate(${OFF} ${OFF})`}>
            {chunkList.map((c, i) => {
              const corners = c.members.flatMap((m) => {
                const p = pos[m];
                if (!p) return [];
                const s = sizeOf(m);
                return [
                  { x: p.x - s.w / 2, y: p.y - s.h / 2 },
                  { x: p.x + s.w / 2, y: p.y - s.h / 2 },
                  { x: p.x + s.w / 2, y: p.y + s.h / 2 },
                  { x: p.x - s.w / 2, y: p.y + s.h / 2 },
                ];
              });
              const h = hull(corners);
              if (h.length < 2) return null;
              const d = `M${h.map((p) => `${p.x} ${p.y}`).join(' L')} Z`;
              return <path key={c.name} d={d} className="km-hull" style={{ '--chunk': CHUNK_COLORS[i % CHUNK_COLORS.length] } as CSSProperties} />;
            })}
            {[...hintEdges, ...edges].map((e) => {
              const a = pos[e.from];
              const b = pos[e.to];
              if (!a || !b) return null;
              const s = sizeOf(e.to);
              const end = e.arrow ? edgeEnd(a, b, s.w / 2 + 3, s.h / 2 + 3) : b;
              const m = mid(a, b);
              return (
                <g key={e.key} data-edge={e.cls === 'hint' ? undefined : e.key} className={`km-edge ${e.cls}${isSel(e.key) ? ' sel' : ''}`}>
                  {e.cls !== 'hint' && <line className="km-edge-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />}
                  <line className="km-edge-line" x1={a.x} y1={a.y} x2={end.x} y2={end.y} markerEnd={e.arrow ? `url(#km-arrow-${e.cls})` : undefined} />
                  {e.label && (
                    <text className="km-edge-label" x={m.x} y={m.y - 5} textAnchor="middle">
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
            {temp && pos[temp.from] && (
              <line className="km-temp" x1={pos[temp.from].x} y1={pos[temp.from].y} x2={temp.to.x} y2={temp.to.y} />
            )}
          </g>
        </svg>
        {nodes.map((n) => {
          const p = pos[n.id];
          if (!p) return null;
          const sel = selected?.type === 'node' && selected.id === n.id;
          const ci = chunkOf.get(n.id);
          return (
            <button
              key={n.id}
              type="button"
              data-node={n.id}
              className={`km-node ${n.kind}${sel ? ' sel' : ''}${linkFrom === n.id ? ' from' : ''}${popId === n.id ? ' pop' : ''}${ci !== undefined ? ' in-chunk' : ''}`}
              style={{ left: p.x, top: p.y, ...(ci !== undefined ? ({ '--chunk': CHUNK_COLORS[ci % CHUNK_COLORS.length] } as CSSProperties) : {}) }}
              aria-pressed={sel}
              aria-label={`${n.label}, ${KIND_TEXT[n.kind]}${layer === 3 ? (linkFrom && linkFrom !== n.id ? '. Press to link.' : '. Press to start a link.') : ''}`}
              onClick={(e) => {
                // Pointer taps are handled by the gesture code; this covers Enter and Space.
                if (e.detail === 0) onTapNode(n.id);
              }}
              onKeyDown={(e) => nodeKey(e, n.id)}
            >
              {n.kind === 'note' && <Icon name="pencil" size={13} />}
              {n.kind === 'learned' && <Icon name="check" size={13} />}
              <span className="km-node-label">{n.label}</span>
              {chunkNames.has(n.id) && <span className="km-chunk-tag">chunk</span>}
              {layer === 3 && <span className="km-handle" data-handle={n.id} aria-hidden />}
            </button>
          );
        })}
      </div>
      {!nodes.length && <p className="km-empty">Your map is empty. Type the first idea you remember.</p>}
    </div>
  );
}
