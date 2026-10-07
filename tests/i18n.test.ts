// Tests for translations: the catalogs, locale detection, plurals and formatting, and the course-translation
// validator. Run with: npm test
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import {
  checkGridStep,
  codeOf,
  deepEqual,
  overlay,
  textStats,
  validateCourseTranslation,
  validateTranslation,
  ROADMAP_FIELDS,
} from '../src/content/translation.ts';
import { validateCourse } from '../src/content/validate.ts';
import {
  formatDate,
  formatList,
  formatNumber,
  formatPercent,
  interpolate,
  registerCatalog,
  resolve,
  selectPlural,
  setActiveLocale,
  t,
  translator,
  type Catalog,
  type Message,
  type MessageKey,
} from '../src/i18n/core.ts';
import en from '../src/i18n/en/index.ts';
import { NAMESPACES } from '../src/i18n/en/index.ts';
import { detectLocale, isLocale, LOCALES } from '../src/i18n/locales.ts';
import { checkName, formatHours, shareLinks } from '../src/lib/certificate.ts';
import { certificatePdf, pdfString } from '../src/lib/pdf.ts';
import { mergeProgress, emptyProgress } from '../src/lib/storage.ts';

const root = join(import.meta.dirname, '..');
const others = LOCALES.filter((l) => l !== 'en');
const catalogs = new Map<string, Record<string, Message>>();
for (const locale of others) {
  const file = join(root, 'src', 'i18n', locale, 'index.ts');
  try {
    catalogs.set(locale, (await import(file)).default);
  } catch {
    /* missing or incomplete: the catalog test below fails with a clear message */
  }
}
const english = en as Record<string, Message>;

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (s: string) => [...s.matchAll(/<\/?(\w+)>/g)].map((m) => m[0]).sort();
const forms = (m: Message) => (typeof m === 'string' ? [m] : Object.values(m).filter((x): x is string => typeof x === 'string'));

describe('catalogs', () => {
  test('every English key starts with its namespace, and no key is defined twice', () => {
    const seen = new Set<string>();
    for (const [ns, messages] of Object.entries(NAMESPACES)) {
      for (const key of Object.keys(messages)) {
        assert.ok(key.startsWith(`${ns}.`), `${key} is in ${ns}.ts`);
        assert.ok(!seen.has(key), `${key} is defined twice`);
        seen.add(key);
      }
    }
  });

  test('English plurals have "other", and messages are not empty', () => {
    for (const [key, m] of Object.entries(english)) {
      if (typeof m === 'string') assert.ok(m.trim(), `${key} is empty`);
      else assert.ok(m.other?.trim(), `${key} needs an "other" form`);
    }
  });

  for (const locale of others) {
    test(`${locale}: same keys and shapes as English, same placeholders and tags`, () => {
      const cat = catalogs.get(locale);
      assert.ok(cat, `src/i18n/${locale}/index.ts exists`);
      assert.deepEqual(Object.keys(cat).sort(), Object.keys(english).sort(), 'same keys');
      for (const [key, m] of Object.entries(english)) {
        const tr = cat[key];
        assert.equal(typeof tr, typeof m, `${key}: ${typeof m === 'string' ? 'a string' : 'a plural object'} like English`);
        const enPh = [...new Set(forms(m).flatMap(placeholders))].sort();
        for (const form of forms(tr)) {
          assert.ok(form.trim(), `${key}: empty translation`);
          // Every placeholder a form uses must exist in English; {count} may be dropped in a singular form ("one lesson").
          for (const p of placeholders(form)) assert.ok(enPh.includes(p), `${key}: unknown placeholder {${p}} in "${form}"`);
          assert.deepEqual(tags(form), tags(forms(m)[0]), `${key}: tags must match English in "${form}"`);
        }
        const trPh = new Set(forms(tr).flatMap(placeholders));
        for (const p of enPh.filter((x) => x !== 'count')) assert.ok(trPh.has(p), `${key}: {${p}} is missing`);
        if (typeof m !== 'string') {
          assert.ok(typeof tr !== 'string' && tr.other, `${key}: needs an "other" form`);
          if (m.zero !== undefined) assert.ok(typeof tr !== 'string' && tr.zero !== undefined, `${key}: English has a "zero" form`);
        }
      }
    });
  }
});

describe('locale detection', () => {
  test('follows the first supported browser language', () => {
    assert.equal(detectLocale(['pt-BR']), 'pt-BR');
    assert.equal(detectLocale(['pt-PT', 'en']), 'pt-BR', 'any Portuguese → pt-BR');
    assert.equal(detectLocale(['es-MX']), 'es');
    assert.equal(detectLocale(['fr-CA', 'en-US']), 'fr');
    assert.equal(detectLocale(['de-DE', 'fr']), 'fr', 'skips unsupported languages');
    assert.equal(detectLocale(['en-GB', 'pt-BR']), 'en');
    assert.equal(detectLocale(['de', 'ja']), 'en', 'nothing supported → English');
    assert.equal(detectLocale([]), 'en');
    assert.equal(detectLocale(undefined), 'en');
    assert.equal(detectLocale(['ES']), 'es', 'case-insensitive');
  });

  test('isLocale', () => {
    assert.ok(isLocale('pt-BR') && isLocale('en'));
    assert.ok(!isLocale('pt') && !isLocale('de') && !isLocale(null));
  });
});

describe('t(), plurals and formatting', () => {
  test('plural rules per language', () => {
    const m = { one: 'one', other: 'other' };
    assert.equal(selectPlural(m, 1, 'en'), 'one');
    assert.equal(selectPlural(m, 0, 'en'), 'other');
    assert.equal(selectPlural(m, 0, 'fr'), 'one', 'French: 0 is singular');
    assert.equal(selectPlural(m, 1.5, 'fr'), 'one', 'French: 1.5 is singular');
    assert.equal(selectPlural(m, 1.5, 'en'), 'other');
    assert.equal(selectPlural(m, 0, 'pt-BR'), 'one', 'Portuguese (Brazil): 0 is singular');
    assert.equal(selectPlural(m, 0, 'es'), 'other');
    assert.equal(selectPlural({ ...m, zero: 'none' }, 0, 'fr'), 'none', 'explicit zero wins');
    assert.equal(selectPlural({ other: 'x' }, 1, 'en'), 'x', 'missing form falls back to other');
  });

  test('interpolation formats numbers for the locale', () => {
    assert.equal(interpolate('{n} XP', { n: 1234.5 }, 'en'), '1,234.5 XP');
    assert.equal(interpolate('{n} XP', { n: 1234.5 }, 'pt-BR'), '1.234,5 XP');
    assert.equal(interpolate('{n} XP', { n: 1234.5 }, 'es'), '1234,5 XP', 'es groups only from 5 digits');
    assert.equal(interpolate('{n}', { n: 12345 }, 'fr'), '12 345');
    assert.equal(interpolate('{a} and {b}', { a: 'x' }, 'en'), 'x and {b}', 'unknown placeholders stay');
    assert.equal(interpolate('{{a}}', { a: 'x' }, 'en'), '{a}', 'escaped braces');
  });

  test('resolve picks the plural from params.count and falls back to English', () => {
    assert.equal(resolve('common.lessons', { count: 1 }, 'en'), '1 lesson');
    assert.equal(resolve('common.lessons', { count: 3 }, 'en'), '3 lessons');
    registerCatalog('fr', { ...(en as Catalog), 'common.lessons': { one: '{count} leçon', other: '{count} leçons' } } as Catalog);
    assert.equal(resolve('common.lessons', { count: 0 }, 'fr'), '0 leçon');
    assert.equal(resolve('common.lessons', { count: 2 }, 'fr'), '2 leçons');
    assert.equal(resolve('not.a.key' as MessageKey, undefined, 'fr'), 'not.a.key');
    if (catalogs.get('fr')) registerCatalog('fr', catalogs.get('fr') as Catalog);
  });

  test('the active locale drives t()', () => {
    assert.equal(t('common.continue'), 'Continue');
    if (catalogs.has('pt-BR')) {
      registerCatalog('pt-BR', catalogs.get('pt-BR') as Catalog);
      setActiveLocale('pt-BR');
      assert.notEqual(t('common.continue'), 'Continue');
      setActiveLocale('en');
    }
    assert.equal(translator('en')('common.continue'), 'Continue');
  });

  test('numbers, percentages, dates and lists', () => {
    assert.equal(formatNumber(0.5, 'pt-BR'), '0,5');
    assert.equal(formatPercent(0.42, 'en'), '42%');
    assert.equal(formatPercent(0.42, 'fr'), '42 %');
    const d = Date.UTC(2026, 9, 7, 12);
    assert.equal(formatDate(d, undefined, 'en'), 'October 7, 2026');
    assert.equal(formatDate(d, undefined, 'pt-BR'), '7 de outubro de 2026');
    assert.equal(formatDate(d, undefined, 'es'), '7 de octubre de 2026');
    assert.equal(formatDate(d, undefined, 'fr'), '7 octobre 2026');
    assert.equal(formatList(['a', 'b', 'c'], 'en'), 'a, b, and c');
    assert.equal(formatList(['a', 'b', 'c'], 'pt-BR'), 'a, b e c');
    assert.equal(formatList(['a', 'b'], 'es'), 'a y b');
    assert.equal(formatList(['a', 'b'], 'fr'), 'a et b');
  });
});

describe('certificates in other languages', () => {
  test('hours and name problems follow the locale', () => {
    assert.equal(formatHours(90, 'en'), '1.5 hours');
    if (catalogs.size === others.length) {
      for (const l of others) registerCatalog(l, catalogs.get(l) as Catalog);
      assert.match(formatHours(90, 'pt-BR'), /^1,5 /);
      assert.match(formatHours(90, 'fr'), /^1,5 /);
      assert.notEqual(checkName('A', 'es').problem, checkName('A', 'en').problem);
      const links = shareLinks({ id: 'K7Q2-M9XD', name: 'Ada', courseTitle: 'Tout apprendre plus vite', minutes: 90, lessons: 6, issuedAt: 0 }, 'https://x.test', 'fr');
      assert.match(new URL(links.x).searchParams.get('text')!, /Tout apprendre plus vite/);
    }
    assert.equal(checkName('A', 'en').key, 'cert.name.empty');
    assert.deepEqual(checkName('Ana Šimić', 'en').params, { chars: 'ć' });
  });

  test('the PDF is written in the locale, and French spacing prints', () => {
    assert.equal(pdfString('42 %'), '(42\\240%)', 'narrow no-break space becomes a no-break space');
    if (!catalogs.has('fr')) return;
    registerCatalog('fr', catalogs.get('fr') as Catalog);
    const pdf = certificatePdf(
      { id: 'K7Q2-M9XD', name: 'Zoé', courseTitle: 'Tout apprendre plus vite', minutes: 190, lessons: 6, issuedAt: Date.UTC(2026, 9, 7), color: '#e8590c' },
      undefined,
      'fr',
    );
    assert.ok(/^[\x00-\x7f]*$/.test(pdf), 'still ASCII');
    assert.ok(pdf.includes('octobre 2026'), 'French date');
    assert.ok(!pdf.includes('Certificate of completion') && !pdf.includes('CERTIFICATE'), 'no English labels');
  });
});

// ---------- course translations ----------

const enCourse = JSON.parse(readFileSync(join(root, 'src/content/topics/learn-anything-fast.json'), 'utf8'));
const copy = () => structuredClone(enCourse);

describe('translation validator', () => {
  test('an untouched copy is a valid translation', () => {
    assert.deepEqual(validateCourseTranslation(enCourse, copy(), 'x'), []);
  });

  test('accepts translated text', () => {
    const tr = copy();
    tr.title = 'Aprenda qualquer coisa rápido';
    tr.lessons[0].steps[2].choices = tr.lessons[0].steps[2].choices.map((c: string) => `pt: ${c}`);
    tr.lessons[1].steps[5].accept = ['teste'];
    tr.concepts[0].aliases = ['regra 80/20'];
    tr.lessons[0].steps[5].items[0].text = 'SOMA e MÉDIA';
    assert.deepEqual(validateCourseTranslation(enCourse, tr, 'x'), []);
  });

  test('rejects changed ids, answers, step types and structure', () => {
    const cases: [string, (tr: any) => void, RegExp][] = [
      ['lesson id', (tr) => (tr.lessons[0].id = 'x'), /lessons\[0\]\.id: must stay identical/],
      ['mcq answer', (tr) => (tr.lessons[0].steps[2].answer = 0), /steps\[2\]\.answer/],
      ['question id', (tr) => (tr.lessons[0].steps[2].id = 'q-other'), /steps\[2\]\.id/],
      ['concept tags', (tr) => (tr.lessons[0].steps[2].concepts = ['long-tail']), /steps\[2\]\.concepts/],
      ['bucket index', (tr) => (tr.lessons[0].steps[5].items[0].bucket = 1), /items\[0\]\.bucket/],
      ['numeric answer', (tr) => (tr.lessons[2].steps[4].answer = 61), /steps\[4\]\.answer/],
      ['choice count', (tr) => tr.lessons[0].steps[2].choices.pop(), /must have 4 entries/],
      ['removed step', (tr) => tr.lessons[0].steps.pop(), /must have 7 entries/],
      ['step type', (tr) => (tr.lessons[0].steps[0].type = 'example'), /step type must be "explain"/],
      ['missing hint', (tr) => delete tr.lessons[0].steps[2].hint, /missing field "hint"/],
      ['extra field', (tr) => (tr.lessons[0].steps[4].hint = 'x'), /unexpected field "hint"/],
      ['empty text', (tr) => (tr.lessons[0].title = ' '), /lessons\[0\]\.title: must be a non-empty string/],
      ['link target', (tr) => (tr.links[0].to = 'long-tail'), /links\[0\]\.to/],
      ['category', (tr) => (tr.category = 'Aprendizagem'), /category: must stay identical/],
      ['empty accept list', (tr) => (tr.lessons[1].steps[5].accept = []), /accept: must be a non-empty list/],
      ['lost paragraph', (tr) => (tr.lessons[0].steps[0].body = 'Um parágrafo só.'), /same paragraphs/],
      ['lost bullet', (tr) => (tr.lessons[0].steps[1].body = tr.lessons[0].steps[1].body.replace(/\n- [^\n]+$/, '')), /same list items/],
    ];
    for (const [name, mutate, re] of cases) {
      const tr = copy();
      mutate(tr);
      const errs = validateCourseTranslation(enCourse, tr, 'x');
      assert.ok(errs.some((e) => re.test(e)), `${name}: expected ${re}, got ${JSON.stringify(errs.slice(0, 3))}`);
    }
  });

  test('code must be copied unchanged', () => {
    const en = { title: 'T', body: 'Run `print(x)` then\n\n```python\nprint(1)\n```' };
    const fields = { kind: 'shape', fields: { title: 'T', body: 'T' } } as const;
    assert.deepEqual(validateTranslation(en, { title: 'X', body: 'Rode `print(x)` e\n\n```python\nprint(1)\n```' }, '', fields as never), []);
    assert.match(validateTranslation(en, { title: 'X', body: 'Rode `imprimir(x)` e\n\n```python\nprint(1)\n```' }, '', fields as never)[0], /inline code/);
    assert.match(validateTranslation(en, { title: 'X', body: 'Rode `print(x)` e\n\n```python\nimprimir(1)\n```' }, '', fields as never)[0], /code blocks/);
    assert.deepEqual(codeOf('a `b` c `a`'), { blocks: [], inline: ['`a`', '`b`'] });
  });

  test('logic grids: the solution must name the translated items at the same positions', () => {
    const en = {
      categories: [
        { name: 'Person', items: ['Ana', 'Ben', 'Cy'] },
        { name: 'Pet', items: ['cat', 'dog', 'fish'] },
      ],
      solution: [['fish'], ['cat'], ['dog']],
    };
    const good = { categories: [en.categories[0], { name: 'Pet', items: ['gato', 'cão', 'peixe'] }], solution: [['peixe'], ['gato'], ['cão']] };
    assert.deepEqual(checkGridStep(en, good, 'x'), []);
    const bad = { ...good, solution: [['gato'], ['peixe'], ['cão']] };
    assert.equal(checkGridStep(en, bad, 'x').length, 2);
  });

  test('roadmap translations', () => {
    const roadmap = JSON.parse(readFileSync(join(root, 'src/content/roadmap.json'), 'utf8'));
    const tr = structuredClone(roadmap);
    tr.tracks[0].title = 'Desenvolvedor back-end Python';
    assert.deepEqual(validateTranslation(roadmap, tr, '', ROADMAP_FIELDS), []);
    tr.tracks[0].nodes[1].after = [];
    assert.equal(validateTranslation(roadmap, tr, '', ROADMAP_FIELDS).length, 1);
  });

  test('shipped translations are valid courses and faithful mirrors', () => {
    const dir = join(root, 'src/content/topics');
    for (const locale of others) {
      if (!existsSync(join(dir, locale))) continue;
      for (const f of readdirSync(join(dir, locale)).filter((x) => x.endsWith('.json'))) {
        const tr = JSON.parse(readFileSync(join(dir, locale, f), 'utf8'));
        const en = JSON.parse(readFileSync(join(dir, f), 'utf8'));
        assert.deepEqual(validateCourse(tr, f), [], `${locale}/${f} as a course`);
        assert.deepEqual(validateCourseTranslation(en, tr, f), [], `${locale}/${f} as a translation`);
        // Notation (O(n log n)), names and real tool output stay English on purpose: shipped courses sit
        // at 0–8%. A forgotten lesson pushes a course well past 10%.
        const { same, total } = textStats(en, tr);
        assert.ok(same / total <= 0.1, `${locale}/${f}: ${same} of ${total} text fields still identical to English`);
      }
    }
  });
});

describe('switching a course in place', () => {
  test('overlay swaps text without replacing objects, and back', () => {
    const live = copy();
    const lesson = live.lessons[0];
    const step = lesson.steps[2];
    const tr = copy();
    tr.lessons[0].title = 'Título';
    tr.lessons[0].steps[2].choices = ['a', 'b', 'c', 'd'];
    overlay(live, tr);
    assert.equal(live.lessons[0], lesson, 'same lesson object');
    assert.equal(live.lessons[0].steps[2], step, 'same step object');
    assert.equal(lesson.title, 'Título');
    assert.deepEqual(step.choices, ['a', 'b', 'c', 'd']);
    overlay(live, enCourse);
    assert.ok(deepEqual(live, enCourse), 'back to English');
  });
});

describe('the language follows the learner', () => {
  test('merging progress keeps the newer side\'s language choice', () => {
    const a = { ...emptyProgress(), locale: 'fr' as const, updatedAt: 2 };
    const b = { ...emptyProgress(), locale: 'es' as const, updatedAt: 1 };
    assert.equal(mergeProgress(a, b).locale, 'fr');
    assert.equal(mergeProgress(b, a).locale, 'fr');
    const none = { ...emptyProgress(), updatedAt: 5 };
    assert.equal(mergeProgress(none, b).locale, 'es', 'a side that never chose does not erase the choice');
    assert.equal(mergeProgress(none, { ...emptyProgress() }).locale, undefined);
  });
});
