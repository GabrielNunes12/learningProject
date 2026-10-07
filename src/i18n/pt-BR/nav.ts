// Brazilian Portuguese UI strings: nav. Mirrors src/i18n/en/nav.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/nav.ts';

export default {
  'nav.home': 'Início',
  'nav.courses': 'Cursos',
  'nav.roadmap': 'Trilhas',
  'nav.review': 'Revisão',
  'nav.profile': 'Perfil',
  'nav.main': 'Principal',
  'nav.streakTip': { one: 'Sequência de {count} dia', other: 'Sequência de {count} dias' },
  'nav.goalTip': 'Hoje {today} / {goal} XP · Nível {level}',
  'nav.goalRing': 'Progresso da meta diária',
  'nav.xp': '{xp} XP',
  'nav.getStarted': 'Começar',
  'nav.accountMenu': 'Menu da conta',
  'nav.signedInAs': 'Conectado como {name}',
  'nav.profileStats': 'Perfil e estatísticas',
  'nav.signOut': 'Sair',
  'nav.exit': 'Sair',
  'nav.language': 'Idioma',
  'nav.languageHint': 'Escolha o idioma do site',
} satisfies Translation<typeof en>;
