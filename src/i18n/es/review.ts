// Spanish UI strings: review. Mirrors src/i18n/en/review.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/review.ts';

export default {
  'review.title': 'Repaso',
  'review.subtitle':
    'La repetición espaciada te trae cada pregunta justo antes de que la olvides. Los aciertos esperan más; los fallos vuelven pronto.',
  'review.dueNow': 'Pendientes ahora',
  'review.allCaughtUp': 'Todo al día',
  'review.nothingToReview': 'Nada que repasar',
  'review.sessionInfo': 'Unos {minutes} min. Cada sesión tiene hasta {size} preguntas.',
  'review.nextToday': 'Próximo repaso más tarde hoy.',
  'review.nextOn': 'Próximo repaso el {date}.',
  'review.emptyHint': 'Responde preguntas en una lección: llegan aquí automáticamente.',
  'review.start': 'Empezar el repaso →',
  'review.practiseWeakest': { one: 'Practicar {count} pregunta débil', other: 'Practicar las {count} más débiles' },
  'review.browseCourses': 'Ver cursos',
  'review.next7Days': 'Próximos 7 días',
  'review.duePerDay': 'repasos pendientes por día',
  'review.memoryStrength': 'Fuerza de la memoria',
  'review.seen': { one: '{count} pregunta vista', other: '{count} preguntas vistas' },
  'review.levelsNote': 'Cada repaso correcto sube la pregunta un nivel y la hace esperar más: 1 → 3 → 7 → 16 → 35 días.',
  'review.byCourse': 'Por curso',
  'review.courseDue': { zero: 'Nada pendiente', one: '{count} pendiente', other: '{count} pendientes' },
  'review.courseSeen': '{seen} vistas de {total}',
  'review.reviewButton': 'Repasar',
  'review.practiseButton': 'Practicar',

  // ---------- review session ----------
  'review.empty.titleIn': 'Nada que repasar en {course}',
  'review.empty.lead': 'Lo tienes todo al día. Vuelve más tarde o aprende algo nuevo.',
  'review.overview': 'Resumen del repaso',
  'review.ritualTitle': 'Repaso',
  'review.ritualTitleCourse': 'Repaso: {course}',
  'review.done.title': 'Repaso terminado',
  'review.done.lead': '{right} de {total} recordadas. Los aciertos ahora esperan más; los fallos vuelven pronto.',
  'review.done.xp': 'XP ganados',
  'review.done.remembered': 'Recordadas',
} satisfies Translation<typeof en>;
