// English UI strings: quiz. The end-of-course quiz and its results screen (src/components/Quiz.tsx).
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  'quiz.noQuestions': 'This course has no questions yet.',
  'quiz.back': '← Back',
  // Session title, also saved as the title of the learner's thinking sheet. {title} is the course name.
  'quiz.ritualTitle': 'Quiz: {title}',

  // Results. {right} of {total} answers were correct; the second sentence depends on the score.
  'quiz.end.summaryHigh': "{right} of {total} correct. You've got the core of this course.",
  'quiz.end.summaryMid': '{right} of {total} correct. Solid start — focus on the gaps below.',
  'quiz.end.summaryLow': '{right} of {total} correct. Great diagnostic: now you know exactly where to start.',
  // Result tiles (short labels).
  'quiz.end.xpEarned': 'XP earned',
  'quiz.end.xpGain': '+{xp}',
  'quiz.end.toStudy': 'To study',
  'quiz.end.solid': 'Solid',
  'quiz.end.studyThese': 'Study these',
  // Next to a lesson: {missed} of its {total} quiz questions were wrong.
  'quiz.end.missed': 'missed {missed} of {total}',
  'quiz.end.solidTitle': 'Looking solid — you can skip these',
  'quiz.end.reviewNote': 'Missed questions come back in your Review queue.',
  'quiz.end.backToCourse': 'Back to course',
  'quiz.end.retake': 'Retake quiz',
} satisfies Record<string, Message>;
