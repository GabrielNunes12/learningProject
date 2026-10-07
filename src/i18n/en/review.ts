// English UI strings: review. The review overview and review sessions (src/components/Review.tsx).
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  // Page title.
  'review.title': 'Review',
  'review.subtitle':
    "Spaced repetition brings each question back right before you'd forget it. Right answers wait longer; misses come back soon.",
  'review.dueNow': 'Due now',
  'review.allCaughtUp': 'All caught up',
  'review.nothingToReview': 'Nothing to review',
  // {minutes}: estimated session length; {size}: the most questions a session holds.
  'review.sessionInfo': 'About {minutes} min. Sessions hold up to {size} questions.',
  'review.nextToday': 'Next review later today.',
  // {date} is a formatted date.
  'review.nextOn': 'Next review on {date}.',
  'review.emptyHint': 'Answer questions in a lesson — they land here automatically.',
  // Buttons.
  'review.start': 'Start review →',
  'review.practiseWeakest': { one: 'Practise weakest {count}', other: 'Practise weakest {count}' },
  'review.browseCourses': 'Browse courses',
  // Forecast panel.
  'review.next7Days': 'Next 7 days',
  'review.duePerDay': 'reviews due per day',
  // Memory strength panel.
  'review.memoryStrength': 'Memory strength',
  'review.seen': { one: '{count} question seen', other: '{count} questions seen' },
  'review.levelsNote': 'Each correct review moves a question one level up and waits longer: 1 → 3 → 7 → 16 → 35 days.',
  // Per-course list.
  'review.byCourse': 'By course',
  'review.courseDue': { zero: 'Nothing due', one: '{count} due', other: '{count} due' },
  'review.courseSeen': '{seen} seen of {total}',
  // Buttons (tight space).
  'review.reviewButton': 'Review',
  'review.practiseButton': 'Practise',

  // ---------- review session ----------
  // {course} is a course title.
  'review.empty.titleIn': 'Nothing to review in {course}',
  'review.empty.lead': "You're all caught up. Come back later, or learn something new.",
  'review.overview': 'Review overview',
  // Title of the session in the notebook.
  'review.ritualTitle': 'Review',
  'review.ritualTitleCourse': 'Review: {course}',
  'review.done.title': 'Review done',
  'review.done.lead': '{right} of {total} remembered. Correct answers now wait longer; misses come back soon.',
  // Result tiles (tight space).
  'review.done.xp': 'XP earned',
  'review.done.remembered': 'Remembered',
} satisfies Record<string, Message>;
