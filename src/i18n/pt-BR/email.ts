// Brazilian Portuguese UI strings: email. Mirrors src/i18n/en/email.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/email.ts';

export default {
  'email.verify.subject': 'Confirme seu e-mail no ProjectLearn',
  'email.verify.intro': 'Olá, {name}! Confirme seu endereço de e-mail para ativar seu perfil.',
  'email.verify.button': 'Confirmar e-mail',
  'email.verify.outro': 'Este link expira em 24 horas. Se você não criou uma conta, pode ignorar este e-mail.',
  'email.reset.subject': 'Redefina sua senha do ProjectLearn',
  'email.reset.intro': 'Olá, {name}. Alguém (esperamos que você) pediu para redefinir sua senha.',
  'email.reset.button': 'Escolher uma nova senha',
  'email.reset.outro': 'Este link expira em 60 minutos. Se não foi você que pediu, ignore este e-mail — sua senha continua a mesma.',
} satisfies Translation<typeof en>;
