// French UI strings: profile. Mirrors src/i18n/en/profile.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/profile.ts';

export default {
  'profile.importBadFile': "Ce fichier ne ressemble pas à une exportation de progression ProjectLearn.",

  'profile.guest': 'Invité',
  'profile.guestLearner': 'Apprenant invité',
  'profile.accountLine': '{email} <verified>✓ vérifié</verified> · membre depuis {joined}',
  'profile.localOnly': 'Ta progression est enregistrée uniquement dans ce navigateur.',
  'profile.levelLine': 'Niveau {level} · {title}',
  'profile.levelXp': '{into} / {needed} XP',
  'profile.levelProgress': 'Progression vers le niveau suivant',
  'profile.sync.saving': 'Enregistrement…',
  'profile.sync.offline': 'Hors ligne, nouvel essai bientôt',
  'profile.sync.synced': 'Synchronisé',
  'profile.createProfile': 'Créer un profil',

  'profile.stat.totalXp': 'XP total',
  'profile.stat.currentStreak': 'Série actuelle',
  'profile.stat.bestStreak': 'Meilleure série',
  'profile.stat.lessonsDone': 'Leçons terminées',
  'profile.stat.mastered': 'Questions maîtrisées',
  'profile.stat.coursesStarted': 'Cours commencés',

  'profile.activity': 'Activité',

  'profile.goal.help': "Combien d'XP veux-tu gagner chaque jour ? Une leçon rapporte environ 30 à 50 XP.",
  'profile.goal.label': 'Objectif quotidien en XP',
  'profile.goal.casual': 'Tranquille',
  'profile.goal.regular': 'Régulier',
  'profile.goal.serious': 'Sérieux',
  'profile.goal.intense': 'Intense',

  'profile.courseProgress': 'Progression par cours',
  'profile.notebookLink': 'Carnet →',
  'profile.reportLink': "Ton bilan d'apprentissage →",
  'profile.noCourses': 'Aucun cours commencé pour le moment. <link>Choisis-en un →</link>',
  'profile.courseLine': 'Essentiel {done}/{total} · {mastery} de maîtrise',
  'profile.courseLineQuiz': 'Essentiel {done}/{total} · {mastery} de maîtrise · quiz {quiz}',
  'profile.courseProgressLabel': 'Progression : {title}',

  'profile.somethingWrong': 'Un problème est survenu.',

  'profile.account.title': 'Compte',
  'profile.account.changePassword': 'Changer de mot de passe',
  'profile.account.currentPassword': 'Mot de passe actuel',
  'profile.account.newPassword': 'Nouveau mot de passe',
  'profile.account.passwordHelp': 'Au moins 8 caractères.',
  'profile.account.updatePassword': 'Mettre à jour le mot de passe',
  'profile.account.passwordChanged': 'Mot de passe modifié. Tes autres appareils ont été déconnectés.',
  'profile.account.session': 'Session',
  'profile.account.signOutHelp': 'Te déconnecter retire ta progression de ce navigateur. Elle reste enregistrée dans ton compte.',
  'profile.account.signOut': 'Se déconnecter',
  'profile.account.delete': 'Supprimer le compte',
  'profile.account.deleteStart': 'Supprimer mon compte…',
  'profile.account.deleteWarning': 'Cette action supprime définitivement ton profil et toute ta progression synchronisée. Elle est irréversible.',
  'profile.account.deleteConfirm': 'Confirme avec ton mot de passe',
  'profile.account.deleteForever': 'Supprimer définitivement',

  'profile.data.title': 'Tes données',
  'profile.data.helpSignedIn': 'Ta progression se synchronise automatiquement avec ton compte. Tu peux quand même garder un fichier de sauvegarde.',
  'profile.data.helpGuest': 'Sauvegarde ta progression dans un fichier, ou restaure-la dans un autre navigateur.',
  'profile.data.export': 'Exporter la progression',
  'profile.data.import': 'Importer une progression',
  'profile.data.reset': 'Réinitialiser la progression',
  'profile.data.resetConfirm': "Effacer toute ta progression ? Exporte-la d'abord si tu veux une sauvegarde.",
  'profile.data.importFailed': 'Impossible de lire ce fichier.',
} satisfies Translation<typeof en>;
