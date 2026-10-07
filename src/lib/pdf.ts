// A small PDF writer for the course certificate: one page, the PDF standard fonts (no font files to embed),
// vector shapes and a link. Pure: text widths come from a `measure` function (the browser measures with
// Arial / Times New Roman, which are metric-compatible with the PDF's Helvetica / Times).
import { ISSUER, formatHours, certificateUrl, type CertificateInfo } from './certificate.ts';
import { formatDate, getLocale, translator, type Locale } from '../i18n/core.ts';

export type FontName = 'sans' | 'sans-bold' | 'serif-italic' | 'serif-bold';
export type Measure = (text: string, font: FontName, size: number) => number;

const PDF_FONTS: Record<FontName, { ref: string; base: string }> = {
  sans: { ref: 'F1', base: 'Helvetica' },
  'sans-bold': { ref: 'F2', base: 'Helvetica-Bold' },
  'serif-italic': { ref: 'F3', base: 'Times-Italic' },
  'serif-bold': { ref: 'F4', base: 'Times-Bold' },
};

/** Rough widths for when no real measurement is available (tests, server): average glyph width per font. */
export const approxMeasure: Measure = (text, font, size) =>
  [...text].length * size * (font === 'sans' ? 0.52 : font === 'sans-bold' ? 0.56 : font === 'serif-italic' ? 0.44 : 0.5);

// ---------- encoding ----------

/** WinAnsiEncoding codes for the characters outside Latin-1 that the standard fonts include. */
const WIN_ANSI: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b,
  'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99,
  'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

/** A PDF string literal in WinAnsi: ASCII as-is (with \ ( ) escaped), other bytes as octal escapes, unknowns as "?". */
export function pdfString(text: string): string {
  let out = '(';
  for (const raw of text.normalize('NFC')) {
    // Narrow / thin no-break spaces (French numbers and dates) become a plain no-break space.
    const ch = raw === '\u202f' || raw === '\u2009' ? '\u00a0' : raw;
    const c = ch.codePointAt(0)!;
    const byte = c >= 0x20 && c <= 0x7e ? c : c >= 0xa0 && c <= 0xff ? c : (WIN_ANSI[ch] ?? 0x3f);
    if (byte === 0x5c || byte === 0x28 || byte === 0x29) out += `\\${String.fromCharCode(byte)}`;
    else if (byte < 0x80) out += String.fromCharCode(byte);
    else out += `\\${byte.toString(8).padStart(3, '0')}`;
  }
  return `${out})`;
}

// ---------- drawing ----------

type RGB = [number, number, number];
const n = (v: number) => (Math.round(v * 100) / 100).toString();
const rgb = ([r, g, b]: RGB) => `${n(r)} ${n(g)} ${n(b)}`;

export function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.36, 0.36, 0.84];
  const v = parseInt(m[1], 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/** Darkens a colour until it reads on white (relative luminance at most 0.35). */
export function readable(c: RGB): RGB {
  const lum = (x: RGB) => 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2];
  let out = c;
  for (let i = 0; i < 12 && lum(out) > 0.35; i++) out = [out[0] * 0.85, out[1] * 0.85, out[2] * 0.85];
  return out;
}

class Page {
  ops: string[] = [];
  links: { rect: [number, number, number, number]; uri: string }[] = [];
  readonly w: number;
  readonly h: number;
  readonly measure: Measure;
  constructor(w: number, h: number, measure: Measure) {
    this.w = w;
    this.h = h;
    this.measure = measure;
  }

  rect(x: number, y: number, w: number, h: number, opts: { fill?: RGB; stroke?: RGB; width?: number }) {
    if (opts.fill) this.ops.push(`${rgb(opts.fill)} rg`);
    if (opts.stroke) this.ops.push(`${rgb(opts.stroke)} RG ${n(opts.width ?? 1)} w`);
    this.ops.push(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re ${opts.fill && opts.stroke ? 'B' : opts.fill ? 'f' : 'S'}`);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: RGB, width = 1) {
    this.ops.push(`${rgb(color)} RG ${n(width)} w ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`);
  }

  width(text: string, font: FontName, size: number, spacing = 0) {
    return this.measure(text, font, size) + spacing * Math.max(0, [...text].length - 1);
  }

  /** Largest size up to `size` at which the text fits in `maxWidth`. */
  fit(text: string, font: FontName, size: number, maxWidth: number, min = 10) {
    let s = size;
    while (s > min && this.width(text, font, s) > maxWidth) s -= 1;
    return s;
  }

  text(text: string, x: number, y: number, font: FontName, size: number, color: RGB, opts: { align?: 'left' | 'center' | 'right'; spacing?: number } = {}) {
    const w = this.width(text, font, size, opts.spacing);
    const left = opts.align === 'center' ? x - w / 2 : opts.align === 'right' ? x - w : x;
    const tc = opts.spacing ? ` ${n(opts.spacing)} Tc` : ' 0 Tc';
    this.ops.push(`BT /${PDF_FONTS[font].ref} ${n(size)} Tf${tc} ${rgb(color)} rg ${n(left)} ${n(y)} Td ${pdfString(text)} Tj ET`);
    return { left, width: w };
  }

  link(x: number, y: number, w: number, h: number, uri: string) {
    this.links.push({ rect: [x, y, x + w, y + h], uri });
  }
}

/** Serialises one page into a complete PDF file (ASCII only, so string length = byte length). */
function writePdf(page: Page, info: Record<string, string>): string {
  const content = page.ops.join('\n');
  const objects: string[] = [];
  const add = (body: string) => objects.push(body);
  const fontNames = Object.values(PDF_FONTS);
  const firstFont = 4;
  const contentObj = firstFont + fontNames.length;
  const firstLink = contentObj + 1;
  const infoObj = firstLink + page.links.length;

  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  const fonts = fontNames.map((f, i) => `/${f.ref} ${firstFont + i} 0 R`).join(' ');
  const annots = page.links.length ? ` /Annots [${page.links.map((_, i) => `${firstLink + i} 0 R`).join(' ')}]` : '';
  add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.w} ${page.h}] /Resources << /Font << ${fonts} >> >> /Contents ${contentObj} 0 R${annots} >>`);
  for (const f of fontNames) add(`<< /Type /Font /Subtype /Type1 /BaseFont /${f.base} /Encoding /WinAnsiEncoding >>`);
  add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  for (const l of page.links) add(`<< /Type /Annot /Subtype /Link /Rect [${l.rect.map(n).join(' ')}] /Border [0 0 0] /A << /S /URI /URI ${pdfString(l.uri)} >> >>`);
  add(`<< ${Object.entries(info).map(([k, v]) => `/${k} ${pdfString(v)}`).join(' ')} >>`);

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${infoObj} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

const pdfDate = (t: number) => {
  const d = new Date(t);
  const p = (v: number) => String(v).padStart(2, '0');
  return `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
};

/** "October 7, 2026" / "7 de outubro de 2026" / "7 de octubre de 2026" / "7 octobre 2026". */
export const issuedDate = (t: number, locale: Locale = getLocale()) => formatDate(t, { year: 'numeric', month: 'long', day: 'numeric' }, locale);

// ---------- the certificate ----------

export interface CertificateDesign extends CertificateInfo {
  /** Course accent colour, "#rrggbb". */
  color: string;
  site?: string;
}

/** The certificate's own words in one language (shared by the PDF and the HTML view). */
export function certificateText(cert: CertificateInfo, locale: Locale = getLocale()) {
  const t = translator(locale);
  return {
    id: t('cert.id', { id: cert.id }),
    title: t('cert.title'),
    certifies: t('cert.certifies'),
    completed: t('cert.completed'),
    details: t('cert.details', { count: cert.lessons, hours: formatHours(cert.minutes, locale) }),
    date: issuedDate(cert.issuedAt, locale),
    dateIssued: t('cert.dateIssued'),
    issuer: t('cert.issuer'),
  };
}

/** Builds the certificate as a landscape A4 PDF and returns the file's text (ASCII). */
export function certificatePdf(cert: CertificateDesign, measure: Measure = approxMeasure, locale: Locale = getLocale()): string {
  const t = translator(locale);
  const words = certificateText(cert, locale);
  const W = 842;
  const H = 595;
  const page = new Page(W, H, measure);
  const accent = readable(hexToRgb(cert.color));
  const ink: RGB = [0.11, 0.11, 0.13];
  const grey: RGB = [0.42, 0.42, 0.46];
  const rule: RGB = [0.78, 0.77, 0.74];
  const cx = W / 2;
  const url = certificateUrl(cert.id, cert.site);

  // Paper and frames.
  page.rect(0, 0, W, H, { fill: [0.995, 0.99, 0.975] });
  page.rect(22, 22, W - 44, H - 44, { stroke: accent, width: 2.5 });
  page.rect(31, 31, W - 62, H - 62, { stroke: rule, width: 0.75 });
  for (const [x, y] of [[31, 31], [W - 31, 31], [31, H - 31], [W - 31, H - 31]] as const) {
    page.rect(x - 4, y - 4, 8, 8, { fill: accent });
  }

  // Brand: the 80/20 mark and the name.
  page.rect(64, H - 78, 22, 20, { fill: accent });
  page.rect(89, H - 78, 6, 20, { fill: [accent[0] * 0.55 + 0.45, accent[1] * 0.55 + 0.45, accent[2] * 0.55 + 0.45] });
  page.text(ISSUER.toUpperCase(), 104, H - 73, 'sans-bold', 11, ink, { spacing: 2 });
  page.text(words.id, W - 64, H - 73, 'sans', 8.5, grey, { align: 'right' });

  // Title.
  const title = words.title.toLocaleUpperCase(locale);
  page.text(title, cx, H - 150, 'sans-bold', page.fit(title, 'sans-bold', 16, 700, 11), ink, { align: 'center', spacing: 3.2 });
  page.line(cx - 34, H - 166, cx + 34, H - 166, accent, 2);

  // Who and what.
  page.text(words.certifies, cx, H - 210, 'serif-italic', 16, grey, { align: 'center' });
  const nameSize = page.fit(cert.name, 'serif-bold', 42, 620, 22);
  page.text(cert.name, cx, H - 262, 'serif-bold', nameSize, ink, { align: 'center' });
  page.line(cx - 230, H - 278, cx + 230, H - 278, rule, 0.75);
  page.text(words.completed, cx, H - 312, 'serif-italic', 16, grey, { align: 'center' });
  const courseSize = page.fit(cert.courseTitle, 'sans-bold', 28, 660, 14);
  page.text(cert.courseTitle, cx, H - 356, 'sans-bold', courseSize, accent, { align: 'center' });
  page.text(words.details, cx, H - 388, 'sans', 13, grey, { align: 'center' });

  // Date and issuer.
  const date = words.date;
  page.line(110, 132, 300, 132, rule, 0.75);
  page.text(date, 205, 142, 'sans-bold', 12, ink, { align: 'center' });
  page.text(words.dateIssued, 205, 118, 'sans', 9, grey, { align: 'center' });
  page.line(W - 300, 132, W - 110, 132, rule, 0.75);
  page.text(ISSUER, W - 205, 140, 'serif-italic', 20, accent, { align: 'center' });
  page.text(words.issuer, W - 205, 118, 'sans', 9, grey, { align: 'center' });

  // Verification link (clickable).
  const verify = t('cert.verifyAt', { url: url.replace(/^https?:\/\//, '') });
  const v = page.text(verify, cx, 56, 'sans', 9, grey, { align: 'center' });
  page.link(v.left, 52, v.width, 13, url);

  return writePdf(page, {
    Title: t('cert.pdfTitle', { course: cert.courseTitle }),
    Author: ISSUER,
    Subject: t('cert.pdfSubject', { name: cert.name, course: cert.courseTitle }),
    Creator: `${ISSUER} (${url})`,
    CreationDate: pdfDate(cert.issuedAt),
  });
}
