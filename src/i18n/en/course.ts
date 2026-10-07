// English UI strings: course. A course's page, its learning path map and its cheat sheet
// (src/components/CoursePage.tsx, CoursePath.tsx, CheatSheet.tsx).
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  'course.allCourses': '← All courses',
  // Eyebrow above the course title: "Programming · Beginner".
  'course.categoryLevel': '{category} · {level}',
  // Main hero button.
  'course.continue': 'Continue →',
  'course.startLearning': 'Start learning →',
  'course.takeQuiz': 'Take the quiz',
  // For learners who haven't started: take the quiz to see what they already know.
  'course.testOut': 'Test out with the quiz',
  // Unit heading in the path ("Unit 2").
  'course.unit': 'Unit {number}',
  // Under a lesson title: minutes and number of steps.
  'course.lessonMeta': { one: '{minutes} min · {count} step', other: '{minutes} min · {count} steps' },
  'course.lessonMetaDone': { one: '{minutes} min · {count} step · completed', other: '{minutes} min · {count} steps · completed' },

  // Learning path.
  'course.path.title': 'Learning path',
  // Map / List toggle (very short).
  'course.path.view': 'Path view',
  'course.path.map': 'Map',
  'course.path.list': 'List',
  // Switch that hides deep-dive lessons.
  'course.path.fastTrack': 'Fast track: core only',
  'course.path.fastTrackNote': {
    one: "Showing the {count} core lesson (~{minutes} min) that covers most of what you'll use.",
    other: "Showing the {count} core lessons (~{minutes} min) that cover most of what you'll use.",
  },
  // Accessible labels of the lesson nodes on the map. {number} is the lesson's position, {title} its name.
  'course.path.node': 'Lesson {number}: {title}',
  'course.path.nodeDone': 'Lesson {number}: {title}, completed',
  'course.path.nodeNext': 'Lesson {number}: {title}, up next',
  'course.path.nodeDeep': 'Lesson {number}: {title}, deep dive',
  'course.path.nodeDeepDone': 'Lesson {number}: {title}, deep dive, completed',
  'course.path.nodeDeepNext': 'Lesson {number}: {title}, deep dive, up next',
  'course.path.completed': '✓ Completed',
  // Button in a lesson's popover when it is already done (verb).
  'course.path.review': 'Review',
  // Unit banner count: "3/5". The <sr>…</sr> part is read by screen readers only.
  'course.path.unitCount': '{done}/{total}<sr> lessons done</sr>',

  // Side panel. <b>…</b> is the big number.
  'course.side.lessonsCompleted': 'Lessons completed',
  'course.side.coreLessons': '<b>{done}/{total}</b> core lessons',
  // {pct} is a percentage.
  'course.side.mastered': '<b>{pct}</b> mastered',
  // {score} is the best quiz percentage, or "—" if no quiz was taken.
  'course.side.bestQuiz': '<b>{score}</b> best quiz',
  'course.side.mastery': 'Mastery',
  'course.side.masteredNote': 'Mastered = remembered across several spaced reviews.',
  // Heading of the key ideas panel (the Pareto principle: the 20% of ideas that give 80% of the value).
  'course.keyIdeas': 'The 20% that matters',

  // Links to the course's other activities.
  'course.links.quiz': 'Quiz',
  'course.links.quizHelp': { one: '{count} mixed question — find your gaps', other: '{count} mixed questions — find your gaps' },
  'course.links.map': 'Knowledge map',
  // {recalled} of the course's {total} key ideas recalled on the knowledge map.
  'course.links.mapProgress': '{recalled}/{total} ideas recalled so far — keep mapping',
  'course.links.mapStart': 'Map what you know from memory, then connect the dots',
  'course.links.mapRecall': 'Recall the key ideas from memory',
  'course.links.review': 'Review this course',
  // {title} is the course name.
  'course.links.reviewHelp': "Practise what's due from {title}",
  'course.links.cheatSheet': 'Cheat sheet',
  'course.links.cheatSheetHelp': 'The whole course on one printable page',

  // Cheat sheet page. {title} is the course name.
  'course.cheatSheet.back': '← {title}',
  'course.cheatSheet.print': 'Print / save as PDF',
  'course.cheatSheet.title': '{title} — cheat sheet',
  'course.cheatSheet.intro': 'Try this first: cover the page and explain each idea out loud. Wherever you get stuck is what to review.',
  'course.cheatSheet.keyIdeas': 'Key ideas',
} satisfies Record<string, Message>;
