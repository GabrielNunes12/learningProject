import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';
import { completeVerification, signIn, useAuth } from '../lib/auth';
import { href } from '../lib/router';
import { Field, Notice } from './ui';
import { BrandMark } from './icons';
import { Icon } from './icons';
import { getLocale, tMaybe, type MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';

function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="auth-page">
      <a className="brand auth-brand" href="#/">
        <span className="brand-mark" aria-hidden>
          <BrandMark />
        </span>
        <span className="brand-name">ProjectLearn</span>
      </a>
      <main className="auth-card">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
      </main>
      {footer && <p className="auth-footer">{footer}</p>}
    </div>
  );
}

function DevMailboxHint() {
  const { tx } = useT();
  return import.meta.env.DEV ? <Notice>{tx('auth.devMailboxHint', {}, { link: (c) => <a href="#/dev/mailbox">{c}</a> })}</Notice> : null;
}

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}
const STRENGTH: MessageKey[] = ['auth.strength.tooShort', 'auth.strength.weak', 'auth.strength.okay', 'auth.strength.good', 'auth.strength.strong'];

/** Errors are kept as message keys (client checks) or as already-translated server text, and shown in the current language. */
const showError = (e: string | undefined) => (e ? tMaybe(e, e) : e);

function useResend(email: string) {
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const resend = async () => {
    await api('/auth/resend', { email, locale: getLocale() }).catch(() => {});
    setSent(true);
    setCooldown(60);
  };
  return { resend, cooldown, sent };
}

export function SignUp() {
  const { t, tx } = useT();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(form.password);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) errs.username = 'auth.signUp.usernameInvalid';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'auth.signUp.emailInvalid';
    if (form.password.length < 8) errs.password = 'auth.passwordTooShort';
    if (form.confirm !== form.password) errs.confirm = 'auth.passwordsDontMatch';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await api('/auth/register', { username: form.username, email: form.email, password: form.password, locale: getLocale() });
      window.location.hash = href('check-email', form.email.trim().toLowerCase());
    } catch (err) {
      if (err instanceof ApiError && err.code && ['username', 'email', 'password'].includes(err.code)) setErrors({ [err.code]: err.message });
      else setErrors({ form: err instanceof Error ? err.message : 'auth.somethingWrong' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={t('auth.signUp.title')}
      subtitle={t('auth.signUp.subtitle')}
      footer={tx('auth.signUp.footer', {}, { link: (c) => <a href="#/signin">{c}</a> })}
    >
      <form className="stack" onSubmit={submit} noValidate>
        <Field label={t('auth.username')} name="username" autoComplete="username" value={form.username} onChange={set('username')} error={showError(errors.username)} help={t('auth.signUp.usernameHelp')} autoFocus />
        <Field label={t('auth.email')} name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={showError(errors.email)} help={t('auth.signUp.emailHelp')} />
        <Field
          label={t('auth.password')}
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={showError(errors.password)}
          help={
            form.password ? (
              <span className="strength">
                <span className={`strength-bar s${strength}`}>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                {t(STRENGTH[strength])}
              </span>
            ) : (
              t('auth.signUp.passwordHelp')
            )
          }
        />
        <Field label={t('auth.confirmPassword')} name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={showError(errors.confirm)} />
        {errors.form && <Notice tone="bad">{showError(errors.form)}</Notice>}
        <button className="btn primary big full" disabled={busy}>
          {busy ? t('auth.signUp.creating') : t('auth.signUp.submit')}
        </button>
      </form>
    </AuthCard>
  );
}

export function CheckEmail({ email }: { email: string }) {
  const { t, tx } = useT();
  const { resend, cooldown, sent } = useResend(email);
  return (
    <AuthCard title={t('auth.checkEmail.title')} subtitle={tx('auth.checkEmail.subtitle', { email: <strong>{email}</strong> })}>
      <div className="mail-art" aria-hidden>
        <Icon name="mail" size={56} />
      </div>
      <DevMailboxHint />
      <p className="muted small">{t('auth.checkEmail.spam')}</p>
      {sent && <Notice tone="good">{t('auth.checkEmail.resent')}</Notice>}
      <button className="btn full" onClick={resend} disabled={cooldown > 0}>
        {cooldown > 0 ? t('auth.checkEmail.resendIn', { seconds: cooldown }) : t('auth.checkEmail.resend')}
      </button>
      <p className="center small">
        <a href="#/signin">{t('auth.backToSignIn')}</a>
      </p>
    </AuthCard>
  );
}

export function SignIn() {
  const { t, tx } = useT();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { serverAvailable } = useAuth();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setUnverified(null);
    try {
      await signIn(login.trim(), password);
      window.location.hash = '#/';
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') setUnverified(String(err.data.email ?? ''));
      else setError(err instanceof Error ? err.message : 'auth.somethingWrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={t('auth.signIn.title')}
      subtitle={t('auth.signIn.subtitle')}
      footer={tx('auth.signIn.footer', {}, { link: (c) => <a href="#/signup">{c}</a> })}
    >
      {!serverAvailable && <Notice tone="bad">{t('auth.signIn.serverDown')}</Notice>}
      <form className="stack" onSubmit={submit}>
        <Field label={t('auth.signIn.login')} name="login" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required autoFocus />
        <Field label={t('auth.password')} name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <a className="small forgot" href="#/forgot">
          {t('auth.signIn.forgot')}
        </a>
        {error && <Notice tone="bad">{showError(error)}</Notice>}
        {unverified !== null && <UnverifiedNotice email={unverified} />}
        <button className="btn primary big full" disabled={busy}>
          {busy ? t('auth.signIn.signingIn') : t('common.signIn')}
        </button>
      </form>
    </AuthCard>
  );
}

function UnverifiedNotice({ email }: { email: string }) {
  const { t, tx } = useT();
  const { resend, cooldown, sent } = useResend(email);
  return (
    <Notice tone="bad">
      {tx('auth.unverified.message', { email: <strong>{email}</strong> })}{' '}
      {sent ? (
        t('auth.unverified.resent')
      ) : (
        <button type="button" className="link" onClick={resend} disabled={cooldown > 0}>
          {t('auth.unverified.resend')}
        </button>
      )}
    </Notice>
  );
}

export function Verify({ token }: { token: string }) {
  const { t } = useT();
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice; the token only works once.
    started.current = true;
    completeVerification(token)
      .then(() => setState('done'))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'auth.somethingWrong');
        setState('error');
      });
  }, [token]);

  if (state === 'working') return <AuthCard title={t('auth.verify.working')} />;
  if (state === 'error')
    return (
      <AuthCard title={t('auth.verify.failedTitle')} subtitle={showError(error)}>
        <p className="muted small">{t('auth.verify.failedHelp')}</p>
        <a className="btn primary full" href="#/signin">
          {t('auth.verify.goToSignIn')}
        </a>
      </AuthCard>
    );
  return (
    <AuthCard title={t('auth.verify.doneTitle')} subtitle={t('auth.verify.doneSubtitle')}>
      <a className="btn primary big full" href="#/">
        {t('auth.verify.startLearning')}
      </a>
    </AuthCard>
  );
}

export function Forgot() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  return (
    <AuthCard title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')}>
      {sent ? (
        <>
          <Notice tone="good">{t('auth.forgot.sent', { email })}</Notice>
          <DevMailboxHint />
          <a className="btn full" href="#/signin">
            {t('auth.backToSignIn')}
          </a>
        </>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await api('/auth/forgot', { email: email.trim(), locale: getLocale() });
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'auth.somethingWrong');
            }
          }}
        >
          <Field label={t('auth.email')} type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          {error && <Notice tone="bad">{showError(error)}</Notice>}
          <button className="btn primary big full">{t('auth.forgot.submit')}</button>
          <p className="center small">
            <a href="#/signin">{t('auth.backToSignIn')}</a>
          </p>
        </form>
      )}
    </AuthCard>
  );
}

export function Reset({ token }: { token: string }) {
  const { t } = useT();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (done)
    return (
      <AuthCard title={t('auth.reset.doneTitle')} subtitle={t('auth.reset.doneSubtitle')}>
        <a className="btn primary big full" href="#/signin">
          {t('common.signIn')}
        </a>
      </AuthCard>
    );

  return (
    <AuthCard title={t('auth.reset.title')}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (password !== confirm) return setError('auth.passwordsDontMatch');
          setError('');
          try {
            await api('/auth/reset', { token, password });
            setDone(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'auth.somethingWrong');
          }
        }}
      >
        <Field label={t('auth.newPassword')} type="password" name="new-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoFocus help={t('auth.passwordTooShort')} />
        <Field label={t('auth.confirmNewPassword')} type="password" name="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        {error && <Notice tone="bad">{showError(error)}</Notice>}
        <button className="btn primary big full">{t('auth.updatePassword')}</button>
      </form>
    </AuthCard>
  );
}

interface Mail {
  to: string;
  subject: string;
  text: string;
  link: string;
  sentAt: number;
}

/** Development-only: shows emails the server would have sent. */
export function DevMailbox() {
  const { t, date } = useT();
  const [mails, setMails] = useState<Mail[] | null>(null);
  const [error, setError] = useState('');
  const load = () =>
    api<{ mails: Mail[] }>('/dev/outbox')
      .then((r) => setMails(r.mails))
      .catch(() => setError('auth.devMailbox.unavailable'));
  useEffect(() => {
    load();
  }, []);

  return (
    <AuthCard title={t('auth.devMailbox.title')} subtitle={t('auth.devMailbox.subtitle')}>
      {error && <Notice tone="bad">{showError(error)}</Notice>}
      {mails && mails.length === 0 && <p className="muted">{t('auth.devMailbox.empty')}</p>}
      <div className="stack">
        {mails?.map((m, i) => (
          <article key={i} className="mail">
            <div className="mail-meta">
              <strong>{m.subject}</strong>
              <span className="muted small">
                {t('auth.devMailbox.meta', { to: m.to, time: date(m.sentAt, { hour: 'numeric', minute: '2-digit', second: '2-digit' }) })}
              </span>
            </div>
            <p className="small">{m.text.split('\n')[0]}</p>
            <a className="btn primary small" href={m.link.slice(m.link.indexOf('#'))}>
              {m.link.includes('#/reset/') ? t('auth.reset.title') : t('auth.devMailbox.confirm')}
            </a>
          </article>
        ))}
      </div>
      <button className="btn ghost full" onClick={load}>
        {t('auth.devMailbox.refresh')}
      </button>
    </AuthCard>
  );
}
