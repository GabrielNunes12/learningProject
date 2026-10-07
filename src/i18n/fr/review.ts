// French UI strings: review. Mirrors src/i18n/en/review.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/review.ts';

export default {
  'review.title': 'Révision',
  'review.subtitle':
    "La répétition espacée te repose chaque question juste avant que tu l'oublies. Les bonnes réponses attendent plus longtemps ; les erreurs reviennent vite.",
  'review.dueNow': 'À réviser',
  'review.allCaughtUp': 'Tout est à jour',
  'review.nothingToReview': 'Rien à réviser',
  'review.sessionInfo': "Environ {minutes} min. Une séance compte jusqu'à {size} questions.",
  'review.nextToday': "Prochaine révision plus tard aujourd'hui.",
  'review.nextOn': 'Prochaine révision le {date}.',
  'review.emptyHint': 'Réponds aux questions des leçons : elles arrivent ici automatiquement.',
  'review.start': 'Commencer la révision →',
  'review.practiseWeakest': { one: 'Travailler {count} point faible', other: 'Travailler {count} points faibles' },
  'review.browseCourses': 'Voir les cours',
  'review.next7Days': '7 prochains jours',
  'review.duePerDay': 'révisions prévues par jour',
  'review.memoryStrength': 'Solidité de la mémoire',
  'review.seen': { one: '{count} question vue', other: '{count} questions vues' },
  'review.levelsNote': "Chaque bonne réponse fait monter la question d'un niveau et allonge l'attente : 1 → 3 → 7 → 16 → 35 jours.",
  'review.byCourse': 'Par cours',
  'review.courseDue': { zero: 'Rien à réviser', one: '{count} à réviser', other: '{count} à réviser' },
  'review.courseSeen': 'Vues : {seen} sur {total}',
  'review.reviewButton': 'Réviser',
  'review.practiseButton': 'Pratiquer',

  // ---------- review session ----------
  'review.empty.titleIn': 'Rien à réviser dans « {course} »',
  'review.empty.lead': 'Tout est à jour. Reviens plus tard, ou apprends quelque chose de nouveau.',
  'review.overview': "Vue d'ensemble des révisions",
  'review.ritualTitle': 'Révision',
  'review.ritualTitleCourse': 'Révision : {course}',
  'review.done.title': 'Révision terminée',
  'review.done.lead': 'Retrouvées : {right} sur {total}. Les bonnes réponses attendent désormais plus longtemps ; les erreurs reviennent vite.',
  'review.done.xp': 'XP gagnés',
  'review.done.remembered': 'Retrouvées',
} satisfies Translation<typeof en>;
