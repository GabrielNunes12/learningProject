// French UI strings: quiz. Mirrors src/i18n/en/quiz.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/quiz.ts';

export default {
  'quiz.noQuestions': "Ce cours n'a pas encore de questions.",
  'quiz.back': '← Retour',
  'quiz.ritualTitle': 'Quiz : {title}',

  'quiz.end.xpEarned': 'XP gagnés',
  'quiz.end.xpGain': '+{xp}',
  'quiz.end.toStudy': 'À étudier',
  'quiz.end.solid': 'Acquis',
  'quiz.end.studyThese': 'À étudier en priorité',
  'quiz.end.solidTitle': 'Acquis : tu peux passer ces leçons',
  'quiz.end.reviewNote': 'Les questions ratées reviendront dans ta file de révision.',
  'quiz.level.eyebrow': 'Ton niveau',
  'quiz.level.startAt': 'Commence à « {lesson} »',
  'quiz.level.stoppedLead': { one: "Tu as répondu à {count} leçon avec assurance, puis tu as commencé à deviner. C'est à cette limite qu'on apprend : commence là.", other: "Tu as répondu à {count} leçons avec assurance, puis tu as commencé à deviner. C'est à cette limite qu'on apprend : commence là." },
  'quiz.level.stoppedFirst': "Tu as commencé à deviner tout de suite. Commence par le début : c'est à cette limite qu'on apprend.",
  'quiz.level.allTitle': 'Tu maîtrises ce cours',
  'quiz.level.allLead': 'Toutes les leçons justes, et tu étais sûr à chaque fois.',
  'quiz.level.patchTitle': 'Presque',
  'quiz.level.patchLead': 'Tu es arrivé au bout. Consolide les leçons ratées ou devinées et ce cours est à toi.',
  'quiz.level.startButton': 'Commencer cette leçon',
  'quiz.level.reason.missed': 'ratée',
  'quiz.level.reason.guessed': 'devinée',
  'quiz.level.reason.unknown': 'pas su',
  'quiz.level.notReached': { one: '{count} leçon suivante n’a pas été atteinte : elle s’appuie sur celles-ci.', other: '{count} leçons suivantes n’ont pas été atteintes : elles s’appuient sur celles-ci.' },
  'quiz.level.howItWorks': "Les questions deviennent plus difficiles leçon après leçon, et le quiz s'arrête quand tu commences à deviner ou à te tromper. Coche « Je devine » dès que tu n'es pas sûr.",
  'quiz.end.backToCourse': 'Retour au cours',
  'quiz.end.retake': 'Refaire le quiz',
} satisfies Translation<typeof en>;
