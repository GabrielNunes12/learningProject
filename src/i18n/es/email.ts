// Spanish UI strings: email. Mirrors src/i18n/en/email.ts (see docs/TRANSLATING.md).
import type { Translation } from '../core.ts';
import type en from '../en/email.ts';

export default {
  'email.verify.subject': 'Confirma tu correo de ProjectLearn',
  'email.verify.intro': '¡Hola, {name}! Confirma tu dirección de correo para activar tu perfil.',
  'email.verify.button': 'Confirmar correo',
  'email.verify.outro': 'Este enlace caduca en 24 horas. Si no te registraste, puedes ignorar este correo.',
  'email.reset.subject': 'Restablece tu contraseña de ProjectLearn',
  'email.reset.intro': 'Hola, {name}: alguien (esperamos que tú) pidió restablecer tu contraseña.',
  'email.reset.button': 'Elegir una contraseña nueva',
  'email.reset.outro': 'Este enlace caduca en 60 minutos. Si no lo pediste, ignora este correo: tu contraseña no cambiará.',
} satisfies Translation<typeof en>;
