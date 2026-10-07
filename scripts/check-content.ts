// Validates every course file: node scripts/check-content.ts  (or: npm run check:content)
// English courses in src/content/topics/*.json, their translations in src/content/topics/<locale>/*.json,
// the roadmap and its translations (src/content/roadmap.<locale>.json).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROADMAP_FIELDS, validateCourseTranslation, validateTranslation } from '../src/content/translation.ts';
import { validateConceptCoverage, validateConceptRefs, validateCourse, validateRoadmap } from '../src/content/validate.ts';
import { LOCALES } from '../src/i18n/locales.ts';
import { QUESTION_TYPES } from '../src/types.ts';

const dir = join(import.meta.dirname, '..', 'src', 'content', 'topics');
let problems = 0;
const ids = new Map<string, string>();
const loadedCourses: unknown[] = [];
/** English course data by course id, for checking translations against. */
const english = new Map<string, unknown>();

function readJson(path: string, label: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`✗ ${label}: invalid JSON — ${(e as Error).message}`);
    problems++;
    return undefined;
  }
}

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const data = readJson(join(dir, file), file);
  if (data === undefined) continue;
  const errs = validateCourse(data, file);
  if (!errs.length) errs.push(...validateConceptCoverage(data, file));
  loadedCourses.push(data);
  const id = (data as { id?: string }).id;
  if (id && ids.has(id)) errs.push(`${file}: course id "${id}" is also used by ${ids.get(id)}`);
  if (id) ids.set(id, file);
  if (id && `${id}.json` !== file) errs.push(`${file}: the file name must be the course id ("${id}.json"), so translations can find it`);
  if (id) english.set(id, data);
  if (errs.length) {
    errs.forEach((e) => console.error(`✗ ${e}`));
    problems += errs.length;
  } else {
    const c = data as { units?: { lessons: { pareto: string; steps: { type: string }[] }[] }[]; lessons?: { pareto: string; steps: { type: string }[] }[] };
    const lessons = c.units ? c.units.flatMap((u) => u.lessons) : (c.lessons ?? []);
    const questions = lessons.flatMap((l) => l.steps).filter((s) => (QUESTION_TYPES as readonly string[]).includes(s.type)).length;
    const core = lessons.filter((l) => l.pareto === 'core').length;
    console.log(`✓ ${file}: ${lessons.length} lessons (${core} core), ${questions} questions`);
  }
}

const refErrs = validateConceptRefs(loadedCourses);
refErrs.forEach((e) => console.error(`✗ ${e}`));
problems += refErrs.length;

const roadmapPath = join(dir, '..', 'roadmap.json');
const roadmap = readJson(roadmapPath, 'roadmap.json');
if (roadmap !== undefined) {
  const roadmapErrs = validateRoadmap(roadmap, [...ids.keys()]);
  roadmapErrs.forEach((e) => console.error(`✗ ${e}`));
  problems += roadmapErrs.length;
  if (!roadmapErrs.length) console.log('✓ roadmap.json');
}

// ---------- translations ----------

const translationDirs = readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory());
for (const locale of translationDirs) {
  if (locale === 'en' || !(LOCALES as readonly string[]).includes(locale)) {
    console.error(`✗ topics/${locale}/: not a translation locale (use one of ${LOCALES.filter((l) => l !== 'en').join(', ')})`);
    problems++;
    continue;
  }
  for (const file of readdirSync(join(dir, locale)).filter((f) => f.endsWith('.json'))) {
    const label = `${locale}/${file}`;
    const data = readJson(join(dir, locale, file), label);
    if (data === undefined) continue;
    const id = file.slice(0, -'.json'.length);
    const en = english.get(id);
    if (!en) {
      console.error(`✗ ${label}: no English course "${id}" (the file name must be an English course id)`);
      problems++;
      continue;
    }
    // The translation must be a valid course on its own, and a faithful mirror of the English one.
    const errs = validateCourse(data, label);
    if (!errs.length) errs.push(...validateConceptCoverage(data, label));
    errs.push(...validateCourseTranslation(en, data, label));
    if (errs.length) {
      errs.forEach((e) => console.error(`✗ ${e}`));
      problems += errs.length;
    } else {
      console.log(`✓ ${label}: matches the English course`);
    }
  }
}

for (const locale of LOCALES.filter((l) => l !== 'en')) {
  const path = join(dir, '..', `roadmap.${locale}.json`);
  if (!existsSync(path) || roadmap === undefined) continue;
  const data = readJson(path, `roadmap.${locale}.json`);
  if (data === undefined) continue;
  const errs = validateTranslation(roadmap, data, `roadmap.${locale}.json`, ROADMAP_FIELDS);
  errs.forEach((e) => console.error(`✗ ${e}`));
  problems += errs.length;
  if (!errs.length) console.log(`✓ roadmap.${locale}.json: matches roadmap.json`);
}

if (problems) {
  console.error(`\n${problems} problem(s) found.`);
  process.exit(1);
}
