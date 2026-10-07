// English UI strings: auth. Sign up, sign in, email confirmation, password reset and the dev mailbox
// (src/components/Auth.tsx). English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  // Shared field labels and messages.
  'auth.username': 'Username',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm password',
  'auth.newPassword': 'New password',
  'auth.confirmNewPassword': 'Confirm new password',
  'auth.updatePassword': 'Update password',
  'auth.passwordTooShort': 'At least 8 characters.',
  'auth.passwordsDontMatch': "Passwords don't match.",
  'auth.somethingWrong': 'Something went wrong.',
  'auth.backToSignIn': 'Back to sign in',
  // Shown only in development. <link>…</link> becomes a link to the dev mailbox page.
  'auth.devMailboxHint': 'Development mode: no email server is configured, so emails go to the <link>dev mailbox</link>.',

  // Password strength meter under the password field, from weakest to strongest (one or two words).
  'auth.strength.tooShort': 'Too short',
  'auth.strength.weak': 'Weak',
  'auth.strength.okay': 'Okay',
  'auth.strength.good': 'Good',
  'auth.strength.strong': 'Strong',

  // Sign up.
  'auth.signUp.title': 'Create your profile',
  'auth.signUp.subtitle': 'Save your progress, streak and reviews across devices.',
  // <link>…</link> links to the sign-in page.
  'auth.signUp.footer': 'Already have a profile? <link>Sign in</link>',
  'auth.signUp.usernameHelp': 'Shown on your profile. Letters, numbers and _.',
  'auth.signUp.usernameInvalid': '3–20 letters, numbers or underscores.',
  'auth.signUp.emailHelp': "We'll send a link to confirm it.",
  'auth.signUp.emailInvalid': 'Please enter a valid email address.',
  'auth.signUp.passwordHelp': 'At least 8 characters. A short phrase is easier to remember.',
  'auth.signUp.creating': 'Creating…',
  'auth.signUp.submit': 'Create profile',

  // "Check your email" page after sign up. {email} is the address the link was sent to.
  'auth.checkEmail.title': 'Check your email',
  'auth.checkEmail.subtitle': 'We sent a confirmation link to {email}. Click it to activate your profile.',
  'auth.checkEmail.spam': "Can't find it? Check your spam folder. The link expires in 24 hours.",
  'auth.checkEmail.resent': 'If that address needs confirming, a new link is on its way.',
  'auth.checkEmail.resend': 'Resend email',
  // Button label during the cooldown; {seconds} counts down from 60.
  'auth.checkEmail.resendIn': 'Resend in {seconds}s',

  // Sign in.
  'auth.signIn.title': 'Welcome back',
  'auth.signIn.subtitle': 'Sign in to continue where you left off.',
  // <link>…</link> links to the sign-up page.
  'auth.signIn.footer': 'New here? <link>Create a profile</link>',
  // Developer-facing: "npm run dev" is a command, keep it as is.
  'auth.signIn.serverDown': "The server isn't reachable. Start it with npm run dev.",
  'auth.signIn.login': 'Username or email',
  'auth.signIn.forgot': 'Forgot password?',
  'auth.signIn.signingIn': 'Signing in…',
  // Sign-in attempt with an unconfirmed email. {email} is the address.
  'auth.unverified.message': 'Please confirm your email first — we sent a link to {email}.',
  'auth.unverified.resent': 'A new link is on its way.',
  'auth.unverified.resend': 'Resend link',

  // Email confirmation link landing page.
  'auth.verify.working': 'Confirming your email…',
  'auth.verify.failedTitle': "Link didn't work",
  'auth.verify.failedHelp': 'Sign in to get a fresh confirmation link.',
  'auth.verify.goToSignIn': 'Go to sign in',
  'auth.verify.doneTitle': 'Email confirmed',
  'auth.verify.doneSubtitle': "Your profile is active and you're signed in. Your progress now syncs across devices.",
  'auth.verify.startLearning': 'Start learning',

  // Forgot password.
  'auth.forgot.title': 'Reset your password',
  'auth.forgot.subtitle': "Enter your email and we'll send you a link to choose a new password.",
  // {email} is the address the learner typed.
  'auth.forgot.sent': 'If an account exists for {email}, a reset link is on its way. It expires in 60 minutes.',
  'auth.forgot.submit': 'Send reset link',

  // Reset password (from the emailed link).
  'auth.reset.title': 'Choose a new password',
  'auth.reset.doneTitle': 'Password updated',
  'auth.reset.doneSubtitle': 'You can now sign in with your new password.',

  // Development-only page listing emails the server would have sent. SMTP and .env are technical terms.
  'auth.devMailbox.title': 'Dev mailbox',
  'auth.devMailbox.subtitle': 'Emails the server would have sent. Configure SMTP in .env to send real emails.',
  'auth.devMailbox.unavailable': 'The dev mailbox is only available in development without SMTP configured.',
  'auth.devMailbox.empty': 'No emails yet.',
  // {to} is the recipient address, {time} the time it was sent.
  'auth.devMailbox.meta': 'to {to} · {time}',
  'auth.devMailbox.confirm': 'Confirm email',
  'auth.devMailbox.refresh': 'Refresh',
} satisfies Record<string, Message>;
