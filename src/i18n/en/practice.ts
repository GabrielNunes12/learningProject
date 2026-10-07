// English UI strings: practice. Mixed (interleaved) practice (src/components/MixedPractice.tsx) and the reasons
// given for each topic (src/lib/interleave.ts).
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  'practice.title': 'Mixed practice',
  // {course} is a course title.
  'practice.titleCourse': 'Mixed practice: {course}',
  'practice.intro':
    'Mixed practice interleaves related ideas instead of drilling one topic at a time. It tends to feel harder while you do it, but studies suggest it improves how well you tell similar ideas apart and how long you remember them.',
  // Topic status badges (tight space).
  'practice.status.weak': 'Weak',
  'practice.status.due': 'Due',
  'practice.status.new': 'New',
  'practice.status.strong': 'Strong',
  'practice.notFound': 'Course not found',
  'practice.mixAll': 'Mix all my courses',
  // {label} is a concept name; <b>…</b> is bold.
  'practice.focus': 'Focused on <b>{label}</b> and the ideas linked to it.',
  'practice.focusFallback': "That concept doesn't have enough questions you've met yet, so this session mixes the whole course.",
  'practice.yourMix': 'Your mix',
  // An "idea" is a concept from the course's concept map.
  'practice.ideas': { one: '{count} idea', other: '{count} ideas' },
  'practice.ideasAria': 'Ideas in this session',
  'practice.lessonsAria': 'Lessons in this session',
  // {courses} is the list of course names (with icons).
  'practice.from': 'From {courses}',
  'practice.byLesson': "These questions are mixed by lesson: this course doesn't have a concept map yet.",
  'practice.whyThese': 'Why these?',
  'practice.defaultReason': 'Part of what you have learned so far',
  'practice.lengthAria': 'Session length',
  // Label before the session-length buttons (8 / 12 / 20).
  'practice.length': 'Length',
  'practice.onlyQualify': { one: 'Only {count} question qualifies right now', other: 'Only {count} questions qualify right now' },
  // Estimated session length.
  'practice.aboutMin': 'about {count} min',
  // Button.
  'practice.start': 'Start mixed practice',
  'practice.mixAllInstead': 'Mix all my courses instead',
  'practice.orOneCourse': 'Or practise one course:',

  // ---------- not available yet ----------
  'practice.empty.recentTitle': 'You just practised all of it',
  'practice.empty.recentLead':
    'Questions you answered right in the last 10 minutes sit out for a while, so the next round is real recall, not repetition. Try again in a few minutes, or learn something new.',
  'practice.empty.lockedTitle': { one: 'Mixed practice opens after {count} lesson', other: 'Mixed practice opens after {count} lessons' },
  'practice.empty.lockedLead': {
    one: "Mixing needs a few ideas to tell apart. You've done {count} lesson so far.",
    other: "Mixing needs a few ideas to tell apart. You've done {count} lessons so far.",
  },
  // {course} is a course title.
  'practice.empty.lockedLeadCourse': {
    one: "Mixing needs a few ideas to tell apart. You've done {count} lesson in {course} so far.",
    other: "Mixing needs a few ideas to tell apart. You've done {count} lessons in {course} so far.",
  },
  // {title} is a lesson title.
  'practice.empty.nextLesson': 'Next lesson: {title}',

  // ---------- results ----------
  'practice.end.title': 'Mixed practice done',
  'practice.end.leadIdeas': {
    one: '{right} of {total} right across {count} idea.',
    other: '{right} of {total} right across {count} ideas.',
  },
  'practice.end.leadLessons': {
    one: '{right} of {total} right across {count} lesson.',
    other: '{right} of {total} right across {count} lessons.',
  },
  // Result tiles (tight space).
  'practice.end.xp': 'XP earned',
  'practice.end.right': 'Right',
  'practice.end.resultsAria': 'Results by idea',
  // {title} is a lesson title.
  'practice.end.reviewLesson': 'Review lesson: {title}',
  // Shown for a topic answered fully right.
  'practice.end.solid': 'Solid',
  'practice.end.note': 'Misses come back in your Review queue; right answers wait longer.',
  'practice.end.backToCourse': 'Back to course',
  // Button: start another mixed session.
  'practice.end.again': 'Again',

  // ---------- card on the Review page ----------
  'practice.card.title': 'Mix related ideas',
  'practice.card.ready': 'Questions from different lessons side by side, weighted toward your weak spots, so you learn to tell similar ideas apart.',
  'practice.card.locked': {
    one: 'Opens after {count} lesson: mixing needs a few ideas to tell apart.',
    other: 'Opens after {count} lessons: mixing needs a few ideas to tell apart.',
  },
  'practice.card.howItWorks': 'See how it works',

  // ---------- why a topic is in the mix (src/lib/interleave.ts) ----------
  'practice.reason.due': 'Due for review',
  'practice.reason.missed': 'You missed it last time',
  'practice.reason.new': "From a lesson you've done, not practised since",
  'practice.reason.weakSpot': 'Weak spot',
  // Mostly right, but the latest try was wrong.
  'practice.reason.slipping': 'Slipping: you missed your latest try ({right} of {seen} recent answers right)',
  'practice.reason.weak': 'Weak spot: {right} of {seen} recent answers right',
  'practice.reason.strong': 'You know this well: mixed in for contrast and confidence',
  'practice.reason.focus': 'The concept you chose to practise',
  // {label} is the linked concept; {sentence} is the link read as a sentence (see practice.linkSentence).
  'practice.reason.related': 'Linked to {label}: "{sentence}"',
  'practice.reason.relatedCross': 'Linked to {label} in another course: "{sentence}"',
  // A concept-map link read as a sentence: {from} and {to} are concept names, {link} the link's label from the
  // course (e.g. "Contrapositive" "is not the same as" "Converse"). Reorder if your language needs it.
  'practice.linkSentence': '{from} {link} {to}',
} satisfies Record<string, Message>;
