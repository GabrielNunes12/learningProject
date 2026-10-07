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
import { certificatePdf, certificateText, issuedDate, type FontName, type Measure } from '../lib/pdf';
import { getLocale } from '../i18n/core';
import { useT } from '../i18n/react';
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
  /** The language it was issued in (the share card uses it); the certificate itself shows the viewer's language. */
  locale?: string;
}

/** The course title in the viewer's language when the course exists here, else the title it was issued with. */
const localized = (cert: Certificate): Certificate => ({ ...cert, courseTitle: getCourse(cert.courseId)?.title ?? cert.courseTitle });

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
  return new Blob([certificatePdf({ ...localized(cert), site: site() }, canvasMeasure(), getLocale())], { type: 'application/pdf' });
}

function download(cert: Certificate) {
  const url = URL.createObjectURL(pdfBlob(cert));
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfFileName(localized(cert).courseTitle);
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
export function CertificateView({ cert: issued }: { cert: Certificate }) {
  const { t, locale } = useT();
  const cert = localized(issued);
  const words = certificateText(cert, locale);
  return (
    <figure className="cert" style={accentStyle(cert.color)} aria-label={t('cert.brandLabel', { name: cert.name, course: cert.courseTitle })}>
      <div className="cert-frame">
        <div className="cert-top">
          <span className="cert-brand">
            <span className="cert-mark" aria-hidden>
              <span />
              <span />
            </span>
            {ISSUER.toUpperCase()}
          </span>
          <span className="cert-id">{words.id}</span>
        </div>
        <p className="cert-title">{words.title}</p>
        <p className="cert-script">{words.certifies}</p>
        <p className="cert-name">{cert.name}</p>
        <p className="cert-script">{words.completed}</p>
        <p className="cert-course">{cert.courseTitle}</p>
        <p className="cert-details">{words.details}</p>
        <div className="cert-bottom">
          <span>
            <strong>{words.date}</strong>
            <small>{words.dateIssued}</small>
          </span>
          <span>
            <em>{ISSUER}</em>
            <small>{words.issuer}</small>
          </span>
        </div>
      </div>
    </figure>
  );
}

function CertificateActions({ cert }: { cert: Certificate }) {
  const { t, tx, locale } = useT();
  const links = useMemo(() => shareLinks(localized(cert), site(), locale), [cert, locale]);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t('cert.copyPrompt'), links.url);
    }
  };
  return (
    <div className="cert-actions">
      <div className="row wrap">
        <button className="btn primary big" onClick={() => download(cert)}>
          {t('cert.download')}
        </button>
        <button className="btn big" onClick={() => openForPrint(cert)}>
          {t('cert.print')}
        </button>
      </div>
      <div className="cert-share">
        <span className="small muted">{t('cert.shareIt')}</span>
        <div className="row wrap">
          <a className="btn share linkedin" href={links.linkedinProfile} target="_blank" rel="noopener noreferrer">
            {t('cert.addLinkedIn')}
          </a>
          <a className="btn share linkedin" href={links.linkedin} target="_blank" rel="noopener noreferrer">
            {t('cert.postLinkedIn')}
          </a>
          <a className="btn share x" href={links.x} target="_blank" rel="noopener noreferrer">
            {t('cert.postX')}
          </a>
          <a className="btn share facebook" href={links.facebook} target="_blank" rel="noopener noreferrer">
            {t('cert.shareFacebook')}
          </a>
          <button className="btn share" onClick={copy}>
            {copied ? t('cert.linkCopied') : t('cert.copyLink')}
          </button>
        </div>
        <p className="small muted cert-url">
          {tx('cert.anyoneVerify', { link: <a href={`#/certificate/${cert.id}`}>{links.url.replace(/^https?:\/\//, '')}</a> })}
        </p>
      </div>
    </div>
  );
}

// ---------- course page panel ----------

/** On the course page: how far from the certificate, or the button to get it. */
export function CertificatePanel({ course }: { course: Course }) {
  const { t } = useT();
  const p = useProgress();
  const left = lessonsLeft(course, p);
  const earned = hasEarned(course, p);
  return (
    <div className={`panel cert-panel${earned ? ' earned' : ''}`}>
      <div className="cert-panel-head">
        <Icon name="medal" size={22} />
        <strong>{t('cert.panel.title')}</strong>
      </div>
      {earned ? (
        <>
          <p className="small">{t('cert.panel.ready')}</p>
          <a className="btn primary full" href={href('course', course.id, 'certificate')}>
            {t('cert.panel.get')}
          </a>
        </>
      ) : (
        <p className="small muted">{t('cert.panel.toGo', { total: course.lessons.length, count: left })}</p>
      )}
    </div>
  );
}

// ---------- issuing ----------

export function CertificatePage({ course }: { course: Course }) {
  const { t, tx } = useT();
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
        locale: getLocale(),
      });
      setCert(certificate);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.somethingWrong'));
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
          <h1>{t('cert.almost')}</h1>
          <p className="lead">{t('cert.almostLead', { total: course.lessons.length, course: course.title, count: lessonsLeft(course, p) })}</p>
          <a className="btn primary" href={href('course', course.id)}>
            {t('cert.continueCourse')}
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
          <h1>{t('cert.finished', { course: course.title })}</h1>
          <p className="lead">{t('cert.needProfile')}</p>
          <div className="actions center">
            <a className="btn primary" href="#/signup">
              {t('common.createProfile')}
            </a>
            <a className="btn" href="#/signin">
              {t('common.signIn')}
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
          <span className="eyebrow">{t('cert.courseComplete')}</span>
          <h1>{t('cert.yours', { course: course.title })}</h1>
          <p className="lead">{t('cert.details', { count: course.lessons.length, hours: formatHours(minutes) })}</p>
        </header>

        {cert === undefined && <p className="muted">{t('common.loading')}</p>}

        {showForm && (
          <form className="panel cert-form" onSubmit={submit}>
            <label htmlFor="cert-name">
              <strong>{t('cert.nameLabel')}</strong>
            </label>
            <input
              id="cert-name"
              value={name}
              maxLength={60}
              autoComplete="name"
              autoFocus
              placeholder={t('cert.namePlaceholder')}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
            {error && <p className="field-error" role="alert">{error}</p>}
            <div className="row wrap">
              <button className="btn primary big" disabled={busy || !name.trim()}>
                {busy ? t('cert.issuing') : cert ? t('cert.update') : t('cert.create')}
              </button>
              {cert && (
                <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </button>
              )}
            </div>
            <p className="small muted">{t('cert.hoursNote')}</p>
          </form>
        )}

        {cert && !editing && (
          <>
            <CertificateView cert={cert} />
            <CertificateActions cert={cert} />
            <p className="small muted">
              {tx(
                'cert.wrongName',
                {},
                {
                  edit: (c) => (
                    <button type="button" className="link-button" onClick={() => setEditing(true)}>
                      {c}
                    </button>
                  ),
                },
              )}
            </p>
          </>
        )}
      </div>
    </Page>
  );
}

// ---------- public verification page ----------

export function PublicCertificate({ id }: { id: string }) {
  const { t, tx, locale } = useT();
  const [cert, setCert] = useState<Certificate | null | undefined>(undefined);
  useEffect(() => {
    api<{ certificate: Certificate }>(`/certificates/${encodeURIComponent(id)}`)
      .then(({ certificate }) => setCert(certificate))
      .catch(() => setCert(null));
  }, [id]);

  if (cert === undefined) {
    return (
      <Page>
        <p className="muted">{t('cert.loadingPublic')}</p>
      </Page>
    );
  }
  if (cert === null) {
    return (
      <Page>
        <section className="panel center cert-empty">
          <Icon name="compass" size={56} />
          <h1>{t('cert.notFound')}</h1>
          <p className="lead">{t('cert.notFoundLead', { issuer: ISSUER, id: id.toUpperCase() })}</p>
          <a className="btn primary" href="#/">
            {t('common.goHome')}
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
          <Icon name="check" size={18} />{' '}
          {tx('cert.verified', { issuer: ISSUER, name: <strong>{cert.name}</strong>, date: issuedDate(cert.issuedAt, locale) })}
        </p>
        <CertificateView cert={cert} />
        <div className="row wrap cert-public-actions">
          <button className="btn" onClick={() => download(cert)}>
            {t('cert.download')}
          </button>
          {course && (
            <a className="btn primary" href={href('course', course.id)}>
              {t('cert.takeIt', { course: course.title })}
            </a>
          )}
        </div>
      </div>
    </Page>
  );
}
