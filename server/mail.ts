import nodemailer from 'nodemailer';
import { translator, type Locale } from '../src/i18n/core.ts';
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

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function send(to: string, locale: Locale, subject: string, intro: string, buttonLabel: string, link: string, outro: string) {
  const text = `${intro}\n\n${buttonLabel}\n${link}\n\n${outro}`;
  const html = `
    <div lang="${locale}" style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1d1d1f">
      <h2 style="margin:0 0 12px">ProjectLearn</h2>
      <p>${esc(intro)}</p>
      <p style="margin:28px 0"><a href="${link}" style="background:#5b5bd6;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${esc(buttonLabel)}</a></p>
      <p style="color:#6b6b70;font-size:14px">${esc(outro)}</p>
      <p style="color:#6b6b70;font-size:12px;word-break:break-all">${link}</p>
    </div>`;

  if (transport) {
    await transport.sendMail({ from: mailFrom, to, subject, text, html });
    return;
  }
  console.log(`\nEmail to ${to}: ${subject}\n   ${link}\n`);
  if (devOutbox) {
    outbox.unshift({ to, subject, text, link, sentAt: Date.now() });
    outbox.length = Math.min(outbox.length, 50);
  }
}

/** Emails are written in the language the learner was using when they asked (src/i18n/<locale>/email.ts). */
export function sendVerifyEmail(to: string, username: string, token: string, locale: Locale = 'en') {
  const t = translator(locale);
  return send(
    to,
    locale,
    t('email.verify.subject'),
    t('email.verify.intro', { name: username }),
    t('email.verify.button'),
    `${appUrl}/#/verify/${token}`,
    t('email.verify.outro'),
  );
}

export function sendResetEmail(to: string, username: string, token: string, locale: Locale = 'en') {
  const t = translator(locale);
  return send(
    to,
    locale,
    t('email.reset.subject'),
    t('email.reset.intro', { name: username }),
    t('email.reset.button'),
    `${appUrl}/#/reset/${token}`,
    t('email.reset.outro'),
  );
}
