// Spanish UI strings: content. Mirrors src/i18n/en/content.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/content.ts';

export default {
  'content.category.Data': 'Datos',
  'content.category.Engineering': 'Ingeniería',
  'content.category.Learning': 'Aprendizaje',
  'content.category.Math': 'Matemáticas',
  'content.category.Programming': 'Programación',
  'content.category.Thinking': 'Pensamiento',
  'content.category.Tools': 'Herramientas',
  'content.category.General': 'General',
  'content.level.Beginner': 'Principiante',
  'content.level.Intermediate': 'Intermedio',
  'content.level.Advanced': 'Avanzado',
  'content.lessonsUnit': 'Lecciones',
} satisfies Translation<typeof en>;
