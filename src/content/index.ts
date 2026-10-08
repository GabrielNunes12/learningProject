import { useEffect, useSyncExternalStore } from 'react';
import { isQuestion, type Course, type CourseFile, type LessonInfo, type QuestionInfo, type QuestionStep, type Step } from '../types';
import { prerequisites } from '../lib/diagnose';
import { withLessons, type CatalogEntry } from './catalog';
import roadmapData from './roadmap.json';
import { overlay, ROADMAP_FIELDS, validateCourseTranslation, validateTranslation } from './translation';
import { validateConceptCoverage, validateConceptRefs, validateCourse, validateRoadmap } from './validate';

// Every JSON file in ./topics becomes a course. Add a file, refresh, done.
// The catalog (everything but step bodies) is bundled up front; each course's steps are a chunk loaded on demand.
const catalog = import.meta.glob<CatalogEntry>('./topics/*.json', { eager: true, query: '?catalog', import: 'default' });
const content = import.meta.glob<CourseFile>('./topics/*.json', { import: 'default' });

export const contentErrors: string[] = [];

// Validating a course needs its steps, so the app does it in development only. `npm run check:content`
// (also the first step of `npm run build`) validates the same files before anything ships.
const invalid = new Set<string>();
if (import.meta.env.DEV) {
  const files = await Promise.all(Object.entries(content).map(async ([file, load]) => [file, await load()] as const));
  for (const [file, data] of files) {
    const name = file.replace('./topics/', '');
    const errs = validateCourse(data, name);
    if (errs.length) invalid.add(file);
    // Coverage gaps are reported in the banner but don't hide the course.
    contentErrors.push(...(errs.length ? errs : validateConceptCoverage(data, name)));
  }
}

/** Course id → its file's key in the globs above. */
const fileOf = new Map<string, string>();
const loaded: Course[] = [];
for (const [file, entry] of Object.entries(catalog)) {
  if (invalid.has(file)) continue;
  if (fileOf.has(entry.id)) {
    contentErrors.push(`${file.replace('./topics/', '')}: course id "${entry.id}" is already used by another file`);
    continue;
  }
  fileOf.set(entry.id, file);
  loaded.push(withLessons(entry));
}

export const courses: Course[] = loaded.sort(
  (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title),
);

if (import.meta.env.DEV) contentErrors.push(...validateConceptRefs(loaded));

export const categories = [...new Set(courses.map((c) => c.category))];

// Built now, while link labels are still English: a language switch rewrites them in place (see `overlay` below).
const prereqGraphs = new Map(
  courses.map((c) => {
    const lessonOf = new Map((c.concepts ?? []).map((k) => [k.id, c.lessons.findIndex((l) => l.id === k.lesson)]));
    return [c.id, prerequisites(c.links ?? [], (id) => (lessonOf.get(id) ?? -1) >= 0 ? lessonOf.get(id) : undefined)];
  }),
);
/** A course's prerequisite graph: each concept's direct prerequisites (lib/diagnose.ts). */
export const prerequisiteGraph = (courseId: string) => prereqGraphs.get(courseId) ?? new Map<string, string[]>();

export const getCourse = (id: string) => courses.find((c) => c.id === id);

export const lessonKey = (courseId: string, lessonId: string) => `${courseId}/${lessonId}`;
export const questionKey = (courseId: string, lessonId: string, stepId: string) => `${courseId}/${lessonId}/${stepId}`;

export const unitOf = (course: Course, lesson: LessonInfo) => course.units.find((u) => u.lessons.includes(lesson))!;

/** A graded question as the catalog knows it. The full step comes from questionStep once its course has loaded. */
export interface QuestionRef {
  key: string;
  course: Course;
  lesson: LessonInfo;
  step: QuestionInfo;
}

export const allQuestions: QuestionRef[] = courses.flatMap((course) =>
  course.lessons.flatMap((lesson) =>
    lesson.questions.map((step) => ({
      key: questionKey(course.id, lesson.id, step.id),
      course,
      lesson,
      step,
    })),
  ),
);

export const questionByKey = new Map(allQuestions.map((q) => [q.key, q]));

// ---------- lesson steps: one chunk per course, loaded on demand ----------

const stepsByLesson = new Map<string, Step[]>();
const stepsByQuestion = new Map<string, QuestionStep>();
const requests = new Map<string, Promise<void>>();
const ready = new Set<string>();
const failed = new Set<string>();

const listeners = new Set<() => void>();
let version = 0;
function changed() {
  version++;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const lessonsOf = (file: CourseFile) => (file.units ? file.units.flatMap((u) => u.lessons) : (file.lessons ?? []));

/** Loads a course's steps once, in the current content language. */
export function loadCourse(id: string): Promise<void> {
  let request = requests.get(id);
  if (request) return request;
  const file = fileOf.get(id);
  request = (file ? content[file]() : Promise.reject(new Error(`No course "${id}"`))).then(
    async (data) => {
      // Translations are copied onto these step objects in place; this copy keeps the English to check them against and to switch back.
      englishFiles.set(id, structuredClone(data));
      for (const lesson of lessonsOf(data)) {
        stepsByLesson.set(lessonKey(id, lesson.id), lesson.steps);
        for (const step of lesson.steps) if (isQuestion(step)) stepsByQuestion.set(questionKey(id, lesson.id, step.id), step);
      }
      // A translation that fails to download leaves the steps in English rather than the lesson unopenable.
      await localizeSteps(id).catch((err: unknown) => console.error(`Could not load the ${contentLocale} text of ${id}`, err));
      ready.add(id);
      changed();
    },
    (err: unknown) => {
      failed.add(id);
      changed();
      throw err;
    },
  );
  requests.set(id, request);
  return request;
}

/** Starts loading courses the learner is likely to open next. */
export function preloadCourses(ids: Iterable<string>) {
  for (const id of ids) loadCourse(id).catch(() => {});
}

/** A lesson's steps, once its course has loaded. */
export const lessonSteps = (courseId: string, lessonId: string) => stepsByLesson.get(lessonKey(courseId, lessonId));

/** A question's full step, once its course has loaded. */
export const questionStep = (key: string) => stepsByQuestion.get(key);

export type ContentStatus = 'loading' | 'ready' | 'error';

/**
 * Loads the steps of the given courses and re-renders as they arrive. After an 'error' (offline, or a chunk gone
 * after a deploy) only a page reload helps: browsers remember a failed import() and won't fetch it again.
 */
export function useCourseContent(ids: string[]): ContentStatus {
  useSyncExternalStore(subscribe, () => version);
  const key = [...new Set(ids)].sort().join(',');
  useEffect(() => {
    if (key) preloadCourses(key.split(','));
  }, [key]);
  const wanted = key ? key.split(',') : [];
  return wanted.some((id) => failed.has(id)) ? 'error' : wanted.every((id) => ready.has(id)) ? 'ready' : 'loading';
}

// ---------- roadmap: goal-based tracks that chain courses together ----------

export interface TrackNode {
  course: string;
  /** Courses (earlier nodes) to take first. */
  after?: string[];
  note?: string;
}
export interface Track {
  id: string;
  title: string;
  icon: string;
  description: string;
  nodes: TrackNode[];
}

const roadmapErrors = validateRoadmap(roadmapData, courses.map((c) => c.id));
contentErrors.push(...roadmapErrors);
export const tracks: Track[] = roadmapErrors.length ? [] : (roadmapData as { tracks: Track[] }).tracks;

// ---------- translations: course text in the learner's language, loaded on demand ----------
//
// A translated course is src/content/topics/<locale>/<course id>.json, a mirror of the English file (see
// docs/TRANSLATING.md); the roadmap's is src/content/roadmap.<locale>.json. Nothing is bundled, and translations
// load in the same two layers as English: picking a language fetches that language's catalogs (titles, summaries,
// concepts: everything but step bodies) for every course, and a course's translated steps come with its steps.
//
// Translated text is copied onto the catalog and step objects in place (`overlay`), so every course, lesson and
// step object the app already holds (open lessons, review queues, quiz state) shows the new language without
// being replaced. The English is kept (`englishCatalog`, `englishFiles`) to check translations against and to
// switch back. A translation that doesn't mirror its English file is skipped, so that course stays English;
// `npm run check:content` keeps such files from shipping.

const translatedCatalogs = import.meta.glob<CatalogEntry>('./topics/*/*.json', { query: '?catalog', import: 'default' });
const translatedContent = import.meta.glob<CourseFile>('./topics/*/*.json', { import: 'default' });
const translatedRoadmaps = import.meta.glob<unknown>('./roadmap.*.json', { import: 'default' });

/** The language course text is currently in. */
let contentLocale = 'en';
/** English catalog entries, cloned before the first overlay. */
let englishCatalog: Map<string, CatalogEntry> | null = null;
let englishRoadmap: unknown = null;
/** English course files of the loaded courses. */
const englishFiles = new Map<string, CourseFile>();
/** Courses built from a flat "lessons" list get a made-up unit (src/content/catalog.ts); its title follows the language. */
const flatCourses = new Set(Object.values(catalog).filter((e) => e.units.length === 1 && e.units[0].id === 'lessons').map((e) => e.id));

function reportTranslation(errs: string[]) {
  // A broken translation must not break the course: it stays English, and the problem is reported.
  console.warn(`Translation skipped:\n${errs.slice(0, 20).join('\n')}`);
  if (import.meta.env.DEV) {
    contentErrors.push(...errs.slice(0, 5));
    changed();
  }
}

/**
 * Fetched translation files, per glob and path: the catalog and content globs share paths (only the query
 * differs), so one cache for both would hand back a catalog where a full file was asked for. A failed fetch is
 * forgotten so a later switch can retry it.
 */
const fetched = new Map<object, Map<string, Promise<unknown>>>();
function fetchOnce<T>(glob: Record<string, () => Promise<T>>, path: string): Promise<T> | undefined {
  if (!glob[path]) return undefined;
  let cache = fetched.get(glob);
  if (!cache) fetched.set(glob, (cache = new Map()));
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = glob[path]();
    cache.set(path, p);
    p.catch(() => cache.delete(path));
  }
  return p;
}

/** A course's translated catalog entry, or undefined when it has none (or an invalid one) in `locale`. */
async function translatedCatalog(locale: string, id: string): Promise<CatalogEntry | undefined> {
  if (locale === 'en') return undefined;
  const name = fileOf.get(id)?.replace('./topics/', '');
  const tr = await fetchOnce(translatedCatalogs, `./topics/${locale}/${name}`);
  if (!tr) return undefined;
  const errs = validateCourseTranslation(englishCatalog!.get(id), tr, `${locale}/${name}`);
  if (errs.length) return void reportTranslation(errs);
  return tr;
}

/** A loaded course's translated file, or undefined when it has none (or an invalid one) in `locale`. */
async function translatedFile(locale: string, id: string): Promise<CourseFile | undefined> {
  if (locale === 'en') return undefined;
  const name = fileOf.get(id)?.replace('./topics/', '');
  const tr = await fetchOnce(translatedContent, `./topics/${locale}/${name}`);
  if (!tr) return undefined;
  const errs = [...validateCourse(tr, `${locale}/${name}`), ...validateCourseTranslation(englishFiles.get(id), tr, `${locale}/${name}`)];
  if (errs.length) return void reportTranslation(errs);
  return tr;
}

/** Copies a course file's step text onto the loaded steps. */
function applySteps(id: string, src: CourseFile) {
  for (const lesson of lessonsOf(src)) {
    const live = stepsByLesson.get(lessonKey(id, lesson.id));
    if (live) overlay({ steps: live }, { steps: lesson.steps });
  }
}

/** Puts a just-loaded course's steps into the current language (again, if the language changes meanwhile). */
async function localizeSteps(id: string) {
  for (;;) {
    const locale = contentLocale;
    const tr = await translatedFile(locale, id);
    if (locale !== contentLocale) continue;
    applySteps(id, tr ?? englishFiles.get(id)!);
    return;
  }
}

/**
 * Puts every course (and the roadmap) into `locale`. Everything is downloaded first and applied in one go, so a
 * failed download (offline) rejects and leaves the content in its current language rather than half-switched.
 * `lessonsUnit` is the translated title for the unit of flat-lesson courses.
 */
export async function loadContentLocale(locale: string, lessonsUnit: string): Promise<void> {
  englishCatalog ??= new Map(courses.map((c) => [c.id, structuredClone(catalog[fileOf.get(c.id)!])]));
  englishRoadmap ??= structuredClone(roadmapData);
  const loadedIds = [...ready];
  const roadmapFile = `./roadmap.${locale}.json`;
  const [catalogs, files, roadmapTr] = await Promise.all([
    Promise.all(courses.map((c) => translatedCatalog(locale, c.id))),
    Promise.all(loadedIds.map((id) => translatedFile(locale, id))),
    locale === 'en' ? undefined : fetchOnce(translatedRoadmaps, roadmapFile),
  ]);
  contentLocale = locale;
  courses.forEach((course, i) => {
    overlay(course, catalogs[i] ?? englishCatalog!.get(course.id)!);
    if (flatCourses.has(course.id)) course.units[0].title = lessonsUnit;
  });
  loadedIds.forEach((id, i) => applySteps(id, files[i] ?? englishFiles.get(id)!));
  // Courses that finished loading during the downloads above.
  for (const id of ready) if (!loadedIds.includes(id)) localizeSteps(id).then(changed, () => {});
  if (tracks.length) {
    const ok = roadmapTr !== undefined && !validateTranslation(englishRoadmap, roadmapTr, `roadmap.${locale}.json`, ROADMAP_FIELDS).length;
    overlay({ tracks }, ok ? roadmapTr : englishRoadmap);
  }
  changed();
}
