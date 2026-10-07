// Spanish UI strings: courses. Mirrors src/i18n/en/courses.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/courses.ts';

export default {
  'courses.title': 'Cursos',
  'courses.subtitle': 'Cada curso empieza por el 20% esencial: las ideas que usarás el 80% del tiempo. Las profundizaciones son opcionales.',
  'courses.searchPlaceholder': 'Busca cursos y lecciones…',
  'courses.searchLabel': 'Buscar cursos',
  'courses.filter.label': 'Categoría',
  'courses.filter.all': 'Todos',
  'courses.noMatch': 'Ningún curso coincide con “{query}”.',

  'courses.card.coreMeta': { one: '{count} esencial · ~{minutes} min', other: '{count} esenciales · ~{minutes} min' },
  'courses.card.progressLabel': 'Progreso de {title}',
  'courses.card.coreDone': 'Esencial {done}/{total}',
  'courses.card.mastered': '{pct} dominado',
  'courses.card.start': 'Empezar curso →',
} satisfies Translation<typeof en>;
