// Spanish UI strings: course. Mirrors src/i18n/en/course.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/course.ts';

export default {
  'course.allCourses': '← Todos los cursos',
  'course.categoryLevel': '{category} · {level}',
  'course.continue': 'Continuar →',
  'course.startLearning': 'Empezar a aprender →',
  'course.takeQuiz': 'Hacer el test',
  'course.testOut': 'Mide lo que sabes con el test',
  'course.unit': 'Unidad {number}',
  'course.lessonMeta': { one: '{minutes} min · {count} paso', other: '{minutes} min · {count} pasos' },
  'course.lessonMetaDone': { one: '{minutes} min · {count} paso · completada', other: '{minutes} min · {count} pasos · completada' },

  'course.path.title': 'Ruta de aprendizaje',
  'course.path.view': 'Vista de la ruta',
  'course.path.map': 'Mapa',
  'course.path.list': 'Lista',
  'course.path.fastTrack': 'Modo rápido: solo lo esencial',
  'course.path.fastTrackNote': {
    one: 'Mostrando la {count} lección esencial (~{minutes} min) que cubre la mayor parte de lo que usarás.',
    other: 'Mostrando las {count} lecciones esenciales (~{minutes} min) que cubren la mayor parte de lo que usarás.',
  },
  'course.path.node': 'Lección {number}: {title}',
  'course.path.nodeDone': 'Lección {number}: {title}, completada',
  'course.path.nodeNext': 'Lección {number}: {title}, la siguiente',
  'course.path.nodeDeep': 'Lección {number}: {title}, profundización',
  'course.path.nodeDeepDone': 'Lección {number}: {title}, profundización, completada',
  'course.path.nodeDeepNext': 'Lección {number}: {title}, profundización, la siguiente',
  'course.path.completed': '✓ Completada',
  'course.path.review': 'Repasar',
  'course.path.unitCount': '{done}/{total}<sr> lecciones completadas</sr>',

  'course.side.lessonsCompleted': 'Lecciones completadas',
  'course.side.coreLessons': '<b>{done}/{total}</b> lecciones esenciales',
  'course.side.mastered': '<b>{pct}</b> dominado',
  'course.side.bestQuiz': '<b>{score}</b> mejor test',
  'course.side.mastery': 'Dominio',
  'course.side.masteredNote': 'Dominado = recordado a lo largo de varios repasos espaciados.',
  'course.keyIdeas': 'El 20% que importa',

  'course.links.quiz': 'Test',
  'course.links.quizHelp': { one: '{count} pregunta variada: encuentra tus lagunas', other: '{count} preguntas variadas: encuentra tus lagunas' },
  'course.links.map': 'Mapa de conocimientos',
  'course.links.mapProgress': '{recalled}/{total} ideas recordadas por ahora: sigue con el mapa',
  'course.links.mapStart': 'Plasma de memoria lo que sabes y luego une los puntos',
  'course.links.mapRecall': 'Recuerda de memoria las ideas clave',
  'course.links.review': 'Repasar este curso',
  'course.links.reviewHelp': 'Practica lo pendiente de {title}',
  'course.links.cheatSheet': 'Resumen',
  'course.links.cheatSheetHelp': 'Todo el curso en una página imprimible',

  'course.cheatSheet.back': '← {title}',
  'course.cheatSheet.print': 'Imprimir / guardar como PDF',
  'course.cheatSheet.title': '{title}: resumen',
  'course.cheatSheet.intro': 'Prueba esto primero: tapa la página y explica cada idea en voz alta. Donde te atasques, ahí tienes lo que debes repasar.',
  'course.cheatSheet.keyIdeas': 'Ideas clave',
} satisfies Translation<typeof en>;
