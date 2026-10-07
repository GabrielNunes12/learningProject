// French UI strings: quiz. Mirrors src/i18n/en/quiz.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/quiz.ts';

export default {
  'quiz.noQuestions': "Ce cours n'a pas encore de questions.",
  'quiz.back': '← Retour',
  'quiz.ritualTitle': 'Quiz : {title}',

  'quiz.end.summaryHigh': "Score : {right} sur {total}. Tu maîtrises l'essentiel de ce cours.",
  'quiz.end.summaryMid': 'Score : {right} sur {total}. Bon début : concentre-toi sur les lacunes ci-dessous.',
  'quiz.end.summaryLow': 'Score : {right} sur {total}. Excellent diagnostic : tu sais maintenant exactement par où commencer.',
  'quiz.end.xpEarned': 'XP gagnés',
  'quiz.end.xpGain': '+{xp}',
  'quiz.end.toStudy': 'À étudier',
  'quiz.end.solid': 'Acquis',
  'quiz.end.studyThese': 'À étudier en priorité',
  'quiz.end.missed': '{missed} sur {total} à revoir',
  'quiz.end.solidTitle': 'Acquis : tu peux passer ces leçons',
  'quiz.end.reviewNote': 'Les questions ratées reviendront dans ta file de révision.',
  'quiz.end.backToCourse': 'Retour au cours',
  'quiz.end.retake': 'Refaire le quiz',
} satisfies Translation<typeof en>;
