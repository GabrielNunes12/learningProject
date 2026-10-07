// Brazilian Portuguese UI strings: content. Mirrors src/i18n/en/content.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/content.ts';

export default {
  'content.category.Data': 'Dados',
  'content.category.Engineering': 'Engenharia',
  'content.category.Learning': 'Aprendizagem',
  'content.category.Math': 'Matemática',
  'content.category.Programming': 'Programação',
  'content.category.Thinking': 'Raciocínio',
  'content.category.Tools': 'Ferramentas',
  'content.category.General': 'Geral',
  'content.level.Beginner': 'Iniciante',
  'content.level.Intermediate': 'Intermediário',
  'content.level.Advanced': 'Avançado',
  'content.lessonsUnit': 'Lições',
} satisfies Translation<typeof en>;
