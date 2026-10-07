import { allQuestions, lessonKey } from '../content';
import type { Course, LessonInfo } from '../types';
import { MASTERED_BOX, type Progress } from './storage';

export function courseStats(course: Course, p: Progress) {
  const done = (l: LessonInfo) => Boolean(p.completed[lessonKey(course.id, l.id)]);
  const core = course.lessons.filter((l) => l.pareto === 'core');
  const questions = allQuestions.filter((q) => q.course.id === course.id);
  const mastered = questions.filter((q) => (p.cards[q.key]?.box ?? 0) >= MASTERED_BOX).length;
  // 80/20: every core lesson comes before any deep dive.
  const next = core.find((l) => !done(l)) ?? course.lessons.find((l) => !done(l));
  return {
    done,
    completed: course.lessons.filter(done).length,
    total: course.lessons.length,
    coreDone: core.filter(done).length,
    coreTotal: core.length,
    questionCount: questions.length,
    mastery: questions.length ? mastered / questions.length : 0,
    minutes: course.lessons.reduce((s, l) => s + (l.minutes ?? 5), 0),
    coreMinutes: core.reduce((s, l) => s + (l.minutes ?? 5), 0),
    started: course.lessons.some(done) || questions.some((q) => p.cards[q.key]),
    next,
  };
}
