// Translated course files: which fields are human language (translated) and which are locked (identical to
// the English file), the structural validator, and the overlay that swaps a course's text in place.
// Pure, no runtime imports: scripts/check-content.ts, node:test and the app all use it.
//
// A translation lives at src/content/topics/<locale>/<course-id>.json and mirrors the English file exactly:
// the same keys, the same order of units, lessons, steps, concepts and links, the same ids, code, outputs and
// answers. Only the fields marked T, TS or FREE below may differ. See docs/TRANSLATING.md.

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * L    locked: must deep-equal the English value (ids, code, outputs, answers, numbers, config).
 * T    text: a translated string. Inline `code`, ``` code blocks, list items and paragraphs must match English.
 * TS   a list of translated strings with the same length as English (choices, items, steps, keyIdeas...).
 * FREE a list of translated strings whose length may differ (accepted answers, aliases): at least one entry.
 */
type Rule = 'L' | 'T' | 'TS' | 'FREE' | Shape | ArrayOf | Special;
interface Shape {
  kind: 'shape';
  fields: Record<string, Rule>;
}
interface ArrayOf {
  kind: 'array';
  of: Rule;
}
interface Special {
  kind: 'special';
  check: (en: any, tr: any, where: string, errs: string[]) => void;
}

const shape = (fields: Record<string, Rule>): Shape => ({ kind: 'shape', fields });
const arr = (of: Rule): ArrayOf => ({ kind: 'array', of });

const QUESTION: Record<string, Rule> = { type: 'L', id: 'L', concepts: 'L', prompt: 'T', explanation: 'T', hint: 'T' };

/** Per step type: every field the step may have. Fields not listed here are treated as locked. */
export const STEP_FIELDS: Record<string, Record<string, Rule>> = {
  explain: { type: 'L', title: 'T', body: 'T' },
  example: { type: 'L', title: 'T', problem: 'T', steps: 'TS', answer: 'T' },
  mcq: { ...QUESTION, choices: 'TS', answer: 'L' },
  numeric: { ...QUESTION, answer: 'L', tolerance: 'L', unit: 'T' },
  // Accepted answers are language-dependent: translate them and add the spellings a learner would type.
  text: { ...QUESTION, accept: 'FREE' },
  output: { ...QUESTION, code: 'L', language: 'L', output: 'L' },
  bug: { ...QUESTION, code: 'L', language: 'L', error: 'L', lines: 'L', fixes: 'TS', answer: 'L' },
  order: { ...QUESTION, items: 'TS' },
  buckets: { ...QUESTION, buckets: 'TS', items: arr(shape({ text: 'T', bucket: 'L' })) },
  trace: { ...QUESTION, code: 'L', language: 'L', frames: arr(shape({ line: 'L', vars: 'L', out: 'L', ask: 'L', note: 'T' })) },
  truthtable: { ...QUESTION, vars: 'L', columns: arr(shape({ expr: 'L', given: 'L', label: 'T' })) },
  logicgrid: {
    ...QUESTION,
    categories: arr(shape({ name: 'T', items: 'TS' })),
    clues: 'TS',
    solution: { kind: 'special', check: checkGridSolution },
  },
  balance: { ...QUESTION, left: 'L', right: 'L', variable: 'L' },
  sim: {
    type: 'L',
    sim: 'L',
    title: 'T',
    body: 'T',
    // git
    setup: 'L',
    goal: shape({ text: 'T', head: 'L', branches: 'L', merged: 'L', minCommits: 'L' }),
    // dice, growth, join: configuration and table data stay as they are.
    dice: 'L',
    sides: 'L',
    target: 'L',
    goalRolls: 'L',
    curves: 'L',
    maxN: 'L',
    left: 'L',
    right: 'L',
    on: 'L',
    joins: 'L',
  },
};

const STEP: Special = {
  kind: 'special',
  check: (en, tr, where, errs) => {
    const fields = STEP_FIELDS[en?.type];
    if (!fields) {
      if (!deepEqual(en, tr)) errs.push(`${where}: unknown step type "${en?.type}" must stay identical`);
      return;
    }
    if (tr?.type !== en.type) {
      errs.push(`${where}: step type must be "${en.type}" (found "${tr?.type}")`);
      return;
    }
    checkShape(shape(fields), en, tr, where, errs);
  },
};

const LESSON = shape({ id: 'L', title: 'T', pareto: 'L', minutes: 'L', takeaway: 'T', steps: arr(STEP) });

/** The whole course file. */
export const COURSE_FIELDS = shape({
  id: 'L',
  title: 'T',
  icon: 'L',
  color: 'L',
  order: 'L',
  // Category and level are shown through the UI catalogs (category.*, level.*), so they stay English here.
  category: 'L',
  level: 'L',
  description: 'T',
  keyIdeas: 'TS',
  concepts: arr(shape({ id: 'L', label: 'T', lesson: 'L', summary: 'T', aliases: 'FREE' })),
  links: arr(shape({ from: 'L', to: 'L', label: 'T' })),
  units: arr(shape({ id: 'L', title: 'T', description: 'T', lessons: arr(LESSON) })),
  lessons: arr(LESSON),
});

/** src/content/roadmap.<locale>.json mirrors roadmap.json the same way. */
export const ROADMAP_FIELDS = shape({
  tracks: arr(
    shape({
      id: 'L',
      title: 'T',
      icon: 'L',
      description: 'T',
      nodes: arr(shape({ course: 'L', after: 'L', note: 'T' })),
    }),
  ),
});

// ---------- validation ----------

/** Checks that `tr` is a faithful translation of `en`: same structure and locked fields, translated text only. */
export function validateTranslation(en: unknown, tr: unknown, where: string, fields: Shape = COURSE_FIELDS): string[] {
  const errs: string[] = [];
  checkShape(fields, en, tr, where, errs);
  return errs;
}

function check(rule: Rule, en: any, tr: any, where: string, errs: string[]) {
  if (rule === 'L') {
    if (!deepEqual(en, tr)) errs.push(`${where}: must stay identical to English (${short(en)}), found ${short(tr)}`);
    return;
  }
  if (rule === 'T') {
    checkText(en, tr, where, errs);
    return;
  }
  if (rule === 'TS' || rule === 'FREE') {
    if (!Array.isArray(tr) || !tr.length) {
      errs.push(`${where}: must be a non-empty list of strings`);
      return;
    }
    if (rule === 'TS' && Array.isArray(en) && tr.length !== en.length) {
      errs.push(`${where}: must have ${en.length} entries like English (found ${tr.length})`);
      return;
    }
    if (rule === 'TS') tr.forEach((s, i) => checkText(en?.[i], s, `${where}[${i}]`, errs));
    else tr.forEach((s, i) => {
      if (typeof s !== 'string' || !s.trim()) errs.push(`${where}[${i}]: must be a non-empty string`);
    });
    return;
  }
  if (rule.kind === 'special') {
    rule.check(en, tr, where, errs);
    return;
  }
  if (rule.kind === 'array') {
    if (!Array.isArray(en) || !Array.isArray(tr)) {
      if (!deepEqual(en, tr)) errs.push(`${where}: must be a list like English`);
      return;
    }
    if (en.length !== tr.length) {
      errs.push(`${where}: must have ${en.length} entries in the same order as English (found ${tr.length})`);
      return;
    }
    en.forEach((e, i) => check(rule.of, e, tr[i], `${where}[${i}]`, errs));
    return;
  }
  checkShape(rule, en, tr, where, errs);
}

function checkShape(rule: Shape, en: any, tr: any, where: string, errs: string[]) {
  if (!isObject(en) || !isObject(tr)) {
    if (!deepEqual(en, tr)) errs.push(`${where}: must be an object like English`);
    return;
  }
  const enKeys = Object.keys(en);
  const trKeys = Object.keys(tr);
  for (const k of trKeys) if (!(k in en)) errs.push(`${where}: unexpected field "${k}" (English has no "${k}" here)`);
  for (const k of enKeys) {
    if (!(k in tr)) {
      errs.push(`${where}: missing field "${k}"`);
      continue;
    }
    check(rule.fields[k] ?? 'L', en[k], tr[k], where ? `${where}.${k}` : k, errs);
  }
}

const INLINE_CODE = /`[^`\n]+`/g;
const FENCE = /```[\s\S]*?```/g;

/** The pieces of a text that are never translated: fenced code blocks and inline `code`. */
export function codeOf(s: string): { blocks: string[]; inline: string[] } {
  const blocks = s.match(FENCE) ?? [];
  const rest = s.replace(FENCE, '');
  return { blocks, inline: (rest.match(INLINE_CODE) ?? []).sort() };
}

const blocksOf = (s: string) => s.replace(FENCE, 'CODE').split(/\n\s*\n/).filter((b) => b.trim()).length;
const listItemsOf = (s: string) => (s.replace(FENCE, '').match(/^\s*(?:[-*]|\d+\.)\s/gm) ?? []).length;
const boldOf = (s: string) => (s.replace(FENCE, '').replace(INLINE_CODE, '').match(/\*\*/g) ?? []).length;

function checkText(en: unknown, tr: unknown, where: string, errs: string[]) {
  if (typeof tr !== 'string' || !tr.trim()) {
    errs.push(`${where}: must be a non-empty string`);
    return;
  }
  if (typeof en !== 'string') return;
  const a = codeOf(en);
  const b = codeOf(tr);
  if (a.blocks.length !== b.blocks.length || a.blocks.some((x, i) => x !== b.blocks[i])) {
    errs.push(`${where}: code blocks (\`\`\`) must be copied unchanged from English`);
  }
  if (a.inline.join('\u0000') !== b.inline.join('\u0000')) {
    const missing = a.inline.filter((c) => !b.inline.includes(c));
    const extra = b.inline.filter((c) => !a.inline.includes(c));
    errs.push(
      `${where}: inline code must be copied unchanged from English` +
        (missing.length ? `; missing ${missing.join(' ')}` : '') +
        (extra.length ? `; not in English ${extra.join(' ')}` : '') +
        (!missing.length && !extra.length ? ' (same spans, different count)' : ''),
    );
  }
  if (blocksOf(en) !== blocksOf(tr)) errs.push(`${where}: keep the same paragraphs as English (${blocksOf(en)}, found ${blocksOf(tr)})`);
  if (listItemsOf(en) !== listItemsOf(tr)) errs.push(`${where}: keep the same list items as English (${listItemsOf(en)}, found ${listItemsOf(tr)})`);
  if (boldOf(en) % 2 === 0 && boldOf(tr) % 2 !== 0) errs.push(`${where}: unbalanced **bold** markers`);
}

/**
 * The logic-grid solution names items by their text. Here: the same rows and columns as English;
 * checkGridStep (run by validateCourseTranslation) checks it names the translated items at the English positions.
 */
function checkGridSolution(en: any, tr: any, where: string, errs: string[]) {
  if (!Array.isArray(en) || !Array.isArray(tr) || en.length !== tr.length || en.some((row, i) => !Array.isArray(tr[i]) || tr[i].length !== row.length)) {
    errs.push(`${where}: must have the same rows and columns as English`);
  }
}

/** Logic grids: translated solution entries must be the translated items at the English positions. */
export function checkGridStep(en: any, tr: any, where: string): string[] {
  const errs: string[] = [];
  const cats: any[] = en?.categories ?? [];
  const tcats: any[] = tr?.categories ?? [];
  (en?.solution ?? []).forEach((row: any[], r: number) =>
    row.forEach((item, k) => {
      const i = cats[k + 1]?.items?.indexOf(item);
      const want = tcats[k + 1]?.items?.[i];
      const got = tr?.solution?.[r]?.[k];
      if (i < 0 || want === undefined) return;
      if (got !== want) errs.push(`${where}.solution[${r}][${k}]: must be "${want}" (the translation of "${item}")`);
    }),
  );
  return errs;
}

/** Full check of one translated course: structure, plus the logic-grid solutions. */
export function validateCourseTranslation(en: any, tr: any, where: string): string[] {
  const errs = validateTranslation(en, tr, where, COURSE_FIELDS);
  const lessons = (x: any): any[] => (Array.isArray(x?.units) ? x.units.flatMap((u: any) => u?.lessons ?? []) : (x?.lessons ?? []));
  const tl = lessons(tr);
  lessons(en).forEach((l, li) =>
    (l?.steps ?? []).forEach((s: any, si: number) => {
      if (s?.type === 'logicgrid' && tl[li]?.steps?.[si]?.type === 'logicgrid') {
        errs.push(...checkGridStep(s, tl[li].steps[si], `${where}: lesson "${l.id}", step ${si + 1} (${s.id})`));
      }
    }),
  );
  return errs;
}

// ---------- coverage ----------

/** Counts translated text fields and how many are still identical to English (likely untranslated). */
export function textStats(en: unknown, tr: unknown, fields: Shape = COURSE_FIELDS): { total: number; same: number; samples: string[] } {
  const out = { total: 0, same: 0, samples: [] as string[] };
  const visit = (rule: Rule, a: any, b: any, where: string) => {
    if (rule === 'L' || a === undefined || b === undefined) return;
    if (rule === 'T') {
      if (typeof a !== 'string') return;
      out.total++;
      if (a === b && /[a-z]{3}/i.test(a.replace(INLINE_CODE, '').replace(FENCE, ''))) {
        out.same++;
        if (out.samples.length < 8) out.samples.push(`${where}: ${short(a)}`);
      }
      return;
    }
    // FREE lists (aliases, accepted answers) hold what learners type: commands, annotations and English
    // terms belong there on purpose, and entries don't line up by index, so they aren't counted.
    if (rule === 'FREE') return;
    if (rule === 'TS') {
      if (Array.isArray(a)) a.forEach((s, i) => visit('T', s, Array.isArray(b) ? b[i] : undefined, `${where}[${i}]`));
      return;
    }
    if (rule.kind === 'special') {
      if (rule === STEP && isObject(a) && STEP_FIELDS[a.type]) visit(shape(STEP_FIELDS[a.type]), a, b, where);
      return;
    }
    if (rule.kind === 'array') {
      if (Array.isArray(a)) a.forEach((x, i) => visit(rule.of, x, Array.isArray(b) ? b[i] : undefined, `${where}[${i}]`));
      return;
    }
    if (isObject(a)) for (const k of Object.keys(a)) visit(rule.fields[k] ?? 'L', a[k], b?.[k], where ? `${where}.${k}` : k);
  };
  visit(fields, en, tr, '');
  return out;
}

// ---------- overlay ----------

/**
 * Copies every field of `src` (a validated translation, or the pristine English file) onto `target` in place,
 * so objects the app already holds (courses, lessons, steps) show the new language without being replaced.
 * Arrays of objects are walked element by element; strings, numbers and arrays of strings are replaced.
 */
export function overlay(target: any, src: any) {
  for (const [k, v] of Object.entries(src)) {
    const cur = target[k];
    if (Array.isArray(v) && Array.isArray(cur) && v.length === cur.length && v.every(isObject) && cur.every(isObject)) {
      v.forEach((x, i) => overlay(cur[i], x));
    } else if (isObject(v) && isObject(cur)) {
      overlay(cur, v);
    } else {
      target[k] = Array.isArray(v) ? [...v] : isObject(v) ? structuredClone(v) : v;
    }
  }
}

// ---------- helpers ----------

const isObject = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === (b as unknown[]).length && a.every((x, i) => deepEqual(x, (b as unknown[])[i]));
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  return ka.length === kb.length && ka.every((k) => k in (b as object) && deepEqual((a as any)[k], (b as any)[k]));
}

function short(v: unknown) {
  const s = JSON.stringify(v) ?? 'nothing';
  return s.length > 60 ? `${s.slice(0, 57)}...` : s;
}
