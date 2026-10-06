// Validates one course JSON file and returns human-readable problems.
// Has no runtime imports so scripts/check-content.ts can run it with plain Node.

/* eslint-disable @typescript-eslint/no-explicit-any */
const isStr = (v: unknown) => typeof v === 'string' && v.trim() !== '';

/** Step types that count as interactive practice. Every lesson needs at least one. */
export const INTERACTIVE_TYPES = ['output', 'bug', 'order', 'buckets', 'trace', 'sim'];

export function validateCourse(t: any, where: string): string[] {
  const errs: string[] = [];
  const req = (ok: boolean, msg: string) => {
    if (!ok) errs.push(`${where}: ${msg}`);
  };

  req(isStr(t?.id) && /^[a-z0-9-]+$/.test(t.id), '"id" must be kebab-case (a-z, 0-9, -)');
  req(isStr(t?.title), 'missing "title"');
  req(isStr(t?.icon), 'missing "icon"');
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
    req(isStr(t?.icon), `${tw}: missing "icon"`);
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
