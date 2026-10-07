// French UI strings: cert. Mirrors src/i18n/en/cert.ts (see docs/TRANSLATING.md).
// The certificate itself uses formal wording; the PDF fonts print é, œ and « » but use U+00A0 (not U+202F) here.
import type { Translation } from '../core.ts';
import type en from '../en/cert.ts';

export default {
  'cert.minutes': { one: '{count} minute', other: '{count} minutes' },
  'cert.hours': { one: '{count} heure', other: '{count} heures' },

  // ---- the certificate (same text in the HTML view and the PDF) ----
  'cert.brandLabel': 'Certificat de réussite : {name}, {course}',
  'cert.id': 'Certificat n° {id}',
  'cert.title': 'Certificat de réussite',
  'cert.certifies': 'Ce certificat atteste que',
  'cert.completed': 'a terminé avec succès le cours',
  'cert.details': { one: "{count} leçon · {hours} d'apprentissage", other: "{count} leçons · {hours} d'apprentissage" },
  'cert.dateIssued': 'Date de délivrance',
  'cert.issuer': 'Délivré par',
  'cert.verifyAt': 'Vérifiable sur {url}',
  'cert.pdfTitle': '{course} : certificat de réussite',
  'cert.pdfSubject': '{name} a terminé {course}',

  // ---- the name ----
  'cert.name.empty': "Saisis ton nom tel qu'il doit apparaître sur le certificat.",
  'cert.name.long': 'Le nom ne doit pas dépasser 60 caractères.',
  'cert.name.letter': 'Le nom doit contenir au moins une lettre.',
  'cert.name.chars': 'La police du certificat ne peut pas imprimer « {chars} ». Utilise des lettres latines (les accents comme é, ñ, ü sont acceptés).',

  // ---- sharing ----
  'cert.shareText': {
    one: "Je viens de terminer « {course} » sur {issuer} : {count} leçon, {hours} d'apprentissage.",
    other: "Je viens de terminer « {course} » sur {issuer} : {count} leçons, {hours} d'apprentissage.",
  },
  'cert.download': 'Télécharger le PDF',
  'cert.print': 'Imprimer',
  'cert.shareIt': 'Partage-le',
  'cert.addLinkedIn': 'Ajouter au profil LinkedIn',
  'cert.postLinkedIn': 'Publier sur LinkedIn',
  'cert.postX': 'Publier sur X',
  'cert.shareFacebook': 'Partager sur Facebook',
  'cert.copyLink': 'Copier le lien',
  'cert.linkCopied': 'Lien copié',
  'cert.copyPrompt': 'Copie le lien du certificat :',
  'cert.anyoneVerify': 'Toute personne qui a le lien peut le vérifier : {link}',

  // ---- course page panel ----
  'cert.panel.title': 'Certificat',
  'cert.panel.ready': 'Tu as terminé toutes les leçons. Ton certificat est prêt.',
  'cert.panel.get': 'Obtiens ton certificat',
  'cert.panel.toGo': {
    one: 'Termine les {total} leçons pour obtenir un certificat à télécharger et à partager. Plus que {count}.',
    other: 'Termine les {total} leçons pour obtenir un certificat à télécharger et à partager. Plus que {count}.',
  },

  // ---- issuing page ----
  'cert.almost': 'Presque fini',
  'cert.almostLead': {
    one: 'Termine les {total} leçons de « {course} » pour obtenir ton certificat. Plus que {count}.',
    other: 'Termine les {total} leçons de « {course} » pour obtenir ton certificat. Plus que {count}.',
  },
  'cert.continueCourse': 'Continuer le cours',
  'cert.finished': 'Tu as terminé « {course} »',
  'cert.needProfile':
    'Les certificats sont délivrés à des profils, pour pouvoir être vérifiés et partagés. Crée un profil gratuit (ta progression te suit) ou connecte-toi, puis reviens ici.',
  'cert.courseComplete': 'Cours terminé',
  'cert.yours': 'Ton certificat pour « {course} »',
  'cert.nameLabel': "Ton nom, tel qu'il doit apparaître sur le certificat",
  'cert.namePlaceholder': 'ex. : Ada Lovelace',
  'cert.issuing': 'Création…',
  'cert.update': 'Mettre à jour le certificat',
  'cert.create': 'Créer mon certificat',
  'cert.hoursNote': "Les heures correspondent à ton temps d'étude actif sur ce cours, et ne sont jamais inférieures à la durée estimée des leçons.",
  'cert.wrongName': "Nom incorrect ? <edit>Modifie-le</edit>. Le lien et l'identifiant restent les mêmes.",

  // ---- public verification page ----
  'cert.loadingPublic': 'Chargement du certificat…',
  'cert.notFound': 'Certificat introuvable',
  'cert.notFoundLead': "Aucun certificat {issuer} ne porte l'identifiant {id}. Vérifie le lien et réessaie.",
  'cert.verified': 'Vérifié : délivré par {issuer} à {name} le {date}.',
  'cert.takeIt': 'Suis le cours « {course} » toi aussi',

  // ---- share card ----
  'cert.card.title': '{name} a terminé « {course} »',
  'cert.card.description': {
    one: "{count} leçon, {hours} d'apprentissage. Délivré par {issuer} le {date}. Certificat n° {id}.",
    other: "{count} leçons, {hours} d'apprentissage. Délivré par {issuer} le {date}. Certificat n° {id}.",
  },
  'cert.card.notFound': 'Certificat introuvable',
  'cert.card.invalid': "Ce lien de certificat {issuer} n'est pas valide.",
  'cert.card.open': 'Ouvrir le certificat',
} satisfies Translation<typeof en>;
