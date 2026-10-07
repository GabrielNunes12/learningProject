import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { layoutPath, pathThrough, placePopover } from '../lib/pathLayout';
import { href } from '../lib/router';
import type { courseStats } from '../lib/stats';
import type { Course, LessonInfo } from '../types';
import { plural } from './ui';
import './CoursePath.css';

type Stats = ReturnType<typeof courseStats>;

/** Node diameters (px). Keep in sync with CoursePath.css. */
const SIZE = { core: 64, extra: 52, next: 80 };
/** Room for the "Start" bubble over the next node. */
const BUBBLE_SPACE = 30;
const POP_WIDTH = 272;
const POP_HEIGHT = 190;

interface Entry {
  lesson: LessonInfo;
  /** Global index in the displayed order. */
  index: number;
  done: boolean;
  next: boolean;
}

const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/**
 * The winding, game-style course map. `fast` shows core lessons only.
 * `canAutoScroll()` is asked once when the map mounts (or the course changes): true means this is the page load,
 * so the "next" node may be scrolled into view.
 */
export function CoursePath({
  course,
  stats: s,
  fast,
  canAutoScroll,
}: {
  course: Course;
  stats: Stats;
  fast: boolean;
  canAutoScroll?: () => boolean;
}) {
  const uid = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const bannerRefs = useRef<(HTMLElement | null)[]>([]);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const popRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; banners: number[] }>({ width: 0, banners: [] });
  const [openId, setOpenId] = useState<string | null>(null);

  // Lessons per unit as displayed, with one running index across units.
  const units = useMemo(() => {
    let index = 0;
    return course.units.map((u, ui) => {
      const lessons = fast ? u.lessons.filter((l) => l.pareto === 'core') : u.lessons;
      const entries: Entry[] = lessons.map((lesson) => ({ lesson, index: index++, done: s.done(lesson), next: s.next?.id === lesson.id }));
      return { unit: u, ui, entries, doneCount: u.lessons.filter(s.done).length };
    });
  }, [course, fast, s]);
  const entries = useMemo(() => units.flatMap((u) => u.entries), [units]);
  const groups = units.map((u) => u.entries.length);
  const nextIndex = entries.findIndex((e) => e.next);

  const groupsKey = groups.join(',');
  const compute = useCallback(
    (width: number, banners: number[]) => {
      const spaceAbove: number[] = [];
      if (nextIndex >= 0) spaceAbove[nextIndex] = BUBBLE_SPACE;
      return layoutPath({ width, groups: groupsKey ? groupsKey.split(',').map(Number) : [], bannerHeights: banners, spaceAbove });
    },
    [groupsKey, nextIndex],
  );
  const layout = compute(size.width, size.banners);

  // Measure the container width and banner heights; re-measure on resize.
  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return null;
    const width = el.clientWidth;
    const banners = course.units.map((_, i) => bannerRefs.current[i]?.offsetHeight ?? 0);
    setSize((prev) =>
      prev.width === width && prev.banners.length === banners.length && prev.banners.every((h, i) => h === banners[i]) ? prev : { width, banners },
    );
    return { width, banners };
  }, [course.units]);

  useLayoutEffect(() => {
    measure();
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    for (const b of bannerRefs.current) if (b) ro.observe(b);
    return () => ro.disconnect();
  }, [measure, groupsKey]);

  // On page load, bring the "next" node into view if it's below the fold. Once per course, not on every render.
  useLayoutEffect(() => {
    if (!canAutoScroll?.()) return;
    const m = measure();
    const el = wrapRef.current;
    if (!m || !el || nextIndex < 0) return;
    const node = compute(m.width, m.banners).nodes[nextIndex];
    if (!node) return;
    const top = el.getBoundingClientRect().top + node.y;
    const fold = window.innerHeight - 90; // leave room for the mobile tab bar
    if (top + SIZE.next / 2 <= fold) return;
    const target = window.scrollY + top - window.innerHeight / 2;
    // Defer a frame so the page has painted at its full height first.
    requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, target), behavior: reducedMotion() ? 'auto' : 'smooth' }));
  }, [course.id]); // only on mount / course change, never on re-render

  // Popover: Esc and click-outside close it; opening moves focus to its main link.
  const open = openId ? entries.find((e) => e.lesson.id === openId) : undefined;
  const activeId = open ? open.lesson.id : null; // a lesson hidden by the fast track can't stay open
  useEffect(() => {
    if (!activeId) return;
    popRef.current?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    popRef.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpenId(null);
      nodeRefs.current.get(activeId)?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || nodeRefs.current.get(activeId)?.contains(t)) return;
      setOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [activeId]);

  const lastDone = entries.reduce((last, e, i) => (e.done ? i : last), -1);
  const donePath = lastDone > 0 ? pathThrough(layout.nodes.slice(0, lastDone + 1)) : '';

  const node = (e: Entry) => {
    const pos = layout.nodes[e.index];
    const { lesson, done, next } = e;
    const n = e.index + 1;
    const extra = lesson.pareto === 'extra';
    const d = next ? SIZE.next : extra ? SIZE.extra : SIZE.core;
    const isOpen = activeId === lesson.id;
    const popId = `${uid}-pop-${e.index}`;
    const label = `Lesson ${n}: ${lesson.title}${extra ? ', deep dive' : ''}${done ? ', completed' : next ? ', up next' : ''}`;
    const pop =
      isOpen && pos
        ? placePopover({
            nodeX: pos.x,
            nodeY: pos.y,
            nodeRadius: d / 2,
            containerWidth: layout.width,
            containerHeight: layout.height,
            popWidth: POP_WIDTH,
            popHeight: POP_HEIGHT,
          })
        : null;
    return (
      <li key={lesson.id}>
        <div
          className={`cpath-node${done ? ' done' : ''}${next ? ' next' : ''}${extra ? ' extra' : ''}`}
          style={pos ? { left: pos.x, top: pos.y } : undefined}
        >
          {next && (
            <span className="cpath-bubble" aria-hidden>
              {s.started ? 'Continue' : 'Start'}
            </span>
          )}
          <button
            type="button"
            className="cpath-btn"
            style={{ width: d, height: d }}
            aria-label={label}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={isOpen ? popId : undefined}
            ref={(b) => {
              if (b) nodeRefs.current.set(lesson.id, b);
              else nodeRefs.current.delete(lesson.id);
            }}
            onClick={() => setOpenId(isOpen ? null : lesson.id)}
          >
            <span aria-hidden>{done ? '✓' : n}</span>
          </button>
          {extra && (
            <span className="cpath-label" aria-hidden>
              Deep dive
            </span>
          )}
        </div>
        {pop && (
          <div
            ref={popRef}
            id={popId}
            className={`cpath-pop${pop.above ? ' above' : ''}`}
            role="dialog"
            aria-label={`Lesson ${n}: ${lesson.title}`}
            style={{ left: pop.left, top: pop.top, width: pop.width, '--arrow-x': `${pop.arrowX}px` } as CSSProperties}
          >
            <div className="cpath-pop-tags">
              <span className={`tag ${lesson.pareto}`}>{extra ? 'Deep dive' : 'Core'}</span>
              {done && <span className="cpath-pop-done">✓ Completed</span>}
            </div>
            <h3>{lesson.title}</h3>
            <p className="small muted">
              {lesson.minutes ?? 5} min · {plural(lesson.stepCount, 'step')}
            </p>
            <a className="btn primary full" href={href('course', course.id, 'lesson', lesson.id)}>
              {done ? 'Review' : next && s.started ? 'Continue' : 'Start'}
            </a>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="cpath" ref={wrapRef} style={{ height: layout.height }}>
      <svg className="cpath-svg" width={layout.width} height={layout.height} aria-hidden focusable="false">
        <path className="cpath-track" d={layout.path} />
        {donePath && <path className="cpath-done" d={donePath} />}
      </svg>
      {units.map(({ unit, ui, entries: es, doneCount }) => {
        if (!es.length) return null;
        const banner = layout.banners.find((b) => b.group === ui);
        const headId = `${uid}-unit-${ui}`;
        return (
          <section key={unit.id} className="cpath-unit" aria-labelledby={headId}>
            <header
              className="cpath-banner"
              ref={(b) => {
                bannerRefs.current[ui] = b;
              }}
              style={{ top: banner?.y ?? 0 }}
            >
              <div className="cpath-banner-top">
                <span className="cpath-unit-num">Unit {ui + 1}</span>
                <span className={`cpath-count${doneCount === unit.lessons.length ? ' all' : ''}`}>
                  {doneCount === unit.lessons.length ? '✓ ' : ''}
                  {doneCount}/{unit.lessons.length}
                  <span className="sr-only"> lessons done</span>
                </span>
              </div>
              <h3 id={headId}>{unit.title}</h3>
              {unit.description && <p>{unit.description}</p>}
            </header>
            <ol className="cpath-list">{es.map(node)}</ol>
          </section>
        );
      })}
    </div>
  );
}
