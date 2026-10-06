import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { getCourse, tracks, type Track, type TrackNode } from '../content';
import { href } from '../lib/router';
import {
  chooseLayoutOptions,
  layoutRoadmap,
  nodeStatuses,
  suggestNext,
  type LayoutInput,
  type NodeStatus,
} from '../lib/roadmapLayout';
import { courseStats } from '../lib/stats';
import { useProgress, type Progress } from '../lib/storage';
import type { Course } from '../types';
import { Page, PageHeader } from './Layout';
import { accentStyle, plural, ProgressBar, Ring } from './ui';
import './Roadmap.css';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';

// ---------- data ----------

type Stats = ReturnType<typeof courseStats>;

interface NodeInfo {
  node: TrackNode;
  course: Course;
  stats: Stats;
  status: NodeStatus;
}

interface TrackInfo {
  track: Track;
  nodes: NodeInfo[];
  byId: Map<string, NodeInfo>;
  /** Lessons completed / total across the track's courses. */
  fraction: number;
  doneCount: number;
  /** Course id to do next (first in progress, else first up next); undefined when everything is done. */
  next?: string;
}

const STATUS_LABEL: Record<NodeStatus, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  'up-next': 'Up next',
  later: 'Later',
};
const STATUS_MARK: Record<NodeStatus, string> = { done: '✓', 'in-progress': '◐', 'up-next': '→', later: '○' };

/** Finished for the track = every core lesson done (or every lesson, for a course without core lessons). */
const courseDone = (s: Stats) => (s.coreTotal ? s.coreDone >= s.coreTotal : s.total > 0 && s.completed >= s.total);

function buildTrack(track: Track, p: Progress): TrackInfo {
  const present = track.nodes.flatMap((node) => {
    const course = getCourse(node.course);
    return course ? [{ node, course, stats: courseStats(course, p) }] : [];
  });
  const inputs: LayoutInput[] = present.map((x) => ({ id: x.node.course, after: x.node.after }));
  const statuses = nodeStatuses(
    inputs,
    Object.fromEntries(present.map((x) => [x.node.course, { done: courseDone(x.stats), started: x.stats.started }])),
  );
  const nodes = present.map((x) => ({ ...x, status: statuses.get(x.node.course) ?? 'later' }));
  const completed = nodes.reduce((s, n) => s + n.stats.completed, 0);
  const total = nodes.reduce((s, n) => s + n.stats.total, 0);
  return {
    track,
    nodes,
    byId: new Map(nodes.map((n) => [n.node.course, n])),
    fraction: total ? completed / total : 0,
    doneCount: nodes.filter((n) => n.status === 'done').length,
    next: suggestNext(
      nodes.map((n) => n.node.course),
      statuses,
    ),
  };
}

function useTracks(): TrackInfo[] {
  const p = useProgress();
  return useMemo(() => tracks.map((t) => buildTrack(t, p)), [p]);
}

/** The track with the most progress (by share of lessons done), else the first. */
function defaultTrack(infos: TrackInfo[]): TrackInfo | undefined {
  return infos.reduce<TrackInfo | undefined>((best, t) => (!best || t.fraction > best.fraction ? t : best), undefined);
}

// ---------- page ----------

export function Roadmap({ trackId }: { trackId?: string }) {
  const infos = useTracks();
  const current = infos.find((t) => t.track.id === trackId) ?? defaultTrack(infos);

  if (!current) {
    return (
      <Page>
        <PageHeader title="Roadmap" />
        <div className="panel rm-empty">
          <Icon name="route" size={56} />
          <p>
            <strong>The roadmap isn't available right now.</strong>
          </p>
          <p className="muted">
            Its tracks couldn't be loaded. In the meantime, every course is still open on the{' '}
            <a href="#/courses">Courses</a> page.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page wide>
      <PageHeader
        title="Roadmap"
        subtitle="Tracks chain courses toward a goal. Follow the lines in order — or jump anywhere, nothing is locked."
      />

      <nav className="rm-tracks" aria-label="Tracks">
        {infos.map((t) => {
          const on = t === current;
          const pct = Math.round(t.fraction * 100);
          return (
            <a key={t.track.id} className={`rm-track${on ? ' on' : ''}`} href={href('roadmap', t.track.id)} aria-current={on ? 'page' : undefined}>
              <CourseIcon icon={t.track.icon} size={44} />
              <span className="rm-track-body">
                <strong>{t.track.title}</strong>
                <span className="rm-track-desc">{t.track.description}</span>
                <span className="rm-track-progress">
                  <ProgressBar value={t.fraction} thin label={`${t.track.title}: ${pct}% complete`} />
                  <span className="small muted">
                    {pct}% · {t.doneCount}/{plural(t.nodes.length, 'course')}
                  </span>
                </span>
              </span>
            </a>
          );
        })}
      </nav>

      <TrackMap key={current.track.id} info={current} />
    </Page>
  );
}

// ---------- the map ----------

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1024 : Math.min(window.innerWidth - 32, 1120)));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      setWidth(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function TrackMap({ info }: { info: TrackInfo }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [openId, setOpenId] = useState<string>();
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());

  const inputs = useMemo<LayoutInput[]>(() => info.nodes.map((n) => ({ id: n.node.course, after: n.node.after })), [info]);
  const opts = useMemo(() => chooseLayoutOptions(inputs, width), [inputs, width]);
  const layout = useMemo(() => layoutRoadmap(inputs, opts), [inputs, opts]);
  const vertical = opts.direction === 'vertical';
  const next = info.next ? info.byId.get(info.next) : undefined;
  const open = openId ? info.byId.get(openId) : undefined;

  const close = useCallback(() => {
    const id = openId;
    setOpenId(undefined);
    if (id) requestAnimationFrame(() => nodeRefs.current.get(id)?.focus());
  }, [openId]);

  return (
    <section className="rm-map-section" aria-labelledby="rm-track-title">
      <div className="rm-map-head">
        <div>
          <h2 id="rm-track-title">
            <CourseIcon icon={info.track.icon} size={30} className="title-icon" /> {info.track.title}
          </h2>
          <p className="muted small">
            {info.doneCount === info.nodes.length
              ? `Track complete — all ${info.nodes.length} courses done.`
              : `${info.doneCount} of ${plural(info.nodes.length, 'course')} done${next ? ` · Next: ${next.course.title}` : ''}`}
          </p>
        </div>
        {next?.stats.next && (
          <a className="btn primary small" style={accentStyle(next.course.color)} href={href('course', next.course.id, 'lesson', next.stats.next.id)}>
            {next.stats.started ? 'Continue' : 'Start'} {next.course.title} →
          </a>
        )}
      </div>

      <div className={`rm-map-wrap${vertical ? ' vertical' : ''}`} ref={wrapRef}>
        <div className="rm-canvas" style={{ width: layout.width, height: layout.height }} role="group" aria-label={`${info.track.title} map`}>
          <svg className="rm-edges" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden focusable="false">
            {layout.edges.map((e) => {
              const from = info.byId.get(e.from)!;
              const solid = from.status === 'done';
              return (
                <path
                  key={`${e.from}>${e.to}`}
                  d={e.path}
                  className={`rm-edge${solid ? ' solid' : ''}`}
                  style={solid ? ({ stroke: from.course.color ?? 'var(--brand)' } as CSSProperties) : undefined}
                />
              );
            })}
          </svg>
          {layout.nodes.map((pos) => {
            const n = info.byId.get(pos.id)!;
            return (
              <MapNode
                key={pos.id}
                n={n}
                info={info}
                compact={vertical}
                style={{ left: pos.x, top: pos.y, width: opts.nodeWidth, height: opts.nodeHeight }}
                expanded={openId === pos.id}
                onOpen={() => setOpenId(pos.id)}
                buttonRef={(el) => {
                  if (el) nodeRefs.current.set(pos.id, el);
                  else nodeRefs.current.delete(pos.id);
                }}
              />
            );
          })}
        </div>
      </div>

      <ul className="rm-legend" aria-label="Legend">
        {(['done', 'in-progress', 'up-next', 'later'] as NodeStatus[]).map((s) => (
          <li key={s}>
            <span className={`rm-pill ${s}`}>
              <span aria-hidden>{STATUS_MARK[s]}</span> {STATUS_LABEL[s]}
            </span>
            <span className="small muted">
              {s === 'done'
                ? 'core lessons finished'
                : s === 'in-progress'
                  ? 'started'
                  : s === 'up-next'
                    ? 'ready to start'
                    : 'after its prerequisites'}
            </span>
          </li>
        ))}
        <li className="rm-legend-edges">
          <svg width="34" height="10" aria-hidden>
            <path d="M2 5 H32" className="rm-edge solid" style={{ stroke: 'var(--brand)' }} />
          </svg>
          <span className="small muted">from a finished course</span>
          <svg width="34" height="10" aria-hidden>
            <path d="M2 5 H32" className="rm-edge" />
          </svg>
          <span className="small muted">still to do</span>
        </li>
      </ul>

      {open && <DetailPanel n={open} info={info} onClose={close} />}
    </section>
  );
}

function prereqNames(n: NodeInfo, info: TrackInfo) {
  return (n.node.after ?? []).map((id) => info.byId.get(id)?.course.title ?? id);
}

function MapNode({
  n,
  info,
  compact,
  style,
  expanded,
  onOpen,
  buttonRef,
}: {
  n: NodeInfo;
  info: TrackInfo;
  compact: boolean;
  style: CSSProperties;
  expanded: boolean;
  onOpen: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  const { course, stats: s, status } = n;
  const value = s.total ? s.completed / s.total : 0;
  const after = prereqNames(n, info);
  const label = `${course.title}: ${STATUS_LABEL[status]}, ${s.completed} of ${plural(s.total, 'lesson')} done${
    after.length ? `. After ${after.join(' and ')}` : ''
  }`;
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`rm-node ${status}${compact ? ' compact' : ''}`}
      style={{ ...style, ...accentStyle(course.color) }}
      onClick={onOpen}
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={expanded}
    >
      <Ring value={value} size={compact ? 44 : 50} stroke={compact ? 4 : 5}>
        <CourseIcon icon={course.icon} color={course.color} size={compact ? 30 : 34} />
      </Ring>
      <span className="rm-node-text">
        <strong className="rm-node-title">{course.title}</strong>
        <span className={`rm-pill ${status}`}>
          <span aria-hidden>{STATUS_MARK[status]}</span> {STATUS_LABEL[status]}
        </span>
        {!compact && (
          <span className="rm-node-count">
            {s.completed}/{s.total} lessons
          </span>
        )}
      </span>
    </button>
  );
}

// ---------- detail panel ----------

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function DetailPanel({ n, info, onClose }: { n: NodeInfo; info: TrackInfo; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { course, stats: s, status } = n;
  const after = (n.node.after ?? []).flatMap((id) => info.byId.get(id) ?? []);

  useEffect(() => {
    ref.current?.focus();
  }, [course.id]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Keep Tab inside the dialog while it is open.
  const trap = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const titleId = `rm-detail-${course.id}`;
  return (
    <div className="rm-detail-layer" style={accentStyle(course.color)}>
      <div className="rm-backdrop" onClick={onClose} aria-hidden />
      <div className="rm-detail" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={ref} onKeyDown={trap}>
        <div className="rm-grabber" aria-hidden />
        <header className="rm-detail-head">
          <CourseIcon icon={course.icon} color={course.color} size={52} />
          <div className="grow">
            <span className="eyebrow">
              {course.category}
              {course.level && ` · ${course.level}`}
            </span>
            <h2 id={titleId}>{course.title}</h2>
          </div>
          <button type="button" className="btn ghost small rm-close" onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </header>

        <div className="rm-detail-body">
          <p className="rm-detail-status">
            <span className={`rm-pill ${status}`}>
              <span aria-hidden>{STATUS_MARK[status]}</span> {STATUS_LABEL[status]}
            </span>
            {after.length > 0 && (
              <span className="small muted">
                After{' '}
                {after.map((a, i) => (
                  <span key={a.course.id}>
                    {i > 0 && (i === after.length - 1 ? ' and ' : ', ')}
                    {a.course.title}
                    {a.status === 'done' && ' ✓'}
                  </span>
                ))}
              </span>
            )}
          </p>

          <p>{course.description}</p>
          {n.node.note && (
            <p className="rm-note">
              <Icon name="bulb" size={15} /> {n.node.note}
            </p>
          )}

          <div className="rm-detail-progress">
            <div className="row between small">
              <strong>
                Core {s.coreDone}/{s.coreTotal}
              </strong>
              <span className="muted">
                {s.completed}/{plural(s.total, 'lesson')} · {Math.round(s.mastery * 100)}% mastered
              </span>
            </div>
            <ProgressBar value={s.coreTotal ? s.coreDone / s.coreTotal : 0} label={`${course.title} core lessons`} />
          </div>

          <div className="rm-detail-actions">
            {s.next ? (
              <a className="btn primary" href={href('course', course.id, 'lesson', s.next.id)}>
                {s.started ? 'Continue' : 'Start'}: {s.next.title}
              </a>
            ) : (
              <a className="btn primary" href={href('course', course.id, 'quiz')}>
                All done — take the quiz
              </a>
            )}
            <a className="btn" href={href('course', course.id)}>
              Open course
            </a>
          </div>

          <h3 className="rm-units-title">What's inside</h3>
          {course.units.map((u) => {
            const doneCount = u.lessons.filter(s.done).length;
            return (
              <section key={u.id} className="rm-unit">
                <div className="rm-unit-head">
                  <strong>{u.title}</strong>
                  <span className="small muted">
                    {doneCount}/{u.lessons.length}
                  </span>
                </div>
                <ul className="rm-checklist">
                  {u.lessons.map((l) => {
                    const done = s.done(l);
                    const isNext = s.next?.id === l.id;
                    return (
                      <li key={l.id} className={`${done ? 'done' : ''}${isNext ? ' next' : ''}`}>
                        <span className="rm-check" aria-hidden>
                          {done ? '✓' : ''}
                        </span>
                        <a href={href('course', course.id, 'lesson', l.id)}>
                          {l.title}
                          <span className="sr-only">{done ? ' (done)' : ' (not done)'}</span>
                        </a>
                        {l.pareto === 'core' && (
                          <span className="rm-core-dot" title="Core lesson">
                            <span className="sr-only">Core lesson</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- home teaser ----------

/** Small Home-page card: "Next on your <track> track: <course>". Renders nothing when there are no tracks. */
export function RoadmapTeaser() {
  const infos = useTracks();
  const t = defaultTrack(infos);
  if (!t) return null;
  const next = t.next ? t.byId.get(t.next) : undefined;
  return (
    <a className="rm-teaser" href={href('roadmap', t.track.id)} style={accentStyle(next?.course.color)}>
      <CourseIcon icon={t.track.icon} size={48} />
      <span className="rm-teaser-body">
        <span className="eyebrow">Roadmap</span>
        {next ? (
          <span className="rm-teaser-text">
            Next on your {t.track.title} track:{' '}
            <strong>
              <CourseIcon icon={next.course.icon} color={next.course.color} size={18} /> {next.course.title}
            </strong>
          </span>
        ) : (
          <span className="rm-teaser-text">
            You've finished the <strong>{t.track.title}</strong> track. Pick another one!
          </span>
        )}
        <ProgressBar value={t.fraction} thin label={`${t.track.title}: ${Math.round(t.fraction * 100)}% complete`} />
      </span>
      <span className="rm-teaser-cta">See the map →</span>
    </a>
  );
}
