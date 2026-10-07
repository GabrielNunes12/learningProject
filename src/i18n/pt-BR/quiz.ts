// Brazilian Portuguese UI strings: quiz. Mirrors src/i18n/en/quiz.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/quiz.ts';

export default {
  'quiz.noQuestions': 'Este curso ainda não tem questões.',
  'quiz.back': '← Voltar',
  'quiz.ritualTitle': 'Quiz: {title}',

  'quiz.end.summaryHigh': '{right} de {total} corretas. Você já domina o essencial deste curso.',
  'quiz.end.summaryMid': '{right} de {total} corretas. Bom começo — foque nas lacunas abaixo.',
  'quiz.end.summaryLow': '{right} de {total} corretas. Ótimo diagnóstico: agora você sabe exatamente por onde começar.',
  'quiz.end.xpEarned': 'XP ganho',
  'quiz.end.xpGain': '+{xp}',
  'quiz.end.toStudy': 'Para estudar',
  'quiz.end.solid': 'Sólidas',
  'quiz.end.studyThese': 'Estude estas',
  'quiz.end.missed': 'errou {missed} de {total}',
  'quiz.end.solidTitle': 'Tudo certo aqui — pode pular estas',
  'quiz.end.reviewNote': 'As questões que você errou voltam na sua fila de Revisão.',
  'quiz.end.backToCourse': 'Voltar ao curso',
  'quiz.end.retake': 'Refazer o quiz',
} satisfies Translation<typeof en>;
