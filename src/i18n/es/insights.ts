// Spanish UI strings: insights. Mirrors src/i18n/en/insights.ts (see docs/TRANSLATING.md).
// Items can be concepts (m.), lessons (f.) or topics (m.): mastery states avoid gender ("que dominas", "con dificultad").
import type { Translation } from '../core.ts';
import type en from '../en/insights.ts';

export default {
  // ---------- question formats ----------
  'insights.format.mcq': 'Opción múltiple',
  'insights.format.numeric': 'Respuestas numéricas',
  'insights.format.text': 'Respuestas cortas',
  'insights.format.output': 'Predice la salida',
  'insights.format.bug': 'Caza de errores',
  'insights.format.order': 'Ordenar',
  'insights.format.buckets': 'Clasificar en grupos',
  'insights.format.trace': 'Seguimiento de código',
  'insights.format.truthtable': 'Tablas de verdad',
  'insights.format.logicgrid': 'Cuadrículas lógicas',
  'insights.format.balance': 'Problemas de balanza',
  // In-sentence forms: "40% de aciertos en caza de errores frente a 90% en opción múltiple".
  'insights.formatInline.mcq': 'opción múltiple',
  'insights.formatInline.numeric': 'respuestas numéricas',
  'insights.formatInline.text': 'respuestas cortas',
  'insights.formatInline.output': 'predicción de la salida',
  'insights.formatInline.bug': 'caza de errores',
  'insights.formatInline.order': 'ordenación',
  'insights.formatInline.buckets': 'clasificación en grupos',
  'insights.formatInline.trace': 'seguimiento de código',
  'insights.formatInline.truthtable': 'tablas de verdad',
  'insights.formatInline.logicgrid': 'cuadrículas lógicas',
  'insights.formatInline.balance': 'problemas de balanza',
  'insights.formatAdvice.mcq': 'Intenta responder mentalmente antes de leer las opciones y luego elige la que coincida.',
  'insights.formatAdvice.numeric': 'Estima primero la respuesta para que un resultado muy desviado salte a la vista, y revisa las unidades.',
  'insights.formatAdvice.text': 'Di primero la idea con tus propias palabras y luego nombra el término exacto que pide la pregunta.',
  'insights.formatAdvice.output': 'Sigue el código en papel: anota cada variable después de cada línea antes de escribir la salida.',
  'insights.formatAdvice.bug': 'Lee primero el error y luego sigue las variables línea a línea para ver dónde se tuercen.',
  'insights.formatAdvice.order': 'Coloca primero la primera y la última pieza, y luego completa el medio.',
  'insights.formatAdvice.buckets': 'Ponle nombre a la regla de cada grupo antes de clasificar la primera tarjeta.',
  'insights.formatAdvice.trace': 'Predice qué cambia cada línea antes de avanzar y luego compara.',
  'insights.formatAdvice.truthtable': 'Completa una columna cada vez y apóyate en las columnas auxiliares.',
  'insights.formatAdvice.logicgrid': 'Marca lo que cada pista descarta, no solo lo que confirma.',
  'insights.formatAdvice.balance': 'Reúne primero las incógnitas en un lado y luego los números sueltos en el otro.',

  // ---------- small helpers ----------
  'insights.quoted': '“{title}”',
  'insights.list.separator': ', ',
  'insights.list.and': '{items} y {last}',
  'insights.list.more': { one: '{items} y {count} más', other: '{items} y {count} más' },

  // ---------- "you missed X n of the last m times" ----------
  'insights.miss.concept': {
    one: 'Fallaste en {name} en tu último intento.',
    other: 'Fallaste en {name} {misses} de las últimas {count} veces.',
  },
  'insights.miss.conceptAllTime': {
    one: 'Has fallado en {name} {misses} de {count} vez hasta ahora.',
    other: 'Has fallado en {name} {misses} de {count} veces hasta ahora.',
  },
  'insights.miss.lesson': {
    one: 'Fallaste preguntas de “{name}” en tu último intento.',
    other: 'Fallaste preguntas de “{name}” {misses} de las últimas {count} veces.',
  },
  'insights.miss.lessonAllTime': {
    one: 'Has fallado preguntas de “{name}” {misses} de {count} vez hasta ahora.',
    other: 'Has fallado preguntas de “{name}” {misses} de {count} veces hasta ahora.',
  },

  // ---------- struggle patterns ----------
  'insights.pattern.formats.title': 'Formato más débil: {format}',
  'insights.pattern.formats.detail': '{worst}: {worstPct} de aciertos, frente a {best}: {bestPct} (todas tus respuestas hasta ahora).',
  'insights.pattern.forgetting.title': 'Bien al principio, mal después',
  'insights.pattern.forgetting.detail': {
    one: '{items}: respondiste bien una pregunta sobre esto al menos dos veces y luego la fallaste en tu último intento. Es el olvido normal, y la señal para repasar.',
    other: '{items}: respondiste bien preguntas sobre esto al menos dos veces y luego las fallaste en tu último intento. Es el olvido normal, y la señal para repasar.',
  },
  'insights.pattern.pileup.title': 'Se te acumulan los repasos',
  'insights.pattern.pileup.detail': { one: '{count} repaso pendiente.', other: '{count} repasos pendientes.' },
  'insights.pattern.pileup.detailOldest': {
    one: '{count} repaso pendiente, desde hace {days}.',
    other: '{count} repasos pendientes; el más antiguo, desde hace {days}.',
  },
  'insights.pattern.skipped.title': 'Lecciones esenciales que te saltaste',
  'insights.pattern.skipped.detail': {
    one: '{lessons} es una lección esencial que no has abierto, aunque ya hiciste otras posteriores.',
    other: '{lessons} son lecciones esenciales que no has abierto, aunque ya hiciste otras posteriores.',
  },

  // ---------- tips ----------
  'insights.tip.clearReviews.title': { one: 'Haz primero tu {count} repaso pendiente', other: 'Haz primero tus {count} repasos pendientes' },
  'insights.tip.clearReviews.evidence': { one: '{count} repaso pendiente.', other: '{count} repasos pendientes.' },
  'insights.tip.clearReviews.evidenceOldest': {
    one: '{count} repaso pendiente; lleva esperando {days}.',
    other: '{count} repasos pendientes; el más antiguo lleva esperando {days}.',
  },
  'insights.tip.clearReviews.advice':
    'Hazlos antes de empezar lecciones nuevas. El repaso espaciado suele funcionar mejor cuando se hace cerca de la fecha prevista.',
  'insights.tip.weak.title': 'Vuelve a {name}',
  'insights.tip.weak.adviceConcept':
    'Relee la lección “{lesson}” y luego haz una práctica mixta corta: mezclarlo con otras ideas te ayuda a elegir el enfoque correcto, no solo a repetirlo.',
  'insights.tip.weak.adviceLesson': 'Repite la lección y luego haz una práctica mixta corta de {course}.',
  'insights.tip.forgetting.title': 'Repasa {name} antes',
  'insights.tip.forgetting.evidence': 'Habías acertado {name} al menos dos veces, pero fallaste en tu último intento.',
  'insights.tip.forgetting.advice':
    'La práctica de recuperación repartida en varios días suele hacer que los recuerdos duren. Practica hoy tus preguntas más débiles y deja que el calendario te las vuelva a traer.',
  'insights.tip.format.title': '{format}: prueba otro enfoque',
  'insights.tip.format.evidence': '{worstPct} de aciertos en {worst} frente a {bestPct} en {best}.',
  'insights.tip.skipped.title': 'Haz la lección esencial “{lesson}”',
  'insights.tip.skipped.evidence': 'Es una lección esencial de {course} que no has abierto, aunque ya avanzaste más allá.',
  'insights.tip.skipped.advice': 'Las lecciones esenciales son el grueso de un curso; las posteriores suelen basarse en ellas.',
  'insights.tip.confirm.title': 'Comprueba lo que sabes con un test',
  'insights.tip.confirm.evidence.concepts': { one: 'Dominas {count} concepto.', other: 'Dominas {count} conceptos.' },
  'insights.tip.confirm.evidence.lessons': { one: 'Dominas {count} lección.', other: 'Dominas {count} lecciones.' },
  'insights.tip.confirm.evidence.topics': { one: 'Dominas {count} tema.', other: 'Dominas {count} temas.' },
  'insights.tip.confirm.advice':
    'Un test mezcla preguntas de todo el curso: una forma rápida de confirmar que lo recuerdas y de encontrar lagunas.',
  'insights.tip.mix.title': 'Mezcla tu práctica',
  'insights.tip.mix.evidence.concepts': {
    one: '{count} concepto todavía se te resiste de vez en cuando.',
    other: '{count} conceptos todavía se te resisten de vez en cuando.',
  },
  'insights.tip.mix.evidence.lessons': {
    one: '{count} lección todavía se te resiste de vez en cuando.',
    other: '{count} lecciones todavía se te resisten de vez en cuando.',
  },
  'insights.tip.mix.evidence.topics': {
    one: '{count} tema todavía se te resiste de vez en cuando.',
    other: '{count} temas todavía se te resisten de vez en cuando.',
  },
  'insights.tip.mix.evidenceNone': 'Ahora mismo no hay nada que destaque como débil.',
  'insights.tip.mix.advice': 'Practicar varios temas en una sesión suele ayudarte a elegir el método correcto, no solo a recordarlo.',

  // ---------- tip buttons ----------
  'insights.action.startReviews': 'Empezar repasos',
  'insights.action.openLesson': 'Abrir “{lesson}”',
  'insights.action.redoLesson': 'Repetir la lección',
  'insights.action.practiseConcept': 'Practicar {concept}',
  'insights.action.mixedPractice': 'Práctica mixta',
  'insights.action.practiseWeakest': 'Practicar lo más débil',
  'insights.action.openLessonPlain': 'Abrir lección',
  'insights.action.courseQuiz': 'Test de {course}',

  // ---------- the report page ----------
  'insights.title': 'Tu informe de aprendizaje',
  'insights.subtitle': 'Qué fallas, en qué te cuesta y cómo mejorar.',
  'insights.subtitleCourse': 'Qué fallas, en qué te cuesta y cómo mejorar en {course}.',
  'insights.filter': 'Filtrar por curso',
  'insights.allCourses': 'Todos los cursos',
  'insights.notFound.title': 'Curso no encontrado',
  'insights.notFound.body': 'No hay ningún curso llamado “{id}”. <link>Ver el informe de todos tus cursos</link>.',

  'insights.noun.concepts': 'Conceptos',
  'insights.noun.lessons': 'Lecciones',
  'insights.noun.topics': 'Temas',

  'insights.state.mastered': 'Lo dominas',
  'insights.state.learning': 'En progreso',
  'insights.state.struggling': 'Con dificultad',
  'insights.state.untested': 'Sin practicar',
  'insights.state.none': 'Sin preguntas aún',

  // ---------- empty state ----------
  'insights.empty.title': 'Aún no hay suficiente práctica',
  'insights.empty.start': 'Responde unas cuantas preguntas y este informe se irá completando.',
  'insights.empty.startIn': 'Responde unas cuantas preguntas de {course} y este informe se irá completando.',
  'insights.empty.answered': { one: 'Has respondido {count} pregunta.', other: 'Has respondido {count} preguntas.' },
  'insights.empty.answeredIn': { one: 'Has respondido {count} pregunta de {course}.', other: 'Has respondido {count} preguntas de {course}.' },
  'insights.empty.more': {
    one: 'Te falta {count} respuesta para completar este informe.',
    other: 'Te faltan {count} respuestas para completar este informe.',
  },
  'insights.empty.needsAttention': '<b>Necesita atención:</b> conceptos que sigues fallando, ordenados según tus respuestas recientes.',
  'insights.empty.patterns':
    '<b>Patrones:</b> qué formatos de pregunta se te resisten, lo que acertaste una vez pero olvidaste y los repasos que se acumulan.',
  'insights.empty.strengths': '<b>Puntos fuertes:</b> lo que has respondido bien tres veces seguidas.',
  'insights.empty.tips': '<b>Consejos:</b> unos cuantos pasos concretos, cada uno basado en tus propias respuestas.',
  'insights.empty.openCourse': 'Abrir el curso',
  'insights.empty.continue': 'Seguir aprendiendo',
  'insights.empty.review': 'Repasar',

  // ---------- sections ----------
  'insights.tips.title': 'Cómo mejorar',
  'insights.tips.basis': 'Basado en tus propias respuestas',
  'insights.weak.title': 'Necesita atención',
  'insights.weak.ranked': 'Ordenado por fallos recientes',
  'insights.patterns.title': 'Patrones de dificultad',
  'insights.strengths.title': 'Puntos fuertes',
  'insights.strengths.count.concepts': { one: '{count} concepto dominado', other: '{count} conceptos dominados' },
  'insights.strengths.count.lessons': { one: '{count} lección dominada', other: '{count} lecciones dominadas' },
  'insights.strengths.count.topics': { one: '{count} tema dominado', other: '{count} temas dominados' },
  'insights.strengths.more': { one: 'y {count} más', other: 'y {count} más' },
  'insights.strengths.none.concepts':
    'Aún no dominas nada. Un concepto cuenta como dominado cuando todas las preguntas que has respondido sobre él te han salido bien tres veces seguidas.',
  'insights.strengths.none.lessons':
    'Aún no dominas nada. Una lección cuenta como dominada cuando todas las preguntas que has respondido sobre ella te han salido bien tres veces seguidas.',
  'insights.strengths.none.topics':
    'Aún no dominas nada. Un tema cuenta como dominado cuando todas las preguntas que has respondido sobre él te han salido bien tres veces seguidas.',
  'insights.map.title': 'Dominio por curso',

  // ---------- overview tiles ----------
  'insights.window.label': { one: 'Aciertos, último {count} día', other: 'Aciertos, últimos {count} días' },
  'insights.window.detail': {
    one: 'Último intento en {count} pregunta: {right} bien',
    other: 'Último intento en {count} preguntas: {right} bien',
  },
  'insights.window.empty': 'No hay respuestas en este periodo',
  'insights.counts.mastered': { one: '<b>{count}</b> que dominas', other: '<b>{count}</b> que dominas' },
  'insights.counts.learning': { one: '<b>{count}</b> en progreso', other: '<b>{count}</b> en progreso' },
  'insights.counts.struggling': { one: '<b>{count}</b> con dificultad', other: '<b>{count}</b> con dificultad' },
  'insights.counts.untested': { one: '{count} sin practicar', other: '{count} sin practicar' },
  'insights.due.label': 'Repasos pendientes',
  'insights.due.oldest': { one: 'El más antiguo espera desde hace {count} día', other: 'El más antiguo espera desde hace {count} días' },
  'insights.due.today': 'Para hoy',
  'insights.due.none': 'Todo al día',

  // ---------- needs attention ----------
  'insights.weak.nothing': 'Ahora mismo no hay nada que destaque.',
  'insights.weak.thin.concepts': {
    one: '{count} concepto tiene menos de {min} respuestas, así que aún es pronto para saberlo.',
    other: '{count} conceptos tienen menos de {min} respuestas, así que aún es pronto para saberlo.',
  },
  'insights.weak.thin.lessons': {
    one: '{count} lección tiene menos de {min} respuestas, así que aún es pronto para saberlo.',
    other: '{count} lecciones tienen menos de {min} respuestas, así que aún es pronto para saberlo.',
  },
  'insights.weak.thin.topics': {
    one: '{count} tema tiene menos de {min} respuestas, así que aún es pronto para saberlo.',
    other: '{count} temas tienen menos de {min} respuestas, así que aún es pronto para saberlo.',
  },
  'insights.weak.lesson': 'Lección “{title}”',
  'insights.weak.lastToday': 'última respuesta hoy',
  'insights.weak.lastYesterday': 'última respuesta ayer',
  'insights.weak.lastDaysAgo': { one: 'última respuesta hace {count} día', other: 'última respuesta hace {count} días' },
  'insights.weak.due': { one: '{count} pendiente', other: '{count} pendientes' },
  'insights.weak.practise': 'Practicar',
  'insights.weak.practiseLabel': 'Practicar {name} con ideas relacionadas',
  'insights.weak.more': { one: 'y {count} más en las vistas por curso de abajo', other: 'y {count} más en las vistas por curso de abajo' },

  // ---------- sparkline ----------
  'insights.spark.empty': 'sin historial',
  'insights.spark.right': 'acierto',
  'insights.spark.wrong': 'fallo',
  'insights.spark.guessed': 'adivinada',
  'insights.spark.label': {
    one: 'Última {count} respuesta, de la más antigua a la más reciente: {results}',
    other: 'Últimas {count} respuestas, de la más antigua a la más reciente: {results}',
  },
  'insights.spark.point': 'Respuesta {index} de {total}: {result} (últimas 3: {pct} de aciertos)',

  // ---------- patterns ----------
  'insights.types.title': 'Aciertos por formato de pregunta',
  'insights.types.tip': '{format}: {right} de {total} bien',
  'insights.types.row': '{right} de {total} bien ({pct})',
  'insights.types.needMore': 'Cada formato necesita {min} respuestas antes de aparecer aquí.',
  'insights.types.hidden': {
    one: 'Se omite {count} formato con menos de {min} respuestas. Cuentan todas tus respuestas hasta ahora.',
    other: 'Se omiten {count} formatos con menos de {min} respuestas. Cuentan todas tus respuestas hasta ahora.',
  },
  'insights.patterns.none':
    'Aún no hay patrones claros: ninguna diferencia entre formatos, nada olvidado, los repasos bajo control y ninguna lección esencial saltada.',

  // ---------- mastery map ----------
  'insights.chip.noQuestions': 'Aún no hay preguntas de práctica',
  'insights.chip.untested': { one: '{count} pregunta, sin practicar', other: '{count} preguntas, sin practicar' },
  'insights.chip.score': '{right}/{total} bien',
  'insights.chip.scoreThin': '{right}/{total} bien (muy pocas respuestas para valorar)',
  'insights.chip.scoreRecent': '{right}/{total} bien; últimas {count}: {pct}',
  'insights.chip.scoreRecentThin': '{right}/{total} bien; últimas {count}: {pct} (muy pocas respuestas para valorar)',
  'insights.chip.label': '{name}: {state}. {detail}',
  'insights.legend': 'Leyenda',
  'insights.course.masteredConcepts': {
    one: '{mastered} de {count} concepto dominado',
    other: '{mastered} de {count} conceptos dominados',
  },
  'insights.course.masteredLessons': {
    one: '{mastered} de {count} lección dominada · agrupado por lección hasta que este curso tenga mapa de conceptos',
    other: '{mastered} de {count} lecciones dominadas · agrupado por lección hasta que este curso tenga mapa de conceptos',
  },
  'insights.course.focus': 'Ver solo este',

  // ---------- Home card ----------
  'insights.teaser.weak': '{miss} Mira cómo mejorar.',
  'insights.teaser.mastered.concepts': {
    one: '{count} concepto dominado. Mira qué practicar ahora.',
    other: '{count} conceptos dominados. Mira qué practicar ahora.',
  },
  'insights.teaser.mastered.lessons': {
    one: '{count} lección dominada. Mira qué practicar ahora.',
    other: '{count} lecciones dominadas. Mira qué practicar ahora.',
  },
  'insights.teaser.mastered.topics': {
    one: '{count} tema dominado. Mira qué practicar ahora.',
    other: '{count} temas dominados. Mira qué practicar ahora.',
  },
  'insights.teaser.default': 'Mira qué fallas, en qué te cuesta y cómo mejorar.',

  // ---------- charts (Home, Review, Profile) ----------
  'insights.chart.goal': 'meta {goal}',
  'insights.chart.xpTip': '{day}: {count} XP',
  'insights.chart.xpLabel': 'XP ganados en los últimos 7 días',
  'insights.chart.tomorrow': 'Mañana',
  'insights.chart.dueTip': { one: '{day}: {count} pendiente', other: '{day}: {count} pendientes' },
  'insights.chart.reviews': { one: '{count} repaso', other: '{count} repasos' },
  'insights.chart.forecastLabel': 'Repasos pendientes en los próximos 7 días',
  // Memory strength of a question (pregunta: feminine).
  'insights.box.1': 'Reaprendiendo',
  'insights.box.2': 'Nueva',
  'insights.box.3': 'Conocida',
  'insights.box.4': 'Sólida',
  'insights.box.5': 'Fuerte',
  'insights.box.6': 'Dominada',
  'insights.chart.strengthLabel': 'Preguntas por fuerza de la memoria',
  'insights.chart.strengthTip': { one: '{box}: {count} pregunta', other: '{box}: {count} preguntas' },
  'insights.chart.heatmapLabel': {
    one: 'Actividad en las últimas {weeks} semanas: {count} día activo',
    other: 'Actividad en las últimas {weeks} semanas: {count} días activos',
  },
  'insights.chart.activeDays': { one: '{count} día activo', other: '{count} días activos' },
  'insights.chart.less': 'Menos',
  'insights.chart.more': 'Más',
} satisfies Translation<typeof en>;
