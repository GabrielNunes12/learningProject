// Spanish UI strings: lesson. Mirrors src/i18n/en/lesson.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/lesson.ts';

export default {
  // ---------- lesson player ----------
  'lesson.xpEarnedAria': '{xp} XP ganados en esta lección',
  'lesson.shorter.heading': 'Resume “{title}” en anclas',
  'lesson.shorter.intro':
    'Dos o tres anclas, de cuatro palabras como máximo cada una: las pistas que te traerán de vuelta esta lección. Mejor fragmentos que frases completas.',
  'lesson.shorter.done': 'Terminar la lección',

  // ---------- worked example ----------
  'lesson.example.eyebrow': 'Ejemplo resuelto',
  'lesson.example.attemptLabel': 'Primero tu respuesta. Vale una estimación aproximada; los pasos se desbloquean cuando te comprometes con una.',
  'lesson.example.placeholder': 'Resuélvelo y escribe tu respuesta',
  'lesson.example.yourAnswer': 'Tu respuesta',
  'lesson.example.compare': 'Compárala con tu respuesta de arriba. ¿En qué punto tu razonamiento tomó otro camino?',
  'lesson.example.stepOf': 'Paso {step} de {total}',
  'lesson.example.ready': 'Cuando quieras.',
  'lesson.example.writeToUnlock': 'Escribe tu respuesta para desbloquear los pasos.',
  'lesson.example.lockIn': 'Fijar mi respuesta',
  'lesson.example.showFirstStep': 'Ver el primer paso',
  'lesson.example.nextStep': 'Siguiente paso',
  'lesson.example.showAnswer': 'Ver la respuesta',
  'lesson.example.notQuite': 'No del todo',
  'lesson.example.hadIt': 'Lo acerté',

  // ---------- lesson complete ----------
  'lesson.complete.title': '¡Lección completada!',
  'lesson.complete.totalXp': 'XP total',
  'lesson.complete.accuracy': 'Precisión',
  'lesson.complete.today': '{today}/{goal} hoy',
  'lesson.complete.certTitle': '¡Terminaste {course}!',
  'lesson.complete.certText': 'Consigue tu certificado: descárgalo en PDF y compártelo en LinkedIn, X o Facebook.',
  'lesson.complete.takeaway': 'Para recordar',
  'lesson.complete.checkpoint': 'Control de la unidad: plasma lo que sabes en el mapa',
  'lesson.complete.signupNudge': '<link>Crea un perfil gratis</link> para conservar tu progreso en todos tus dispositivos.',
  'lesson.complete.backToCourse': 'Volver al curso',
  'lesson.complete.next': 'Siguiente: {title} →',
  'lesson.complete.quiz': 'Hacer el test del curso →',

  // ---------- question kinds ----------
  'lesson.kind.mcq': 'Elige una',
  'lesson.kind.numeric': 'Escribe un número',
  'lesson.kind.text': 'Escribe tu respuesta',
  'lesson.kind.output': 'Predice la salida',
  'lesson.kind.bug': 'Encuentra el error: haz clic en la línea rota',
  'lesson.kind.pickFix': 'Ahora elige la corrección',

  // ---------- classic questions ----------
  'lesson.question.itPrints': 'Imprime:',
  'lesson.question.codeLinesAria': 'Código: elige la línea con el error',
  'lesson.question.lineAria': 'Línea {line}',
  'lesson.question.whenYouRun': 'Al ejecutarlo',
  'lesson.question.lineFound': '✓ La línea {line} es la culpable. ¿Qué cambio lo arregla?',
  'lesson.question.outputPlaceholder': 'Escribe exactamente lo que imprime',
  'lesson.question.outputAria': 'Salida',
  'lesson.question.numericPlaceholder': 'p. ej.: 0,25; 1/4 o 42',
  'lesson.question.textPlaceholder': 'Escribe tu respuesta',
  'lesson.question.outputTip': 'Una línea por cada línea impresa. Pulsa Ctrl/⌘ + Enter para comprobar.',

  // ---------- question feedback (QuestionFrame) ----------
  'lesson.frame.needHint': '¿Necesitas una pista?',
  'lesson.frame.hintLine': '<b>Pista:</b> {hint}',
  'lesson.frame.why': 'Por qué',
  'lesson.frame.gotIt': '¡Lo tienes!',
  'lesson.frame.xpGained': '+{xp} XP',
  'lesson.frame.secondTries': 'Los segundos intentos también cuentan.',
  'lesson.frame.notQuite': 'No del todo.',
  'lesson.frame.retryNudge': 'Piénsalo una vez más: al reintentar es cuando se aprende.',
  'lesson.frame.incorrect': 'Incorrecto',
  'lesson.frame.heresAnswer': 'Esta es la respuesta',
  'lesson.frame.readWhy': 'Lee el porqué; volverá a salir en tus repasos.',
  'lesson.frame.showAnswer': 'Ver la respuesta',
  'lesson.frame.correctAnswer': '<b>Respuesta correcta:</b> {answer}',

  // ---------- correct-answer texts (src/lib/answers.ts) ----------
  'lesson.answer.withUnit': '{value} {unit}',
  'lesson.answer.bugFix': 'Línea {line}: {fix}',
  'lesson.answer.traceValue': '`{expr}` después de la línea {line}',
  // Truth table letters: V (verdadero) and F (falso).
  'lesson.answer.true': 'V',
  'lesson.answer.false': 'F',

  // ---------- question sessions (review, mixed practice, quiz) ----------
  'lesson.session.correctSoFar': { one: '{count} correcta hasta ahora', other: '{count} correctas hasta ahora' },
  'lesson.session.shorterHeading': 'Resume esta sesión en anclas',
  'lesson.session.shorterIntro': '¿Qué vas a recordar o qué harás distinto la próxima vez? Dos o tres anclas, de cuatro palabras como máximo cada una.',
  'lesson.session.seeResults': 'Ver resultados',
} satisfies Translation<typeof en>;
