// English UI strings: quiz. The end-of-course quiz and its results screen (src/components/Quiz.tsx).
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  'quiz.noQuestions': 'This course has no questions yet.',
  'quiz.back': '← Back',
  // Session title, also saved as the title of the learner's thinking sheet. {title} is the course name.
  'quiz.ritualTitle': 'Quiz: {title}',

  // Result tiles (short labels).
  'quiz.end.xpEarned': 'XP earned',
  'quiz.end.xpGain': '+{xp}',
  'quiz.end.toStudy': 'To study',
  'quiz.end.solid': 'Solid',
  'quiz.end.studyThese': 'Study these',
  'quiz.end.solidTitle': 'Looking solid — you can skip these',
  'quiz.end.reviewNote': 'Missed questions come back in your Review queue.',

  // Find your level: the quiz goes easy to hard (one question per lesson, in course order) and stops after two answers in a row that were missed, guessed or "I don't know". {lesson} is a lesson title; {count} is a number of lessons.
  'quiz.level.eyebrow': 'Your level',
  'quiz.level.startAt': 'Start at “{lesson}”',
  'quiz.level.stoppedLead': { one: 'You answered {count} lesson with conviction, then started guessing. That edge is where learning happens: start there.', other: 'You answered {count} lessons with conviction, then started guessing. That edge is where learning happens: start there.' },
  'quiz.level.stoppedFirst': 'You started guessing right away. Start at the beginning: that edge is where learning happens.',
  'quiz.level.allTitle': 'You know this course',
  'quiz.level.allLead': 'Every lesson answered right, and you were sure each time.',
  'quiz.level.patchTitle': 'Almost there',
  'quiz.level.patchLead': 'You reached the end. Patch the lessons you missed or guessed and you know this course.',
  'quiz.level.startButton': 'Start this lesson',
  'quiz.level.reason.missed': 'missed',
  'quiz.level.reason.guessed': 'guessed',
  'quiz.level.reason.unknown': "didn't know",
  'quiz.level.notReached': { one: '{count} later lesson wasn’t reached: it builds on these.', other: '{count} later lessons weren’t reached: they build on these.' },
  'quiz.level.howItWorks': "Questions get harder lesson by lesson, and the quiz stops where you start guessing or missing. Mark “I'm guessing” whenever you aren't sure.",
  'quiz.end.backToCourse': 'Back to course',
  'quiz.end.retake': 'Retake quiz',
} satisfies Record<string, Message>;
