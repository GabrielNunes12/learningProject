// French UI strings: thinking. Mirrors src/i18n/en/thinking.ts (see docs/TRANSLATING.md).
// Phase names come from the glossary: Trompe-toi d'abord / Raccourcis / Refais. A "redo" is a "reprise".
import type { Translation } from '../core.ts';
import type en from '../en/thinking.ts';

export default {
  // ---------- the three phases ----------
  'thinking.phase.wrong': "Trompe-toi d'abord",
  'thinking.phase.shorter': "Raccourcis",
  'thinking.phase.again': "Refais",

  // ---------- missing-step messages ----------
  'thinking.missing.wrongKeywords': {
    one: "Ajoute encore {count} mot-clé. Les doutes comptent aussi.",
    other: "Ajoute encore {count} mots-clés. Les doutes comptent aussi.",
  },
  'thinking.missing.wrongPiles': {
    one: "Classe-les en {count} pile : fais glisser les mots-clés vers le bas, dans les colonnes.",
    other: "Classe-les en {count} piles : fais glisser les mots-clés vers le bas, dans les colonnes.",
  },
  'thinking.missing.anchorTooLong': { one: "Chaque ancre fait {count} mot au maximum.", other: "Chaque ancre fait {count} mots au maximum." },
  'thinking.missing.moreAnchors': { one: "Écris encore {count} ancre.", other: "Écris encore {count} ancres." },
  'thinking.missing.recall': {
    one: "Écris d'abord encore {count} mot-clé de mémoire.",
    other: "Écris d'abord encore {count} mots-clés de mémoire.",
  },

  // ---------- sheet titles for review/practice/quiz sessions ----------
  'thinking.session.review': "Révision",
  'thinking.session.reviewCourse': "Révision : {course}",
  'thinking.session.practice': "Pratique mixte",
  'thinking.session.practiceCourse': "Pratique mixte : {course}",
  'thinking.session.quiz': "Quiz",
  'thinking.session.quizCourse': "Quiz : {course}",

  // ---------- make it wrong (end of a lesson, after the steps) ----------
  'thinking.wrong.heading': "Que te reste-t-il de « {topic} » ?",
  'thinking.wrong.lead': "Écris de mémoire des mots-clés sur la feuille, sans revenir en arrière : ce que tu as retenu, les bribes à moitié oubliées, même celles dont tu doutes. Puis classe-les en piles qui vont ensemble. Rien n'est noté ici ; te tromper un peu maintenant montre ce qu'il faut revoir.",
  'thinking.wrong.sheetLabel': "Tes mots-clés sur {topic}",
  'thinking.wrong.ready': "Bien. {time} sur papier.",
  'thinking.wrong.start': "Continuer",

  // ---------- make it shorter (end of a session) ----------
  'thinking.shorter.placeholder': "quelques mots",
  'thinking.shorter.placeholderOptional': "troisième ancre (facultative)",
  'thinking.shorter.anchorLabel': { one: "Ancre {n}, {count} mot au maximum", other: "Ancre {n}, {count} mots au maximum" },
  'thinking.shorter.wordCount': { one: "{n}/{count} mot", other: "{n}/{count} mots" },
  'thinking.shorter.hitHeading': "Tes ancres évoquent",
  'thinking.shorter.ownWords': "Tes ancres sont formulées avec tes propres mots, et c'est très bien : elles doivent seulement te rappeler l'idée.",
  'thinking.shorter.missedHeading': "Derrière les questions ratées",
  'thinking.shorter.alsoHeading': "Aussi dans cette leçon",
  'thinking.shorter.notMistake': "Ce n'est pas une erreur : ça vaut un dernier coup d'œil avant de continuer.",
  'thinking.shorter.beforeHeading': "Juste avant, tu as écrit",
  'thinking.shorter.firstGuesses': "Tes mots-clés",
  'thinking.shorter.rebuildNext': "Tu reconstruiras cette feuille de mémoire à la fin de ta prochaine séance, et tu corrigeras ce qui est faux.",
  'thinking.shorter.ready': "Assez court. Pas besoin que ce soit propre.",
  'thinking.shorter.squeeze': "Condenser",

  // ---------- make it again (end of a later session) ----------
  'thinking.again.heading': "Reconstruis « {title} » de mémoire",
  'thinking.again.lead':
    "Feuille blanche, sans regarder. Écris les mots-clés et les ancres de cette feuille dont tu te souviens, et organise-les selon les liens que tu vois maintenant. C'est l'effort d'aller les rechercher qui les fait tenir.",
  'thinking.again.sheetLabel': "Reconstruction de {title} de mémoire",
  'thinking.again.compareHeading': "Compare et mets au propre",
  'thinking.again.compareLead':
    "Voici ton ancienne feuille. Garde ce qui tient toujours, corrige ce qui était faux, retire ce qui ne compte pas. Ta version au propre remplace l'ancienne.",
  'thinking.again.oldSheet': "Ton ancienne feuille",
  'thinking.again.verdictHeading': "Garder, corriger ou retirer",
  'thinking.again.anchorTag': "ancre",
  'thinking.again.remembered': "de mémoire",
  'thinking.again.verdictGroup': "Que faire de {item}",
  'thinking.again.keep': "Garder",
  'thinking.again.fix': "Corriger",
  'thinking.again.drop': "Retirer",
  'thinking.again.fixLabel': "Version corrigée de {item}",
  'thinking.again.cleanSheet': "Ta feuille au propre",
  'thinking.again.cleanNote': "Ce que tu as écrit de mémoire. Reclasse-le, ajoute ce que tu viens de corriger, dessine les liens.",
  'thinking.again.savedHeading': "Feuille au propre enregistrée",
  'thinking.again.tileRemembered': "Retrouvés",
  'thinking.again.tileFixed': "Corrigés",
  'thinking.again.tileXp': "XP",
  'thinking.again.nextRedo': {
    one: "Prochaine reprise de cette feuille dans {count} jour. À chaque fois, l'intervalle s'allonge.",
    other: "Prochaine reprise de cette feuille dans {count} jours. À chaque fois, l'intervalle s'allonge.",
  },
  'thinking.again.recalled': { one: "{count} mot-clé de mémoire.", other: "{count} mots-clés de mémoire." },
  'thinking.again.broughtBack': "Tu en as retrouvé {got} sur {total}.",
  'thinking.again.compare': "Comparer avec mon ancienne feuille",
  'thinking.again.save': "Enregistrer la feuille au propre",

  // ---------- the sheet of paper ----------
  'thinking.paper.placeholder': "Tape un mot-clé, puis Entrée",
  'thinking.paper.tools': "Outils de la feuille",
  'thinking.paper.tool': "Outil",
  'thinking.paper.keywords': "Mots-clés",
  'thinking.paper.pen': "Stylo",
  'thinking.paper.undoInk': "Annuler le trait",
  'thinking.paper.addPile': "+ Pile",
  'thinking.paper.count': { one: "{n}/{count} mot-clé", other: "{n}/{count} mots-clés" },
  'thinking.paper.pile': "Pile {n}",
  'thinking.paper.pileInline': "pile {n}",
  'thinking.paper.pilePlaceholder': "Pile {n} : nomme-la",
  'thinking.paper.pileNameLabel': "Nom de la pile {n}",
  'thinking.paper.trayLabel': "les nouveaux mots-clés arrivent ici, fais-les glisser dans une pile",
  'thinking.paper.chipInPile': "{text}, dans {pile}",
  'thinking.paper.chipInTray': "{text}, pas encore classé",
  'thinking.paper.chipInPileFixed': "{text}, dans {pile}, corrigé (avant : {old})",
  'thinking.paper.chipInTrayFixed': "{text}, pas encore classé, corrigé (avant : {old})",
  'thinking.paper.was': "Avant : {old}",
  'thinking.paper.empty': "Feuille vide. Commence par n'importe quel mot qui te vient.",
  'thinking.paper.moveGroup': "Déplacer « {text} »",
  'thinking.paper.moveTo': "Déplacer {text} vers",
  'thinking.paper.tray': "Bac",
  'thinking.paper.remove': "Retirer",
  'thinking.paper.newKeyword': "Nouveau mot-clé",
  'thinking.paper.add': "Ajouter",
  'thinking.paper.hint':
    "Fais glisser un mot-clé dans une pile, ou touche-le et choisis. Au clavier : sélectionne un mot-clé, appuie sur 1–{max} pour le classer, Suppr pour le retirer.",

  // ---------- the Notebook page ----------
  'thinking.notebook.title': "Carnet",
  'thinking.notebook.subtitle': "Chaque feuille sur laquelle tu as réfléchi : tes mots-clés, tes ancres, et les versions au propre reconstruites de mémoire.",
  'thinking.notebook.streak': "Série de réflexion",
  'thinking.notebook.daysThisWeek': "{days} sur les 7 derniers jours",
  'thinking.notebook.recall': "Retrouvé de mémoire",
  'thinking.notebook.redos': { one: "{count} reprise", other: "{count} reprises" },
  'thinking.notebook.due': { one: "{count} à refaire", other: "{count} à refaire" },
  'thinking.notebook.methodHeading': "Comment se déroule chaque séance",
  'thinking.notebook.methodWrong': "<b>{phase}.</b> Après les étapes, mets sur papier les mots-clés dont tu te souviens et classe-les, même si certains sont faux.",
  'thinking.notebook.methodShorter': "<b>{phase}.</b> Après chaque séance, condense-la en 2 ou 3 ancres de quatre mots maximum.",
  'thinking.notebook.methodAgain':
    "<b>{phase}.</b> À la fin de la séance suivante, reconstruis une ancienne feuille sur une page blanche, puis corrige-la et réorganise-la. L'intervalle s'allonge à chaque fois.",
  'thinking.notebook.empty': "Pas encore de feuilles. Ta première leçon se termine par une feuille.",
  'thinking.notebook.pickLesson': "Choisis une leçon",
  'thinking.notebook.sessionAnchors': "Ancres de séance",
  'thinking.notebook.rebuilt': "reconstruite {count} fois, la dernière avec {remembered}/{total} de mémoire",
  'thinking.notebook.firstDraft': "premier jet",
  'thinking.notebook.nextRedoNow': "à refaire maintenant",
  'thinking.notebook.nextRedoToday': "à refaire plus tard aujourd'hui",
  'thinking.notebook.nextRedoTomorrow': "à refaire demain",
  'thinking.notebook.nextRedoDays': { one: "à refaire dans {count} jour", other: "à refaire dans {count} jours" },
  'thinking.notebook.cleanSheetFor': "Feuille au propre : {title}",
  'thinking.notebook.firstDraftFor': "Premier jet : {title}",
  'thinking.notebook.showSheet': "Afficher la feuille",
  'thinking.notebook.hideSheet': "Masquer la feuille",

  // ---------- Home teaser card ----------
  'thinking.teaser.eyebrow': "Penser sur papier",
  'thinking.teaser.due': {
    one: "{count} feuille prête à être reconstruite de mémoire. Ta prochaine séance se termine par là.",
    other: "{count} feuilles prêtes à être reconstruites de mémoire. Ta prochaine séance se termine par l'une d'elles.",
  },
  'thinking.teaser.streak': { one: "Série de réflexion : {count} jour.", other: "Série de réflexion : {count} jours." },
  'thinking.teaser.sheets': { one: "{count} feuille dans ton carnet.", other: "{count} feuilles dans ton carnet." },
} satisfies Translation<typeof en>;
