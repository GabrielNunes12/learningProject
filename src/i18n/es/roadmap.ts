// Spanish UI strings: roadmap. Mirrors src/i18n/en/roadmap.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/roadmap.ts';

export default {
  'roadmap.title': 'Rutas',
  'roadmap.subtitle': 'Las rutas encadenan cursos hacia un objetivo. Sigue las líneas en orden o salta a donde quieras: no hay nada bloqueado.',
  'roadmap.unavailable': 'Las rutas no están disponibles en este momento.',
  'roadmap.unavailableHelp': 'No se pudieron cargar las rutas. Mientras tanto, todos los cursos siguen abiertos en la página <link>Cursos</link>.',
  'roadmap.tracks': 'Rutas',
  'roadmap.trackComplete': '{track}: completada al {pct}',
  'roadmap.trackProgress': { one: '{pct} · {done}/{total} curso', other: '{pct} · {done}/{total} cursos' },
  'roadmap.allDone': { one: 'Ruta completada: curso terminado.', other: 'Ruta completada: los {count} cursos, terminados.' },
  'roadmap.someDone': { one: '{done} de {count} curso terminado', other: '{done} de {count} cursos terminados' },
  'roadmap.someDoneNext': {
    one: '{done} de {count} curso terminado · Siguiente: {course}',
    other: '{done} de {count} cursos terminados · Siguiente: {course}',
  },
  'roadmap.continueCourse': 'Continuar {course} →',
  'roadmap.startCourse': 'Empezar {course} →',
  'roadmap.mapLabel': 'Mapa de {track}',
  'roadmap.legend': 'Leyenda',

  'roadmap.status.done': 'Completado',
  'roadmap.status.inProgress': 'En curso',
  'roadmap.status.upNext': 'Siguiente',
  'roadmap.status.later': 'Más tarde',
  'roadmap.legend.done': 'lecciones esenciales terminadas',
  'roadmap.legend.inProgress': 'empezado',
  'roadmap.legend.upNext': 'listo para empezar',
  'roadmap.legend.later': 'después de sus requisitos previos',
  'roadmap.legend.solid': 'desde un curso terminado',
  'roadmap.legend.dashed': 'pendiente',

  'roadmap.nodeLabel': {
    one: '{course}: {status}, {done} de {count} lección completada',
    other: '{course}: {status}, {done} de {count} lecciones completadas',
  },
  'roadmap.nodeLabelAfter': {
    one: '{course}: {status}, {done} de {count} lección completada. Después de {after}',
    other: '{course}: {status}, {done} de {count} lecciones completadas. Después de {after}',
  },
  'roadmap.nodeCount': '{done}/{total} lecciones',

  'roadmap.closeDetails': 'Cerrar detalles',
  'roadmap.after': 'Después de {list}',
  'roadmap.core': 'Esencial {done}/{total}',
  'roadmap.lessonsMastered': { one: '{done}/{count} lección · {pct} dominado', other: '{done}/{count} lecciones · {pct} dominado' },
  'roadmap.coreLessonsLabel': 'Lecciones esenciales de {course}',
  'roadmap.continueLesson': 'Continuar: {lesson}',
  'roadmap.startLesson': 'Empezar: {lesson}',
  'roadmap.allDoneQuiz': 'Todo listo: haz el test',
  'roadmap.openCourse': 'Abrir el curso',
  'roadmap.inside': 'Qué incluye',
  'roadmap.lessonDone': '(completada)',
  'roadmap.lessonNotDone': '(sin completar)',
  'roadmap.coreLesson': 'Lección esencial',

  'roadmap.teaser.next': 'Siguiente en la ruta {track}: {course}',
  'roadmap.teaser.finished': 'Terminaste la ruta {track}. ¡Elige otra!',
  'roadmap.teaser.cta': 'Ver el mapa →',
} satisfies Translation<typeof en>;
