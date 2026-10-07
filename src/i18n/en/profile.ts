// English UI strings: profile. The Profile page (src/components/Profile.tsx) and progress import/export.
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  'profile.importBadFile': 'That file does not look like a ProjectLearn progress export.',

  // Header.
  // Name used for the avatar initial when nobody is signed in.
  'profile.guest': 'Guest',
  'profile.guestLearner': 'Guest learner',
  // Under the username. {email} is the address, {joined} a month and year ("May 2026");
  // <verified>…</verified> is a small "verified" badge.
  'profile.accountLine': '{email} <verified>✓ verified</verified> · joined {joined}',
  'profile.localOnly': 'Progress is stored only in this browser.',
  // {title} is the level title ("Explorer").
  'profile.levelLine': 'Level {level} · {title}',
  'profile.levelXp': '{into} / {needed} XP',
  'profile.levelProgress': 'Progress to next level',
  // Sync status pill (short).
  'profile.sync.saving': 'Saving…',
  'profile.sync.offline': 'Offline — will retry',
  'profile.sync.synced': 'Synced',
  'profile.createProfile': 'Create profile',

  // Stat tiles (short labels under a number).
  'profile.stat.totalXp': 'Total XP',
  'profile.stat.currentStreak': 'Current streak',
  'profile.stat.bestStreak': 'Best streak',
  'profile.stat.lessonsDone': 'Lessons done',
  'profile.stat.mastered': 'Questions mastered',
  'profile.stat.coursesStarted': 'Courses started',

  'profile.activity': 'Activity',

  // Daily goal picker.
  'profile.goal.help': 'How much XP do you want to earn each day? A lesson is about 30–50 XP.',
  'profile.goal.label': 'Daily XP goal',
  // Goal levels for 20, 50, 100 and 200 XP a day (one word each).
  'profile.goal.casual': 'Casual',
  'profile.goal.regular': 'Regular',
  'profile.goal.serious': 'Serious',
  'profile.goal.intense': 'Intense',

  // Course progress list.
  'profile.courseProgress': 'Course progress',
  'profile.notebookLink': 'Notebook →',
  'profile.reportLink': 'Your learning report →',
  // <link>…</link> links to the course catalog.
  'profile.noCourses': 'No courses started yet. <link>Pick one →</link>',
  // {done}/{total} core lessons finished; {mastery} is a percentage ("42%").
  'profile.courseLine': 'Core {done}/{total} · {mastery} mastered',
  // Same, plus the best final-quiz score {quiz} (a percentage).
  'profile.courseLineQuiz': 'Core {done}/{total} · {mastery} mastered · quiz {quiz}',
  // Accessible label of a course's progress bar. {title} is the course name.
  'profile.courseProgressLabel': '{title} progress',

  'profile.somethingWrong': 'Something went wrong.',

  // Account settings (signed-in learners).
  'profile.account.title': 'Account',
  'profile.account.changePassword': 'Change password',
  'profile.account.currentPassword': 'Current password',
  'profile.account.newPassword': 'New password',
  'profile.account.passwordHelp': 'At least 8 characters.',
  'profile.account.updatePassword': 'Update password',
  'profile.account.passwordChanged': 'Password changed. Other devices have been signed out.',
  'profile.account.session': 'Session',
  'profile.account.signOutHelp': 'Signing out removes your progress from this browser. It stays saved in your account.',
  'profile.account.signOut': 'Sign out',
  'profile.account.delete': 'Delete account',
  'profile.account.deleteStart': 'Delete my account…',
  'profile.account.deleteWarning': "This permanently deletes your profile and all synced progress. It can't be undone.",
  'profile.account.deleteConfirm': 'Confirm with your password',
  'profile.account.deleteForever': 'Delete forever',

  // Data export / import / reset.
  'profile.data.title': 'Your data',
  'profile.data.helpSignedIn': 'Progress syncs to your account automatically. You can still keep a backup file.',
  'profile.data.helpGuest': 'Back up your progress to a file, or restore it on another browser.',
  'profile.data.export': 'Export progress',
  'profile.data.import': 'Import progress',
  'profile.data.reset': 'Reset progress',
  // Browser confirmation dialog before erasing progress.
  'profile.data.resetConfirm': 'Erase all learning progress? Export first if you want a backup.',
  'profile.data.importFailed': 'Could not read that file.',
} satisfies Record<string, Message>;
