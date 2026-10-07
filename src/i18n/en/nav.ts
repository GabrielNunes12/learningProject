// English UI strings: nav. The header, tab bar, account menu and player header (src/components/Layout.tsx),
// and the language switcher.
import type { Message } from '../core.ts';

export default {
  'nav.home': 'Home',
  'nav.courses': 'Courses',
  'nav.roadmap': 'Roadmap',
  'nav.review': 'Review',
  'nav.profile': 'Profile',
  'nav.main': 'Main',
  'nav.streakTip': { one: '{count}-day streak', other: '{count}-day streak' },
  'nav.goalTip': 'Today {today} / {goal} XP · Level {level}',
  'nav.goalRing': 'Daily goal progress',
  'nav.xp': '{xp} XP',
  'nav.getStarted': 'Get started',
  'nav.accountMenu': 'Account menu',
  'nav.signedInAs': 'Signed in as {name}',
  'nav.profileStats': 'Profile & stats',
  'nav.signOut': 'Sign out',
  'nav.exit': 'Exit',
  'nav.language': 'Language',
  'nav.languageHint': 'Choose the language of the site',
} satisfies Record<string, Message>;
