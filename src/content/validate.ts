// Validates one course JSON file and returns human-readable problems.
// Has no runtime imports so scripts/check-content.ts can run it with plain Node.

/* eslint-disable @typescript-eslint/no-explicit-any */
const isStr = (v: unknown) => typeof v === 'string' && v.trim() !== '';

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
        } else {
          req(Array.isArray(s.accept) && s.accept.length > 0 && s.accept.every(isStr), `${sw}: text needs an "accept" list`);
        }
        break;
      default:
        errs.push(`${where}: ${sw}: unknown step type "${s?.type}"`);
    }
  });
}
