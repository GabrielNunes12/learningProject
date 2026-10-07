import { isQuestion, type Course, type CourseFile, type Lesson, type QuestionStep, type Unit } from '../types';
import roadmapData from './roadmap.json';
import { overlay, ROADMAP_FIELDS, validateCourseTranslation, validateTranslation } from './translation';
import { validateConceptCoverage, validateConceptRefs, validateCourse, validateRoadmap } from './validate';

// Every JSON file in ./topics becomes a course. Add a file, refresh, done.
const modules = import.meta.glob<unknown>('./topics/*.json', { eager: true, import: 'default' });

export const contentErrors: string[] = [];

const loaded: Course[] = [];
/** Each course's file as loaded (English). */
const files = new Map<string, CourseFile>();
for (const [file, data] of Object.entries(modules)) {
  const name = file.replace('./topics/', '');
  const errs = validateCourse(data, name);
  if (errs.length) {
    contentErrors.push(...errs);
    continue;
  }
  // Coverage gaps are reported in the banner but don't hide the course.
  contentErrors.push(...validateConceptCoverage(data, name));
  const raw = data as CourseFile;
  if (loaded.some((c) => c.id === raw.id)) {
    contentErrors.push(`${name}: course id "${raw.id}" is already used by another file`);
    continue;
  }
  files.set(raw.id, raw);
  const units: Unit[] = raw.units ?? [{ id: 'lessons', title: 'Lessons', lessons: raw.lessons ?? [] }];
  loaded.push({ ...raw, category: raw.category ?? 'General', units, lessons: units.flatMap((u) => u.lessons) });
}

export const courses: Course[] = loaded.sort(
  (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title),
);

contentErrors.push(...validateConceptRefs(loaded));

export const categories = [...new Set(courses.map((c) => c.category!))];

export const getCourse = (id: string) => courses.find((c) => c.id === id);

export const lessonKey = (courseId: string, lessonId: string) => `${courseId}/${lessonId}`;
export const questionKey = (courseId: string, lessonId: string, stepId: string) => `${courseId}/${lessonId}/${stepId}`;

export const unitOf = (course: Course, lesson: Lesson) => course.units.find((u) => u.lessons.includes(lesson))!;

export interface QuestionRef {
  key: string;
  course: Course;
  lesson: Lesson;
  step: QuestionStep;
}

export const allQuestions: QuestionRef[] = courses.flatMap((course) =>
  course.lessons.flatMap((lesson) =>
    lesson.steps.filter(isQuestion).map((step) => ({
      key: questionKey(course.id, lesson.id, step.id),
      course,
      lesson,
      step,
    })),
  ),
);

export const questionByKey = new Map(allQuestions.map((q) => [q.key, q]));

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
// docs/TRANSLATING.md); the roadmap's is src/content/roadmap.<locale>.json. They are NOT bundled: each file is
// its own chunk, fetched when the learner picks that language. Courses without a translation stay English.
//
// Switching language copies the translated text onto the course objects in place (`overlay`), so every
// course, lesson and step object the app already holds (open lessons, review queues, quiz state) shows the
// new language without being replaced. English text is kept in `pristine` to switch back.

const translatedCourses = import.meta.glob<unknown>('./topics/*/*.json', { import: 'default' });
const translatedRoadmaps = import.meta.glob<unknown>('./roadmap.*.json', { import: 'default' });

/** English originals of every course and the roadmap, cloned before the first overlay. */
let pristine: { courses: Map<string, CourseFile>; roadmap: unknown } | null = null;
/** Courses built from a flat "lessons" list get a made-up unit; its title follows the language. */
const flatCourses = new Set([...files.values()].filter((f) => !f.units).map((f) => f.id));

/** Which courses have a translation in each locale (from the file names; nothing is loaded). */
export const translatedCourseIds = (locale: string) =>
  Object.keys(translatedCourses)
    .filter((f) => f.startsWith(`./topics/${locale}/`))
    .map((f) => f.slice(`./topics/${locale}/`.length, -'.json'.length));

/**
 * Puts every course (and the roadmap) into `locale`: loads that locale's translation files, checks each against
 * its English file, and overlays the text. Courses without a valid translation fall back to English.
 * `lessonsUnit` is the translated title for the unit of flat-lesson courses.
 */
export async function loadContentLocale(locale: string, lessonsUnit: string): Promise<void> {
  const prefix = `./topics/${locale}/`;
  const paths = locale === 'en' ? [] : Object.keys(translatedCourses).filter((f) => f.startsWith(prefix));
  const roadmapFile = `./roadmap.${locale}.json`;
  const [loaded, roadmapTr] = await Promise.all([
    Promise.all(paths.map(async (f) => [f.slice(prefix.length, -'.json'.length), await translatedCourses[f]()] as const)),
    locale !== 'en' && translatedRoadmaps[roadmapFile] ? translatedRoadmaps[roadmapFile]() : Promise.resolve(undefined),
  ]);
  pristine ??= { courses: new Map([...files].map(([id, f]) => [id, structuredClone(f)])), roadmap: structuredClone(roadmapData) };
  const byId = new Map(loaded);
  for (const course of courses) {
    const en = pristine.courses.get(course.id)!;
    let src: unknown = en;
    const tr = byId.get(course.id);
    if (tr) {
      const errs = [...validateCourse(tr, `${locale}/${course.id}.json`), ...validateCourseTranslation(en, tr, `${locale}/${course.id}.json`)];
      if (errs.length) {
        // A broken translation must not break the course: show English and report it (npm run check:content catches it first).
        console.warn(`Translation skipped:\n${errs.slice(0, 20).join('\n')}`);
        if (import.meta.env.DEV) contentErrors.push(...errs.slice(0, 5));
      } else src = tr;
    }
    overlay(course, src);
    if (flatCourses.has(course.id)) course.units[0].title = lessonsUnit;
  }
  if (tracks.length) {
    const tr = roadmapTr && !validateTranslation(pristine.roadmap, roadmapTr, `roadmap.${locale}.json`, ROADMAP_FIELDS).length ? roadmapTr : pristine.roadmap;
    overlay({ tracks }, tr);
  }
}
