// Spanish UI strings: app. Mirrors src/i18n/en/app.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/app.ts';

export default {
  'app.contentErrors': 'Algunos archivos de cursos tienen problemas y se omitieron:',
  'app.notFound': 'Página no encontrada',
  'app.notFoundLead': 'Ese enlace no lleva a ninguna parte.',
} satisfies Translation<typeof en>;
