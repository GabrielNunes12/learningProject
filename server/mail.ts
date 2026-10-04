import nodemailer from 'nodemailer';
import { appUrl, devOutbox, mailFrom, smtp } from './config.ts';

export interface OutboxMail {
  to: string;
  subject: string;
  text: string;
  link: string;
  sentAt: number;
}

/** Development-only inbox (no SMTP configured). Newest first. */
export const outbox: OutboxMail[] = [];

const transport = smtp ? nodemailer.createTransport(smtp) : null;

async function send(to: string, subject: string, intro: string, buttonLabel: string, link: string, outro: string) {
  const text = `${intro}\n\n${buttonLabel}: ${link}\n\n${outro}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1d1d1f">
      <h2 style="margin:0 0 12px">🧠 ProjectLearn</h2>
      <p>${intro}</p>
      <p style="margin:28px 0"><a href="${link}" style="background:#5b5bd6;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${buttonLabel}</a></p>
      <p style="color:#6b6b70;font-size:14px">${outro}</p>
      <p style="color:#6b6b70;font-size:12px;word-break:break-all">${link}</p>
    </div>`;

  if (transport) {
    await transport.sendMail({ from: mailFrom, to, subject, text, html });
    return;
  }
  console.log(`\n✉️  Email to ${to}: ${subject}\n   ${link}\n`);
  if (devOutbox) {
    outbox.unshift({ to, subject, text, link, sentAt: Date.now() });
    outbox.length = Math.min(outbox.length, 50);
  }
}

export const sendVerifyEmail = (to: string, username: string, token: string) =>
  send(
    to,
    'Confirm your ProjectLearn email',
    `Hi ${username}! Confirm your email address to activate your profile.`,
    'Confirm email',
    `${appUrl}/#/verify/${token}`,
    "This link expires in 24 hours. If you didn't sign up, you can ignore this email.",
  );

export const sendResetEmail = (to: string, username: string, token: string) =>
  send(
    to,
    'Reset your ProjectLearn password',
    `Hi ${username}, someone (hopefully you) asked to reset your password.`,
    'Choose a new password',
    `${appUrl}/#/reset/${token}`,
    "This link expires in 60 minutes. If you didn't ask for this, ignore this email — your password stays the same.",
  );
