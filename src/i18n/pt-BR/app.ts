// Brazilian Portuguese UI strings: app. Mirrors src/i18n/en/app.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/app.ts';

export default {
  'app.contentErrors': 'Alguns arquivos de curso têm problemas e foram ignorados:',
  'app.notFound': 'Página não encontrada',
  'app.notFoundLead': 'Esse link não leva a lugar nenhum.',
} satisfies Translation<typeof en>;
