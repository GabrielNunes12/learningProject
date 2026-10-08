// Spanish UI strings: quiz. Mirrors src/i18n/en/quiz.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/quiz.ts';

export default {
  'quiz.noQuestions': 'Este curso todavía no tiene preguntas.',
  'quiz.back': '← Atrás',
  'quiz.ritualTitle': 'Test: {title}',

  'quiz.end.xpEarned': 'XP ganados',
  'quiz.end.xpGain': '+{xp}',
  'quiz.end.toStudy': 'Por estudiar',
  'quiz.end.solid': 'Sólidas',
  'quiz.end.studyThese': 'Estudia estas',
  'quiz.end.solidTitle': 'Vas bien: puedes saltarte estas',
  'quiz.end.reviewNote': 'Las preguntas falladas volverán en tu cola de repaso.',
  'quiz.level.eyebrow': 'Tu nivel',
  'quiz.level.startAt': 'Empieza en “{lesson}”',
  'quiz.level.stoppedLead': { one: 'Respondiste {count} lección con convicción y luego empezaste a adivinar. En ese límite es donde se aprende: empieza ahí.', other: 'Respondiste {count} lecciones con convicción y luego empezaste a adivinar. En ese límite es donde se aprende: empieza ahí.' },
  'quiz.level.stoppedFirst': 'Empezaste a adivinar desde el principio. Empieza por el comienzo: en ese límite es donde se aprende.',
  'quiz.level.allTitle': 'Dominas este curso',
  'quiz.level.allLead': 'Todas las lecciones correctas, y estabas seguro en cada una.',
  'quiz.level.patchTitle': 'Casi lo tienes',
  'quiz.level.patchLead': 'Llegaste al final. Refuerza las lecciones que fallaste o adivinaste y dominarás el curso.',
  'quiz.level.startButton': 'Empezar esta lección',
  'quiz.level.reason.missed': 'fallada',
  'quiz.level.reason.guessed': 'adivinada',
  'quiz.level.reason.unknown': 'no la sabías',
  'quiz.level.notReached': { one: 'No se llegó a {count} lección posterior: se apoya en estas.', other: 'No se llegó a {count} lecciones posteriores: se apoyan en estas.' },
  'quiz.level.howItWorks': 'Las preguntas se vuelven más difíciles lección a lección, y el quiz se detiene cuando empiezas a adivinar o fallar. Marca “Estoy adivinando” cuando no estés seguro.',
  'quiz.end.backToCourse': 'Volver al curso',
  'quiz.end.retake': 'Repetir el test',
} satisfies Translation<typeof en>;
