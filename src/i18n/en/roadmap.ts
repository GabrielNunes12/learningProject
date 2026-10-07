// English UI strings: roadmap. The Roadmap page and its Home teaser (src/components/Roadmap.tsx). Track titles,
// descriptions and notes are content: they live in src/content/roadmap.json (translated in roadmap.<locale>.json).
import type { Message } from '../core.ts';

export default {
  'roadmap.title': 'Roadmap',
  'roadmap.subtitle': 'Tracks chain courses toward a goal. Follow the lines in order — or jump anywhere, nothing is locked.',
  'roadmap.unavailable': "The roadmap isn't available right now.",
  'roadmap.unavailableHelp': "Its tracks couldn't be loaded. In the meantime, every course is still open on the <link>Courses</link> page.",
  'roadmap.tracks': 'Tracks',
  'roadmap.trackComplete': '{track}: {pct} complete',
  // {pct} is a formatted percentage ("40%"); {done}/{total} counts courses.
  'roadmap.trackProgress': { one: '{pct} · {done}/{total} course', other: '{pct} · {done}/{total} courses' },
  'roadmap.allDone': { one: 'Track complete — the course is done.', other: 'Track complete — all {count} courses done.' },
  'roadmap.someDone': { one: '{done} of {count} course done', other: '{done} of {count} courses done' },
  'roadmap.someDoneNext': { one: '{done} of {count} course done · Next: {course}', other: '{done} of {count} courses done · Next: {course}' },
  'roadmap.continueCourse': 'Continue {course} →',
  'roadmap.startCourse': 'Start {course} →',
  'roadmap.mapLabel': '{track} map',
  'roadmap.legend': 'Legend',

  // Course status on a track. Short: shown in small pills.
  'roadmap.status.done': 'Done',
  'roadmap.status.inProgress': 'In progress',
  'roadmap.status.upNext': 'Up next',
  'roadmap.status.later': 'Later',
  'roadmap.legend.done': 'core lessons finished',
  'roadmap.legend.inProgress': 'started',
  'roadmap.legend.upNext': 'ready to start',
  'roadmap.legend.later': 'after its prerequisites',
  'roadmap.legend.solid': 'from a finished course',
  'roadmap.legend.dashed': 'still to do',

  // Screen-reader label of a course on the map. {after} is a list of course titles ("Python and Git").
  'roadmap.nodeLabel': { one: '{course}: {status}, {done} of {count} lesson done', other: '{course}: {status}, {done} of {count} lessons done' },
  'roadmap.nodeLabelAfter': {
    one: '{course}: {status}, {done} of {count} lesson done. After {after}',
    other: '{course}: {status}, {done} of {count} lessons done. After {after}',
  },
  'roadmap.nodeCount': '{done}/{total} lessons',

  'roadmap.closeDetails': 'Close details',
  // Followed by a list of course titles, e.g. "After Python and Git".
  'roadmap.after': 'After {list}',
  'roadmap.core': 'Core {done}/{total}',
  'roadmap.lessonsMastered': { one: '{done}/{count} lesson · {pct} mastered', other: '{done}/{count} lessons · {pct} mastered' },
  'roadmap.coreLessonsLabel': '{course} core lessons',
  'roadmap.continueLesson': 'Continue: {lesson}',
  'roadmap.startLesson': 'Start: {lesson}',
  'roadmap.allDoneQuiz': 'All done — take the quiz',
  'roadmap.openCourse': 'Open course',
  'roadmap.inside': "What's inside",
  'roadmap.lessonDone': '(done)',
  'roadmap.lessonNotDone': '(not done)',
  'roadmap.coreLesson': 'Core lesson',

  'roadmap.teaser.next': 'Next on your {track} track: {course}',
  'roadmap.teaser.finished': "You've finished the {track} track. Pick another one!",
  'roadmap.teaser.cta': 'See the map →',
} satisfies Record<string, Message>;
