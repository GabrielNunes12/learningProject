// French UI strings: insights. Mirrors src/i18n/en/insights.ts (see docs/TRANSLATING.md).
// The in-sentence format names (formatInline) follow "en" ("contre 90 % en QCM") and "Format le plus faible :".
import type { Translation } from '../core.ts';
import type en from '../en/insights.ts';

export default {
  // ---------- question formats ----------
  'insights.format.mcq': "QCM",
  'insights.format.numeric': "Réponses chiffrées",
  'insights.format.text': "Réponses courtes",
  'insights.format.output': "Prédiction de sortie",
  'insights.format.bug': "Chasse aux bugs",
  'insights.format.order': "Remise en ordre",
  'insights.format.buckets': "Classement en groupes",
  'insights.format.trace': "Suivi de code",
  'insights.format.truthtable': "Tables de vérité",
  'insights.format.logicgrid': "Grilles logiques",
  'insights.format.balance': "Énigmes de balance",
  'insights.formatInline.mcq': "QCM",
  'insights.formatInline.numeric': "réponses chiffrées",
  'insights.formatInline.text': "réponses courtes",
  'insights.formatInline.output': "prédiction de sortie",
  'insights.formatInline.bug': "chasse aux bugs",
  'insights.formatInline.order': "remise en ordre",
  'insights.formatInline.buckets': "classement en groupes",
  'insights.formatInline.trace': "suivi de code",
  'insights.formatInline.truthtable': "tables de vérité",
  'insights.formatInline.logicgrid': "grilles logiques",
  'insights.formatInline.balance': "énigmes de balance",
  'insights.formatAdvice.mcq': "Essaie de répondre dans ta tête avant de lire les choix, puis prends celui qui correspond.",
  'insights.formatAdvice.numeric': "Estime d'abord la réponse pour repérer un résultat aberrant, et vérifie les unités.",
  'insights.formatAdvice.text': "Formule d'abord l'idée avec tes mots, puis donne le terme exact demandé.",
  'insights.formatAdvice.output': "Suis le code sur papier : note chaque variable après chaque ligne avant de taper la sortie.",
  'insights.formatAdvice.bug': "Lis d'abord l'erreur, puis suis les variables ligne par ligne pour voir où ça déraille.",
  'insights.formatAdvice.order': "Place d'abord le premier et le dernier élément, puis remplis le milieu.",
  'insights.formatAdvice.buckets': "Formule la règle de chaque groupe avant de classer la première carte.",
  'insights.formatAdvice.trace': "Prédis ce que change chaque ligne avant d'avancer, puis compare.",
  'insights.formatAdvice.truthtable': "Remplis une colonne à la fois et appuie-toi sur les colonnes intermédiaires.",
  'insights.formatAdvice.logicgrid': "Note ce que chaque indice exclut, pas seulement ce qu'il confirme.",
  'insights.formatAdvice.balance': "Regroupe d'abord les inconnues d'un côté, puis les nombres seuls de l'autre.",

  // ---------- small helpers ----------
  'insights.quoted': "« {title} »",
  'insights.list.separator': ", ",
  'insights.list.and': "{items} et {last}",
  'insights.list.more': { one: "{items} et {count} autre", other: "{items} et {count} autres" },

  // ---------- "you missed X n of the last m times" ----------
  'insights.miss.concept': {
    one: "Sur {name}, tu as eu faux {misses} fois sur {count} tentative récente.",
    other: "Sur {name}, tu as eu faux {misses} fois lors de tes {count} dernières tentatives.",
  },
  'insights.miss.conceptAllTime': {
    one: "Sur {name}, tu as eu faux {misses} fois sur {count} tentative jusqu'ici.",
    other: "Sur {name}, tu as eu faux {misses} fois sur {count} tentatives jusqu'ici.",
  },
  'insights.miss.lesson': {
    one: "Dans « {name} », tu as eu faux {misses} fois sur {count} tentative récente.",
    other: "Dans « {name} », tu as eu faux {misses} fois lors de tes {count} dernières tentatives.",
  },
  'insights.miss.lessonAllTime': {
    one: "Dans « {name} », tu as eu faux {misses} fois sur {count} tentative jusqu'ici.",
    other: "Dans « {name} », tu as eu faux {misses} fois sur {count} tentatives jusqu'ici.",
  },

  // ---------- struggle patterns ----------
  'insights.pattern.formats.title': "Format le plus faible : {format}",
  'insights.pattern.formats.detail': "{worst} : {worstPct} de bonnes réponses, contre {bestPct} en {best} (toutes réponses confondues).",
  'insights.pattern.forgetting.title': "Juste avant, faux ensuite",
  'insights.pattern.forgetting.detail': {
    one: "{items} : tu as bien répondu au moins deux fois à ses questions, puis tu as eu faux à ta dernière tentative. C'est l'oubli normal, et le signal pour réviser.",
    other: "{items} : tu as bien répondu au moins deux fois à leurs questions, puis tu as eu faux à ta dernière tentative. C'est l'oubli normal, et le signal pour réviser.",
  },
  'insights.pattern.pileup.title': "Les révisions s'accumulent",
  'insights.pattern.pileup.detail': { one: "{count} révision à faire.", other: "{count} révisions à faire." },
  'insights.pattern.pileup.detailOldest': {
    one: "{count} révision à faire, la plus ancienne depuis {days}.",
    other: "{count} révisions à faire, la plus ancienne depuis {days}.",
  },
  'insights.pattern.skipped.title': "Leçons essentielles sautées",
  'insights.pattern.skipped.detail': {
    one: "{lessons} est une leçon essentielle que tu n'as pas ouverte, alors que tu as fait les suivantes.",
    other: "{lessons} sont des leçons essentielles que tu n'as pas ouvertes, alors que tu as fait les suivantes.",
  },

  // ---------- tips ----------
  'insights.tip.clearReviews.title': {
    one: "Fais d'abord {count} révision en attente",
    other: "Fais d'abord tes {count} révisions en attente",
  },
  'insights.tip.clearReviews.evidence': { one: "{count} révision à faire.", other: "{count} révisions à faire." },
  'insights.tip.clearReviews.evidenceOldest': {
    one: "{count} révision à faire ; la plus ancienne attend depuis {days}.",
    other: "{count} révisions à faire ; la plus ancienne attend depuis {days}.",
  },
  'insights.tip.clearReviews.advice': "Fais-les avant les nouvelles leçons. La révision espacée marche souvent mieux quand elle a lieu près de la date prévue.",
  'insights.tip.weak.title': "Reviens sur {name}",
  'insights.tip.weak.adviceConcept':
    "Relis la leçon « {lesson} », puis fais une courte pratique mixte : mélanger avec d'autres idées aide souvent à choisir la bonne approche, pas seulement à la répéter.",
  'insights.tip.weak.adviceLesson': "Refais la leçon, puis une courte pratique mixte sur {course}.",
  'insights.tip.forgetting.title': "Révise {name} plus tôt",
  'insights.tip.forgetting.evidence': "Sur {name}, tu avais bien répondu au moins deux fois, puis tu as eu faux à ta dernière tentative.",
  'insights.tip.forgetting.advice':
    "La pratique de récupération étalée sur plusieurs jours aide souvent à ancrer les souvenirs. Travaille tes questions les plus faibles aujourd'hui et laisse le planning les ramener.",
  'insights.tip.format.title': "{format} : essaie une autre approche",
  'insights.tip.format.evidence': "{worstPct} de bonnes réponses en {worst}, contre {bestPct} en {best}.",
  'insights.tip.skipped.title': "Fais la leçon essentielle « {lesson} »",
  'insights.tip.skipped.evidence': "C'est une leçon essentielle du cours {course} que tu n'as pas ouverte, alors que tu as déjà avancé plus loin.",
  'insights.tip.skipped.advice': "Les leçons essentielles portent la majeure partie d'un cours ; les suivantes s'appuient souvent dessus.",
  'insights.tip.confirm.title': "Vérifie tes acquis avec un quiz",
  'insights.tip.confirm.evidence.concepts': { one: "Tu maîtrises {count} concept.", other: "Tu maîtrises {count} concepts." },
  'insights.tip.confirm.evidence.lessons': { one: "Tu maîtrises {count} leçon.", other: "Tu maîtrises {count} leçons." },
  'insights.tip.confirm.evidence.topics': { one: "Tu maîtrises {count} sujet.", other: "Tu maîtrises {count} sujets." },
  'insights.tip.confirm.advice': "Un quiz mélange des questions de tout le cours : un moyen rapide de vérifier que ça tient et de repérer les lacunes.",
  'insights.tip.mix.title': "Mélange tes exercices",
  'insights.tip.mix.evidence.concepts': {
    one: "{count} concept te pose encore problème de temps en temps.",
    other: "{count} concepts te posent encore problème de temps en temps.",
  },
  'insights.tip.mix.evidence.lessons': {
    one: "{count} leçon te pose encore problème de temps en temps.",
    other: "{count} leçons te posent encore problème de temps en temps.",
  },
  'insights.tip.mix.evidence.topics': {
    one: "{count} sujet te pose encore problème de temps en temps.",
    other: "{count} sujets te posent encore problème de temps en temps.",
  },
  'insights.tip.mix.evidenceNone': "Aucun point faible ne ressort pour l'instant.",
  'insights.tip.mix.advice': "Travailler plusieurs sujets dans une même séance aide souvent à choisir la bonne méthode, pas seulement à la retrouver.",

  // ---------- tip buttons ----------
  'insights.action.startReviews': "Commencer les révisions",
  'insights.action.openLesson': "Ouvrir « {lesson} »",
  'insights.action.redoLesson': "Refaire la leçon",
  'insights.action.practiseConcept': "S'entraîner sur {concept}",
  'insights.action.mixedPractice': "Pratique mixte",
  'insights.action.practiseWeakest': "Travailler mes points faibles",
  'insights.action.openLessonPlain': "Ouvrir la leçon",
  'insights.action.courseQuiz': "Quiz : {course}",

  // ---------- the report page ----------
  'insights.title': "Ton bilan d'apprentissage",
  'insights.subtitle': "Ce que tu rates, ce qui te met en difficulté, et comment progresser.",
  'insights.subtitleCourse': "Ce que tu rates, ce qui te met en difficulté, et comment progresser dans {course}.",
  'insights.filter': "Filtrer par cours",
  'insights.allCourses': "Tous les cours",
  'insights.notFound.title': "Cours introuvable",
  'insights.notFound.body': "Aucun cours ne s'appelle « {id} ». <link>Voir le bilan de tous tes cours</link>.",

  'insights.noun.concepts': "Concepts",
  'insights.noun.lessons': "Leçons",
  'insights.noun.topics': "Sujets",

  'insights.state.mastered': "Maîtrisé",
  'insights.state.learning': "En cours",
  'insights.state.struggling': "En difficulté",
  'insights.state.untested': "Pas encore pratiqué",
  'insights.state.none': "Pas encore de questions",

  // ---------- empty state ----------
  'insights.empty.title': "Pas encore assez de pratique",
  'insights.empty.start': "Réponds à quelques questions et ce bilan se remplira.",
  'insights.empty.startIn': "Réponds à quelques questions dans {course} et ce bilan se remplira.",
  'insights.empty.answered': { one: "Tu as répondu à {count} question.", other: "Tu as répondu à {count} questions." },
  'insights.empty.answeredIn': { one: "Tu as répondu à {count} question dans {course}.", other: "Tu as répondu à {count} questions dans {course}." },
  'insights.empty.more': { one: "Encore {count} réponse et ce bilan se remplira.", other: "Encore {count} réponses et ce bilan se remplira." },
  'insights.empty.needsAttention': "<b>À travailler :</b> les concepts que tu rates souvent, classés selon tes réponses récentes.",
  'insights.empty.patterns': "<b>Points de blocage :</b> les formats de questions qui te piègent, ce que tu as su puis oublié, et les révisions qui s'accumulent.",
  'insights.empty.strengths': "<b>Points forts :</b> ce que tu as réussi trois fois de suite.",
  'insights.empty.tips': "<b>Conseils :</b> quelques actions concrètes, chacune fondée sur tes propres réponses.",
  'insights.empty.openCourse': "Ouvrir le cours",
  'insights.empty.continue': "Continuer à apprendre",
  'insights.empty.review': "Réviser",

  // ---------- sections ----------
  'insights.tips.title': "Comment progresser",
  'insights.tips.basis': "D'après tes propres réponses",
  'insights.weak.title': "À travailler",
  'insights.weak.ranked': "Classés selon tes erreurs récentes",
  'insights.patterns.title': "Points de blocage",
  'insights.strengths.title': "Points forts",
  'insights.strengths.count.concepts': { one: "{count} concept maîtrisé", other: "{count} concepts maîtrisés" },
  'insights.strengths.count.lessons': { one: "{count} leçon maîtrisée", other: "{count} leçons maîtrisées" },
  'insights.strengths.count.topics': { one: "{count} sujet maîtrisé", other: "{count} sujets maîtrisés" },
  'insights.strengths.more': { one: "et {count} autre", other: "et {count} autres" },
  'insights.strengths.none.concepts':
    "Rien de maîtrisé pour l'instant. Un concept est maîtrisé dès que tu as bien répondu trois fois de suite à chacune de ses questions déjà vues.",
  'insights.strengths.none.lessons':
    "Rien de maîtrisé pour l'instant. Une leçon est maîtrisée dès que tu as bien répondu trois fois de suite à chacune de ses questions déjà vues.",
  'insights.strengths.none.topics':
    "Rien de maîtrisé pour l'instant. Un sujet est maîtrisé dès que tu as bien répondu trois fois de suite à chacune de ses questions déjà vues.",
  'insights.map.title': "Maîtrise par cours",

  // ---------- overview tiles ----------
  'insights.window.label': { one: "Réussite sur {count} jour", other: "Réussite sur {count} jours" },
  'insights.window.detail': {
    one: "Dernier essai : {right} sur {count} question juste",
    other: "Dernier essai : {right} sur {count} questions justes",
  },
  'insights.window.empty': "Aucune réponse sur cette période",
  'insights.counts.mastered': { one: "<b>{count}</b> maîtrisé", other: "<b>{count}</b> maîtrisés" },
  'insights.counts.learning': { one: "<b>{count}</b> en cours", other: "<b>{count}</b> en cours" },
  'insights.counts.struggling': { one: "<b>{count}</b> en difficulté", other: "<b>{count}</b> en difficulté" },
  'insights.counts.untested': { one: "{count} pas encore pratiqué", other: "{count} pas encore pratiqués" },
  'insights.due.label': "Révisions à faire",
  'insights.due.oldest': { one: "La plus ancienne attend depuis {count} jour", other: "La plus ancienne attend depuis {count} jours" },
  'insights.due.today': "À faire aujourd'hui",
  'insights.due.none': "Tout est à jour",

  // ---------- needs attention ----------
  'insights.weak.nothing': "Rien ne ressort pour l'instant.",
  'insights.weak.thin.concepts': {
    one: "{count} concept a moins de {min} réponses : trop tôt pour juger.",
    other: "{count} concepts ont moins de {min} réponses : trop tôt pour juger.",
  },
  'insights.weak.thin.lessons': {
    one: "{count} leçon a moins de {min} réponses : trop tôt pour juger.",
    other: "{count} leçons ont moins de {min} réponses : trop tôt pour juger.",
  },
  'insights.weak.thin.topics': {
    one: "{count} sujet a moins de {min} réponses : trop tôt pour juger.",
    other: "{count} sujets ont moins de {min} réponses : trop tôt pour juger.",
  },
  'insights.weak.lesson': "Leçon « {title} »",
  'insights.weak.lastToday': "dernière réponse aujourd'hui",
  'insights.weak.lastYesterday': "dernière réponse hier",
  'insights.weak.lastDaysAgo': { one: "dernière réponse il y a {count} jour", other: "dernière réponse il y a {count} jours" },
  'insights.weak.due': { one: "{count} à réviser", other: "{count} à réviser" },
  'insights.weak.practise': "S'entraîner",
  'insights.weak.practiseLabel': "S'entraîner sur {name} avec des idées proches",
  'insights.weak.more': {
    one: "et {count} autre dans les vues par cours ci-dessous",
    other: "et {count} autres dans les vues par cours ci-dessous",
  },

  // ---------- sparkline ----------
  'insights.spark.empty': "aucun historique",
  'insights.spark.right': "juste",
  'insights.spark.wrong': "faux",
  'insights.spark.label': {
    one: "{count} dernière réponse, de la plus ancienne à la plus récente : {results}",
    other: "{count} dernières réponses, de la plus ancienne à la plus récente : {results}",
  },
  'insights.spark.point': "Réponse {index} sur {total} : {result} (3 dernières : {pct} de réussite)",

  // ---------- patterns ----------
  'insights.types.title': "Réussite par format de question",
  'insights.types.tip': "{format} : {right} sur {total} justes",
  'insights.types.row': "{right} sur {total} justes ({pct})",
  'insights.types.needMore': "Chaque format doit avoir {min} réponses pour apparaître ici.",
  'insights.types.hidden': {
    one: "{count} format avec moins de {min} réponses est masqué. Toutes les réponses jusqu'ici comptent.",
    other: "{count} formats avec moins de {min} réponses sont masqués. Toutes les réponses jusqu'ici comptent.",
  },
  'insights.patterns.none': "Pas de tendance nette pour l'instant : aucun écart entre formats, rien d'oublié, des révisions sous contrôle et aucune leçon essentielle sautée.",

  // ---------- mastery map ----------
  'insights.chip.noQuestions': "Pas encore de questions d'entraînement",
  'insights.chip.untested': { one: "{count} question, pas encore pratiquée", other: "{count} questions, pas encore pratiquées" },
  'insights.chip.score': "{right}/{total} justes",
  'insights.chip.scoreThin': "{right}/{total} justes (trop peu de réponses pour juger)",
  'insights.chip.scoreRecent': "{right}/{total} justes, {count} dernières : {pct}",
  'insights.chip.scoreRecentThin': "{right}/{total} justes, {count} dernières : {pct} (trop peu de réponses pour juger)",
  'insights.chip.label': "{name} : {state}. {detail}",
  'insights.legend': "Légende",
  'insights.course.masteredConcepts': { one: "Concept maîtrisé : {mastered} sur {count}", other: "Concepts maîtrisés : {mastered} sur {count}" },
  'insights.course.masteredLessons': {
    one: "Leçon maîtrisée : {mastered} sur {count} · regroupé par leçon tant que ce cours n'a pas de carte des concepts",
    other: "Leçons maîtrisées : {mastered} sur {count} · regroupé par leçon tant que ce cours n'a pas de carte des concepts",
  },
  'insights.course.focus': "Cibler",

  // ---------- Home card ----------
  'insights.teaser.weak': "{miss} Découvre comment progresser.",
  'insights.teaser.mastered.concepts': {
    one: "{count} concept maîtrisé. Découvre quoi pratiquer ensuite.",
    other: "{count} concepts maîtrisés. Découvre quoi pratiquer ensuite.",
  },
  'insights.teaser.mastered.lessons': {
    one: "{count} leçon maîtrisée. Découvre quoi pratiquer ensuite.",
    other: "{count} leçons maîtrisées. Découvre quoi pratiquer ensuite.",
  },
  'insights.teaser.mastered.topics': {
    one: "{count} sujet maîtrisé. Découvre quoi pratiquer ensuite.",
    other: "{count} sujets maîtrisés. Découvre quoi pratiquer ensuite.",
  },
  'insights.teaser.default': "Découvre ce que tu rates, ce qui te met en difficulté, et comment progresser.",

  // ---------- charts (Home, Review, Profile) ----------
  'insights.chart.goal': "objectif {goal}",
  'insights.chart.xpTip': "{day} : {count} XP",
  'insights.chart.xpLabel': "XP gagnés ces 7 derniers jours",
  'insights.chart.tomorrow': "Demain",
  'insights.chart.dueTip': { one: "{day} : {count} à réviser", other: "{day} : {count} à réviser" },
  'insights.chart.reviews': { one: "{count} révision", other: "{count} révisions" },
  'insights.chart.forecastLabel': "Révisions à faire ces 7 prochains jours",
  // Memory strength of a question ("question" is feminine).
  'insights.box.1': "À réapprendre",
  'insights.box.2': "Nouvelle",
  'insights.box.3': "Familière",
  'insights.box.4': "Solide",
  'insights.box.5': "Bien ancrée",
  'insights.box.6': "Maîtrisée",
  'insights.chart.strengthLabel': "Questions par solidité de la mémoire",
  'insights.chart.strengthTip': { one: "{box} : {count} question", other: "{box} : {count} questions" },
  'insights.chart.heatmapLabel': {
    one: "Activité des {weeks} dernières semaines : {count} jour actif",
    other: "Activité des {weeks} dernières semaines : {count} jours actifs",
  },
  'insights.chart.activeDays': { one: "{count} jour actif", other: "{count} jours actifs" },
  'insights.chart.less': "Moins",
  'insights.chart.more': "Plus",
} satisfies Translation<typeof en>;
