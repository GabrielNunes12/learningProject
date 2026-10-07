// Thinking on paper: the three-phase ritual that opens and closes every study session.
//   Make it wrong   (start of a lesson)  dump keywords about the topic, sort them into piles, sketch. Nothing is graded.
//   Make it shorter (end of any session) squeeze it into 2–3 anchors of at most 4 words.
//   Make it again   (start of a session) rebuild an earlier sheet from a blank page, then compare and fix it.
// Pure: no DOM, only type imports plus the matching helpers from knowledgeMap.ts.
import type { Concept } from '../types.ts';
import { editDistance, matchConcept, normalize, stem, typoBudget } from './knowledgeMap.ts';
import type { Sheet, SheetAgain, SheetChip, SheetDraft, SheetStroke } from './storage.ts';

const DAY = 86_400_000;

// ---------- the sheet ----------

/** Sheet size in its own units; the component scales it to the screen. */
export const SHEET_W = 1000;
export const SHEET_H = 620;
/** The strip at the top where new keywords land before they are sorted. */
export const TRAY_H = 170;
export const CHIP_W = 150;
export const CHIP_H = 40;

export const MAX_CHIPS = 24;
export const MAX_CHIP_CHARS = 32;
export const MAX_PILES = 3;
export const MAX_STROKES = 60;
/** Total pen points kept per sheet (after simplification), so synced progress stays small. */
export const MAX_POINTS = 4000;

// ---------- what each phase asks for ----------

export const WRONG_MIN_CHIPS = 3;
export const WRONG_MIN_PILES = 2;
export const ANCHOR_MAX_WORDS = 4;
export const ANCHORS_MIN = 2;
export const ANCHORS_MAX = 3;
export const AGAIN_MIN_RECALL = 2;
/**
 * Days until the next "make it again", by how many redos a sheet already has. The first one is due
 * straight away (the start of the next session); later ones spread out like spaced review.
 */
export const AGAIN_DAYS = [0, 1, 3, 7, 16, 35];

export const emptyDraft = (piles = ['', '']): SheetDraft => ({ chips: [], strokes: [], piles, at: 0 });

export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
export const wordCount = (s: string) => words(s).length;

/** Keeps at most `max` words while typing (a trailing space survives so the next word can start). */
export function limitWords(s: string, max = ANCHOR_MAX_WORDS): string {
  const parts = s.replace(/^\s+/, '').split(/(\s+)/);
  let count = 0;
  let out = '';
  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      if (count >= max) break;
      out += ' ';
    } else if (part) {
      if (count >= max) break;
      count++;
      out += part;
    }
  }
  return out;
}

/** Column rectangle of pile i out of n, below the tray. */
export function pileRect(i: number, n: number) {
  const w = SHEET_W / n;
  return { x: i * w, y: TRAY_H, w, h: SHEET_H - TRAY_H };
}

/** Which pile a point falls in (undefined in the tray). */
export function pileAt(x: number, y: number, n: number): number | undefined {
  if (y < TRAY_H || n < 1) return undefined;
  return Math.max(0, Math.min(n - 1, Math.floor(x / (SHEET_W / n))));
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * A chip's size in sheet units. On a phone the sheet is narrow, so chips keep a minimum size on screen and
 * take up more sheet units; layouts use the real size so they don't overlap.
 */
export interface ChipSize {
  w: number;
  h: number;
}
export const DEFAULT_CHIP: ChipSize = { w: CHIP_W, h: CHIP_H };

/** Keeps a chip's centre on the paper. */
export const clampChip = (x: number, y: number) => ({
  x: clamp(Math.round(x), CHIP_W / 2, SHEET_W - CHIP_W / 2),
  y: clamp(Math.round(y), CHIP_H / 2, SHEET_H - CHIP_H / 2),
});

/** A free spot in the tray for a new keyword (left to right, then a second row). */
export function traySpot(chips: SheetChip[], size: ChipSize = DEFAULT_CHIP): { x: number; y: number } {
  const perRow = Math.max(1, Math.floor(SHEET_W / (size.w + 10)));
  const rows = Math.max(1, Math.floor((TRAY_H - 10) / (size.h + 8)));
  const slot = (i: number) => ({ x: size.w / 2 + 10 + (i % perRow) * (size.w + 10), y: size.h / 2 + 8 + Math.floor(i / perRow) * (size.h + 8) });
  const tray = chips.filter((c) => c.pile === undefined);
  const taken = (p: { x: number; y: number }) => tray.some((c) => Math.abs(c.x - p.x) < size.w / 2 && Math.abs(c.y - p.y) < size.h / 2);
  // The first empty slot (one may have opened up when a keyword was dragged into a pile)...
  for (let i = 0; i < perRow * rows; i++) if (!taken(slot(i))) return clampChip(slot(i).x, slot(i).y);
  // ...or, with the tray full, stack it slightly offset like sticky notes so every keyword stays visible.
  const n = tray.length;
  const base = slot(n % (perRow * rows));
  const level = Math.floor(n / (perRow * rows));
  return clampChip(base.x + level * size.w * 0.22, base.y + level * size.h * 0.3);
}

/** The next spot in a pile's column, stacking downwards (and wrapping to a second column if it fills). */
export function pileSpot(chips: SheetChip[], pile: number, n: number, except?: string, size: ChipSize = DEFAULT_CHIP): { x: number; y: number } {
  const r = pileRect(pile, n);
  const count = chips.filter((c) => c.pile === pile && c.id !== except).length;
  const perCol = Math.max(1, Math.floor((r.h - 30) / (size.h + 10)));
  const cols = Math.max(1, Math.floor(r.w / (size.w + 8)));
  const col = Math.floor(count / perCol) % cols;
  const row = count % perCol;
  const left = r.x + (r.w - cols * (size.w + 8)) / 2 + size.w / 2 + 4;
  return clampChip(left + col * (size.w + 8), r.y + 24 + size.h / 2 + row * (size.h + 10));
}

let idCounter = 0;
export const newChipId = (now = Date.now()) => `k${now.toString(36)}${(idCounter++).toString(36)}`;

/** Adds a keyword to the tray. Returns the same draft when it is empty, a duplicate, or the sheet is full. */
export function addChip(draft: SheetDraft, text: string, id = newChipId(), size: ChipSize = DEFAULT_CHIP): SheetDraft {
  const t = text.trim().replace(/\s+/g, ' ').slice(0, MAX_CHIP_CHARS);
  if (!t || draft.chips.length >= MAX_CHIPS || draft.chips.some((c) => normalize(c.text) === normalize(t))) return draft;
  return { ...draft, chips: [...draft.chips, { id, text: t, ...traySpot(draft.chips, size) }] };
}

export const removeChip = (draft: SheetDraft, id: string): SheetDraft => ({ ...draft, chips: draft.chips.filter((c) => c.id !== id) });

/** Drops a chip at a point: it joins whichever pile (or the tray) that point is in. */
export function dropChip(draft: SheetDraft, id: string, x: number, y: number): SheetDraft {
  const p = clampChip(x, y);
  const pile = pileAt(p.x, p.y, draft.piles.length);
  return { ...draft, chips: draft.chips.map((c) => (c.id === id ? { ...c, ...p, pile } : c)) };
}

/** Moves a chip into a pile's next free spot (keyboard and tap alternative to dragging). */
export function sendToPile(draft: SheetDraft, id: string, pile: number | undefined, size: ChipSize = DEFAULT_CHIP): SheetDraft {
  const others = draft.chips.filter((c) => c.id !== id);
  const spot = pile === undefined ? traySpot(others, size) : pileSpot(draft.chips, pile, draft.piles.length, id, size);
  return { ...draft, chips: draft.chips.map((c) => (c.id === id ? { ...c, ...spot, pile } : c)) };
}

export function renamePile(draft: SheetDraft, i: number, name: string): SheetDraft {
  return { ...draft, piles: draft.piles.map((p, j) => (j === i ? name.slice(0, 24) : p)) };
}

export function addPile(draft: SheetDraft, size: ChipSize = DEFAULT_CHIP): SheetDraft {
  if (draft.piles.length >= MAX_PILES) return draft;
  const piles = [...draft.piles, ''];
  // Columns get narrower: re-seat every sorted chip in its pile.
  let next: SheetDraft = { ...draft, piles, chips: draft.chips.map((c) => (c.pile === undefined ? c : { ...c, pile: -1 - c.pile })) };
  for (const c of draft.chips.filter((c) => c.pile !== undefined)) next = sendToPile(next, c.id, c.pile, size);
  return next;
}

/** Deterministic small tilt per chip, so the sheet looks hand-made rather than gridded. */
export function tilt(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 7) - 3) * 0.8;
}

// ---------- ink ----------

/** Ramer–Douglas–Peucker simplification of a polyline given as [{x, y}]. */
export function simplify(points: { x: number; y: number }[], epsilon = 1.5): { x: number; y: number }[] {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points[points.length - 1]];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let worst = 0;
  let at = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = Math.abs(dy * points[i].x - dx * points[i].y + b.x * a.y - b.y * a.x) / len;
    if (d > worst) [worst, at] = [d, i];
  }
  if (worst <= epsilon) return [a, b];
  return [...simplify(points.slice(0, at + 1), epsilon).slice(0, -1), ...simplify(points.slice(at), epsilon)];
}

export const pointCount = (strokes: SheetStroke[]) => strokes.reduce((s, x) => s + x.points.length / 2, 0);

/** Adds a pen stroke (simplified, rounded). Returns the same draft when it would exceed the ink budget. */
export function addStroke(draft: SheetDraft, raw: { x: number; y: number }[]): SheetDraft {
  if (raw.length < 2 || draft.strokes.length >= MAX_STROKES) return draft;
  const pts = simplify(raw).flatMap((p) => [Math.round(clamp(p.x, 0, SHEET_W)), Math.round(clamp(p.y, 0, SHEET_H))]);
  if (pointCount(draft.strokes) + pts.length / 2 > MAX_POINTS) return draft;
  return { ...draft, strokes: [...draft.strokes, { points: pts }] };
}

export const undoStroke = (draft: SheetDraft): SheetDraft => ({ ...draft, strokes: draft.strokes.slice(0, -1) });

/** SVG path for a stroke. */
export function strokePath(s: SheetStroke): string {
  const p = s.points;
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 2; i < p.length; i += 2) d += ` L${p[i]} ${p[i + 1]}`;
  return d;
}

// ---------- phase checks ----------

export interface Readiness {
  ok: boolean;
  /** What is still missing, as a short sentence (empty when ok). */
  missing: string;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Make it wrong: at least 3 keywords, sorted into at least 2 piles. */
export function wrongReady(d: SheetDraft): Readiness {
  const need = WRONG_MIN_CHIPS - d.chips.length;
  if (need > 0) return { ok: false, missing: `Add ${plural(need, 'more keyword')}. Guesses count.` };
  const used = new Set(d.chips.map((c) => c.pile).filter((p) => p !== undefined)).size;
  if (used < WRONG_MIN_PILES) return { ok: false, missing: `Sort them into ${WRONG_MIN_PILES} piles: drag keywords down into the columns.` };
  return { ok: true, missing: '' };
}

/** Make it shorter: 2–3 anchors, none longer than 4 words. */
export function anchorsReady(anchors: string[]): Readiness {
  const filled = anchors.map((a) => a.trim()).filter(Boolean);
  if (filled.some((a) => wordCount(a) > ANCHOR_MAX_WORDS)) return { ok: false, missing: `Each anchor is ${ANCHOR_MAX_WORDS} words or fewer.` };
  if (filled.length < ANCHORS_MIN) return { ok: false, missing: `Write ${plural(ANCHORS_MIN - filled.length, 'more anchor')}.` };
  return { ok: true, missing: '' };
}

/** Make it again, step 1: at least 2 keywords from a blank page before the old sheet is shown. */
export function recallReady(d: SheetDraft): Readiness {
  const need = AGAIN_MIN_RECALL - d.chips.length;
  return need > 0 ? { ok: false, missing: `Write ${plural(need, 'more keyword')} from memory first.` } : { ok: true, missing: '' };
}

// ---------- matching ----------

/** Same idea in other words: equal after normalising, every word of one in the other, or a small typo. */
export function sameIdea(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const wa = na.split(' ').map(stem);
  const wb = nb.split(' ').map(stem);
  const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  if (short.join('').length >= 3 && short.every((w) => long.includes(w))) return true;
  return editDistance(na, nb) <= typoBudget(Math.max(na.length, nb.length));
}

/** Which of the old items the learner brought back (each recalled keyword can cover one old item). */
export function remembered(recalled: string[], old: string[]): string[] {
  const left = [...recalled];
  const hits: string[] = [];
  for (const o of old) {
    const i = left.findIndex((r) => sameIdea(r, o));
    if (i >= 0) {
      hits.push(o);
      left.splice(i, 1);
    }
  }
  return hits;
}

export interface AnchorFeedback {
  /** Course concepts the anchors name, in anchor order. */
  hit: Concept[];
  /** This lesson's concepts no anchor names: worth a second look, not an error. */
  missed: Concept[];
}

/** Compares anchors with the course's concepts. Nothing is marked wrong: it shows what the anchors cover. */
export function anchorFeedback(anchors: string[], concepts: Concept[], lessonId?: string): AnchorFeedback {
  const hit: Concept[] = [];
  const prefer = (id: string) => concepts.some((c) => c.id === id && c.lesson === lessonId);
  for (const a of anchors) {
    for (const piece of [a, ...a.split(/\s*(?:,|;|\/|→|->|\+| and | vs )\s*/)]) {
      const m = piece.trim() ? matchConcept(piece, concepts, prefer) : null;
      const c = m && concepts.find((k) => k.id === m.id);
      // A single generic alias word inside a longer anchor ("constant" in "constants vanish too") is too weak to
      // claim the anchor names that concept; saying nothing beats naming the wrong idea.
      const weak = m?.kind === 'partial' && m.term !== c?.label && words(m.term).length === 1;
      if (c && !weak && !hit.some((h) => h.id === c.id)) hit.push(c);
    }
  }
  const missed = lessonId ? concepts.filter((c) => c.lesson === lessonId && !hit.some((h) => h.id === c.id)) : [];
  return { hit, missed };
}

// ---------- scheduling ----------

/** When the next redo is due after a sheet has `redos` of them. */
export const nextDue = (redos: number, now = Date.now()) => now + AGAIN_DAYS[Math.min(redos, AGAIN_DAYS.length - 1)] * DAY;

/**
 * The sheet to rebuild at the start of a session: a lesson sheet that is due, never the one being
 * studied right now. The freshest never-redone sheet comes first (it is "the previous session"),
 * then the most overdue.
 */
export function dueSheet(sheets: Record<string, Sheet>, now = Date.now(), exceptKey?: string): Sheet | undefined {
  const due = Object.values(sheets).filter((s) => s.key !== exceptKey && s.due !== undefined && s.due <= now && s.anchors?.length);
  const fresh = due.filter((s) => s.again.length === 0).sort((a, b) => b.createdAt - a.createdAt);
  if (fresh.length) return fresh[0];
  return due.sort((a, b) => (a.due ?? 0) - (b.due ?? 0))[0];
}

/** What the learner judges in "make it again": the anchors, then the keywords of the latest version of the sheet. */
export function againItems(sheet: Sheet): string[] {
  const draft = sheet.clean ?? sheet.wrong;
  const out: string[] = [];
  for (const t of [...(sheet.anchors ?? []), ...(draft?.chips.map((c) => c.text) ?? [])]) {
    if (!out.some((o) => normalize(o) === normalize(t))) out.push(t);
  }
  return out;
}

export type Verdict = 'keep' | 'fix' | 'drop';

/**
 * Finishes "make it again": the recalled draft becomes the clean sheet, kept and fixed old keywords are
 * added to its tray when they are not on it yet, anchors are updated, and the next redo is scheduled.
 */
export function finishAgain(
  sheet: Sheet,
  recalled: SheetDraft,
  verdicts: Record<string, { verdict: Verdict; text?: string }>,
  now = Date.now(),
): Sheet {
  const items = againItems(sheet);
  const recalledTexts = recalled.chips.map((c) => c.text);
  const hits = remembered(recalledTexts, items);
  let clean: SheetDraft = { ...recalled, at: now };
  let fixed = 0;
  const anchors: string[] = [];
  for (const item of items) {
    const v = verdicts[item] ?? { verdict: 'keep' };
    if (v.verdict === 'drop') continue;
    const text = v.verdict === 'fix' && v.text?.trim() ? v.text.trim() : item;
    if (v.verdict === 'fix' && text !== item) fixed++;
    if (sheet.anchors?.includes(item)) anchors.push(limitWords(text).trim());
    if (!clean.chips.some((c) => sameIdea(c.text, text))) {
      const before = clean.chips.length;
      clean = addChip(clean, text);
      if (clean.chips.length > before && text !== item) {
        clean = { ...clean, chips: clean.chips.map((c, i) => (i === clean.chips.length - 1 ? { ...c, fixedFrom: item } : c)) };
      }
    }
  }
  const again: SheetAgain = { at: now, recalled: recalledTexts, remembered: hits.length, total: items.length, fixed };
  const redos = sheet.again.length + 1;
  return {
    ...sheet,
    clean,
    anchors: anchors.length ? anchors.slice(0, ANCHORS_MAX) : sheet.anchors,
    again: [...sheet.again, again].slice(-12),
    due: nextDue(redos, now),
    updatedAt: now,
  };
}

// ---------- building sheets ----------

export const lessonSheetKey = (course: string, lesson: string) => `${course}/${lesson}`;
export const sessionSheetKey = (kind: 'review' | 'practice' | 'quiz', now = Date.now()) => `session/${kind}/${now}`;

/** A lesson sheet after "make it wrong" (anchors come at the end of the lesson). */
export function startLessonSheet(prev: Sheet | undefined, course: string, lesson: string, title: string, wrong: SheetDraft, now = Date.now()): Sheet {
  return {
    key: lessonSheetKey(course, lesson),
    course,
    lesson,
    title,
    again: prev?.again ?? [],
    createdAt: prev?.createdAt ?? now,
    ...prev,
    wrong: { ...wrong, at: now },
    updatedAt: now,
  };
}

/** Adds the anchors ("make it shorter") and schedules the first redo for the next session. */
export function finishShorter(sheet: Sheet, anchors: string[], now = Date.now()): Sheet {
  const clean = anchors.map((a) => limitWords(a).trim()).filter(Boolean).slice(0, ANCHORS_MAX);
  const lessonSheet = !sheet.key.startsWith('session/');
  return { ...sheet, anchors: clean, due: lessonSheet ? (sheet.again.length ? sheet.due : nextDue(0, now)) : undefined, updatedAt: now };
}

// ---------- habit stats ----------

export interface ThinkingStats {
  lessonSheets: number;
  sessionSheets: number;
  redos: number;
  /** Share of old keywords brought back from memory across all redos (null before the first redo). */
  recallRate: number | null;
  /** Thinking days in the last 7 (today included). */
  daysThisWeek: number;
  /** Redos waiting now. */
  dueNow: number;
}

export function thinkingStats(sheets: Record<string, Sheet>, thinkDays: string[], now = Date.now(), today = new Date(now)): ThinkingStats {
  const all = Object.values(sheets);
  const redos = all.flatMap((s) => s.again);
  const total = redos.reduce((n, r) => n + r.total, 0);
  const week = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    week.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return {
    lessonSheets: all.filter((s) => !s.key.startsWith('session/')).length,
    sessionSheets: all.filter((s) => s.key.startsWith('session/')).length,
    redos: redos.length,
    recallRate: total ? redos.reduce((n, r) => n + r.remembered, 0) / total : null,
    daysThisWeek: thinkDays.filter((d) => week.has(d)).length,
    dueNow: all.filter((s) => s.due !== undefined && s.due <= now && s.anchors?.length).length,
  };
}
