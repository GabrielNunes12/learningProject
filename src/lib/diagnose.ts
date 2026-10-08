// The diagnostician: when the same mistakes keep coming back, find the cause they share. Concepts build on each other
// (the course's concept graph); a gap in a foundation shows up as mistakes in everything built on it, so fixing the
// foundation fixes them all. Pure (type-only imports) so node:test can load it.
import type { ConceptLink } from '../types.ts';

/** Link labels meaning "`from` builds on `to`": `to` is a prerequisite. Labels are matched in English (source) form. */
export const PREREQ_LABELS = ['builds on', 'needs', 'extends', 'is a special case of', 'uses'];
/** Link labels meaning "`from` is a prerequisite of `to`". */
export const PREREQ_REVERSED_LABELS = ['is used in'];

/** Links that compare two ideas rather than build one on the other. */
export const NOT_DEPENDENCY_LABELS = ['contrasts with', 'is the opposite of', 'is equivalent to'];

/**
 * Each concept's direct prerequisites, from a course's links (links to other courses are left out). Labels like
 * "builds on" say which way a dependency goes. Other links between concepts of different lessons use the course's
 * order when `lessonIndex` is given: courses build lesson by lesson, so the earlier lesson's concept is the foundation.
 */
export function prerequisites(links: ConceptLink[], lessonIndex?: (concept: string) => number | undefined): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (concept: string, prereq: string) => {
    if (concept === prereq || prereq.includes('/') || concept.includes('/')) return;
    const list = out.get(concept) ?? [];
    if (!list.includes(prereq)) out.set(concept, [...list, prereq]);
  };
  for (const l of links) {
    const label = l.label.trim().toLowerCase();
    if (PREREQ_LABELS.includes(label)) add(l.from, l.to);
    else if (PREREQ_REVERSED_LABELS.includes(label)) add(l.to, l.from);
    else if (lessonIndex && !NOT_DEPENDENCY_LABELS.includes(label)) {
      const a = lessonIndex(l.from);
      const b = lessonIndex(l.to);
      if (a !== undefined && b !== undefined && a !== b) {
        if (a > b) add(l.from, l.to);
        else add(l.to, l.from);
      }
    }
  }
  return out;
}

/** How far up the graph to look for a cause. */
export const MAX_DEPTH = 4;

export interface RootCause {
  /** The shaky foundation. */
  root: string;
  /** The weak concepts that build on it (directly or through other concepts). */
  explains: string[];
}

/**
 * Groups weak concepts by the deepest shaky prerequisite they build on. A weak concept with no shaky prerequisite is
 * its own cause and isn't reported. Most-explaining causes first.
 */
export function rootCauses(weak: string[], shaky: (concept: string) => boolean, prereqs: Map<string, string[]>): RootCause[] {
  const byRoot = new Map<string, string[]>();
  for (const w of weak) {
    let root: string | null = null;
    let rootDepth = 0;
    const seen = new Set([w]);
    let frontier = [w];
    for (let depth = 1; depth <= MAX_DEPTH && frontier.length; depth++) {
      const next: string[] = [];
      for (const c of frontier)
        for (const p of prereqs.get(c) ?? []) {
          if (seen.has(p)) continue;
          seen.add(p);
          next.push(p);
          if (shaky(p) && depth > rootDepth) {
            root = p;
            rootDepth = depth;
          }
        }
      frontier = next;
    }
    if (root) byRoot.set(root, [...(byRoot.get(root) ?? []), w]);
  }
  return [...byRoot.entries()].map(([root, explains]) => ({ root, explains })).sort((a, b) => b.explains.length - a.explains.length);
}
