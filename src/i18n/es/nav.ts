// Spanish UI strings: nav. Mirrors src/i18n/en/nav.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/nav.ts';

export default {
  'nav.home': 'Inicio',
  'nav.courses': 'Cursos',
  'nav.roadmap': 'Rutas',
  'nav.review': 'Repaso',
  'nav.profile': 'Perfil',
  'nav.main': 'Principal',
  'nav.streakTip': { one: 'Racha de {count} día', other: 'Racha de {count} días' },
  'nav.goalTip': 'Hoy {today} / {goal} XP · Nivel {level}',
  'nav.goalRing': 'Progreso de la meta diaria',
  'nav.xp': '{xp} XP',
  'nav.getStarted': 'Empezar',
  'nav.accountMenu': 'Menú de la cuenta',
  'nav.signedInAs': 'Sesión iniciada como {name}',
  'nav.profileStats': 'Perfil y estadísticas',
  'nav.signOut': 'Cerrar sesión',
  'nav.exit': 'Salir',
  'nav.language': 'Idioma',
  'nav.languageHint': 'Elige el idioma del sitio',
} satisfies Translation<typeof en>;
