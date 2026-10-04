// Validates every course file: node scripts/check-content.ts  (or: npm run check:content)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateCourse } from '../src/content/validate.ts';

const dir = join(import.meta.dirname, '..', 'src', 'content', 'topics');
let problems = 0;
const ids = new Map<string, string>();

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    console.error(`✗ ${file}: invalid JSON — ${(e as Error).message}`);
    problems++;
    continue;
  }
  const errs = validateCourse(data, file);
  const id = (data as { id?: string }).id;
  if (id && ids.has(id)) errs.push(`${file}: course id "${id}" is also used by ${ids.get(id)}`);
  if (id) ids.set(id, file);
  if (errs.length) {
    errs.forEach((e) => console.error(`✗ ${e}`));
    problems += errs.length;
  } else {
    const c = data as { units?: { lessons: { pareto: string; steps: { type: string }[] }[] }[]; lessons?: { pareto: string; steps: { type: string }[] }[] };
    const lessons = c.units ? c.units.flatMap((u) => u.lessons) : (c.lessons ?? []);
    const questions = lessons.flatMap((l) => l.steps).filter((s) => ['mcq', 'numeric', 'text'].includes(s.type)).length;
    const core = lessons.filter((l) => l.pareto === 'core').length;
    console.log(`✓ ${file}: ${lessons.length} lessons (${core} core), ${questions} questions`);
  }
}

if (problems) {
  console.error(`\n${problems} problem(s) found.`);
  process.exit(1);
}
