// Spanish UI strings: thinking. Mirrors src/i18n/en/thinking.ts (see docs/TRANSLATING.md).
// Phase names come from the glossary: Equivócate primero / Acórtalo / Rehazlo. Sheet = hoja, pile = montón,
// anchor = ancla, keyword = palabra clave, guesses = conjeturas.
import type { Translation } from '../core.ts';
import type en from '../en/thinking.ts';

export default {
  // ---------- the three phases ----------
  'thinking.phase.wrong': 'Equivócate primero',
  'thinking.phase.shorter': 'Acórtalo',
  'thinking.phase.again': 'Rehazlo',

  // ---------- missing-step messages ----------
  'thinking.missing.wrongKeywords': {
    one: 'Añade {count} palabra clave más. Adivinar también vale.',
    other: 'Añade {count} palabras clave más. Adivinar también vale.',
  },
  'thinking.missing.wrongPiles': {
    one: 'Agrúpalas en {count} montón: arrastra las palabras clave hacia las columnas.',
    other: 'Agrúpalas en {count} montones: arrastra las palabras clave hacia las columnas.',
  },
  'thinking.missing.anchorTooLong': {
    one: 'Cada ancla tiene {count} palabra como máximo.',
    other: 'Cada ancla tiene {count} palabras como máximo.',
  },
  'thinking.missing.moreAnchors': { one: 'Escribe {count} ancla más.', other: 'Escribe {count} anclas más.' },
  'thinking.missing.recall': {
    one: 'Primero escribe {count} palabra clave más de memoria.',
    other: 'Primero escribe {count} palabras clave más de memoria.',
  },

  // ---------- sheet titles for review/practice/quiz sessions ----------
  'thinking.session.review': 'Repaso',
  'thinking.session.reviewCourse': 'Repaso: {course}',
  'thinking.session.practice': 'Práctica mixta',
  'thinking.session.practiceCourse': 'Práctica mixta: {course}',
  'thinking.session.quiz': 'Test',
  'thinking.session.quizCourse': 'Test: {course}',

  // ---------- make it wrong ----------
  'thinking.wrong.heading': '¿Qué piensas ya sobre “{topic}”?',
  'thinking.wrong.lead':
    'Pon palabras clave en el papel antes de la lección: conjeturas, recuerdos a medias, incluso ideas equivocadas. Luego agrúpalas en montones que te parezcan relacionados. Aquí nada se califica; un primer intento desordenado le da a la lección algo a lo que engancharse.',
  'thinking.wrong.sheetLabel': 'Tus primeras conjeturas sobre {topic}',
  'thinking.wrong.ready': 'Bien. {time} en papel.',
  'thinking.wrong.start': 'Empezar la lección',

  // ---------- make it shorter ----------
  'thinking.shorter.placeholder': 'unas pocas palabras',
  'thinking.shorter.placeholderOptional': 'tercera ancla opcional',
  'thinking.shorter.anchorLabel': { one: 'Ancla {n}, {count} palabra como máximo', other: 'Ancla {n}, {count} palabras como máximo' },
  'thinking.shorter.wordCount': { one: '{n}/{count} palabra', other: '{n}/{count} palabras' },
  'thinking.shorter.hitHeading': 'Tus anclas nombran',
  'thinking.shorter.ownWords': 'Tus anclas están en tus propias palabras, y está bien: solo tienen que traerte la idea de vuelta.',
  'thinking.shorter.missedHeading': 'Detrás de las preguntas que fallaste',
  'thinking.shorter.alsoHeading': 'También en esta lección',
  'thinking.shorter.notMistake': 'No es un error: vale la pena echarle otro vistazo antes de seguir.',
  'thinking.shorter.beforeHeading': 'Antes de la lección escribiste',
  'thinking.shorter.firstGuesses': 'Tus primeras conjeturas',
  'thinking.shorter.rebuildNext': 'Reharás esta hoja de memoria al empezar tu próxima sesión y corregirás lo que esté mal.',
  'thinking.shorter.ready': 'Ya es bastante corto. El desorden no importa.',
  'thinking.shorter.squeeze': 'Condénsalo',

  // ---------- make it again ----------
  'thinking.again.heading': 'Rehaz “{title}” de memoria',
  'thinking.again.lead':
    'Papel en blanco y sin mirar. Escribe las palabras clave y las anclas que recuerdes de esa hoja, y ordénalas según cómo se conectan ahora. Sacarlo de la memoria es lo que hace que se quede.',
  'thinking.again.sheetLabel': 'Rehaciendo {title} de memoria',
  'thinking.again.compareHeading': 'Compara y pásalo a limpio',
  'thinking.again.compareLead':
    'Aquí está tu hoja antigua. Conserva lo que sigue siendo válido, corrige lo que estaba mal y descarta lo que no importa. Tu versión en limpio reemplaza a la antigua.',
  'thinking.again.oldSheet': 'Tu hoja antigua',
  'thinking.again.verdictHeading': 'Conservar, corregir o descartar',
  'thinking.again.anchorTag': 'ancla',
  'thinking.again.remembered': 'recordada',
  'thinking.again.verdictGroup': 'Qué hacer con {item}',
  'thinking.again.keep': 'Conservar',
  'thinking.again.fix': 'Corregir',
  'thinking.again.drop': 'Descartar',
  'thinking.again.fixLabel': 'Versión corregida de {item}',
  'thinking.again.cleanSheet': 'Tu hoja en limpio',
  'thinking.again.cleanNote': 'Lo que escribiste de memoria. Vuelve a ordenarlo, añade lo que acabas de corregir y dibuja cómo se conecta.',
  'thinking.again.savedHeading': 'Hoja en limpio guardada',
  'thinking.again.tileRemembered': 'Recordadas',
  'thinking.again.tileFixed': 'Corregidas',
  'thinking.again.tileXp': 'XP',
  'thinking.again.nextRedo': {
    one: 'Esta hoja vuelve dentro de {count} día. Cada vez, el intervalo crece.',
    other: 'Esta hoja vuelve dentro de {count} días. Cada vez, el intervalo crece.',
  },
  'thinking.again.recalled': { one: '{count} palabra clave de memoria.', other: '{count} palabras clave de memoria.' },
  'thinking.again.broughtBack': 'Recuperaste {got} de {total}.',
  'thinking.again.compare': 'Comparar con mi hoja antigua',
  'thinking.again.save': 'Guardar la hoja en limpio',

  // ---------- the sheet of paper ----------
  'thinking.paper.placeholder': 'Escribe una palabra clave y presiona Enter',
  'thinking.paper.tools': 'Herramientas de la hoja',
  'thinking.paper.tool': 'Herramienta',
  'thinking.paper.keywords': 'Palabras',
  'thinking.paper.pen': 'Lápiz',
  'thinking.paper.undoInk': 'Deshacer trazo',
  'thinking.paper.addPile': '+ Montón',
  'thinking.paper.count': { one: '{n}/{count} palabra clave', other: '{n}/{count} palabras clave' },
  'thinking.paper.pile': 'Montón {n}',
  'thinking.paper.pileInline': 'montón {n}',
  'thinking.paper.pilePlaceholder': 'Montón {n}: ponle nombre',
  'thinking.paper.pileNameLabel': 'Nombre del montón {n}',
  'thinking.paper.trayLabel': 'las palabras clave nuevas aparecen aquí; arrástralas a un montón',
  'thinking.paper.chipInPile': '{text}, en {pile}',
  'thinking.paper.chipInTray': '{text}, sin clasificar',
  'thinking.paper.chipInPileFixed': '{text}, en {pile}; antes decía {old}',
  'thinking.paper.chipInTrayFixed': '{text}, sin clasificar; antes decía {old}',
  'thinking.paper.was': 'Antes: {old}',
  'thinking.paper.empty': 'Papel en blanco. Empieza con cualquier palabra que se te ocurra.',
  'thinking.paper.moveGroup': 'Mover “{text}”',
  'thinking.paper.moveTo': 'Mover {text} a',
  'thinking.paper.tray': 'Bandeja',
  'thinking.paper.remove': 'Quitar',
  'thinking.paper.newKeyword': 'Nueva palabra clave',
  'thinking.paper.add': 'Añadir',
  'thinking.paper.hint':
    'Arrastra una palabra clave a un montón, o tócala y elige. Con teclado: enfoca una palabra clave, presiona 1–{max} para clasificarla y Supr para quitarla.',

  // ---------- the Notebook page ----------
  'thinking.notebook.title': 'Cuaderno',
  'thinking.notebook.subtitle':
    'Cada hoja en la que pensaste: tus primeras conjeturas, tus anclas y las versiones en limpio que rehiciste de memoria.',
  'thinking.notebook.streak': 'Racha de reflexión',
  'thinking.notebook.daysThisWeek': '{days} de los últimos 7 días',
  'thinking.notebook.recall': 'Rehecho de memoria',
  'thinking.notebook.redos': { one: '{count} reconstrucción', other: '{count} reconstrucciones' },
  'thinking.notebook.due': { one: '{count} pendiente', other: '{count} pendientes' },
  'thinking.notebook.methodHeading': 'Cómo funciona cada sesión',
  'thinking.notebook.methodWrong': '<b>{phase}.</b> Antes de una lección, pon en papel lo que crees que sabes y ordénalo, aunque esté mal.',
  'thinking.notebook.methodShorter': '<b>{phase}.</b> Después de cada sesión, condénsala en 2–3 anclas de cuatro palabras o menos.',
  'thinking.notebook.methodAgain':
    '<b>{phase}.</b> En la siguiente sesión, rehaz una hoja antigua partiendo de una página en blanco, y luego corrígela y reorganízala. El intervalo crece cada vez.',
  'thinking.notebook.empty': 'Aún no hay hojas. Tu primera lección empieza con una.',
  'thinking.notebook.pickLesson': 'Elige una lección',
  'thinking.notebook.sessionAnchors': 'Anclas de la sesión',
  'thinking.notebook.rebuilt': 'rehecha {count}×, la última vez {remembered}/{total} de memoria',
  'thinking.notebook.firstDraft': 'primer borrador',
  'thinking.notebook.nextRedoNow': 'toca rehacerla ya',
  'thinking.notebook.nextRedoToday': 'toca rehacerla hoy más tarde',
  'thinking.notebook.nextRedoTomorrow': 'toca rehacerla mañana',
  'thinking.notebook.nextRedoDays': { one: 'toca rehacerla dentro de {count} día', other: 'toca rehacerla dentro de {count} días' },
  'thinking.notebook.cleanSheetFor': 'Hoja en limpio de {title}',
  'thinking.notebook.firstDraftFor': 'Primer borrador de {title}',
  'thinking.notebook.showSheet': 'Mostrar hoja',
  'thinking.notebook.hideSheet': 'Ocultar hoja',

  // ---------- Home teaser card ----------
  'thinking.teaser.eyebrow': 'Pensar en papel',
  'thinking.teaser.due': {
    one: '{count} hoja lista para rehacer de memoria. Tu próxima sesión empieza con una.',
    other: '{count} hojas listas para rehacer de memoria. Tu próxima sesión empieza con una.',
  },
  'thinking.teaser.streak': { one: 'Racha de reflexión: {count} día.', other: 'Racha de reflexión: {count} días.' },
  'thinking.teaser.sheets': { one: '{count} hoja en tu cuaderno.', other: '{count} hojas en tu cuaderno.' },
} satisfies Translation<typeof en>;
