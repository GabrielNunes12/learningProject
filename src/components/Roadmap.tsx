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
import { accentStyle, ProgressBar, Ring } from './ui';
import './Roadmap.css';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { categoryLabel, formatList, formatPercent, levelLabel, t, type MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';

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

const STATUS_KEY: Record<NodeStatus, MessageKey> = {
  done: 'roadmap.status.done',
  'in-progress': 'roadmap.status.inProgress',
  'up-next': 'roadmap.status.upNext',
  later: 'roadmap.status.later',
};
const statusLabel = (s: NodeStatus) => t(STATUS_KEY[s]);
const LEGEND_KEY: Record<NodeStatus, MessageKey> = {
  done: 'roadmap.legend.done',
  'in-progress': 'roadmap.legend.inProgress',
  'up-next': 'roadmap.legend.upNext',
  later: 'roadmap.legend.later',
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
  const { t, tx, pct } = useT();
  const infos = useTracks();
  const current = infos.find((t) => t.track.id === trackId) ?? defaultTrack(infos);

  if (!current) {
    return (
      <Page>
        <PageHeader title={t('roadmap.title')} />
        <div className="panel rm-empty">
          <Icon name="route" size={56} />
          <p>
            <strong>{t('roadmap.unavailable')}</strong>
          </p>
          <p className="muted">{tx('roadmap.unavailableHelp', {}, { link: (c) => <a href="#/courses">{c}</a> })}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page wide>
      <PageHeader title={t('roadmap.title')} subtitle={t('roadmap.subtitle')} />

      <nav className="rm-tracks" aria-label={t('roadmap.tracks')}>
        {infos.map((info) => {
          const on = info === current;
          const done = pct(info.fraction);
          return (
            <a key={info.track.id} className={`rm-track${on ? ' on' : ''}`} href={href('roadmap', info.track.id)} aria-current={on ? 'page' : undefined}>
              <CourseIcon icon={info.track.icon} size={44} />
              <span className="rm-track-body">
                <strong>{info.track.title}</strong>
                <span className="rm-track-desc">{info.track.description}</span>
                <span className="rm-track-progress">
                  <ProgressBar value={info.fraction} thin label={t('roadmap.trackComplete', { track: info.track.title, pct: done })} />
                  <span className="small muted">
                    {t('roadmap.trackProgress', { pct: done, done: info.doneCount, total: info.nodes.length, count: info.nodes.length })}
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
  const { t } = useT();
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
              ? t('roadmap.allDone', { count: info.nodes.length })
              : next
                ? t('roadmap.someDoneNext', { done: info.doneCount, count: info.nodes.length, course: next.course.title })
                : t('roadmap.someDone', { done: info.doneCount, count: info.nodes.length })}
          </p>
        </div>
        {next?.stats.next && (
          <a className="btn primary small" style={accentStyle(next.course.color)} href={href('course', next.course.id, 'lesson', next.stats.next.id)}>
            {t(next.stats.started ? 'roadmap.continueCourse' : 'roadmap.startCourse', { course: next.course.title })}
          </a>
        )}
      </div>

      <div className={`rm-map-wrap${vertical ? ' vertical' : ''}`} ref={wrapRef}>
        <div className="rm-canvas" style={{ width: layout.width, height: layout.height }} role="group" aria-label={t('roadmap.mapLabel', { track: info.track.title })}>
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

      <ul className="rm-legend" aria-label={t('roadmap.legend')}>
        {(['done', 'in-progress', 'up-next', 'later'] as NodeStatus[]).map((s) => (
          <li key={s}>
            <span className={`rm-pill ${s}`}>
              <span aria-hidden>{STATUS_MARK[s]}</span> {statusLabel(s)}
            </span>
            <span className="small muted">{t(LEGEND_KEY[s])}</span>
          </li>
        ))}
        <li className="rm-legend-edges">
          <svg width="34" height="10" aria-hidden>
            <path d="M2 5 H32" className="rm-edge solid" style={{ stroke: 'var(--brand)' }} />
          </svg>
          <span className="small muted">{t('roadmap.legend.solid')}</span>
          <svg width="34" height="10" aria-hidden>
            <path d="M2 5 H32" className="rm-edge" />
          </svg>
          <span className="small muted">{t('roadmap.legend.dashed')}</span>
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
  const params = { course: course.title, status: statusLabel(status), done: s.completed, count: s.total };
  const label = after.length ? t('roadmap.nodeLabelAfter', { ...params, after: formatList(after) }) : t('roadmap.nodeLabel', params);
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
          <span aria-hidden>{STATUS_MARK[status]}</span> {statusLabel(status)}
        </span>
        {!compact && <span className="rm-node-count">{t('roadmap.nodeCount', { done: s.completed, total: s.total })}</span>}
      </span>
    </button>
  );
}

// ---------- detail panel ----------

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function DetailPanel({ n, info, onClose }: { n: NodeInfo; info: TrackInfo; onClose: () => void }) {
  const { t, pct, list } = useT();
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
              {categoryLabel(course.category ?? 'General')}
              {course.level && ` · ${levelLabel(course.level)}`}
            </span>
            <h2 id={titleId}>{course.title}</h2>
          </div>
          <button type="button" className="btn ghost small rm-close" onClick={onClose} aria-label={t('roadmap.closeDetails')}>
            ✕
          </button>
        </header>

        <div className="rm-detail-body">
          <p className="rm-detail-status">
            <span className={`rm-pill ${status}`}>
              <span aria-hidden>{STATUS_MARK[status]}</span> {statusLabel(status)}
            </span>
            {after.length > 0 && (
              <span className="small muted">
                {t('roadmap.after', { list: list(after.map((a) => (a.status === 'done' ? `${a.course.title} ✓` : a.course.title))) })}
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
              <strong>{t('roadmap.core', { done: s.coreDone, total: s.coreTotal })}</strong>
              <span className="muted">{t('roadmap.lessonsMastered', { done: s.completed, count: s.total, pct: pct(s.mastery) })}</span>
            </div>
            <ProgressBar value={s.coreTotal ? s.coreDone / s.coreTotal : 0} label={t('roadmap.coreLessonsLabel', { course: course.title })} />
          </div>

          <div className="rm-detail-actions">
            {s.next ? (
              <a className="btn primary" href={href('course', course.id, 'lesson', s.next.id)}>
                {t(s.started ? 'roadmap.continueLesson' : 'roadmap.startLesson', { lesson: s.next.title })}
              </a>
            ) : (
              <a className="btn primary" href={href('course', course.id, 'quiz')}>
                {t('roadmap.allDoneQuiz')}
              </a>
            )}
            <a className="btn" href={href('course', course.id)}>
              {t('roadmap.openCourse')}
            </a>
          </div>

          <h3 className="rm-units-title">{t('roadmap.inside')}</h3>
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
                          <span className="sr-only"> {done ? t('roadmap.lessonDone') : t('roadmap.lessonNotDone')}</span>
                        </a>
                        {l.pareto === 'core' && (
                          <span className="rm-core-dot" title={t('roadmap.coreLesson')}>
                            <span className="sr-only">{t('roadmap.coreLesson')}</span>
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
  const { t, tx } = useT();
  const infos = useTracks();
  const info = defaultTrack(infos);
  if (!info) return null;
  const next = info.next ? info.byId.get(info.next) : undefined;
  return (
    <a className="rm-teaser" href={href('roadmap', info.track.id)} style={accentStyle(next?.course.color)}>
      <CourseIcon icon={info.track.icon} size={48} />
      <span className="rm-teaser-body">
        <span className="eyebrow">{t('roadmap.title')}</span>
        {next ? (
          <span className="rm-teaser-text">
            {tx('roadmap.teaser.next', {
              track: info.track.title,
              course: (
                <strong>
                  <CourseIcon icon={next.course.icon} color={next.course.color} size={18} /> {next.course.title}
                </strong>
              ),
            })}
          </span>
        ) : (
          <span className="rm-teaser-text">{tx('roadmap.teaser.finished', { track: <strong>{info.track.title}</strong> })}</span>
        )}
        <ProgressBar value={info.fraction} thin label={t('roadmap.trackComplete', { track: info.track.title, pct: formatPercent(info.fraction) })} />
      </span>
      <span className="rm-teaser-cta">{t('roadmap.teaser.cta')}</span>
    </a>
  );
}
