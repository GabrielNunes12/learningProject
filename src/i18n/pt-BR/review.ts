// Brazilian Portuguese UI strings: review. Mirrors src/i18n/en/review.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/review.ts';

export default {
  'review.title': 'Revisão',
  'review.subtitle':
    'A repetição espaçada traz cada questão de volta logo antes de você esquecê-la. Os acertos esperam mais; os erros voltam logo.',
  'review.dueNow': 'Pendentes agora',
  'review.allCaughtUp': 'Tudo em dia',
  'review.nothingToReview': 'Nada para revisar',
  'review.sessionInfo': 'Cerca de {minutes} min. Cada sessão tem até {size} questões.',
  'review.nextToday': 'Próxima revisão ainda hoje.',
  'review.nextOn': 'Próxima revisão em {date}.',
  'review.emptyHint': 'Responda questões em uma lição — elas aparecem aqui automaticamente.',
  'review.start': 'Começar a revisão →',
  'review.practiseWeakest': { one: 'Praticar a {count} mais fraca', other: 'Praticar as {count} mais fracas' },
  'review.browseCourses': 'Ver cursos',
  'review.next7Days': 'Próximos 7 dias',
  'review.duePerDay': 'revisões pendentes por dia',
  'review.memoryStrength': 'Força da memória',
  'review.seen': { one: '{count} questão vista', other: '{count} questões vistas' },
  'review.levelsNote': 'Cada revisão correta sobe a questão um nível e aumenta a espera: 1 → 3 → 7 → 16 → 35 dias.',
  'review.byCourse': 'Por curso',
  'review.courseDue': { zero: 'Nada pendente', one: '{count} pendente', other: '{count} pendentes' },
  'review.courseSeen': '{seen} de {total} vistas',
  'review.reviewButton': 'Revisar',
  'review.practiseButton': 'Praticar',

  // ---------- review session ----------
  'review.empty.titleIn': 'Nada para revisar em {course}',
  'review.empty.lead': 'Está tudo em dia. Volte mais tarde ou aprenda algo novo.',
  'review.overview': 'Visão geral da revisão',
  'review.ritualTitle': 'Revisão',
  'review.ritualTitleCourse': 'Revisão: {course}',
  'review.done.title': 'Revisão concluída',
  'review.done.lead': '{right} de {total} lembradas. As respostas certas agora esperam mais; os erros voltam logo.',
  'review.done.xp': 'XP ganho',
  'review.done.remembered': 'Lembradas',
} satisfies Translation<typeof en>;
