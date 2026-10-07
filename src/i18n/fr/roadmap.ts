// French UI strings: roadmap. Mirrors src/i18n/en/roadmap.ts (see docs/TRANSLATING.md).
// Track titles, descriptions and notes live in src/content/roadmap.fr.json.
import type { Translation } from '../core.ts';
import type en from '../en/roadmap.ts';

export default {
  'roadmap.title': 'Parcours',
  'roadmap.subtitle': "Les parcours enchaînent des cours vers un objectif. Suis les lignes dans l'ordre, ou va où tu veux : rien n'est verrouillé.",
  'roadmap.unavailable': "Les parcours ne sont pas disponibles pour le moment.",
  'roadmap.unavailableHelp': "Impossible de charger les parcours. En attendant, tous les cours restent accessibles sur la page <link>Cours</link>.",
  'roadmap.tracks': 'Parcours',
  'roadmap.trackComplete': '{track} : {pct} terminé',
  'roadmap.trackProgress': { one: '{pct} · {done}/{total} cours', other: '{pct} · {done}/{total} cours' },
  'roadmap.allDone': { one: 'Parcours terminé : le cours est fini.', other: 'Parcours terminé : les {count} cours sont finis.' },
  'roadmap.someDone': { one: '{done} cours terminé sur {count}', other: '{done} cours terminés sur {count}' },
  'roadmap.someDoneNext': {
    one: '{done} cours terminé sur {count} · Ensuite : {course}',
    other: '{done} cours terminés sur {count} · Ensuite : {course}',
  },
  'roadmap.continueCourse': 'Continuer {course} →',
  'roadmap.startCourse': 'Commencer {course} →',
  'roadmap.mapLabel': 'Carte du parcours « {track} »',
  'roadmap.legend': 'Légende',

  'roadmap.status.done': 'Terminé',
  'roadmap.status.inProgress': 'En cours',
  'roadmap.status.upNext': 'À suivre',
  'roadmap.status.later': 'Plus tard',
  'roadmap.legend.done': 'leçons essentielles terminées',
  'roadmap.legend.inProgress': 'commencé',
  'roadmap.legend.upNext': 'prêt à commencer',
  'roadmap.legend.later': 'après ses prérequis',
  'roadmap.legend.solid': "depuis un cours terminé",
  'roadmap.legend.dashed': 'encore à faire',

  'roadmap.nodeLabel': {
    one: '{course} : {status}, {done} leçon sur {count} terminée',
    other: '{course} : {status}, {done} leçons sur {count} terminées',
  },
  'roadmap.nodeLabelAfter': {
    one: '{course} : {status}, {done} leçon sur {count} terminée. Après {after}',
    other: '{course} : {status}, {done} leçons sur {count} terminées. Après {after}',
  },
  'roadmap.nodeCount': '{done}/{total} leçons',

  'roadmap.closeDetails': 'Fermer les détails',
  'roadmap.after': 'Après {list}',
  'roadmap.core': 'Essentiel {done}/{total}',
  'roadmap.lessonsMastered': {
    one: '{done}/{count} leçon · {pct} de maîtrise',
    other: '{done}/{count} leçons · {pct} de maîtrise',
  },
  'roadmap.coreLessonsLabel': 'Leçons essentielles de « {course} »',
  'roadmap.continueLesson': 'Continuer : {lesson}',
  'roadmap.startLesson': 'Commencer : {lesson}',
  'roadmap.allDoneQuiz': 'Tout est fait : fais le quiz',
  'roadmap.openCourse': 'Ouvrir le cours',
  'roadmap.inside': 'Au programme',
  'roadmap.lessonDone': '(terminée)',
  'roadmap.lessonNotDone': '(pas terminée)',
  'roadmap.coreLesson': 'Leçon essentielle',

  'roadmap.teaser.next': 'Prochaine étape du parcours « {track} » : {course}',
  'roadmap.teaser.finished': 'Tu as terminé le parcours « {track} ». Choisis-en un autre !',
  'roadmap.teaser.cta': 'Voir la carte →',
} satisfies Translation<typeof en>;
