// Pure layout math and status rules for the roadmap skill map. No runtime imports: tested in tests/roadmapLayout.test.ts.

export interface LayoutInput {
  id: string;
  /** Ids of earlier nodes that come first. Unknown ids are ignored. */
  after?: string[];
}

export type Direction = 'horizontal' | 'vertical';

export interface LayoutOptions {
  /** horizontal: levels flow left→right. vertical: top→bottom. */
  direction: Direction;
  nodeWidth: number;
  nodeHeight: number;
  /** Space between consecutive levels (along the flow). */
  levelGap: number;
  /** Space between nodes in the same level. */
  siblingGap: number;
  /** Margin around the whole map. */
  padding: number;
}

export interface PositionedNode {
  id: string;
  level: number;
  /** Position inside its level (0-based, after crossing-reducing ordering). */
  index: number;
  /** Top-left corner. */
  x: number;
  y: number;
}

export interface LayoutEdge {
  from: string;
  to: string;
  /** SVG path (one cubic Bézier) from the edge of `from` to the edge of `to`. */
  path: string;
}

export interface RoadmapLayout {
  /** Sorted in reading order: by level, then index. Use this order for tab order. */
  nodes: PositionedNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  levelCount: number;
}

/** level = 0 without prerequisites, else 1 + the highest level among its `after` nodes. */
export function computeLevels(nodes: LayoutInput[]): Map<string, number> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const levels = new Map<string, number>();
  const visiting = new Set<string>();
  const levelOf = (id: string): number => {
    const known = levels.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return 0; // cycle guard: content validation forbids cycles, but never loop forever
    visiting.add(id);
    const parents = (byId.get(id)?.after ?? []).filter((a) => byId.has(a) && a !== id);
    const lvl = parents.length ? 1 + Math.max(...parents.map(levelOf)) : 0;
    visiting.delete(id);
    levels.set(id, lvl);
    return lvl;
  };
  nodes.forEach((n) => levelOf(n.id));
  return levels;
}

/** Group node ids per level; inside a level, order by the mean position of their parents (fewer crossings), then input order. */
export function orderLevels(nodes: LayoutInput[], levels: Map<string, number>): string[][] {
  const count = nodes.length ? Math.max(...nodes.map((n) => levels.get(n.id) ?? 0)) + 1 : 0;
  const rows: string[][] = Array.from({ length: count }, () => []);
  nodes.forEach((n) => rows[levels.get(n.id) ?? 0].push(n.id));
  const inputIndex = new Map(nodes.map((n, i) => [n.id, i]));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const pos = new Map<string, number>();
  rows.forEach((row, li) => {
    if (li > 0) {
      const key = (id: string) => {
        const ps = (byId.get(id)?.after ?? []).filter((a) => pos.has(a));
        return ps.length ? ps.reduce((s, a) => s + pos.get(a)!, 0) / ps.length : Number.POSITIVE_INFINITY;
      };
      const keys = new Map(row.map((id) => [id, key(id)]));
      row.sort((a, b) => keys.get(a)! - keys.get(b)! || inputIndex.get(a)! - inputIndex.get(b)!);
    }
    // Normalise to a 0..1 band so levels of different sizes compare fairly.
    row.forEach((id, i) => pos.set(id, row.length === 1 ? 0.5 : i / (row.length - 1)));
  });
  return rows;
}

const r = (n: number) => Math.round(n * 10) / 10;

/** Smooth cubic curve between two anchor points; the control points pull along the flow direction. */
export function edgePath(x1: number, y1: number, x2: number, y2: number, direction: Direction): string {
  if (direction === 'horizontal') {
    const dx = (x2 - x1) / 2;
    return `M ${r(x1)} ${r(y1)} C ${r(x1 + dx)} ${r(y1)}, ${r(x2 - dx)} ${r(y2)}, ${r(x2)} ${r(y2)}`;
  }
  const dy = (y2 - y1) / 2;
  return `M ${r(x1)} ${r(y1)} C ${r(x1)} ${r(y1 + dy)}, ${r(x2)} ${r(y2 - dy)}, ${r(x2)} ${r(y2)}`;
}

export function layoutRoadmap(nodes: LayoutInput[], o: LayoutOptions): RoadmapLayout {
  const levels = computeLevels(nodes);
  const rows = orderLevels(nodes, levels);
  const horizontal = o.direction === 'horizontal';
  // "main" = along the flow (levels), "cross" = across it (siblings).
  const mainSize = horizontal ? o.nodeWidth : o.nodeHeight;
  const crossSize = horizontal ? o.nodeHeight : o.nodeWidth;
  const maxCount = Math.max(0, ...rows.map((row) => row.length));
  const crossExtent = maxCount ? maxCount * crossSize + (maxCount - 1) * o.siblingGap : 0;
  const mainExtent = rows.length ? rows.length * mainSize + (rows.length - 1) * o.levelGap : 0;

  const placed = new Map<string, PositionedNode>();
  const out: PositionedNode[] = [];
  rows.forEach((row, level) => {
    const rowExtent = row.length * crossSize + (row.length - 1) * o.siblingGap;
    const offset = (crossExtent - rowExtent) / 2; // centre shorter levels
    row.forEach((id, index) => {
      const main = o.padding + level * (mainSize + o.levelGap);
      const cross = o.padding + offset + index * (crossSize + o.siblingGap);
      const node = { id, level, index, x: horizontal ? main : cross, y: horizontal ? cross : main };
      placed.set(id, node);
      out.push(node);
    });
  });

  const edges: LayoutEdge[] = [];
  for (const n of nodes) {
    const to = placed.get(n.id)!;
    for (const a of n.after ?? []) {
      const from = placed.get(a);
      if (!from || a === n.id) continue;
      const path = horizontal
        ? edgePath(from.x + o.nodeWidth, from.y + o.nodeHeight / 2, to.x, to.y + o.nodeHeight / 2, 'horizontal')
        : edgePath(from.x + o.nodeWidth / 2, from.y + o.nodeHeight, to.x + o.nodeWidth / 2, to.y, 'vertical');
      edges.push({ from: a, to: n.id, path });
    }
  }

  const w = (horizontal ? mainExtent : crossExtent) + 2 * o.padding;
  const h = (horizontal ? crossExtent : mainExtent) + 2 * o.padding;
  return { nodes: out, edges, width: w, height: h, levelCount: rows.length };
}

/** Number of levels and the largest level size, without positions. */
export function shapeOf(nodes: LayoutInput[]): { levels: number; widest: number } {
  const rows = orderLevels(nodes, computeLevels(nodes));
  return { levels: rows.length, widest: Math.max(0, ...rows.map((row) => row.length)) };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Pick direction and node size for a container width. Levels flow left→right when the container is at least
 * `breakpoint` wide and every level fits at a readable node width; otherwise top→bottom with nodes sized to fit
 * the widest level (never narrower than a minimum — the map then scrolls sideways).
 */
export function chooseLayoutOptions(nodes: LayoutInput[], containerWidth: number, breakpoint = 720): LayoutOptions {
  const { levels, widest } = shapeOf(nodes);
  const padding = 8;
  const hGap = 56;
  const hFit = Math.floor((containerWidth - 2 * padding - Math.max(0, levels - 1) * hGap) / Math.max(1, levels));
  if (containerWidth >= breakpoint && hFit >= 172) {
    return { direction: 'horizontal', nodeWidth: clamp(hFit, 172, 236), nodeHeight: 92, levelGap: hGap, siblingGap: 22, padding };
  }
  const vGap = 10;
  const vFit = Math.floor((containerWidth - 2 * padding - Math.max(0, widest - 1) * vGap) / Math.max(1, widest));
  const nodeWidth = clamp(vFit, 96, 210);
  return { direction: 'vertical', nodeWidth, nodeHeight: nodeWidth < 150 ? 142 : 124, levelGap: 40, siblingGap: vGap, padding };
}

// ---------- status ----------

export type NodeStatus = 'done' | 'in-progress' | 'up-next' | 'later';

export interface CourseProgressInfo {
  /** All core lessons done (the course counts as finished for the track). */
  done: boolean;
  started: boolean;
}

/**
 * Done: core finished. In progress: started, not done. Up next: not started and every prerequisite is done
 * (or there are none). Later: not started and a prerequisite is unfinished. Nothing is ever locked.
 */
export function nodeStatuses(nodes: LayoutInput[], info: Record<string, CourseProgressInfo | undefined>): Map<string, NodeStatus> {
  const out = new Map<string, NodeStatus>();
  for (const n of nodes) {
    const me = info[n.id];
    if (me?.done) out.set(n.id, 'done');
    else if (me?.started) out.set(n.id, 'in-progress');
    else if ((n.after ?? []).every((a) => info[a]?.done)) out.set(n.id, 'up-next');
    else out.set(n.id, 'later');
  }
  return out;
}

/** The node to suggest next: the first in-progress one in reading order, else the first up-next one, else none (all done). */
export function suggestNext(order: string[], statuses: Map<string, NodeStatus>): string | undefined {
  return order.find((id) => statuses.get(id) === 'in-progress') ?? order.find((id) => statuses.get(id) === 'up-next');
}
