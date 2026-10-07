// English UI strings: cert. Certificates: the certificate itself (HTML and PDF, src/lib/pdf.ts), the pages
// around it (src/components/Certificate.tsx), name checks and share text (src/lib/certificate.ts), and the
// share card the server renders for /c/<id> (server/app.ts).
import type { Message } from '../core.ts';

export default {
  // Duration on the certificate: under an hour in minutes, else hours to the nearest half hour ({count} may be 1.5).
  'cert.minutes': { one: '{count} minute', other: '{count} minutes' },
  'cert.hours': { one: '{count} hour', other: '{count} hours' },

  // ---- the certificate (same text in the HTML view and the PDF) ----
  'cert.brandLabel': 'Certificate of completion: {name}, {course}',
  'cert.id': 'Certificate ID {id}',
  'cert.title': 'Certificate of completion',
  'cert.certifies': 'This certifies that',
  'cert.completed': 'has successfully completed the course',
  // {hours} is a duration like "2.5 hours".
  'cert.details': { one: '{count} lesson · {hours} of learning', other: '{count} lessons · {hours} of learning' },
  'cert.dateIssued': 'Date issued',
  'cert.issuer': 'Issuer',
  'cert.verifyAt': 'Verify at {url}',
  // PDF document properties.
  'cert.pdfTitle': '{course}: certificate of completion',
  'cert.pdfSubject': '{name} completed {course}',

  // ---- the name ----
  'cert.name.empty': 'Enter your name as it should appear on the certificate.',
  'cert.name.long': 'Keep the name to 60 characters or fewer.',
  'cert.name.letter': 'The name needs at least one letter.',
  // {chars} are the characters that can't be printed, e.g. “ć”.
  'cert.name.chars': "The certificate font can't print “{chars}”. Use Latin letters (accents like é, ñ, ü are fine).",

  // ---- sharing ----
  'cert.shareText': {
    one: 'I just completed “{course}” on {issuer}: {count} lesson, {hours} of learning.',
    other: 'I just completed “{course}” on {issuer}: {count} lessons, {hours} of learning.',
  },
  'cert.download': 'Download PDF',
  'cert.print': 'Print',
  'cert.shareIt': 'Share it',
  'cert.addLinkedIn': 'Add to LinkedIn profile',
  'cert.postLinkedIn': 'Post on LinkedIn',
  'cert.postX': 'Post on X',
  'cert.shareFacebook': 'Share on Facebook',
  'cert.copyLink': 'Copy link',
  'cert.linkCopied': 'Link copied',
  'cert.copyPrompt': 'Copy the certificate link:',
  'cert.anyoneVerify': 'Anyone with the link can verify it: {link}',

  // ---- course page panel ----
  'cert.panel.title': 'Certificate',
  'cert.panel.ready': 'You finished every lesson. Your certificate is ready.',
  'cert.panel.get': 'Get your certificate',
  'cert.panel.toGo': {
    one: 'Finish all {total} lessons to earn a certificate you can download and share. {count} to go.',
    other: 'Finish all {total} lessons to earn a certificate you can download and share. {count} to go.',
  },

  // ---- issuing page ----
  'cert.almost': 'Almost there',
  'cert.almostLead': {
    one: 'Finish all {total} lessons of {course} to earn your certificate. {count} to go.',
    other: 'Finish all {total} lessons of {course} to earn your certificate. {count} to go.',
  },
  'cert.continueCourse': 'Continue the course',
  'cert.finished': 'You finished {course}',
  'cert.needProfile':
    'Certificates are issued to profiles, so they can be verified and shared. Create a free profile (your progress comes with you) or sign in, then come back here.',
  'cert.courseComplete': 'Course complete',
  'cert.yours': 'Your certificate for {course}',
  'cert.nameLabel': 'Your name, as it should appear on the certificate',
  'cert.namePlaceholder': 'e.g. Ada Lovelace',
  'cert.issuing': 'Issuing…',
  'cert.update': 'Update certificate',
  'cert.create': 'Create my certificate',
  'cert.hoursNote': "Hours are your active study time on this course, and never less than the lessons' estimated time.",
  'cert.wrongName': 'Wrong name? <edit>Edit it</edit>. The link and ID stay the same.',

  // ---- public verification page ----
  'cert.loadingPublic': 'Loading certificate…',
  'cert.notFound': 'Certificate not found',
  'cert.notFoundLead': "There's no {issuer} certificate with the ID {id}. Check the link and try again.",
  'cert.verified': 'Verified: issued by {issuer} to {name} on {date}.',
  'cert.takeIt': 'Take {course} yourself',

  // ---- share card (/c/<id>, rendered by the server in the certificate's language) ----
  'cert.card.title': '{name} completed “{course}”',
  'cert.card.description': {
    one: '{count} lesson, {hours} of learning. Issued by {issuer} on {date}. Certificate ID {id}.',
    other: '{count} lessons, {hours} of learning. Issued by {issuer} on {date}. Certificate ID {id}.',
  },
  'cert.card.notFound': 'Certificate not found',
  'cert.card.invalid': 'This {issuer} certificate link is not valid.',
  'cert.card.open': 'Open the certificate',
} satisfies Record<string, Message>;
