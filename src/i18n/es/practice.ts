// Spanish UI strings: practice. Mirrors src/i18n/en/practice.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/practice.ts';

export default {
  'practice.title': 'Práctica mixta',
  'practice.titleCourse': 'Práctica mixta: {course}',
  'practice.intro':
    'La práctica mixta intercala ideas relacionadas en lugar de machacar un tema cada vez. Suele sentirse más difícil mientras la haces, pero los estudios sugieren que mejora tu capacidad de distinguir ideas parecidas y cuánto tiempo las recuerdas.',
  'practice.status.weak': 'Débil',
  'practice.status.due': 'Pendiente',
  'practice.status.new': 'Nuevo',
  'practice.status.strong': 'Sólido',
  'practice.notFound': 'Curso no encontrado',
  'practice.mixAll': 'Mezclar todos mis cursos',
  'practice.focus': 'Enfoque: <b>{label}</b> y sus ideas conectadas.',
  'practice.focusFallback': 'Todavía no has visto suficientes preguntas de ese concepto, así que esta sesión mezcla todo el curso.',
  'practice.yourMix': 'Tu mezcla',
  'practice.ideas': { one: '{count} idea', other: '{count} ideas' },
  'practice.ideasAria': 'Ideas de esta sesión',
  'practice.lessonsAria': 'Lecciones de esta sesión',
  'practice.from': 'De {courses}',
  'practice.byLesson': 'Estas preguntas se mezclan por lección: este curso todavía no tiene mapa de conceptos.',
  'practice.whyThese': '¿Por qué estas?',
  'practice.defaultReason': 'Parte de lo que has aprendido hasta ahora',
  'practice.lengthAria': 'Duración de la sesión',
  'practice.length': 'Duración',
  'practice.onlyQualify': { one: 'Ahora mismo solo hay {count} pregunta disponible', other: 'Ahora mismo solo hay {count} preguntas disponibles' },
  'practice.aboutMin': 'unos {count} min',
  'practice.start': 'Empezar la práctica mixta',
  'practice.mixAllInstead': 'Mejor mezclar todos mis cursos',
  'practice.orOneCourse': 'O practica un solo curso:',

  // ---------- not available yet ----------
  'practice.empty.recentTitle': 'Acabas de practicarlo todo',
  'practice.empty.recentLead':
    'Las preguntas que acertaste en los últimos 10 minutos descansan un rato, para que la próxima ronda sea recuerdo de verdad y no repetición. Vuelve a intentarlo en unos minutos o aprende algo nuevo.',
  'practice.empty.lockedTitle': { one: 'La práctica mixta se abre tras {count} lección', other: 'La práctica mixta se abre tras {count} lecciones' },
  'practice.empty.lockedLead': {
    one: 'Para mezclar hacen falta varias ideas que distinguir. Por ahora llevas {count} lección.',
    other: 'Para mezclar hacen falta varias ideas que distinguir. Por ahora llevas {count} lecciones.',
  },
  'practice.empty.lockedLeadCourse': {
    one: 'Para mezclar hacen falta varias ideas que distinguir. Por ahora llevas {count} lección en {course}.',
    other: 'Para mezclar hacen falta varias ideas que distinguir. Por ahora llevas {count} lecciones en {course}.',
  },
  'practice.empty.nextLesson': 'Siguiente lección: {title}',

  // ---------- results ----------
  'practice.end.title': 'Práctica mixta terminada',
  'practice.end.leadIdeas': {
    one: '{right} de {total} aciertos en {count} idea.',
    other: '{right} de {total} aciertos en {count} ideas.',
  },
  'practice.end.leadLessons': {
    one: '{right} de {total} aciertos en {count} lección.',
    other: '{right} de {total} aciertos en {count} lecciones.',
  },
  'practice.end.xp': 'XP ganados',
  'practice.end.right': 'Aciertos',
  'practice.end.resultsAria': 'Resultados por idea',
  'practice.end.reviewLesson': 'Repasar la lección: {title}',
  'practice.end.solid': 'Sólido',
  'practice.end.note': 'Los fallos vuelven en tu cola de repaso; los aciertos esperan más.',
  'practice.end.backToCourse': 'Volver al curso',
  'practice.end.again': 'Otra vez',

  // ---------- card on the Review page ----------
  'practice.card.title': 'Mezcla ideas relacionadas',
  'practice.card.ready': 'Preguntas de distintas lecciones, una junto a otra y con más peso en tus puntos débiles, para que aprendas a distinguir ideas parecidas.',
  'practice.card.locked': {
    one: 'Se abre tras {count} lección: para mezclar hacen falta varias ideas que distinguir.',
    other: 'Se abre tras {count} lecciones: para mezclar hacen falta varias ideas que distinguir.',
  },
  'practice.card.howItWorks': 'Ver cómo funciona',

  // ---------- why a topic is in the mix (src/lib/interleave.ts) ----------
  'practice.reason.due': 'Pendiente de repaso',
  'practice.reason.missed': 'Lo fallaste la última vez',
  'practice.reason.new': 'De una lección que ya hiciste y no has practicado desde entonces',
  'practice.reason.weakSpot': 'Punto débil',
  'practice.reason.slipping': 'Se te escapa: fallaste el último intento ({right} de {seen} respuestas recientes correctas)',
  'practice.reason.weak': 'Punto débil: {right} de {seen} respuestas recientes correctas',
  'practice.reason.strong': 'Lo dominas: se incluye para contrastar y ganar confianza',
  'practice.reason.focus': 'El concepto que elegiste practicar',
  'practice.reason.related': 'Conexión con {label}: “{sentence}”',
  'practice.reason.relatedCross': 'Conexión con {label} en otro curso: “{sentence}”',
  'practice.linkSentence': '{from} {link} {to}',
} satisfies Translation<typeof en>;
