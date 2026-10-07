// The course catalog: each course file minus its step bodies. The app bundles the catalog for every course up front
// (via the `?catalog` import handled in vite.config.ts) and loads a course's steps only when a lesson or session
// needs them. Runs under both Vite and node (tests), like validate.ts.
import { isQuestion, type Course, type CourseFile, type LessonInfo, type Unit } from '../types.ts';

/** What `topics/<file>.json?catalog` exports. `lessons` is left out so the bundle doesn't carry every lesson twice. */
export type CatalogEntry = Omit<Course, 'lessons'>;

/**
 * Strips a course file down to its catalog entry. Tolerates a malformed file (dev only: invalid courses are reported
 * and skipped by src/content/index.ts) rather than breaking the dev server.
 */
export function toCatalog(file: CourseFile): CatalogEntry {
  const { units, lessons, ...course } = file;
  const all: Unit[] = Array.isArray(units) ? units : [{ id: 'lessons', title: 'Lessons', lessons: lessons ?? [] }];
  return {
    ...course,
    category: course.category ?? 'General',
    units: all.map(({ lessons: ls, ...unit }) => ({
      ...unit,
      lessons: (Array.isArray(ls) ? ls : []).map(({ steps, ...lesson }): LessonInfo => {
        const list = Array.isArray(steps) ? steps : [];
        return {
          ...lesson,
          stepCount: list.length,
          questions: list.filter(isQuestion).map(({ id, type, concepts }) => (concepts ? { id, type, concepts } : { id, type })),
        };
      }),
    })),
  };
}

/** A catalog entry as the app uses it: with every lesson flattened in order (the same objects as in its units). */
export const withLessons = (entry: CatalogEntry): Course => ({ ...entry, lessons: entry.units.flatMap((u) => u.lessons) });
