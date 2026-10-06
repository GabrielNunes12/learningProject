// Layout math for the winding course map (CoursePath). Pure: no DOM, no runtime imports.
//
// Nodes sit on a gentle S-curve: fixed vertical spacing, x = centre + amplitude * sin(i * 2π / period).
// Each group (unit) starts with a banner that takes vertical space; the path keeps winding underneath it.

export interface PathLayoutInput {
  /** Container width in px. */
  width: number;
  /** Number of nodes in each group (unit), in order. Empty groups get no banner. */
  groups: number[];
  /** Measured height of each group's banner. Missing entries use `defaultBanner`. */
  bannerHeights?: number[];
  /** Extra space above a node (by global node index), e.g. for a bubble over the "next" node. */
  spaceAbove?: number[];
  /** Vertical distance between node centres within a group. */
  gap?: number;
  /** Distance from a banner's bottom edge to the first node's centre. */
  afterBanner?: number;
  /** Distance from a group's last node centre to the next banner's top edge. */
  afterGroup?: number;
  /** Fallback banner height before banners are measured. */
  defaultBanner?: number;
  /** Horizontal room a node needs including rings and labels (centre ± half of this stays inside). */
  nodeSpan?: number;
  /** Largest sideways swing of the curve. */
  maxAmplitude?: number;
  /** Nodes per full left-right-left wave. */
  period?: number;
}

export interface PathNode {
  x: number;
  y: number;
  /** Group (unit) index. */
  group: number;
  /** Global node index across all groups. */
  index: number;
}

export interface PathBanner {
  group: number;
  y: number;
  height: number;
}

export interface PathLayout {
  width: number;
  height: number;
  amplitude: number;
  nodes: PathNode[];
  banners: PathBanner[];
  /** SVG path data through every node. */
  path: string;
}

export const PATH_DEFAULTS = {
  gap: 104,
  afterBanner: 64,
  afterGroup: 72,
  defaultBanner: 110,
  nodeSpan: 112,
  maxAmplitude: 110,
  period: 8,
};

const round = (n: number) => Math.round(n * 10) / 10;

/** Sideways swing that keeps every node (± nodeSpan/2) inside the container; shrinks on narrow screens. */
export function amplitudeFor(width: number, nodeSpan = PATH_DEFAULTS.nodeSpan, maxAmplitude = PATH_DEFAULTS.maxAmplitude): number {
  const room = (width - nodeSpan) / 2;
  return Math.max(0, Math.min(maxAmplitude, width * 0.22, room));
}

/** A smooth path through the points: cubic curves with vertical tangents at each point. */
export function pathThrough(points: { x: number; y: number }[]): string {
  if (!points.length) return '';
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mid = (b.y - a.y) / 2;
    d += ` C ${round(a.x)} ${round(a.y + mid)}, ${round(b.x)} ${round(b.y - mid)}, ${round(b.x)} ${round(b.y)}`;
  }
  return d;
}

export function layoutPath(input: PathLayoutInput): PathLayout {
  const o = { ...PATH_DEFAULTS, ...input };
  const width = Math.max(0, input.width);
  const amplitude = amplitudeFor(width, o.nodeSpan, o.maxAmplitude);
  const cx = width / 2;
  const nodes: PathNode[] = [];
  const banners: PathBanner[] = [];
  let y = 0;
  let index = 0;
  input.groups.forEach((count, group) => {
    if (count <= 0) return;
    const height = input.bannerHeights?.[group] ?? o.defaultBanner;
    banners.push({ group, y, height });
    y += height + o.afterBanner;
    for (let k = 0; k < count; k++) {
      if (k > 0) y += o.gap;
      y += input.spaceAbove?.[index] ?? 0;
      const x = cx + amplitude * Math.sin((index * 2 * Math.PI) / o.period);
      nodes.push({ x: round(x), y: round(y), group, index });
      index++;
    }
    y += o.afterGroup;
  });
  return { width, height: round(y), amplitude: round(amplitude), nodes, banners, path: pathThrough(nodes) };
}

/**
 * Where to put a popover card anchored to a node, in container coordinates.
 * Horizontally centred on the node but clamped inside the container; below the node unless it would run past the
 * bottom (and there is room above). `arrowX` is the node's x relative to the card's left edge.
 */
export function placePopover(opts: {
  nodeX: number;
  nodeY: number;
  nodeRadius: number;
  containerWidth: number;
  containerHeight: number;
  popWidth: number;
  popHeight: number;
  margin?: number;
  offset?: number;
}): { left: number; top: number; width: number; above: boolean; arrowX: number } {
  const margin = opts.margin ?? 8;
  const offset = opts.offset ?? 12;
  const width = Math.max(0, Math.min(opts.popWidth, opts.containerWidth - 2 * margin));
  const maxLeft = Math.max(margin, opts.containerWidth - margin - width);
  const left = Math.min(maxLeft, Math.max(margin, opts.nodeX - width / 2));
  const belowTop = opts.nodeY + opts.nodeRadius + offset;
  const aboveTop = opts.nodeY - opts.nodeRadius - offset - opts.popHeight;
  const above = belowTop + opts.popHeight > opts.containerHeight && aboveTop >= 0;
  const arrowX = Math.min(width - 16, Math.max(16, opts.nodeX - left));
  return { left: round(left), top: round(above ? aboveTop : belowTop), width: round(width), above, arrowX: round(arrowX) };
}
