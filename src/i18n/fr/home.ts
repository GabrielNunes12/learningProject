// French UI strings: home. Mirrors src/i18n/en/home.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/home.ts';

export default {
  'home.greet.late': 'Tu veilles tard !',
  'home.greet.morning': 'Bonjour !',
  'home.greet.afternoon': 'Bon après-midi !',
  'home.greet.evening': 'Bonsoir !',
  'home.greet.lateName': 'Tu veilles tard, {name} !',
  'home.greet.morningName': 'Bonjour {name} !',
  'home.greet.afternoonName': 'Bon après-midi, {name} !',
  'home.greet.eveningName': 'Bonsoir {name} !',
  'home.goalReached': "Objectif quotidien atteint. Tout le reste, c'est du bonus.",
  'home.startWithReviews': {
    one: 'Commence par ta révision, puis apprends quelque chose de nouveau.',
    other: 'Commence par tes {count} révisions, puis apprends quelque chose de nouveau.',
  },
  'home.pickUp': 'Reprends là où tu en étais.',

  'home.hero.eyebrow': 'Apprendre mieux, pas plus longtemps',
  'home.hero.title': "Maîtrise les <hl>20 %</hl> qui t'apportent <hl>80 %</hl>.",
  'home.hero.lead':
    "Chaque cours commence par ses idées essentielles, te les enseigne avec des exemples résolus et des exercices, puis les ancre dans ta mémoire grâce aux quiz et à la répétition espacée.",
  'home.hero.tryLesson': 'Essaie une leçon, sans créer de compte',

  'home.continue.eyebrow': 'Poursuis ton apprentissage',
  'home.continue.startHere': 'Commence ici',
  'home.continue.complete': '{course} : terminé !',
  'home.continue.progress': '{done} sur {total} leçons',
  'home.continue.counts': 'Essentiel {coreDone}/{coreTotal} · {done}/{total} leçons',
  'home.continue.continue': 'Continuer →',
  'home.continue.start': 'Commencer →',
  'home.continue.quiz': 'Faire le quiz',

  'home.stat.goalValue': '{today} / {goal} XP',
  'home.stat.streakValue': { one: '{count} jour', other: '{count} jours' },
  'home.stat.level': 'Niveau {level} · {title}',
  'home.stat.levelProgress': 'Progression vers le niveau suivant',
  'home.stat.toNext': '{xp} XP avant le niveau {level}',
  'home.stat.dueNow': '{count} à réviser',
  'home.stat.caughtUp': 'Tout est à jour',
  'home.stat.beforeForget': "Avant d'oublier",
  'home.stat.nothingDue': 'Rien à réviser',

  'home.save.text': "<b>Ta progression est enregistrée uniquement dans ce navigateur.</b> Crée un profil gratuit pour la mettre à l'abri et la retrouver sur tous tes appareils.",
  'home.save.button': 'Sauvegarder ma progression',

  'home.week.title': 'Cette semaine',
  'home.method.title': 'La méthode 80/20',
  'home.method.core': "<b>L'essentiel d'abord.</b> Termine les leçons <core>Essentiel</core> d'un cours avant tout <extra>Approfondissement</extra>.",
  'home.method.testOut': '<b>Teste ton niveau.</b> Fais le quiz en premier : il te dit quelles leçons passer.',
  'home.method.daily': "<b>Révise chaque jour.</b> 5 à 10 minutes suffisent pour garder tout ce que tu as appris.",
  'home.method.two': "<b>Deux cours à la fois.</b> Termine leur partie essentielle, puis passe au suivant.",

  'home.yourCourses': 'Tes cours',
  'home.recommended': 'Cours recommandés',
  'home.allCourses': 'Tous les cours →',
} satisfies Translation<typeof en>;
