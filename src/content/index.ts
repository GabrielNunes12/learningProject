import { useEffect, useSyncExternalStore } from 'react';
import { isQuestion, type Course, type CourseFile, type LessonInfo, type QuestionInfo, type QuestionStep, type Step } from '../types';
import { withLessons, type CatalogEntry } from './catalog';
import roadmapData from './roadmap.json';
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

/** Loads a course's steps once. */
export function loadCourse(id: string): Promise<void> {
  let request = requests.get(id);
  if (request) return request;
  const file = fileOf.get(id);
  request = (file ? content[file]() : Promise.reject(new Error(`No course "${id}"`))).then(
    (data) => {
      for (const lesson of data.units ? data.units.flatMap((u) => u.lessons) : (data.lessons ?? [])) {
        stepsByLesson.set(lessonKey(id, lesson.id), lesson.steps);
        for (const step of lesson.steps) if (isQuestion(step)) stepsByQuestion.set(questionKey(id, lesson.id, step.id), step);
      }
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
