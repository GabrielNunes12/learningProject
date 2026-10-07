// English UI strings: home. The Home page (src/components/Home.tsx). English is the source of truth;
// translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  // Greeting by time of day; {name} is the username (the ", name" part is only added when signed in).
  'home.greet.late': 'Up late!',
  'home.greet.morning': 'Good morning!',
  'home.greet.afternoon': 'Good afternoon!',
  'home.greet.evening': 'Good evening!',
  'home.greet.lateName': 'Up late, {name}!',
  'home.greet.morningName': 'Good morning, {name}!',
  'home.greet.afternoonName': 'Good afternoon, {name}!',
  'home.greet.eveningName': 'Good evening, {name}!',
  'home.goalReached': 'Daily goal reached. Anything more is a bonus.',
  'home.startWithReviews': {
    one: 'Start with your {count} review, then learn something new.',
    other: 'Start with your {count} reviews, then learn something new.',
  },
  'home.pickUp': 'Pick up where you left off.',

  // First visit (no progress, not signed in). <hl> marks the highlighted numbers.
  'home.hero.eyebrow': 'Learn smarter, not longer',
  'home.hero.title': 'Master the <hl>20%</hl> that gives you <hl>80%</hl>.',
  'home.hero.lead':
    'Every course starts with its core ideas, teaches them through worked examples and exercises, then keeps them in your memory with quizzes and spaced review.',
  'home.hero.tryLesson': 'Try a lesson — no account needed',

  'home.continue.eyebrow': 'Continue learning',
  'home.continue.startHere': 'Start here',
  'home.continue.complete': '{course} — complete!',
  'home.continue.progress': '{done} of {total} lessons',
  'home.continue.counts': 'Core {coreDone}/{coreTotal} · {done}/{total} lessons',
  'home.continue.continue': 'Continue →',
  'home.continue.start': 'Start →',
  'home.continue.quiz': 'Take the quiz',

  'home.stat.goalValue': '{today} / {goal} XP',
  'home.stat.streakValue': { one: '{count} day', other: '{count} days' },
  'home.stat.level': 'Level {level} · {title}',
  'home.stat.levelProgress': 'Progress to next level',
  'home.stat.toNext': '{xp} XP to level {level}',
  'home.stat.dueNow': '{count} due now',
  'home.stat.caughtUp': 'All caught up',
  'home.stat.beforeForget': 'Before you forget',
  'home.stat.nothingDue': 'Nothing due',

  'home.save.text': '<b>Your progress lives only in this browser.</b> Create a free profile to keep it safe and use it on any device.',
  'home.save.button': 'Save my progress',

  'home.week.title': 'This week',
  'home.method.title': 'The 80/20 method',
  // <core> and <extra> render the lesson tags "Core" and "Deep dive".
  'home.method.core': "<b>Core first.</b> Finish a course's <core>Core</core> lessons before any <extra>Deep dive</extra>.",
  'home.method.testOut': '<b>Test out.</b> Take the quiz first — it tells you which lessons to skip.',
  'home.method.daily': "<b>Review daily.</b> 5–10 minutes keeps everything you've learned.",
  'home.method.two': '<b>Two courses at a time.</b> Finish their core, then add the next.',

  'home.yourCourses': 'Your courses',
  'home.recommended': 'Recommended courses',
  'home.allCourses': 'All courses →',
} satisfies Record<string, Message>;
