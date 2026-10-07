// French UI strings: app. Mirrors src/i18n/en/app.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/app.ts';

export default {
  'app.contentErrors': 'Certains fichiers de cours ont des problèmes et ont été ignorés :',
  'app.notFound': 'Page introuvable',
  'app.notFoundLead': "Ce lien ne mène nulle part.",
} satisfies Translation<typeof en>;
