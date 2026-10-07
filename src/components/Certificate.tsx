// Course certificates: earning one (course page), issuing it with your name, and the public page anyone can verify.
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getCourse } from '../content';
import { api, ApiError } from '../lib/api';
import { syncNow, useAuth } from '../lib/auth';
import {
  certificateMinutes,
  checkName,
  formatHours,
  hasEarned,
  ISSUER,
  lessonsLeft,
  pdfFileName,
  shareLinks,
  SITE,
  type CertificateInfo,
} from '../lib/certificate';
import { certificatePdf, issuedDate, type FontName, type Measure } from '../lib/pdf';
import { href } from '../lib/router';
import { useProgress } from '../lib/storage';
import type { Course } from '../types';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { Page } from './Layout';
import { accentStyle } from './ui';
import './Certificate.css';

export interface Certificate extends CertificateInfo {
  courseId: string;
  color: string;
}

/** The site the share links point to: this deployment in production, the current origin in development. */
const site = () => (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? location.origin : SITE);

// ---------- PDF ----------

const SANS = 'Arial, Helvetica, "Liberation Sans", sans-serif';
const SERIF = '"Times New Roman", Times, "Liberation Serif", serif';
const CSS_FONT: Record<FontName, (size: number) => string> = {
  sans: (px) => `${px}px ${SANS}`,
  'sans-bold': (px) => `bold ${px}px ${SANS}`,
  'serif-italic': (px) => `italic ${px}px ${SERIF}`,
  'serif-bold': (px) => `bold ${px}px ${SERIF}`,
};

/** Measures text with Arial / Times New Roman, which share their glyph widths with the PDF's Helvetica / Times. */
function canvasMeasure(): Measure {
  const ctx = document.createElement('canvas').getContext('2d')!;
  return (text, font, size) => {
    ctx.font = CSS_FONT[font](size);
    return ctx.measureText(text).width;
  };
}

function pdfBlob(cert: Certificate) {
  return new Blob([certificatePdf({ ...cert, site: site() }, canvasMeasure())], { type: 'application/pdf' });
}

function download(cert: Certificate) {
  const url = URL.createObjectURL(pdfBlob(cert));
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfFileName(cert.courseTitle);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Opens the PDF in the browser's viewer, where it can be printed. */
function openForPrint(cert: Certificate) {
  const url = URL.createObjectURL(pdfBlob(cert));
  const win = window.open(url, '_blank', 'noopener');
  if (!win) download(cert);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ---------- the certificate itself ----------

/** The certificate drawn in HTML: the same content and layout as the PDF. */
export function CertificateView({ cert }: { cert: Certificate }) {
  return (
    <figure className="cert" style={accentStyle(cert.color)} aria-label={`Certificate of completion: ${cert.name}, ${cert.courseTitle}`}>
      <div className="cert-frame">
        <div className="cert-top">
          <span className="cert-brand">
            <span className="cert-mark" aria-hidden>
              <span />
              <span />
            </span>
            {ISSUER.toUpperCase()}
          </span>
          <span className="cert-id">Certificate ID {cert.id}</span>
        </div>
        <p className="cert-title">Certificate of completion</p>
        <p className="cert-script">This certifies that</p>
        <p className="cert-name">{cert.name}</p>
        <p className="cert-script">has successfully completed the course</p>
        <p className="cert-course">{cert.courseTitle}</p>
        <p className="cert-details">
          {cert.lessons} lessons · {formatHours(cert.minutes)} of learning
        </p>
        <div className="cert-bottom">
          <span>
            <strong>{issuedDate(cert.issuedAt)}</strong>
            <small>Date issued</small>
          </span>
          <span>
            <em>{ISSUER}</em>
            <small>Issuer</small>
          </span>
        </div>
      </div>
    </figure>
  );
}

function CertificateActions({ cert }: { cert: Certificate }) {
  const links = useMemo(() => shareLinks(cert, site()), [cert]);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy the certificate link:', links.url);
    }
  };
  return (
    <div className="cert-actions">
      <div className="row wrap">
        <button className="btn primary big" onClick={() => download(cert)}>
          Download PDF
        </button>
        <button className="btn big" onClick={() => openForPrint(cert)}>
          Print
        </button>
      </div>
      <div className="cert-share">
        <span className="small muted">Share it</span>
        <div className="row wrap">
          <a className="btn share linkedin" href={links.linkedinProfile} target="_blank" rel="noopener noreferrer">
            Add to LinkedIn profile
          </a>
          <a className="btn share linkedin" href={links.linkedin} target="_blank" rel="noopener noreferrer">
            Post on LinkedIn
          </a>
          <a className="btn share x" href={links.x} target="_blank" rel="noopener noreferrer">
            Post on X
          </a>
          <a className="btn share facebook" href={links.facebook} target="_blank" rel="noopener noreferrer">
            Share on Facebook
          </a>
          <button className="btn share" onClick={copy}>
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
        <p className="small muted cert-url">
          Anyone with the link can verify it: <a href={`#/certificate/${cert.id}`}>{links.url.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    </div>
  );
}

// ---------- course page panel ----------

/** On the course page: how far from the certificate, or the button to get it. */
export function CertificatePanel({ course }: { course: Course }) {
  const p = useProgress();
  const left = lessonsLeft(course, p);
  const earned = hasEarned(course, p);
  return (
    <div className={`panel cert-panel${earned ? ' earned' : ''}`}>
      <div className="cert-panel-head">
        <Icon name="medal" size={22} />
        <strong>Certificate</strong>
      </div>
      {earned ? (
        <>
          <p className="small">You finished every lesson. Your certificate is ready.</p>
          <a className="btn primary full" href={href('course', course.id, 'certificate')}>
            Get your certificate
          </a>
        </>
      ) : (
        <p className="small muted">
          Finish all {course.lessons.length} lessons to earn a certificate you can download and share. {left} to go.
        </p>
      )}
    </div>
  );
}

// ---------- issuing ----------

export function CertificatePage({ course }: { course: Course }) {
  const p = useProgress();
  const { user } = useAuth();
  const earned = hasEarned(course, p);
  const minutes = certificateMinutes(course, p);
  const [cert, setCert] = useState<Certificate | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api<{ certificates: Certificate[] }>('/certificates')
      .then(({ certificates }) => {
        const mine = certificates.find((c) => c.courseId === course.id) ?? null;
        setCert(mine);
        if (mine) setName(mine.name);
      })
      .catch(() => setCert(null));
  }, [user, course.id]);

  const check = checkName(name);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (check.problem) {
      setError(check.problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await syncNow();
      const { certificate } = await api<{ certificate: Certificate }>('/certificates', {
        courseId: course.id,
        courseTitle: course.title,
        color: course.color,
        name: check.name,
        minutes,
        lessons: course.lessons.length,
      });
      setCert(certificate);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const back = (
    <a className="back" href={href('course', course.id)}>
      ← {course.title}
    </a>
  );

  if (!earned) {
    return (
      <Page>
        {back}
        <section className="panel center cert-empty">
          <CourseIcon icon={course.icon} color={course.color} size={56} />
          <h1>Almost there</h1>
          <p className="lead">
            Finish all {course.lessons.length} lessons of {course.title} to earn your certificate. {lessonsLeft(course, p)} to go.
          </p>
          <a className="btn primary" href={href('course', course.id)}>
            Continue the course
          </a>
        </section>
      </Page>
    );
  }

  if (user === null) {
    return (
      <Page>
        {back}
        <section className="panel center cert-empty">
          <Icon name="medal" size={56} />
          <h1>You finished {course.title}</h1>
          <p className="lead">
            Certificates are issued to profiles, so they can be verified and shared. Create a free profile (your progress comes with
            you) or sign in, then come back here.
          </p>
          <div className="actions center">
            <a className="btn primary" href="#/signup">
              Create a free profile
            </a>
            <a className="btn" href="#/signin">
              Sign in
            </a>
          </div>
        </section>
      </Page>
    );
  }

  const showForm = cert === null || editing;
  return (
    <Page wide>
      {back}
      <div className="cert-page" style={accentStyle(course.color)}>
        <header className="cert-head">
          <span className="eyebrow">Course complete</span>
          <h1>Your certificate for {course.title}</h1>
          <p className="lead">
            {course.lessons.length} lessons · {formatHours(minutes)} of learning
          </p>
        </header>

        {cert === undefined && <p className="muted">Loading…</p>}

        {showForm && (
          <form className="panel cert-form" onSubmit={submit}>
            <label htmlFor="cert-name">
              <strong>Your name, as it should appear on the certificate</strong>
            </label>
            <input
              id="cert-name"
              value={name}
              maxLength={60}
              autoComplete="name"
              autoFocus
              placeholder="e.g. Ada Lovelace"
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
            {error && <p className="field-error" role="alert">{error}</p>}
            <div className="row wrap">
              <button className="btn primary big" disabled={busy || !name.trim()}>
                {busy ? 'Issuing…' : cert ? 'Update certificate' : 'Create my certificate'}
              </button>
              {cert && (
                <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              )}
            </div>
            <p className="small muted">
              Hours are your active study time on this course, and never less than the lessons' estimated time.
            </p>
          </form>
        )}

        {cert && !editing && (
          <>
            <CertificateView cert={cert} />
            <CertificateActions cert={cert} />
            <p className="small muted">
              Wrong name?{' '}
              <button type="button" className="link-button" onClick={() => setEditing(true)}>
                Edit it
              </button>
              . The link and ID stay the same.
            </p>
          </>
        )}
      </div>
    </Page>
  );
}

// ---------- public verification page ----------

export function PublicCertificate({ id }: { id: string }) {
  const [cert, setCert] = useState<Certificate | null | undefined>(undefined);
  useEffect(() => {
    api<{ certificate: Certificate }>(`/certificates/${encodeURIComponent(id)}`)
      .then(({ certificate }) => setCert(certificate))
      .catch(() => setCert(null));
  }, [id]);

  if (cert === undefined) {
    return (
      <Page>
        <p className="muted">Loading certificate…</p>
      </Page>
    );
  }
  if (cert === null) {
    return (
      <Page>
        <section className="panel center cert-empty">
          <Icon name="compass" size={56} />
          <h1>Certificate not found</h1>
          <p className="lead">There's no {ISSUER} certificate with the ID {id.toUpperCase()}. Check the link and try again.</p>
          <a className="btn primary" href="#/">
            Go home
          </a>
        </section>
      </Page>
    );
  }
  const course = getCourse(cert.courseId);
  return (
    <Page wide>
      <div className="cert-page" style={accentStyle(cert.color)}>
        <p className="cert-verified">
          <Icon name="check" size={18} /> Verified: issued by {ISSUER} to <strong>{cert.name}</strong> on {issuedDate(cert.issuedAt)}.
        </p>
        <CertificateView cert={cert} />
        <div className="row wrap cert-public-actions">
          <button className="btn" onClick={() => download(cert)}>
            Download PDF
          </button>
          {course && (
            <a className="btn primary" href={href('course', course.id)}>
              Take {course.title} yourself
            </a>
          )}
        </div>
      </div>
    </Page>
  );
}
