// English UI strings: content. Course categories and levels (course files keep them in English, as ids),
// and the unit title used for courses written as a flat list of lessons.
import type { Message } from '../core.ts';

export default {
  'content.category.Data': 'Data',
  'content.category.Engineering': 'Engineering',
  'content.category.Learning': 'Learning',
  'content.category.Math': 'Math',
  'content.category.Programming': 'Programming',
  'content.category.Thinking': 'Thinking',
  'content.category.Tools': 'Tools',
  'content.category.General': 'General',
  'content.level.Beginner': 'Beginner',
  'content.level.Intermediate': 'Intermediate',
  'content.level.Advanced': 'Advanced',
  'content.lessonsUnit': 'Lessons',
} satisfies Record<string, Message>;
