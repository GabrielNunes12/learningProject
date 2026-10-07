// French UI strings: email. Mirrors src/i18n/en/email.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/email.ts';

export default {
  'email.verify.subject': 'Confirme ton adresse e-mail ProjectLearn',
  'email.verify.intro': 'Bonjour {name} ! Confirme ton adresse e-mail pour activer ton profil.',
  'email.verify.button': "Confirmer l'adresse",
  'email.verify.outro': "Ce lien expire dans 24 heures. Si tu n'as pas créé de compte, tu peux ignorer cet e-mail.",
  'email.reset.subject': 'Réinitialise ton mot de passe ProjectLearn',
  'email.reset.intro': "Bonjour {name}, quelqu'un (toi, on l'espère) a demandé à réinitialiser ton mot de passe.",
  'email.reset.button': 'Choisir un nouveau mot de passe',
  'email.reset.outro': "Ce lien expire dans 60 minutes. Si tu n'as rien demandé, ignore cet e-mail : ton mot de passe reste inchangé.",
} satisfies Translation<typeof en>;
