// English UI strings: email. The confirmation and password-reset emails (server/mail.ts), sent in the language
// the learner was using. {name} is the username.
import type { Message } from '../core.ts';

export default {
  'email.verify.subject': 'Confirm your ProjectLearn email',
  'email.verify.intro': 'Hi {name}! Confirm your email address to activate your profile.',
  'email.verify.button': 'Confirm email',
  'email.verify.outro': "This link expires in 24 hours. If you didn't sign up, you can ignore this email.",
  'email.reset.subject': 'Reset your ProjectLearn password',
  'email.reset.intro': 'Hi {name}, someone (hopefully you) asked to reset your password.',
  'email.reset.button': 'Choose a new password',
  'email.reset.outro': "This link expires in 60 minutes. If you didn't ask for this, ignore this email — your password stays the same.",
} satisfies Record<string, Message>;
