// English UI strings: courses. The course catalog page and course cards (src/components/Courses.tsx).
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  'courses.title': 'Courses',
  // "core 20%" / "80%" refer to the Pareto principle the courses are built on.
  'courses.subtitle': "Each course starts with the core 20% — the ideas you'll use 80% of the time. Deep dives are optional.",
  'courses.searchPlaceholder': 'Search courses and lessons…',
  'courses.searchLabel': 'Search courses',
  // Accessible label of the category filter chips.
  'courses.filter.label': 'Category',
  // First filter chip: every category (short).
  'courses.filter.all': 'All',
  // {query} is what the learner typed in the search box.
  'courses.noMatch': 'No courses match “{query}”.',

  // Course card. {count} core lessons taking about {minutes} minutes.
  'courses.card.coreMeta': { one: '{count} core · ~{minutes} min', other: '{count} core · ~{minutes} min' },
  // Accessible label of the card's progress bar. {title} is the course name.
  'courses.card.progressLabel': '{title} progress',
  // {done}/{total} core lessons finished.
  'courses.card.coreDone': 'Core {done}/{total}',
  // {pct} is a percentage ("42%").
  'courses.card.mastered': '{pct} mastered',
  'courses.card.start': 'Start course →',
} satisfies Record<string, Message>;
