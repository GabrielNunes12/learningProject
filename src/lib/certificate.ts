// Course certificates: who has earned one, the hours on it, the name rules and the share links. Pure.
import type { Course } from '../types.ts';

/** The part of a learner's progress certificates need (kept structural so the server can use this file too). */
export interface CourseProgress {
  completed: Record<string, number>;
  studyMs?: Record<string, number>;
}

export const SITE = 'https://learning.mentor-hub.space';
export const ISSUER = 'ProjectLearn';
/** Fallback length of a lesson without its own estimate (matches lib/stats.ts). */
const LESSON_MINUTES = 5;

/** A course is finished when every one of its lessons is completed. */
export function lessonsLeft(course: Course, p: Pick<CourseProgress, 'completed'>): number {
  return course.lessons.filter((l) => !p.completed[`${course.id}/${l.id}`]).length;
}
export const hasEarned = (course: Course, p: Pick<CourseProgress, 'completed'>) => course.lessons.length > 0 && lessonsLeft(course, p) === 0;

/**
 * Minutes of learning on the certificate: the tracked active time, but never less than the estimated time
 * of the lessons completed (time spent before tracking existed, or on another device, still counts).
 */
export function certificateMinutes(course: Course, p: CourseProgress): number {
  const tracked = Math.round((p.studyMs?.[course.id] ?? 0) / 60_000);
  const estimated = course.lessons.filter((l) => p.completed[`${course.id}/${l.id}`]).reduce((s, l) => s + (l.minutes ?? LESSON_MINUTES), 0);
  return Math.max(tracked, estimated);
}

/** "45 minutes", "1 hour", "2.5 hours" (to the nearest half hour from one hour up). */
export function formatHours(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} minute${Math.round(minutes) === 1 ? '' : 's'}`;
  const h = Math.round(minutes / 30) / 2;
  return `${h % 1 ? h.toFixed(1) : h} hour${h === 1 ? '' : 's'}`;
}

// ---------- the name on the certificate ----------

/** Characters beyond Latin-1 that the PDF's built-in fonts (WinAnsiEncoding) can still draw. */
const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
export const canPrint = (ch: string) => {
  const c = ch.codePointAt(0)!;
  return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WIN_ANSI_EXTRA.includes(ch);
};

/** Tidies a name (collapses spaces) and says what's wrong with it, if anything. */
export function checkName(raw: string): { name: string; problem: string | null } {
  const name = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (name.length < 2) return { name, problem: 'Enter your name as it should appear on the certificate.' };
  if (name.length > 60) return { name, problem: 'Keep the name to 60 characters or fewer.' };
  if (!/\p{L}/u.test(name)) return { name, problem: 'The name needs at least one letter.' };
  const bad = [...new Set([...name].filter((ch) => !canPrint(ch)))];
  if (bad.length) {
    return { name, problem: `The certificate font can't print “${bad.join('')}”. Use Latin letters (accents like é, ñ, ü are fine).` };
  }
  return { name, problem: null };
}

// ---------- sharing ----------

export interface CertificateInfo {
  id: string;
  name: string;
  courseTitle: string;
  minutes: number;
  lessons: number;
  issuedAt: number;
}

/** Public page for a certificate: a share card for social networks that opens the verification page. */
export const certificateUrl = (id: string, site = SITE) => `${site}/c/${id}`;

export function shareLinks(cert: CertificateInfo, site = SITE) {
  const url = certificateUrl(cert.id, site);
  const text = `I just completed “${cert.courseTitle}” on ${ISSUER}: ${cert.lessons} lessons, ${formatHours(cert.minutes)} of learning.`;
  const issued = new Date(cert.issuedAt);
  const q = (o: Record<string, string | number>) => new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)])).toString();
  return {
    url,
    text,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?${q({ url })}`,
    /** Adds it to the "Licenses & certifications" section of the LinkedIn profile. */
    linkedinProfile: `https://www.linkedin.com/profile/add?${q({
      startTask: 'CERTIFICATION_NAME',
      name: cert.courseTitle,
      organizationName: ISSUER,
      issueYear: issued.getFullYear(),
      issueMonth: issued.getMonth() + 1,
      certUrl: url,
      certId: cert.id,
    })}`,
    x: `https://x.com/intent/post?${q({ text, url })}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?${q({ u: url })}`,
  };
}

/** File name for the downloaded PDF, e.g. "ProjectLearn-Big-O-Thinking-certificate.pdf". */
export function pdfFileName(courseTitle: string): string {
  const slug = courseTitle
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${ISSUER}-${slug || 'course'}-certificate.pdf`;
}
