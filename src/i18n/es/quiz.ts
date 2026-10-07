// Spanish UI strings: quiz. Mirrors src/i18n/en/quiz.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/quiz.ts';

export default {
  'quiz.noQuestions': 'Este curso todavía no tiene preguntas.',
  'quiz.back': '← Atrás',
  'quiz.ritualTitle': 'Test: {title}',

  'quiz.end.summaryHigh': '{right} de {total} correctas. Ya dominas lo esencial de este curso.',
  'quiz.end.summaryMid': '{right} de {total} correctas. Buen comienzo: céntrate en las lagunas de abajo.',
  'quiz.end.summaryLow': '{right} de {total} correctas. Gran diagnóstico: ahora sabes exactamente por dónde empezar.',
  'quiz.end.xpEarned': 'XP ganados',
  'quiz.end.xpGain': '+{xp}',
  'quiz.end.toStudy': 'Por estudiar',
  'quiz.end.solid': 'Sólidas',
  'quiz.end.studyThese': 'Estudia estas',
  'quiz.end.missed': 'fallaste {missed} de {total}',
  'quiz.end.solidTitle': 'Vas bien: puedes saltarte estas',
  'quiz.end.reviewNote': 'Las preguntas falladas volverán en tu cola de repaso.',
  'quiz.end.backToCourse': 'Volver al curso',
  'quiz.end.retake': 'Repetir el test',
} satisfies Translation<typeof en>;
