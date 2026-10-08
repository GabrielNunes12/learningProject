// French UI strings: lesson. Mirrors src/i18n/en/lesson.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/lesson.ts';

export default {
  // ---------- lesson player ----------
  'lesson.xpEarnedAria': '{xp} XP gagnés dans cette leçon',
  'lesson.shorter.heading': 'Résume « {title} » en ancres',
  'lesson.shorter.intro':
    'Deux ou trois ancres, quatre mots maximum chacune : les repères qui te rappelleront cette leçon. Des fragments valent mieux que des phrases complètes.',
  'lesson.shorter.done': 'Terminer la leçon',

  // ---------- worked example ----------
  'lesson.example.eyebrow': 'Exemple résolu',
  'lesson.example.attemptLabel': "Ta réponse d'abord. Même une estimation grossière compte ; les étapes se débloquent une fois ta réponse validée.",
  'lesson.example.placeholder': 'Résous le problème et écris ta réponse',
  'lesson.example.yourAnswer': 'Ta réponse',
  'lesson.example.compare': "Compare avec ta réponse ci-dessus. À quel moment ton raisonnement a-t-il pris une autre direction ?",
  'lesson.example.stepOf': 'Étape {step} sur {total}',
  'lesson.example.ready': 'Quand tu veux.',
  'lesson.example.writeToUnlock': 'Écris ta réponse pour débloquer les étapes.',
  'lesson.example.lockIn': 'Valider ma réponse',
  'lesson.example.showFirstStep': 'Voir la première étape',
  'lesson.example.nextStep': 'Étape suivante',
  'lesson.example.showAnswer': 'Voir la réponse',
  'lesson.example.notQuite': 'Pas tout à fait',
  'lesson.example.hadIt': "J'avais trouvé",

  // ---------- lesson complete ----------
  'lesson.complete.title': 'Leçon terminée !',
  'lesson.complete.totalXp': 'XP total',
  'lesson.complete.accuracy': 'Précision',
  'lesson.complete.today': "{today}/{goal} aujourd'hui",
  'lesson.complete.certTitle': 'Tu as terminé « {course} » !',
  'lesson.complete.certText': 'Obtiens ton certificat : télécharge-le en PDF et partage-le sur LinkedIn, X ou Facebook.',
  'lesson.complete.takeaway': 'À retenir',
  'lesson.explain.eyebrow': 'Réexplique-le',
  'lesson.explain.intro': 'Avec tes mots, comme à un ami qui a raté cette leçon. Puis vois quelles idées tu as couvertes.',
  'lesson.explain.placeholder': 'Cette leçon parlait de…',
  'lesson.explain.words': '{count}/{min} mots',
  'lesson.explain.compare': 'Comparer avec la leçon',
  'lesson.explain.compareAgain': 'Comparer à nouveau',
  'lesson.explain.score': { one: '{covered} idée sur {count}', other: '{covered} idées sur {count}' },
  'lesson.explain.missed': { one: 'Il te manque celle-ci', other: 'Il te manque celles-ci' },
  'lesson.explain.fix': 'Ça pointe, tu corriges : ajoute ce qui manque avec tes mots et compare à nouveau.',
  'lesson.explain.all': 'Toutes les idées y sont. Bravo.',
  'lesson.explain.note': 'Ça vérifie quelles idées tu nommes, pas si chaque phrase est juste.',
  'lesson.complete.checkpoint': "Bilan d'unité : place ce que tu sais sur la carte",
  'lesson.complete.signupNudge': '<link>Crée un profil gratuit</link> pour retrouver ta progression sur tous tes appareils.',
  'lesson.complete.backToCourse': 'Retour au cours',
  'lesson.complete.next': 'Suivante : {title} →',
  'lesson.complete.quiz': 'Faire le quiz du cours →',

  // ---------- question kinds ----------
  'lesson.kind.mcq': 'Choisis une réponse',
  'lesson.kind.numeric': 'Entre un nombre',
  'lesson.kind.text': 'Écris ta réponse',
  'lesson.kind.output': 'Prédis la sortie',
  'lesson.kind.bug': 'Trouve le bug : clique sur la ligne fautive',
  'lesson.kind.pickFix': 'Choisis maintenant la correction',

  // ---------- classic questions ----------
  'lesson.question.itPrints': 'Ça affiche :',
  'lesson.question.codeLinesAria': 'Code : choisis la ligne qui contient le bug',
  'lesson.question.lineAria': 'Ligne {line}',
  'lesson.question.whenYouRun': "À l'exécution",
  'lesson.question.lineFound': '✓ La ligne {line} est la coupable. Quelle modification la corrige ?',
  'lesson.question.outputPlaceholder': "Écris exactement ce qui s'affiche",
  'lesson.question.outputAria': 'Sortie',
  'lesson.question.numericPlaceholder': 'ex. : 0,25 ; 1/4 ou 42',
  'lesson.question.textPlaceholder': 'Écris ta réponse',
  'lesson.question.outputTip': 'Une ligne par ligne affichée. Appuie sur Ctrl/⌘ + Entrée pour vérifier.',

  // ---------- question feedback ----------
  'lesson.frame.needHint': "Besoin d'un indice ?",
  'lesson.frame.hintLine': '<b>Indice :</b> {hint}',
  'lesson.frame.why': 'Pourquoi',
  'lesson.frame.gotIt': 'Trouvé !',
  'lesson.frame.xpGained': '+{xp} XP',
  'lesson.frame.secondTries': 'Un deuxième essai, ça compte aussi.',
  'lesson.frame.notQuite': 'Pas tout à fait.',
  'lesson.frame.retryNudge': "Réfléchis encore une fois : c'est en réessayant qu'on apprend.",
  'lesson.frame.incorrect': 'Faux',
  'lesson.frame.heresAnswer': 'Voici la réponse',
  'lesson.frame.readWhy': "Lis l'explication : cette question reviendra dans tes révisions.",
  'lesson.frame.showAnswer': 'Voir la réponse',
  'lesson.frame.guessing': 'Je devine',
  'lesson.frame.guessingTip': 'Pas sûr ? Coche-le. Une bonne réponse au hasard ne compte pas comme un acquis, alors la question revient plus tôt.',
  'lesson.frame.guessedRight': 'Juste, mais au hasard',
  'lesson.frame.guessedRightNote': "Bien vu d'être honnête. Elle revient demain pour que tu l'apprennes vraiment.",
  'lesson.frame.honestMiss': 'Bien vu : pas de hasard',
  'lesson.frame.dontKnow': 'Je ne sais pas',
  'lesson.frame.correctAnswer': '<b>Bonne réponse :</b> {answer}',

  // ---------- correct-answer texts ----------
  'lesson.answer.withUnit': '{value} {unit}',
  'lesson.answer.bugFix': 'Ligne {line} : {fix}',
  'lesson.answer.traceValue': '`{expr}` après la ligne {line}',
  // Truth table answers: V (vrai) and F (faux).
  'lesson.answer.true': 'V',
  'lesson.answer.false': 'F',

  // ---------- question sessions ----------
  'lesson.session.correctSoFar': { one: "{count} bonne réponse pour l'instant", other: "{count} bonnes réponses pour l'instant" },
  'lesson.session.shorterHeading': 'Résume cette séance en ancres',
  'lesson.session.shorterIntro': "Qu'est-ce que tu retiendras, ou feras autrement la prochaine fois ? Deux ou trois ancres, quatre mots maximum chacune.",
  'lesson.session.seeResults': 'Voir les résultats',
  'lesson.session.harder': 'Plus difficile : tu connais déjà la plus facile',
  'lesson.loadFailed.title': 'Impossible de charger cette leçon',
  'lesson.loadFailed.body': 'Vérifie ta connexion et réessaie.',
} satisfies Translation<typeof en>;
