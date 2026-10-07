// Validates one course JSON file and returns human-readable problems.
// Its only runtime import uses an explicit .ts extension so scripts/check-content.ts can run it with plain Node.
import { parseLogic } from '../lib/logic.ts';

/* eslint-disable @typescript-eslint/no-explicit-any */
const isStr = (v: unknown) => typeof v === 'string' && v.trim() !== '';

/** Logos available as "logo:<name>" icons; each needs src/assets/logos/<name>.svg. */
export const LOGOS = ['python', 'java', 'kotlin', 'git', 'spring'];

/**
 * A course or track icon is a real logo ("logo:python") or a short monogram ("P(x)", "∴", "SQL").
 * Emoji are rejected: they made the app look generated.
 */
export function iconProblem(icon: unknown): string | null {
  if (typeof icon !== 'string' || icon.trim() === '') return 'missing "icon"';
  if (icon.startsWith('logo:')) {
    return LOGOS.includes(icon.slice(5)) ? null : `unknown logo "${icon}" (available: ${LOGOS.map((l) => `logo:${l}`).join(', ')})`;
  }
  if (/\p{Extended_Pictographic}/u.test(icon)) return `"icon" can't be an emoji ("${icon}"): use "logo:<name>" or a 1–5 character monogram like "P(x)"`;
  if ([...icon].length > 5) return `"icon" monogram "${icon}" is too long (1–5 characters)`;
  return null;
}

/** Step types that count as interactive practice. Every lesson needs at least one. */
export const INTERACTIVE_TYPES = ['output', 'bug', 'order', 'buckets', 'trace', 'truthtable', 'logicgrid', 'balance', 'sim'];

export function validateCourse(t: any, where: string): string[] {
  const errs: string[] = [];
  const req = (ok: boolean, msg: string) => {
    if (!ok) errs.push(`${where}: ${msg}`);
  };

  req(isStr(t?.id) && /^[a-z0-9-]+$/.test(t.id), '"id" must be kebab-case (a-z, 0-9, -)');
  req(isStr(t?.title), 'missing "title"');
  const ip = iconProblem(t?.icon);
  req(ip === null, ip ?? '');
  req(isStr(t?.description), 'missing "description"');
  req(Array.isArray(t?.keyIdeas) && t.keyIdeas.every(isStr), '"keyIdeas" must be a list of strings');
  req(t?.level === undefined || ['Beginner', 'Intermediate', 'Advanced'].includes(t.level), '"level" must be Beginner, Intermediate or Advanced');

  const units: any[] | null = Array.isArray(t?.units)
    ? t.units
    : Array.isArray(t?.lessons)
      ? [{ id: 'lessons', title: 'Lessons', lessons: t.lessons }]
      : null;
  if (!units || units.length === 0) {
    req(false, 'needs a non-empty "units" list (or a flat "lessons" list)');
    return errs;
  }

  const unitIds = new Set<string>();
  const lessonIds = new Set<string>();
  units.forEach((u, ui) => {
    const uw = `unit "${u?.id ?? ui + 1}"`;
    req(isStr(u?.id), `${uw}: missing "id"`);
    req(!unitIds.has(u?.id), `${uw}: duplicate unit id`);
    unitIds.add(u?.id);
    req(isStr(u?.title), `${uw}: missing "title"`);
    if (!Array.isArray(u?.lessons) || u.lessons.length === 0) {
      req(false, `${uw}: "lessons" must be a non-empty list`);
      return;
    }
    u.lessons.forEach((l: any, li: number) => validateLesson(l, `lesson "${l?.id ?? li + 1}"`, lessonIds, req, errs, where));
  });
  validateConcepts(t, units, lessonIds, req);
  return errs;
}

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The concept graph and the concept tags on questions. Cross-course link targets are checked by validateConceptRefs. */
function validateConcepts(t: any, units: any[], lessonIds: Set<string>, req: (ok: boolean, msg: string) => void) {
  const steps = units.flatMap((u) => (Array.isArray(u?.lessons) ? u.lessons : [])).flatMap((l: any) =>
    Array.isArray(l?.steps) ? l.steps.map((s: any) => ({ s, where: `lesson "${l?.id}", question "${s?.id}"` })) : [],
  );
  const tagged = steps.filter(({ s }) => s?.concepts !== undefined);
  if (t?.concepts === undefined) {
    req(t?.links === undefined, '"links" needs a "concepts" list');
    req(tagged.length === 0, 'questions are tagged with "concepts" but the course has no "concepts" list');
    return;
  }
  const concepts: any[] = Array.isArray(t.concepts) ? t.concepts : [];
  req(Array.isArray(t.concepts) && concepts.length > 0, '"concepts" must be a non-empty list');
  const ids = new Set<string>();
  concepts.forEach((c, i) => {
    const cw = `concept "${c?.id ?? i + 1}"`;
    req(isStr(c?.id) && KEBAB.test(c.id), `${cw}: "id" must be kebab-case`);
    req(!ids.has(c?.id), `${cw}: duplicate concept id`);
    ids.add(c?.id);
    req(isStr(c?.label), `${cw}: missing "label"`);
    req(lessonIds.has(c?.lesson), `${cw}: "lesson" must be a lesson id in this course`);
    req(c?.summary === undefined || isStr(c.summary), `${cw}: "summary" must be a string`);
    req(c?.aliases === undefined || (Array.isArray(c.aliases) && c.aliases.every(isStr)), `${cw}: "aliases" must be a list of strings`);
  });
  const links: any[] = t.links === undefined ? [] : Array.isArray(t.links) ? t.links : [];
  req(t.links === undefined || Array.isArray(t.links), '"links" must be a list');
  const pairs = new Set<string>();
  links.forEach((l, i) => {
    const lw = `link ${i + 1} (${l?.from} → ${l?.to})`;
    req(ids.has(l?.from), `${lw}: "from" must be a concept id in this course`);
    const external = typeof l?.to === 'string' && l.to.includes('/');
    req(
      external ? /^[a-z0-9-]+\/[a-z0-9-]+$/.test(l.to) && !l.to.startsWith(`${t.id}/`) : ids.has(l?.to),
      `${lw}: "to" must be a concept id in this course or "<course id>/<concept id>"`,
    );
    req(l?.from !== l?.to, `${lw}: a concept can't link to itself`);
    req(isStr(l?.label), `${lw}: needs a "label" like "is a" or "needs"`);
    const key = [l?.from, l?.to].sort().join('|');
    req(!pairs.has(key), `${lw}: these two concepts are already linked`);
    pairs.add(key);
  });
  tagged.forEach(({ s, where }) =>
    req(
      Array.isArray(s.concepts) && s.concepts.length > 0 && s.concepts.every((c: unknown) => ids.has(c as string)),
      `${where}: "concepts" must list concept ids from this course`,
    ),
  );
}

/** Checks links that point into other courses ("<course>/<concept>") once every course is loaded. */
export function validateConceptRefs(courses: any[]): string[] {
  const known = new Set(courses.flatMap((c) => (Array.isArray(c?.concepts) ? c.concepts.map((k: any) => `${c.id}/${k.id}`) : [])));
  return courses.flatMap((c) =>
    (Array.isArray(c?.links) ? c.links : [])
      .filter((l: any) => typeof l?.to === 'string' && l.to.includes('/') && !known.has(l.to))
      .map((l: any) => `${c.id}.json: link ${l.from} → ${l.to}: no such concept in that course`),
  );
}

/** Concept counts every real course must stay within: enough to map, few enough to hold in your head. */
export const CONCEPT_RANGE = [8, 24] as const;
const UNGRADED = ['explain', 'example', 'sim'];

/**
 * Coverage rules for shipped courses (kept apart from validateCourse so small test fixtures need no graph):
 * the course has a concept graph, every graded step is tagged, every concept is tested and every lesson teaches one.
 */
export function validateConceptCoverage(t: any, where: string): string[] {
  const errs: string[] = [];
  const req = (ok: boolean, msg: string) => {
    if (!ok) errs.push(`${where}: ${msg}`);
  };
  const concepts: any[] = Array.isArray(t?.concepts) ? t.concepts : [];
  const [min, max] = CONCEPT_RANGE;
  req(concepts.length >= min && concepts.length <= max, `needs a concept graph of ${min}–${max} "concepts" (has ${concepts.length})`);
  if (!concepts.length) return errs;

  const lessons: any[] = (Array.isArray(t?.units) ? t.units.flatMap((u: any) => u?.lessons ?? []) : (t?.lessons ?? [])).filter(Boolean);
  const tested = new Set<string>();
  for (const l of lessons) {
    for (const s of Array.isArray(l?.steps) ? l.steps : []) {
      if (UNGRADED.includes(s?.type)) continue;
      req(Array.isArray(s?.concepts) && s.concepts.length > 0, `lesson "${l.id}", question "${s?.id}": list the "concepts" it tests`);
      (Array.isArray(s?.concepts) ? s.concepts : []).forEach((c: string) => tested.add(c));
    }
    req(concepts.some((c) => c?.lesson === l?.id), `lesson "${l?.id}": no concept is taught here (set a concept's "lesson" to it)`);
  }
  concepts.forEach((c) => req(tested.has(c?.id), `concept "${c?.id}": no graded step tests it (tag one with it, or merge it into a neighbour)`));
  return errs;
}

function validateLesson(
  l: any,
  lw: string,
  lessonIds: Set<string>,
  req: (ok: boolean, msg: string) => void,
  errs: string[],
  where: string,
) {
  req(isStr(l?.id), `${lw}: missing "id"`);
  req(!lessonIds.has(l?.id), `${lw}: duplicate lesson id (must be unique across the whole course)`);
  lessonIds.add(l?.id);
  req(isStr(l?.title), `${lw}: missing "title"`);
  req(l?.pareto === 'core' || l?.pareto === 'extra', `${lw}: "pareto" must be "core" or "extra"`);
  req(isStr(l?.takeaway), `${lw}: missing "takeaway"`);
  if (!Array.isArray(l?.steps) || l.steps.length === 0) {
    req(false, `${lw}: "steps" must be a non-empty list`);
    return;
  }
  // Interactive learning is the default: every lesson needs at least one step the learner manipulates or produces.
  req(
    l.steps.some((s: any) => INTERACTIVE_TYPES.includes(s?.type)),
    `${lw}: needs at least one interactive step (${INTERACTIVE_TYPES.join(', ')}) — see docs/NEW_TOPIC_PROMPT.md`,
  );
  const stepIds = new Set<string>();
  l.steps.forEach((s: any, si: number) => {
    const sw = `${lw}, step ${si + 1}`;
    switch (s?.type) {
      case 'explain':
        req(isStr(s.body), `${sw}: explain needs "body"`);
        break;
      case 'example':
        req(isStr(s.problem), `${sw}: example needs "problem"`);
        req(Array.isArray(s.steps) && s.steps.length > 0 && s.steps.every(isStr), `${sw}: example needs "steps" (list of strings)`);
        break;
      case 'mcq':
      case 'numeric':
      case 'text':
      case 'output':
      case 'bug':
      case 'order':
      case 'buckets':
      case 'trace':
      case 'truthtable':
      case 'logicgrid':
      case 'balance':
        req(isStr(s.id), `${sw}: questions need an "id"`);
        req(!stepIds.has(s.id), `${sw}: duplicate question id "${s.id}"`);
        stepIds.add(s.id);
        req(isStr(s.prompt), `${sw}: missing "prompt"`);
        req(isStr(s.explanation), `${sw}: missing "explanation"`);
        if (s.type === 'mcq') {
          req(Array.isArray(s.choices) && s.choices.length >= 2 && s.choices.every(isStr), `${sw}: mcq needs at least 2 string "choices"`);
          req(
            Number.isInteger(s.answer) && s.answer >= 0 && s.answer < (s.choices?.length ?? 0),
            `${sw}: mcq "answer" must be the 0-based index of the correct choice`,
          );
        } else if (s.type === 'numeric') {
          req(typeof s.answer === 'number', `${sw}: numeric "answer" must be a number`);
        } else if (s.type === 'output' || s.type === 'bug') {
          req(isStr(s.code) && !s.code.trimStart().startsWith('```'), `${sw}: ${s.type} needs "code" (plain code, no \`\`\` fences)`);
          req(s.language === undefined || isStr(s.language), `${sw}: "language" must be a string like "python"`);
          if (s.type === 'output') {
            req(isStr(s.output), `${sw}: output needs "output" (what the code prints)`);
          } else {
            const lineCount = isStr(s.code) ? s.code.split('\n').length : 0;
            req(s.error === undefined || isStr(s.error), `${sw}: bug "error" must be a string`);
            req(
              Array.isArray(s.lines) && s.lines.length > 0 && s.lines.every((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= lineCount),
              `${sw}: bug "lines" must list 1-based line numbers inside "code" (it has ${lineCount} lines)`,
            );
            req(Array.isArray(s.fixes) && s.fixes.length >= 2 && s.fixes.every(isStr), `${sw}: bug needs at least 2 string "fixes"`);
            req(
              Number.isInteger(s.answer) && s.answer >= 0 && s.answer < (s.fixes?.length ?? 0),
              `${sw}: bug "answer" must be the 0-based index of the correct fix`,
            );
          }
        } else if (s.type === 'order') {
          const items: unknown[] = Array.isArray(s.items) ? s.items : [];
          req(items.length >= 3 && items.length <= 8 && items.every(isStr), `${sw}: order needs 3–8 string "items", in the correct order`);
          req(new Set(items).size === items.length, `${sw}: order "items" must all be different`);
        } else if (s.type === 'buckets') {
          const buckets: unknown[] = Array.isArray(s.buckets) ? s.buckets : [];
          req(buckets.length >= 2 && buckets.length <= 4 && buckets.every(isStr), `${sw}: buckets needs 2–4 string "buckets"`);
          const items: any[] = Array.isArray(s.items) ? s.items : [];
          req(
            items.length >= 4 && items.every((it) => isStr(it?.text) && Number.isInteger(it?.bucket) && it.bucket >= 0 && it.bucket < buckets.length),
            `${sw}: buckets needs at least 4 "items" like {"text": "...", "bucket": 0}`,
          );
          req(buckets.every((_, bi) => items.some((it) => it?.bucket === bi)), `${sw}: every bucket needs at least one item`);
        } else if (s.type === 'trace') {
          req(isStr(s.code) && !s.code.trimStart().startsWith('```'), `${sw}: trace needs "code" (plain code, no \`\`\` fences)`);
          req(s.language === undefined || isStr(s.language), `${sw}: "language" must be a string like "python"`);
          const lineCount = isStr(s.code) ? s.code.split('\n').length : 0;
          const frames: any[] = Array.isArray(s.frames) ? s.frames : [];
          req(frames.length >= 2, `${sw}: trace needs at least 2 "frames"`);
          frames.forEach((f, fi) => {
            const fw = `${sw}, frame ${fi + 1}`;
            req(Number.isInteger(f?.line) && f.line >= 1 && f.line <= lineCount, `${fw}: "line" must be a 1-based line inside "code" (it has ${lineCount} lines)`);
            req(
              f?.vars !== null && typeof f?.vars === 'object' && !Array.isArray(f.vars) && Object.values(f.vars).every((v) => typeof v === 'string'),
              `${fw}: "vars" must be an object of strings, e.g. {"i": "0", "nums": "[3, 1]"}`,
            );
            req(f?.out === undefined || typeof f.out === 'string', `${fw}: "out" must be a string`);
            req(f?.note === undefined || isStr(f.note), `${fw}: "note" must be a string`);
            req(f?.ask === undefined || (isStr(f.ask) && typeof f?.vars?.[f.ask] === 'string'), `${fw}: "ask" must name one of this frame's "vars"`);
          });
          req(frames.some((f) => f?.ask), `${sw}: trace needs at least one frame with "ask" (a value to predict)`);
        } else if (s.type === 'truthtable') {
          validateTruthTable(s, sw, req);
        } else if (s.type === 'logicgrid') {
          validateLogicGrid(s, sw, req);
        } else if (s.type === 'balance') {
          validateBalance(s, sw, req);
        } else {
          req(Array.isArray(s.accept) && s.accept.length > 0 && s.accept.every(isStr), `${sw}: text needs an "accept" list`);
        }
        break;
      case 'sim':
        validateSim(s, sw, req);
        break;
      default:
        errs.push(`${where}: ${sw}: unknown step type "${s?.type}"`);
    }
  });
}

function validateSim(s: any, sw: string, req: (ok: boolean, msg: string) => void) {
  req(s.title === undefined || isStr(s.title), `${sw}: "title" must be a string`);
  req(s.body === undefined || isStr(s.body), `${sw}: "body" must be a string`);
  const strings = (v: unknown) => Array.isArray(v) && v.every(isStr);
  switch (s.sim) {
    case 'git': {
      req(s.setup === undefined || strings(s.setup), `${sw}: git "setup" must be a list of commands`);
      const g = s.goal;
      if (g !== undefined) {
        req(isStr(g?.text), `${sw}: git "goal" needs "text"`);
        req(g?.head === undefined || isStr(g.head), `${sw}: git goal "head" must be a branch name`);
        req(g?.branches === undefined || strings(g.branches), `${sw}: git goal "branches" must be a list of names`);
        req(
          g?.merged === undefined || (Array.isArray(g.merged) && g.merged.every((m: any) => isStr(m?.from) && isStr(m?.into))),
          `${sw}: git goal "merged" must be a list like {"from": "feature", "into": "main"}`,
        );
        req(
          g?.minCommits === undefined ||
            (typeof g.minCommits === 'object' && Object.values(g.minCommits).every((n) => Number.isInteger(n) && (n as number) >= 1)),
          `${sw}: git goal "minCommits" must map branch names to counts`,
        );
        req(['head', 'branches', 'merged', 'minCommits'].some((k) => g?.[k] !== undefined), `${sw}: git goal needs at least one condition`);
      }
      break;
    }
    case 'dice':
      req(Number.isInteger(s.dice) && s.dice >= 1 && s.dice <= 3, `${sw}: dice "dice" must be 1–3`);
      req(Number.isInteger(s.sides) && s.sides >= 2 && s.sides <= 20, `${sw}: dice "sides" must be 2–20`);
      req(
        Array.isArray(s.target) && s.target.length > 0 && s.target.every((t: unknown) => Number.isInteger(t) && (t as number) >= s.dice && (t as number) <= s.dice * s.sides),
        `${sw}: dice "target" must list reachable totals`,
      );
      req(s.goalRolls === undefined || (Number.isInteger(s.goalRolls) && s.goalRolls >= 1), `${sw}: dice "goalRolls" must be a positive whole number`);
      break;
    case 'growth': {
      const ok = ['1', 'log n', 'n', 'n log n', 'n^2', '2^n'];
      req(Array.isArray(s.curves) && s.curves.length >= 2 && s.curves.every((c: string) => ok.includes(c)), `${sw}: growth "curves" must list 2+ of ${ok.join(', ')}`);
      req(s.maxN === undefined || (Number.isInteger(s.maxN) && s.maxN >= 10), `${sw}: growth "maxN" must be a whole number ≥ 10`);
      break;
    }
    case 'join': {
      const table = (t: any, name: string) => {
        const cols: unknown[] = Array.isArray(t?.columns) ? t.columns : [];
        req(isStr(t?.name), `${sw}: join "${name}" needs a "name"`);
        req(cols.length > 0 && cols.every(isStr), `${sw}: join "${name}" needs "columns"`);
        req(
          Array.isArray(t?.rows) && t.rows.length > 0 && t.rows.every((r: unknown) => Array.isArray(r) && r.length === cols.length),
          `${sw}: join "${name}" rows must each have ${cols.length} values`,
        );
        return cols;
      };
      const lc = table(s.left, 'left');
      const rc = table(s.right, 'right');
      req(Array.isArray(s.on) && s.on.length === 2 && lc.includes(s.on[0]) && rc.includes(s.on[1]), `${sw}: join "on" must be [left column, right column]`);
      req(
        s.joins === undefined || (Array.isArray(s.joins) && s.joins.length > 0 && s.joins.every((j: string) => ['inner', 'left', 'right', 'full'].includes(j))),
        `${sw}: join "joins" must list inner, left, right and/or full`,
      );
      break;
    }
    default:
      req(false, `${sw}: unknown simulator "${s.sim}" (use git, dice, growth or join)`);
  }
}

/** Validates src/content/roadmap.json against the loaded course ids. */
export function validateRoadmap(r: any, courseIds: string[]): string[] {
  const errs: string[] = [];
  const req = (ok: boolean, msg: string) => {
    if (!ok) errs.push(`roadmap.json: ${msg}`);
  };
  if (!Array.isArray(r?.tracks) || r.tracks.length === 0) return ['roadmap.json: needs a non-empty "tracks" list'];
  const trackIds = new Set<string>();
  r.tracks.forEach((t: any, ti: number) => {
    const tw = `track "${t?.id ?? ti + 1}"`;
    req(isStr(t?.id) && !trackIds.has(t.id), `${tw}: needs a unique "id"`);
    trackIds.add(t?.id);
    req(isStr(t?.title), `${tw}: missing "title"`);
    const ip = iconProblem(t?.icon);
    req(ip === null, `${tw}: ${ip}`);
    req(isStr(t?.description), `${tw}: missing "description"`);
    const nodes: any[] = Array.isArray(t?.nodes) ? t.nodes : [];
    req(nodes.length >= 2, `${tw}: needs at least 2 "nodes"`);
    const seen = new Set<string>();
    nodes.forEach((n) => {
      req(courseIds.includes(n?.course), `${tw}: unknown course "${n?.course}"`);
      req(!seen.has(n?.course), `${tw}: course "${n?.course}" appears twice`);
      // "after" may only point at earlier nodes, which also rules out cycles.
      req(
        n?.after === undefined || (Array.isArray(n.after) && n.after.every((a: string) => seen.has(a))),
        `${tw}: "${n?.course}" lists a course in "after" that isn't an earlier node`,
      );
      req(n?.note === undefined || isStr(n.note), `${tw}: "${n?.course}" note must be a string`);
      seen.add(n?.course);
    });
  });
  return errs;
}

function validateTruthTable(s: any, sw: string, req: (ok: boolean, msg: string) => void) {
  const vars: unknown[] = Array.isArray(s.vars) ? s.vars : [];
  req(
    vars.length >= 1 && vars.length <= 3 && vars.every((v) => typeof v === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(v)),
    `${sw}: truthtable needs 1–3 "vars" (simple names like "P")`,
  );
  req(new Set(vars).size === vars.length, `${sw}: truthtable "vars" must all be different`);
  const cols: any[] = Array.isArray(s.columns) ? s.columns : [];
  req(cols.length >= 1 && cols.length <= 4, `${sw}: truthtable needs 1–4 "columns"`);
  req(cols.some((c) => !c?.given), `${sw}: truthtable needs at least one column that isn't "given"`);
  cols.forEach((c, ci) => {
    const cw = `${sw}, column ${ci + 1}`;
    req(c?.label === undefined || isStr(c.label), `${cw}: "label" must be a string`);
    req(c?.given === undefined || typeof c.given === 'boolean', `${cw}: "given" must be true or false`);
    if (!isStr(c?.expr)) {
      req(false, `${cw}: needs an "expr" like "P -> Q"`);
      return;
    }
    try {
      parseLogic(c.expr, vars as string[]);
    } catch (e) {
      req(false, `${cw}: can't read "${c.expr}": ${(e as Error).message}`);
    }
  });
}

function validateLogicGrid(s: any, sw: string, req: (ok: boolean, msg: string) => void) {
  const cats: any[] = Array.isArray(s.categories) ? s.categories : [];
  req(cats.length >= 2 && cats.length <= 3, `${sw}: logicgrid needs 2–3 "categories"`);
  const size = cats[0]?.items?.length ?? 0;
  cats.forEach((c, ci) => {
    const items: unknown[] = Array.isArray(c?.items) ? c.items : [];
    req(isStr(c?.name), `${sw}: logicgrid category ${ci + 1} needs a "name"`);
    req(items.length >= 3 && items.length <= 5 && items.every(isStr), `${sw}: logicgrid category ${ci + 1} needs 3–5 string "items"`);
    req(items.length === size, `${sw}: every logicgrid category needs the same number of items (${size})`);
    req(new Set(items).size === items.length, `${sw}: logicgrid category ${ci + 1} items must all be different`);
  });
  req(Array.isArray(s.clues) && s.clues.length > 0 && s.clues.every(isStr), `${sw}: logicgrid needs "clues"`);
  const sol: any[] = Array.isArray(s.solution) ? s.solution : [];
  req(
    sol.length === size && sol.every((row) => Array.isArray(row) && row.length === cats.length - 1),
    `${sw}: logicgrid "solution" needs ${size} rows of ${Math.max(cats.length - 1, 0)} items (one per category after the first)`,
  );
  cats.slice(1).forEach((c, k) => {
    const column = sol.map((row) => row?.[k]);
    const items: unknown[] = Array.isArray(c?.items) ? c.items : [];
    req(
      column.length === items.length && items.every((it) => column.filter((v) => v === it).length === 1),
      `${sw}: logicgrid "solution" must use each "${c?.name}" item exactly once`,
    );
  });
}

function validateBalance(s: any, sw: string, req: (ok: boolean, msg: string) => void) {
  const side = (v: unknown) => Array.isArray(v) && v.length === 2 && v.every((n) => Number.isInteger(n) && Math.abs(n as number) <= 20);
  req(side(s.left) && side(s.right), `${sw}: balance "left" and "right" must be [coefficient, constant] whole numbers from -20 to 20`);
  req(s.variable === undefined || (isStr(s.variable) && /^[a-z]$/i.test(s.variable)), `${sw}: balance "variable" must be one letter`);
  if (!side(s.left) || !side(s.right)) return;
  const [a, b] = s.left;
  const [c, d] = s.right;
  req(a !== c, `${sw}: balance needs different x-coefficients on the two sides, or there's no single solution`);
  req(a === c || Number.isInteger((d - b) / (a - c)), `${sw}: balance solution x = (${d} − ${b}) / (${a} − ${c}) must be a whole number`);
  const solved = (p: number[], q: number[]) => p[0] === 1 && p[1] === 0 && q[0] === 0;
  req(!solved(s.left, s.right) && !solved(s.right, s.left), `${sw}: balance starts already solved`);
}
