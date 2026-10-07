// French UI strings: nav. Mirrors src/i18n/en/nav.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/nav.ts';

export default {
  'nav.home': 'Accueil',
  'nav.courses': 'Cours',
  'nav.roadmap': 'Parcours',
  'nav.review': 'Révision',
  'nav.profile': 'Profil',
  'nav.main': 'Navigation principale',
  'nav.streakTip': { one: 'Série de {count} jour', other: 'Série de {count} jours' },
  'nav.goalTip': "Aujourd'hui {today} / {goal} XP · Niveau {level}",
  'nav.goalRing': "Progression de l'objectif quotidien",
  'nav.xp': '{xp} XP',
  'nav.getStarted': 'Commencer',
  'nav.accountMenu': 'Menu du compte',
  'nav.signedInAs': 'Connecté en tant que {name}',
  'nav.profileStats': 'Profil et statistiques',
  'nav.signOut': 'Se déconnecter',
  'nav.exit': 'Quitter',
  'nav.language': 'Langue',
  'nav.languageHint': 'Choisis la langue du site',
} satisfies Translation<typeof en>;
