// Brazilian Portuguese UI strings: courses. Mirrors src/i18n/en/courses.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/courses.ts';

export default {
  'courses.title': 'Cursos',
  'courses.subtitle': 'Cada curso começa pelos 20% essenciais — as ideias que você vai usar 80% do tempo. Os aprofundamentos são opcionais.',
  'courses.searchPlaceholder': 'Buscar cursos e lições…',
  'courses.searchLabel': 'Buscar cursos',
  'courses.filter.label': 'Categoria',
  'courses.filter.all': 'Todos',
  'courses.noMatch': 'Nenhum curso encontrado para “{query}”.',

  'courses.card.coreMeta': { one: '{count} essencial · ~{minutes} min', other: '{count} essenciais · ~{minutes} min' },
  'courses.card.progressLabel': 'Progresso em {title}',
  'courses.card.coreDone': 'Essenciais {done}/{total}',
  'courses.card.mastered': '{pct} de domínio',
  'courses.card.start': 'Começar o curso →',
} satisfies Translation<typeof en>;
