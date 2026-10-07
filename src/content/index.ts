import { isQuestion, type Course, type CourseFile, type Lesson, type QuestionStep, type Unit } from '../types';
import roadmapData from './roadmap.json';
import { validateConceptCoverage, validateConceptRefs, validateCourse, validateRoadmap } from './validate';

// Every JSON file in ./topics becomes a course. Add a file, refresh, done.
const modules = import.meta.glob<unknown>('./topics/*.json', { eager: true, import: 'default' });

export const contentErrors: string[] = [];

const loaded: Course[] = [];
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
