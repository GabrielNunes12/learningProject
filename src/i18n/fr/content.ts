// French UI strings: content. Mirrors src/i18n/en/content.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/content.ts';

export default {
  'content.category.Data': 'Données',
  'content.category.Engineering': 'Ingénierie',
  'content.category.Learning': 'Apprentissage',
  'content.category.Math': 'Maths',
  'content.category.Programming': 'Programmation',
  'content.category.Thinking': 'Réflexion',
  'content.category.Tools': 'Outils',
  'content.category.General': 'Général',
  'content.level.Beginner': 'Débutant',
  'content.level.Intermediate': 'Intermédiaire',
  'content.level.Advanced': 'Avancé',
  'content.lessonsUnit': 'Leçons',
} satisfies Translation<typeof en>;
