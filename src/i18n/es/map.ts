// Spanish UI strings: map. Mirrors src/i18n/en/map.ts (see docs/TRANSLATING.md).
// Words that describe a node agree with "idea" (feminine): recordada, aprendida. A "chunk" is a "bloque".
import type { Translation } from '../core.ts';
import type en from '../en/map.ts';

export default {
  // ---------- page ----------
  'map.notFound': 'Curso no encontrado',
  'map.allCourses': 'Todos los cursos',
  'map.eyebrow': 'Mapa de conocimientos',
  'map.unitCheckpoint': 'Punto de control de la unidad {n}',
  'map.lead': 'Dibújalo de memoria, mira qué falta y luego une los puntos.',
  'map.scope.label': 'Mapa',
  'map.scope.wholeCourse': { one: 'Curso completo ({count} idea)', other: 'Curso completo ({count} ideas)' },
  'map.scope.unit': 'Unidad {n}: {title} ({count})',
  'map.scope.empty': 'Esta unidad aún no tiene ideas en el mapa del curso.',
  'map.scope.mapWhole': 'Mejor haz el mapa de todo el curso',

  // ---------- courses without a concept map ----------
  'map.soon.title': 'El mapa de {course} llegará pronto',
  'map.soon.lead':
    'Este curso aún no tiene su mapa de conceptos. Mientras tanto, aquí tienes la misma idea en papel: tapa la lista de abajo, escribe todas las ideas clave que recuerdes y luego comprueba.',
  'map.soon.keyIdeas': 'Las ideas clave',
  'map.soon.backToCourse': 'Volver al curso',
  'map.soon.quiz': 'Ponte a prueba con el test',

  // ---------- layers (stepper) ----------
  'map.layers': 'Capas',
  'map.layer.1.title': '¿Qué sé ya?',
  'map.layer.1.short': 'Recordar',
  'map.layer.2.title': '¿Qué no sé todavía?',
  'map.layer.2.short': 'Lagunas',
  'map.layer.3.title': 'Une los puntos',
  'map.layer.3.short': 'Conectar',
  'map.layer.locked': '(bloqueada hasta que termines la capa anterior)',

  // ---------- screen-reader announcements ----------
  'map.announce.layer': 'Capa {n}: {title}',
  'map.announce.linkedPickLabel': 'Conectaste {a} y {b}. Si quieres, elige una etiqueta abajo.',
  'map.announce.linked': 'Conectaste {a} y {b}.',
  'map.announce.linkCancelled': 'Conexión cancelada.',
  'map.announce.tidied': 'Mapa ordenado.',
  'map.announce.cleared': 'Borrado. Empieza a recordar de memoria.',
  'map.announce.hint': 'Pista: {from} {label} {to}.',
  'map.announce.markedKnown': 'Anotado: ya sabes {label}.',
  'map.announce.merged': 'Nota fusionada con {label}: cuenta como idea recordada.',
  'map.linkingFrom': 'Conectando desde {label}: ahora elige una segunda idea.',
  'map.confirm.startOverCourse': '¿Empezar de nuevo con todo el curso? Se borrarán las ideas que recordaste, tus notas y tus conexiones de aquí.',
  'map.confirm.startOverUnit': '¿Empezar de nuevo con esta unidad? Se borrarán las ideas que recordaste, tus notas y tus conexiones de aquí.',

  // ---------- toolbar and footer ----------
  'map.view.label': 'Vista',
  'map.view.canvas': 'Lienzo',
  'map.view.list': 'Lista',
  'map.zoomOut': 'Alejar',
  'map.zoomIn': 'Acercar',
  'map.fit': 'Ajustar',
  'map.tidy': 'Ordenar',
  'map.saved': 'Se guarda automáticamente.',
  'map.startOver': 'Empezar de nuevo',

  // ---------- node kinds ----------
  'map.kind.recalled': 'recordada de memoria',
  'map.kind.island': 'aún sin recordar',
  'map.kind.learned': 'aprendida después',
  'map.kind.note': 'tu propia nota',

  // Suggested link labels (glossary: concept-map link labels).
  'map.generic.isA': 'es una forma de',
  'map.generic.isPartOf': 'es parte de',
  'map.generic.needs': 'necesita',
  'map.generic.causes': 'provoca',
  'map.generic.replaces': 'reemplaza',
  'map.generic.isOppositeOf': 'es lo opuesto a',
  'map.link.linkedTo': 'se conecta con',
  'map.link.isLinkedTo': 'se conecta con',
  'map.noLabel': '(sin etiqueta)',

  // ---------- layer 1: recall ----------
  'map.recall.intro':
    'Escribe las ideas que recuerdes, una a una, y presiona Enter. Sin mirar: intentar recordar antes de ver suele hacer que lo que leas después se te quede mejor.',
  'map.recall.counterLabel': 'Recordadas: {recalled} de {total}',
  'map.recall.counter': '{recalled}<rest>/ {total} recordadas</rest>',
  'map.recall.progress': 'Ideas recordadas',
  'map.recall.locked':
    'Aquí ya no puedes recordar porque se ha revelado el resto del mapa. Empieza de nuevo para volver a intentarlo de memoria, o usa las capas 2 y 3.',
  'map.recall.inputLabel': 'Una idea que recuerdes',
  'map.recall.placeholder': 'p. ej., un término, una regla, una técnica',
  'map.recall.add': 'Añadir',
  'map.recall.undo': 'No era eso: conserva mis palabras',
  'map.recall.secondsLeft': { one: 'Queda {count} segundo', other: 'Quedan {count} segundos' },
  'map.recall.stopTimer': 'Detener el temporizador',
  'map.recall.sprint': 'Opcional: reto de 2 minutos',
  'map.recall.backToGaps': 'Volver a las lagunas',
  'map.recall.done': 'Ya no se me ocurre nada: muéstrame lo que falta',
  'map.recall.timeUp':
    'Tiempo. Ha sido un buen ejercicio de recuperación: sigue añadiendo si te viene algo más a la mente, o mira lo que falta.',
  'map.recall.already': '{label} ya está en tu mapa.',
  'map.recall.recalled': 'Recordaste {label}.',
  'map.recall.recalledAll': 'Recordaste {label}. Ya tienes todas las ideas de aquí.',
  'map.recall.recalledRun': 'Recordaste {label}. Llevas {count} de memoria, ¡buena racha!',
  'map.recall.otherUnit': '{label} es de la unidad {unit}. Buen recuerdo: se guarda en tu mapa del curso completo.',
  'map.recall.dupNote': 'Esa ya la anotaste.',
  'map.recall.keptNote':
    '“{typed}” se guardó como nota tuya. Si el curso lo llama de otra forma, podrás fusionarla después de revelar el mapa.',
  'map.recall.keptNoteInstead': 'Entonces “{typed}” se guardó como nota tuya.',
  'map.recall.msg.empty': 'Esta parte del curso todavía no tiene conceptos que recordar.',
  'map.recall.msg.all': {
    one: 'Recordaste {count} idea de memoria. Es el mapa completo.',
    other: 'Recordaste las {count} ideas de memoria. Es el mapa completo.',
  },
  'map.recall.msg.none':
    'Esta vez no te vino nada a la mente, y es un buen punto de partida: los estudios sugieren que intentar recordar primero suele hacer que la siguiente lectura se te quede mejor.',
  'map.recall.msg.strong': {
    other: 'Recordaste {recalled} de {count} ideas de memoria. Es un recuerdo muy sólido; las pocas islas que quedan son victorias rápidas.',
  },
  'map.recall.msg.solid': {
    other: 'Recordaste {recalled} de {count} ideas de memoria. Una base sólida sobre la que construir; las islas de abajo te muestran exactamente qué leer ahora.',
  },
  'map.recall.msg.start': {
    other: 'Recordaste {recalled} de {count} ideas de memoria. Cada idea que sacaste se fortaleció un poco, y las islas de abajo son tu lista de lectura.',
  },

  // ---------- layer 2: gaps ----------
  'map.gaps.recalledPct': 'Recordado: {pct}',
  'map.gaps.intro':
    'Las islas discontinuas son las ideas que no recordaste. Abre una para leer qué es, sigue el enlace a su lección y márcala cuando la entiendas.',
  'map.gaps.marked': '{learned} de {total} marcadas por ahora.',
  'map.gaps.none': 'No hay islas: recordaste todo lo de esta parte del curso.',
  'map.gaps.notesHint': 'Selecciona una de tus notas para fusionarla con una idea del curso si las dos nombran lo mismo.',
  'map.gaps.backToConnecting': 'Volver a conectar →',
  'map.gaps.connect': 'Une los puntos →',

  // ---------- layer 3: connect ----------
  'map.connect.intro':
    'Toca una idea y luego otra para conectarlas, o arrastra desde el punto de una idea. Dibuja las conexiones que podrías explicar en una frase; las ideas unidas a otras suelen ser más fáciles de recordar y de usar.',
  'map.connect.pickFromList': 'O elige dos ideas de una lista',
  'map.connect.from': 'Desde',
  'map.connect.link': 'Conexión',
  'map.connect.to': 'Hasta',
  'map.connect.chooseIdea': 'Elige una idea',
  'map.connect.addLink': 'Añadir conexión',
  'map.connect.check': 'Comprobar mi mapa',
  'map.connect.checkAgain': 'Comprobar de nuevo',

  // ---------- check results ----------
  'map.results.aria': 'Comprobación del mapa',
  'map.results.title': 'Tu mapa frente al mapa del curso',
  'map.results.found': { one: 'conexión encontrada', other: 'conexiones encontradas' },
  'map.results.foundWithHint': { one: 'conexión encontrada, {withHint} con pista', other: 'conexiones encontradas, {withHint} con pista' },
  'map.results.chunks': { one: 'bloque de comprensión', other: 'bloques de comprensión' },
  'map.results.ownLinks': { one: 'conexión tuya', other: 'conexiones tuyas' },
  'map.results.progress': 'Conexiones del curso encontradas',
  'map.results.chunkExplain': 'Un bloque es un grupo de ideas unidas por conexiones del curso; lleva el nombre de su idea mejor conectada.',
  'map.results.chunkIdeas': { one: '{count} idea', other: '{count} ideas' },
  'map.results.extra': {
    one: '{count} conexión que dibujaste no está en el mapa del curso. Aun así puede ser cierta: el mapa del curso es la visión de un experto, no la única.',
    other: '{count} conexiones que dibujaste no están en el mapa del curso. Aun así pueden ser ciertas: el mapa del curso es la visión de un experto, no la única.',
  },
  'map.results.addToMap': 'Añadir a mi mapa',
  'map.results.showHint': 'Muéstrame una conexión que me faltó',
  'map.results.allShown': 'Ya se muestran todas las conexiones que faltaban',
  'map.results.msg.noLinks': 'El mapa del curso aún no tiene conexiones en esta parte, así que cada conexión que dibujes es tuya.',
  'map.results.msg.none': {
    one: 'El mapa del curso une estas ideas con {count} conexión. Dibújala si la tienes clara y vuelve a comprobar, o pide una pista.',
    other: 'El mapa del curso une estas ideas de {count} maneras. Dibuja algunas que tengas claras y vuelve a comprobar, o pide una pista.',
  },
  'map.results.msg.all': {
    one: 'Encontraste la única conexión del mapa del curso. El conocimiento conectado así suele ser más fácil de usar.',
    other: 'Encontraste las {count} conexiones del mapa del curso. El conocimiento conectado así suele ser más fácil de usar.',
  },
  'map.results.msg.allWithHint': {
    one: 'Encontraste la única conexión del mapa del curso ({withHint} con pista). El conocimiento conectado así suele ser más fácil de usar.',
    other: 'Encontraste las {count} conexiones del mapa del curso ({withHint} con pista). El conocimiento conectado así suele ser más fácil de usar.',
  },
  'map.results.msg.some': { other: 'Encontraste {got} de {count} conexiones del mapa del curso. Cada una une dos ideas.' },
  'map.results.msg.someWithHint': {
    other: 'Encontraste {got} de {count} conexiones del mapa del curso ({withHint} con pista). Cada una une dos ideas.',
  },

  // ---------- details panels ----------
  'map.detail.selected': 'Selección: {label}',
  'map.detail.close': 'Cerrar detalles',
  'map.detail.taughtIn': 'Se enseña en {lesson}',
  'map.detail.learnThis': 'Aprender esto',
  'map.detail.knowNow': 'Ya lo sé',
  'map.detail.notYet': 'En realidad, todavía no',
  'map.detail.linkFromHere': 'Conectar desde aquí',
  'map.detail.removeFromMap': 'Quitar de mi mapa',
  'map.detail.deleteNote': 'Eliminar nota',
  'map.detail.mergeLabel': '¿Es la misma idea que un concepto del curso? Fusiónala:',
  'map.detail.chooseConcept': 'Elige un concepto',
  'map.detail.merge': 'Fusionar',
  'map.detail.mergeLater': 'Después de revelar el mapa, podrás fusionar una nota con un concepto del curso.',
  'map.detail.removeLinkTo': 'Quitar la conexión con {label}',
  'map.detail.remove': 'Quitar',
  'map.detail.recalledFromMemory': 'Esta la recordaste de memoria.',
  'map.detail.selectedLink': 'Conexión seleccionada',
  'map.detail.linkKind': 'Conexión',
  'map.detail.label': 'Etiqueta',
  'map.detail.inCourseMap': 'En el mapa del curso: {from} {label} {to}.',
  'map.detail.inCourseMapHinted': 'En el mapa del curso (encontrada con pista): {from} {label} {to}.',
  'map.detail.notInCourseMap': 'No está en el mapa del curso. Aun así puede ser cierta: ¿sabrías decir cómo se relacionan?',
  'map.detail.swap': 'Invertir dirección',
  'map.detail.removeLink': 'Quitar conexión',

  // ---------- legend and list view ----------
  'map.legend': 'Leyenda',
  'map.legend.fromMemory': 'De memoria',
  'map.legend.yourNote': 'Tu nota',
  'map.legend.notYet': 'Aún no',
  'map.legend.learnedSince': 'Aprendida después',
  'map.legend.inCourseMap': 'En el mapa del curso',
  'map.legend.ownLink': 'Conexión tuya',
  'map.legend.hint': 'Pista',
  'map.list.ownNotes': 'Tus notas',
  'map.list.links': 'Conexiones',
  'map.list.status.found': 'en el mapa del curso',
  'map.list.status.hinted': 'en el mapa del curso, con pista',
  'map.list.status.extra': 'conexión tuya',
  'map.list.empty': 'Tu mapa aún está vacío. Añade la primera idea que recuerdes.',
  'map.list.noLinks': 'Aún no hay conexiones. Selecciona una idea y luego otra.',
  'map.list.linkToThis': '(conectar con esta)',
  'map.list.startLink': '(empezar una conexión)',

  // ---------- canvas ----------
  'map.canvas.aria':
    'Lienzo del mapa de conocimientos. Arrastra para desplazarte; pellizca o usa la rueda para hacer zoom. Las ideas son botones; las flechas mueven la idea enfocada. La vista Lista muestra el mismo mapa en forma de listas.',
  'map.canvas.node': '{label}, {kind}',
  'map.canvas.nodeLinkTo': '{label}, {kind}. Presiona para conectar.',
  'map.canvas.nodeStartLink': '{label}, {kind}. Presiona para empezar una conexión.',
  'map.canvas.chunkTag': 'bloque',
  'map.canvas.empty': 'Tu mapa está vacío. Escribe la primera idea que recuerdes.',
} satisfies Translation<typeof en>;
