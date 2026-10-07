// Translation coverage: which courses exist in which language, and how much text still looks untranslated.
//   node scripts/i18n-status.ts            (or: npm run i18n:status)
//   node scripts/i18n-status.ts --verbose  also lists text that is identical to English
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROADMAP_FIELDS, textStats, validateCourseTranslation, validateTranslation } from '../src/content/translation.ts';
import { LOCALES } from '../src/i18n/locales.ts';
import en from '../src/i18n/en/index.ts';

const verbose = process.argv.includes('--verbose');
const root = join(import.meta.dirname, '..', 'src');
const topics = join(root, 'content', 'topics');
const others = LOCALES.filter((l) => l !== 'en');
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

const courses = readdirSync(topics)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ id: f.slice(0, -5), data: read(join(topics, f)) }))
  .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999) || a.id.localeCompare(b.id));

// ---------- UI catalogs ----------

console.log('UI strings (src/i18n/<locale>/)');
const keys = Object.keys(en);
for (const locale of others) {
  const file = join(root, 'i18n', locale, 'index.ts');
  let line = `  ${locale.padEnd(6)} `;
  if (!existsSync(file)) {
    console.log(`${line}missing`);
    continue;
  }
  const catalog = (await import(file)).default as Record<string, unknown>;
  const present = keys.filter((k) => catalog[k] !== undefined).length;
  const same = keys.filter((k) => JSON.stringify(catalog[k]) === JSON.stringify((en as Record<string, unknown>)[k]) && /[a-z]{4}/i.test(JSON.stringify(catalog[k]))).length;
  line += `${present}/${keys.length} keys`;
  if (same) line += `, ${same} identical to English (fine for names like "XP"; check the rest)`;
  console.log(line);
  if (verbose && same) keys.filter((k) => JSON.stringify(catalog[k]) === JSON.stringify((en as Record<string, unknown>)[k])).forEach((k) => console.log(`         = ${k}`));
}

// ---------- courses ----------

console.log('\nCourses (src/content/topics/<locale>/<id>.json)');
const width = Math.max(...courses.map((c) => c.id.length));
console.log(`  ${'course'.padEnd(width)}  ${others.map((l) => l.padEnd(14)).join('')}`);
const totals: Record<string, number> = Object.fromEntries(others.map((l) => [l, 0]));
for (const c of courses) {
  const cells = others.map((locale) => {
    const p = join(topics, locale, `${c.id}.json`);
    if (!existsSync(p)) return '—'.padEnd(14);
    let tr: unknown;
    try {
      tr = read(p);
    } catch {
      return 'bad JSON'.padEnd(14);
    }
    if (validateCourseTranslation(c.data, tr, '').length) return 'INVALID'.padEnd(14);
    totals[locale]++;
    const s = textStats(c.data, tr);
    const cell = s.same ? `✓ (${s.same} same)` : '✓';
    if (verbose && s.same) s.samples.forEach((x) => console.log(`    ${locale} ${c.id} same as English: ${x}`));
    return cell.padEnd(14);
  });
  console.log(`  ${c.id.padEnd(width)}  ${cells.join('')}`);
}
console.log(`  ${'total'.padEnd(width)}  ${others.map((l) => `${totals[l]}/${courses.length}`.padEnd(14)).join('')}`);

// ---------- roadmap ----------

console.log('\nRoadmap (src/content/roadmap.<locale>.json)');
const roadmap = read(join(root, 'content', 'roadmap.json'));
for (const locale of others) {
  const p = join(root, 'content', `roadmap.${locale}.json`);
  const state = !existsSync(p) ? 'missing' : validateTranslation(roadmap, read(p), '', ROADMAP_FIELDS).length ? 'INVALID' : '✓';
  console.log(`  ${locale.padEnd(6)} ${state}`);
}
console.log('\n"same" counts text fields identical to English: proper names and notation are fine; anything else is probably untranslated.');
console.log('Run npm run check:content for the exact problems in INVALID files.');
