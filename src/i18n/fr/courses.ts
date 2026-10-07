// French UI strings: courses. Mirrors src/i18n/en/courses.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/courses.ts';

export default {
  'courses.title': 'Cours',
  'courses.subtitle': "Chaque cours commence par les 20 % essentiels : les idées dont tu te serviras 80 % du temps. Les approfondissements sont facultatifs.",
  'courses.searchPlaceholder': 'Rechercher des cours et des leçons…',
  'courses.searchLabel': 'Rechercher des cours',
  'courses.filter.label': 'Catégorie',
  'courses.filter.all': 'Tous',
  'courses.noMatch': 'Aucun cours ne correspond à « {query} ».',

  'courses.card.coreMeta': { one: '{count} essentielle · ~{minutes} min', other: '{count} essentielles · ~{minutes} min' },
  'courses.card.progressLabel': 'Progression : {title}',
  'courses.card.coreDone': 'Essentiel {done}/{total}',
  'courses.card.mastered': '{pct} de maîtrise',
  'courses.card.start': 'Commencer le cours →',
} satisfies Translation<typeof en>;
