// French UI strings: course. Mirrors src/i18n/en/course.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/course.ts';

export default {
  'course.allCourses': '← Tous les cours',
  'course.categoryLevel': '{category} · {level}',
  'course.continue': 'Continuer →',
  'course.startLearning': 'Commencer →',
  'course.takeQuiz': 'Faire le quiz',
  'course.testOut': 'Teste ton niveau avec le quiz',
  'course.unit': 'Unité {number}',
  'course.lessonMeta': { one: '{minutes} min · {count} étape', other: '{minutes} min · {count} étapes' },
  'course.lessonMetaDone': { one: '{minutes} min · {count} étape · terminée', other: '{minutes} min · {count} étapes · terminée' },

  'course.path.title': "Parcours d'apprentissage",
  'course.path.view': 'Affichage du parcours',
  'course.path.map': 'Carte',
  'course.path.list': 'Liste',
  'course.path.fastTrack': "Mode express : l'essentiel",
  'course.path.fastTrackNote': {
    one: "Seule la leçon essentielle (~{minutes} min) est affichée : elle couvre l'essentiel de ce dont tu te serviras.",
    other: "Seules les {count} leçons essentielles (~{minutes} min) sont affichées : elles couvrent l'essentiel de ce dont tu te serviras.",
  },
  'course.path.node': 'Leçon {number} : {title}',
  'course.path.nodeDone': 'Leçon {number} : {title}, terminée',
  'course.path.nodeNext': 'Leçon {number} : {title}, à suivre',
  'course.path.nodeDeep': 'Leçon {number} : {title}, approfondissement',
  'course.path.nodeDeepDone': 'Leçon {number} : {title}, approfondissement, terminée',
  'course.path.nodeDeepNext': 'Leçon {number} : {title}, approfondissement, à suivre',
  'course.path.completed': '✓ Terminée',
  'course.path.review': 'Réviser',
  'course.path.unitCount': '{done}/{total}<sr> leçons terminées</sr>',

  'course.side.lessonsCompleted': 'Leçons terminées',
  'course.side.coreLessons': '<b>{done}/{total}</b> leçons essentielles',
  'course.side.mastered': '<b>{pct}</b> de maîtrise',
  'course.side.bestQuiz': '<b>{score}</b> au meilleur quiz',
  'course.side.mastery': 'Maîtrise',
  'course.side.masteredNote': 'Maîtrisée = retenue au fil de plusieurs révisions espacées.',
  'course.keyIdeas': 'Les 20 % qui comptent',

  'course.links.quiz': 'Quiz',
  'course.links.quizHelp': {
    one: '{count} question mélangée pour repérer tes lacunes',
    other: '{count} questions mélangées pour repérer tes lacunes',
  },
  'course.links.map': 'Carte des connaissances',
  'course.links.mapProgress': "{recalled}/{total} idées retrouvées pour l'instant : continue ta carte",
  'course.links.mapStart': 'Place de mémoire ce que tu sais sur la carte, puis relie les idées',
  'course.links.mapRecall': 'Retrouve les idées clés de mémoire',
  'course.links.review': 'Réviser ce cours',
  'course.links.reviewHelp': "Pratique ce qui est à réviser dans « {title} »",
  'course.links.cheatSheet': 'Fiche mémo',
  'course.links.cheatSheetHelp': 'Tout le cours sur une page imprimable',

  'course.cheatSheet.back': '← {title}',
  'course.cheatSheet.print': 'Imprimer / enregistrer en PDF',
  'course.cheatSheet.title': '{title} : fiche mémo',
  'course.cheatSheet.intro': "Essaie d'abord ceci : cache la page et explique chaque idée à voix haute. Là où tu bloques, c'est ce qu'il faut réviser.",
  'course.cheatSheet.keyIdeas': 'Idées clés',
} satisfies Translation<typeof en>;
