// French UI strings: practice. Mirrors src/i18n/en/practice.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/practice.ts';

export default {
  'practice.title': 'Pratique mixte',
  'practice.titleCourse': 'Pratique mixte : {course}',
  'practice.intro':
    "La pratique mixte entrelace des idées voisines au lieu de répéter un seul sujet à la fois. Elle paraît souvent plus difficile sur le moment, mais les études suggèrent qu'elle t'aide à mieux distinguer les idées proches et à t'en souvenir plus longtemps.",
  'practice.status.weak': 'Fragile',
  'practice.status.due': 'À réviser',
  'practice.status.new': 'Nouveau',
  'practice.status.strong': 'Solide',
  'practice.notFound': 'Cours introuvable',
  'practice.mixAll': 'Mélanger tous mes cours',
  'practice.focus': 'Séance centrée sur <b>{label}</b> et les idées qui y sont liées.',
  'practice.focusFallback': "Tu n'as pas encore vu assez de questions sur ce concept : cette séance mélange donc tout le cours.",
  'practice.yourMix': 'Ton mélange',
  'practice.ideas': { one: '{count} idée', other: '{count} idées' },
  'practice.ideasAria': 'Idées de cette séance',
  'practice.lessonsAria': 'Leçons de cette séance',
  'practice.from': 'Cours : {courses}',
  'practice.byLesson': "Ces questions sont mélangées par leçon : ce cours n'a pas encore de carte des concepts.",
  'practice.whyThese': 'Pourquoi celles-ci ?',
  'practice.defaultReason': "Fait partie de ce que tu as appris jusqu'ici",
  'practice.lengthAria': 'Durée de la séance',
  'practice.length': 'Durée',
  'practice.onlyQualify': {
    one: 'Seule {count} question est disponible pour le moment',
    other: 'Seules {count} questions sont disponibles pour le moment',
  },
  'practice.aboutMin': 'environ {count} min',
  'practice.start': 'Lancer la pratique mixte',
  'practice.mixAllInstead': 'Mélanger plutôt tous mes cours',
  'practice.orOneCourse': 'Ou entraîne-toi sur un seul cours :',

  // ---------- not available yet ----------
  'practice.empty.recentTitle': 'Tu viens de tout pratiquer',
  'practice.empty.recentLead':
    "Les questions auxquelles tu as bien répondu dans les 10 dernières minutes sont mises de côté un moment, pour que la prochaine série soit un vrai rappel et non de la répétition. Réessaie dans quelques minutes, ou apprends quelque chose de nouveau.",
  'practice.empty.lockedTitle': {
    one: 'La pratique mixte se débloque après {count} leçon',
    other: 'La pratique mixte se débloque après {count} leçons',
  },
  'practice.empty.lockedLead': {
    one: "Pour mélanger, il faut quelques idées à distinguer. Tu as fait {count} leçon pour l'instant.",
    other: "Pour mélanger, il faut quelques idées à distinguer. Tu as fait {count} leçons pour l'instant.",
  },
  'practice.empty.lockedLeadCourse': {
    one: "Pour mélanger, il faut quelques idées à distinguer. Tu as fait {count} leçon de « {course} » pour l'instant.",
    other: "Pour mélanger, il faut quelques idées à distinguer. Tu as fait {count} leçons de « {course} » pour l'instant.",
  },
  'practice.empty.nextLesson': 'Leçon suivante : {title}',

  // ---------- results ----------
  'practice.end.title': 'Pratique mixte terminée',
  'practice.end.leadIdeas': {
    one: 'Score : {right} sur {total} pour {count} idée.',
    other: 'Score : {right} sur {total} pour {count} idées.',
  },
  'practice.end.leadLessons': {
    one: 'Score : {right} sur {total} pour {count} leçon.',
    other: 'Score : {right} sur {total} pour {count} leçons.',
  },
  'practice.end.xp': 'XP gagnés',
  'practice.end.right': 'Justes',
  'practice.end.resultsAria': 'Résultats par idée',
  'practice.end.reviewLesson': 'Revoir la leçon : {title}',
  'practice.end.solid': 'Acquis',
  'practice.end.note': 'Les erreurs reviendront dans ta file de révision ; les bonnes réponses attendent plus longtemps.',
  'practice.end.backToCourse': 'Retour au cours',
  'practice.end.again': 'Encore',

  // ---------- card on the Review page ----------
  'practice.card.title': 'Mélange les idées voisines',
  'practice.card.ready': "Des questions de différentes leçons côte à côte, en insistant sur tes points faibles, pour apprendre à distinguer les idées proches.",
  'practice.card.locked': {
    one: 'Se débloque après {count} leçon : pour mélanger, il faut quelques idées à distinguer.',
    other: 'Se débloque après {count} leçons : pour mélanger, il faut quelques idées à distinguer.',
  },
  'practice.card.howItWorks': 'Voir comment ça marche',

  // ---------- why a topic is in the mix ----------
  'practice.reason.due': 'À réviser',
  'practice.reason.missed': 'Tu as fait une erreur la dernière fois',
  'practice.reason.new': "Tiré d'une leçon déjà faite, pas pratiqué depuis",
  'practice.reason.weakSpot': 'Point faible',
  'practice.reason.slipping': 'En recul : ta dernière réponse était fausse ({right} sur {seen} lors de tes derniers essais)',
  'practice.reason.weak': 'Point faible : {right} sur {seen} lors de tes derniers essais',
  'practice.reason.strong': 'Tu le connais bien : ajouté pour le contraste et la confiance',
  'practice.reason.focus': "Le concept que tu as choisi de pratiquer",
  'practice.reason.related': 'En lien avec {label} : « {sentence} »',
  'practice.reason.relatedCross': 'En lien avec {label} dans un autre cours : « {sentence} »',
  'practice.linkSentence': '{from} {link} {to}',
} satisfies Translation<typeof en>;
