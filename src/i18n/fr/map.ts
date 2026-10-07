// French UI strings: map. Mirrors src/i18n/en/map.ts (see docs/TRANSLATING.md).
// The ideas on the map are "idées" (feminine): sentences that describe a node say "idée" so agreement always works.
import type { Translation } from '../core.ts';
import type en from '../en/map.ts';

export default {
  // ---------- page ----------
  'map.notFound': "Cours introuvable",
  'map.allCourses': "Tous les cours",
  'map.eyebrow': "Carte des connaissances",
  'map.unitCheckpoint': "Bilan de l'unité {n}",
  'map.lead': "Trace-la de mémoire, repère ce qui manque, puis relie les points.",
  'map.scope.label': "Carte",
  'map.scope.wholeCourse': { one: "Tout le cours ({count} idée)", other: "Tout le cours ({count} idées)" },
  'map.scope.unit': "Unité {n} : {title} ({count})",
  'map.scope.empty': "Cette unité n'a encore aucune idée sur la carte du cours.",
  'map.scope.mapWhole': "Cartographier plutôt tout le cours",

  // ---------- courses without a concept map ----------
  'map.soon.title': "La carte du cours {course} arrive bientôt",
  'map.soon.lead':
    "Ce cours n'a pas encore sa carte des concepts. En attendant, voici le même exercice sur papier : cache la liste ci-dessous, note toutes les idées clés dont tu te souviens, puis vérifie.",
  'map.soon.keyIdeas': "Les idées clés",
  'map.soon.backToCourse': "Retour au cours",
  'map.soon.quiz': "Teste-toi avec le quiz",

  // ---------- layers (stepper) ----------
  'map.layers': "Couches",
  'map.layer.1.title': "Qu'est-ce que je sais déjà ?",
  'map.layer.1.short': "Rappel",
  'map.layer.2.title': "Qu'est-ce que je ne sais pas encore ?",
  'map.layer.2.short': "Lacunes",
  'map.layer.3.title': "Relier les points",
  'map.layer.3.short': "Relier",
  'map.layer.locked': "(verrouillée tant que la couche précédente n'est pas terminée)",

  // ---------- screen-reader announcements ----------
  'map.announce.layer': "Couche {n} : {title}",
  'map.announce.linkedPickLabel': "Lien créé entre {a} et {b}. Choisis une étiquette ci-dessous si tu veux.",
  'map.announce.linked': "Lien créé entre {a} et {b}.",
  'map.announce.linkCancelled': "Lien annulé.",
  'map.announce.tidied': "Carte rangée.",
  'map.announce.cleared': "Carte effacée. Recommence de mémoire.",
  'map.announce.hint': "Indice : {from} {label} {to}.",
  'map.announce.markedKnown': "{label} : idée marquée comme acquise.",
  'map.announce.merged': "Note fusionnée avec {label} : elle compte comme rappelée.",
  'map.linkingFrom': "Lien depuis {label} : choisis maintenant une deuxième idée.",
  'map.confirm.startOverCourse': "Recommencer pour tout le cours ? Tes idées rappelées, tes notes et tes liens ici seront effacés.",
  'map.confirm.startOverUnit': "Recommencer pour cette unité ? Tes idées rappelées, tes notes et tes liens ici seront effacés.",

  // ---------- toolbar and footer ----------
  'map.view.label': "Vue",
  'map.view.canvas': "Canevas",
  'map.view.list': "Liste",
  'map.zoomOut': "Zoom arrière",
  'map.zoomIn': "Zoom avant",
  'map.fit': "Ajuster",
  'map.tidy': "Ranger",
  'map.saved': "Enregistré automatiquement.",
  'map.startOver': "Recommencer",

  // ---------- node kinds ----------
  'map.kind.recalled': "idée rappelée de mémoire",
  'map.kind.island': "idée pas encore rappelée",
  'map.kind.learned': "idée apprise depuis",
  'map.kind.note': "ta propre note",

  // Suggested link labels (glossary: concept-map link labels).
  'map.generic.isA': "est une forme de",
  'map.generic.isPartOf': "fait partie de",
  'map.generic.needs': "nécessite",
  'map.generic.causes': "entraîne",
  'map.generic.replaces': "remplace",
  'map.generic.isOppositeOf': "est l'inverse de",
  'map.link.linkedTo': "en lien avec",
  'map.link.isLinkedTo': "est en lien avec",
  'map.noLabel': "(sans étiquette)",

  // ---------- layer 1: recall ----------
  'map.recall.intro':
    "Tape les idées dont tu te souviens, une à la fois, et appuie sur Entrée. Sans regarder : essayer de te rappeler avant de lire aide souvent à mieux retenir ce que tu lis ensuite.",
  'map.recall.counterLabel': "Rappel : {recalled} sur {total}",
  'map.recall.counter': "{recalled}<rest>/ {total} rappelées</rest>",
  'map.recall.progress': "Idées rappelées",
  'map.recall.locked':
    "Le rappel est fermé ici, car le reste de la carte a été révélé. Recommence pour réessayer de mémoire, ou passe aux couches 2 et 3.",
  'map.recall.inputLabel': "Une idée dont tu te souviens",
  'map.recall.placeholder': "ex. un terme, une règle, une technique",
  'map.recall.add': "Ajouter",
  'map.recall.undo': "Ce n'est pas ce que je voulais dire : garder mes mots",
  'map.recall.secondsLeft': { one: "{count} seconde restante", other: "{count} secondes restantes" },
  'map.recall.stopTimer': "Arrêter le chrono",
  'map.recall.sprint': "Facultatif : sprint de 2 minutes",
  'map.recall.backToGaps': "Retour aux lacunes",
  'map.recall.done': "Je n'ai plus d'idées : montre-moi ce qui reste",
  'map.recall.timeUp': "Temps écoulé. Bel entraînement à la récupération : continue d'ajouter si d'autres idées te viennent, ou regarde ce qui reste.",
  'map.recall.already': "{label} est déjà sur ta carte.",
  'map.recall.recalled': "Tu t'en souviens : {label}.",
  'map.recall.recalledAll': "Tu t'en souviens : {label}. Tu as retrouvé toutes les idées d'ici.",
  'map.recall.recalledRun': "Tu t'en souviens : {label}. {count} de mémoire, joli enchaînement.",
  'map.recall.otherUnit': "{label} vient de l'unité {unit}. Bon rappel : c'est enregistré sur ta carte du cours entier.",
  'map.recall.dupNote': "Tu as déjà noté celle-là.",
  'map.recall.keptNote': "Ta note « {typed} » est gardée. Si le cours l'appelle autrement, tu pourras la fusionner avec une idée du cours après la révélation.",
  'map.recall.keptNoteInstead': "D'accord : « {typed} » reste une note personnelle.",
  'map.recall.msg.empty': "Cette partie du cours n'a pas encore de concepts à rappeler.",
  'map.recall.msg.all': {
    one: "Tu as retrouvé {count} idée de mémoire. C'est toute la carte.",
    other: "Tu as retrouvé les {count} idées de mémoire. C'est toute la carte.",
  },
  'map.recall.msg.none':
    "Rien n'est venu cette fois, et c'est un bon point de départ : des études suggèrent qu'essayer de se rappeler d'abord aide souvent à mieux retenir ce qu'on lit ensuite.",
  'map.recall.msg.strong': {
    one: "Tu as retrouvé de mémoire {recalled} idée sur {count}. C'est un rappel solide ; les quelques îlots restants se rattrapent vite.",
    other: "Tu as retrouvé de mémoire {recalled} des {count} idées. C'est un rappel solide ; les quelques îlots restants se rattrapent vite.",
  },
  'map.recall.msg.solid': {
    one: "Tu as retrouvé de mémoire {recalled} idée sur {count}. Une bonne base pour construire ; les îlots ci-dessous montrent exactement quoi lire ensuite.",
    other: "Tu as retrouvé de mémoire {recalled} des {count} idées. Une bonne base pour construire ; les îlots ci-dessous montrent exactement quoi lire ensuite.",
  },
  'map.recall.msg.start': {
    one: "Tu as retrouvé de mémoire {recalled} idée sur {count}. Chaque idée retrouvée s'est un peu renforcée, et les îlots ci-dessous forment ta liste de lecture.",
    other: "Tu as retrouvé de mémoire {recalled} des {count} idées. Chaque idée retrouvée s'est un peu renforcée, et les îlots ci-dessous forment ta liste de lecture.",
  },

  // ---------- layer 2: gaps ----------
  'map.gaps.recalledPct': "Rappel : {pct}",
  'map.gaps.intro':
    "Les îlots en pointillés sont les idées que tu n'as pas retrouvées. Ouvre-en un pour lire ce que c'est, suis-le jusqu'à sa leçon, puis marque-le quand c'est clair.",
  'map.gaps.marked': "{learned} sur {total} marqués pour l'instant.",
  'map.gaps.none': "Aucun îlot : tu as tout retrouvé dans cette partie du cours.",
  'map.gaps.notesHint': "Sélectionne une de tes notes pour la fusionner avec une idée du cours si elles désignent la même chose.",
  'map.gaps.backToConnecting': "Retour aux liens →",
  'map.gaps.connect': "Relier les points →",

  // ---------- layer 3: connect ----------
  'map.connect.intro':
    "Touche une idée, puis une autre, pour les relier, ou tire un trait depuis le point d'une idée. Trace les liens que tu pourrais expliquer en une phrase : les idées reliées à d'autres sont souvent plus faciles à retrouver et à utiliser.",
  'map.connect.pickFromList': "Ou choisis deux idées dans une liste",
  'map.connect.from': "De",
  'map.connect.link': "Lien",
  'map.connect.to': "Vers",
  'map.connect.chooseIdea': "Choisis une idée",
  'map.connect.addLink': "Ajouter le lien",
  'map.connect.check': "Vérifier ma carte",
  'map.connect.checkAgain': "Revérifier",

  // ---------- check results ----------
  'map.results.aria': "Vérification de la carte",
  'map.results.title': "Ta carte face à celle du cours",
  'map.results.found': { one: "lien trouvé", other: "liens trouvés" },
  'map.results.foundWithHint': { one: "lien trouvé, dont {withHint} avec un indice", other: "liens trouvés, dont {withHint} avec un indice" },
  'map.results.chunks': { one: "bloc de compréhension", other: "blocs de compréhension" },
  'map.results.ownLinks': { one: "lien personnel", other: "liens personnels" },
  'map.results.progress': "Liens du cours trouvés",
  'map.results.chunkExplain': "Un bloc est un groupe d'idées reliées par des liens du cours, nommé d'après son idée la plus connectée.",
  'map.results.chunkIdeas': { one: "{count} idée", other: "{count} idées" },
  'map.results.extra': {
    one: "{count} lien que tu as tracé n'est pas dans la carte du cours. Il peut quand même être juste : la carte du cours est le point de vue d'un expert, pas le seul possible.",
    other: "{count} liens que tu as tracés ne sont pas dans la carte du cours. Ils peuvent quand même être justes : la carte du cours est le point de vue d'un expert, pas le seul possible.",
  },
  'map.results.addToMap': "Ajouter à ma carte",
  'map.results.showHint': "Montrer un lien manqué",
  'map.results.allShown': "Tous les liens manqués sont affichés",
  'map.results.msg.noLinks': "La carte du cours n'a pas encore de liens dans ce périmètre : chaque lien que tu traces est le tien.",
  'map.results.msg.none': {
    one: "La carte du cours relie ces idées de {count} façon. Trace quelques liens qui te paraissent certains, puis revérifie, ou prends un indice.",
    other: "La carte du cours relie ces idées de {count} façons. Trace quelques liens qui te paraissent certains, puis revérifie, ou prends un indice.",
  },
  'map.results.msg.all': {
    one: "Tu as trouvé {count} lien sur {count} dans la carte du cours. Un savoir aussi connecté est souvent plus facile à utiliser.",
    other: "Tu as trouvé les {count} liens de la carte du cours. Un savoir aussi connecté est souvent plus facile à utiliser.",
  },
  'map.results.msg.allWithHint': {
    one: "Tu as trouvé {count} lien sur {count} dans la carte du cours ({withHint} avec un indice). Un savoir aussi connecté est souvent plus facile à utiliser.",
    other: "Tu as trouvé les {count} liens de la carte du cours ({withHint} avec un indice). Un savoir aussi connecté est souvent plus facile à utiliser.",
  },
  'map.results.msg.some': {
    one: "Tu as trouvé {got} lien sur {count} dans la carte du cours. Chacun relie deux idées.",
    other: "Tu as trouvé {got} des {count} liens de la carte du cours. Chacun relie deux idées.",
  },
  'map.results.msg.someWithHint': {
    one: "Tu as trouvé {got} lien sur {count} dans la carte du cours ({withHint} avec un indice). Chacun relie deux idées.",
    other: "Tu as trouvé {got} des {count} liens de la carte du cours ({withHint} avec un indice). Chacun relie deux idées.",
  },

  // ---------- details panels ----------
  'map.detail.selected': "Sélection : {label}",
  'map.detail.close': "Fermer les détails",
  'map.detail.taughtIn': "Leçon : {lesson}",
  'map.detail.learnThis': "Apprendre",
  'map.detail.knowNow': "C'est acquis",
  'map.detail.notYet': "En fait, pas encore",
  'map.detail.linkFromHere': "Relier depuis ici",
  'map.detail.removeFromMap': "Retirer de ma carte",
  'map.detail.deleteNote': "Supprimer la note",
  'map.detail.mergeLabel': "Même idée qu'un concept du cours ? Fusionne-la :",
  'map.detail.chooseConcept': "Choisis un concept",
  'map.detail.merge': "Fusionner",
  'map.detail.mergeLater': "Après la révélation, tu pourras fusionner une note avec un concept du cours.",
  'map.detail.removeLinkTo': "Retirer le lien vers {label}",
  'map.detail.remove': "Retirer",
  'map.detail.recalledFromMemory': "Tu as retrouvé cette idée de mémoire.",
  'map.detail.selectedLink': "Lien sélectionné",
  'map.detail.linkKind': "Lien",
  'map.detail.label': "Étiquette",
  'map.detail.inCourseMap': "Dans la carte du cours : {from} {label} {to}.",
  'map.detail.inCourseMapHinted': "Dans la carte du cours (trouvé avec un indice) : {from} {label} {to}.",
  'map.detail.notInCourseMap': "Absent de la carte du cours. Il peut quand même être juste : sais-tu dire quel est leur rapport ?",
  'map.detail.swap': "Inverser le sens",
  'map.detail.removeLink': "Retirer le lien",

  // ---------- legend and list view ----------
  'map.legend': "Légende",
  'map.legend.fromMemory': "De mémoire",
  'map.legend.yourNote': "Ta note",
  'map.legend.notYet': "Pas encore",
  'map.legend.learnedSince': "Apprise depuis",
  'map.legend.inCourseMap': "Dans la carte du cours",
  'map.legend.ownLink': "Ton propre lien",
  'map.legend.hint': "Indice",
  'map.list.ownNotes': "Tes propres notes",
  'map.list.links': "Liens",
  'map.list.status.found': "dans la carte du cours",
  'map.list.status.hinted': "dans la carte du cours, avec un indice",
  'map.list.status.extra': "ton propre lien",
  'map.list.empty': "Rien sur ta carte pour l'instant. Ajoute la première idée dont tu te souviens.",
  'map.list.noLinks': "Pas encore de liens. Sélectionne une idée, puis une autre.",
  'map.list.linkToThis': "(relier à celle-ci)",
  'map.list.startLink': "(commencer un lien)",

  // ---------- canvas ----------
  'map.canvas.aria':
    "Canevas de la carte des connaissances. Fais glisser pour te déplacer, pince ou fais défiler pour zoomer. Les idées sont des boutons ; les flèches déplacent l'idée sélectionnée. La vue Liste montre la même carte sous forme de listes.",
  'map.canvas.node': "{label}, {kind}",
  'map.canvas.nodeLinkTo': "{label}, {kind}. Appuie pour relier.",
  'map.canvas.nodeStartLink': "{label}, {kind}. Appuie pour commencer un lien.",
  'map.canvas.chunkTag': "bloc",
  'map.canvas.empty': "Ta carte est vide. Tape la première idée dont tu te souviens.",
} satisfies Translation<typeof en>;
