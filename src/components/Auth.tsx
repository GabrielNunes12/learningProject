import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';
import { completeVerification, signIn, useAuth } from '../lib/auth';
import { href } from '../lib/router';
import { Field, Notice } from './ui';

function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="auth-page">
      <a className="brand auth-brand" href="#/">
        <span className="brand-mark" aria-hidden>
          🧠
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

const DevMailboxHint = () =>
  import.meta.env.DEV ? (
    <Notice>
      Development mode: no email server is configured, so emails go to the <a href="#/dev/mailbox">dev mailbox</a>.
    </Notice>
  ) : null;

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}
const STRENGTH = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

function useResend(email: string) {
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const resend = async () => {
    await api('/auth/resend', { email }).catch(() => {});
    setSent(true);
    setCooldown(60);
  };
  return { resend, cooldown, sent };
}

export function SignUp() {
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
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) errs.username = '3–20 letters, numbers or underscores.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email address.';
    if (form.password.length < 8) errs.password = 'At least 8 characters.';
    if (form.confirm !== form.password) errs.confirm = "Passwords don't match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await api('/auth/register', { username: form.username, email: form.email, password: form.password });
      window.location.hash = href('check-email', form.email.trim().toLowerCase());
    } catch (err) {
      if (err instanceof ApiError && err.code && ['username', 'email', 'password'].includes(err.code)) setErrors({ [err.code]: err.message });
      else setErrors({ form: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create your profile"
      subtitle="Save your progress, streak and reviews across devices."
      footer={
        <>
          Already have a profile? <a href="#/signin">Sign in</a>
        </>
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="Username" name="username" autoComplete="username" value={form.username} onChange={set('username')} error={errors.username} help="Shown on your profile. Letters, numbers and _." autoFocus />
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} help="We'll send a link to confirm it." />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          help={
            form.password ? (
              <span className="strength">
                <span className={`strength-bar s${strength}`}>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                {STRENGTH[strength]}
              </span>
            ) : (
              'At least 8 characters. A short phrase is easier to remember.'
            )
          }
        />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        {errors.form && <Notice tone="bad">{errors.form}</Notice>}
        <button className="btn primary big full" disabled={busy}>
          {busy ? 'Creating…' : 'Create profile'}
        </button>
      </form>
    </AuthCard>
  );
}

export function CheckEmail({ email }: { email: string }) {
  const { resend, cooldown, sent } = useResend(email);
  return (
    <AuthCard title="Check your email" subtitle={<>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your profile.</>}>
      <div className="mail-art" aria-hidden>
        ✉️
      </div>
      <DevMailboxHint />
      <p className="muted small">Can't find it? Check your spam folder. The link expires in 24 hours.</p>
      {sent && <Notice tone="good">If that address needs confirming, a new link is on its way.</Notice>}
      <button className="btn full" onClick={resend} disabled={cooldown > 0}>
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
      </button>
      <p className="center small">
        <a href="#/signin">Back to sign in</a>
      </p>
    </AuthCard>
  );
}

export function SignIn() {
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
      else setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue where you left off."
      footer={
        <>
          New here? <a href="#/signup">Create a profile</a>
        </>
      }
    >
      {!serverAvailable && <Notice tone="bad">The server isn't reachable. Start it with npm run dev.</Notice>}
      <form className="stack" onSubmit={submit}>
        <Field label="Username or email" name="login" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required autoFocus />
        <Field label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <a className="small forgot" href="#/forgot">
          Forgot password?
        </a>
        {error && <Notice tone="bad">{error}</Notice>}
        {unverified !== null && <UnverifiedNotice email={unverified} />}
        <button className="btn primary big full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthCard>
  );
}

function UnverifiedNotice({ email }: { email: string }) {
  const { resend, cooldown, sent } = useResend(email);
  return (
    <Notice tone="bad">
      Please confirm your email first — we sent a link to <strong>{email}</strong>.{' '}
      {sent ? (
        'A new link is on its way.'
      ) : (
        <button type="button" className="link" onClick={resend} disabled={cooldown > 0}>
          Resend link
        </button>
      )}
    </Notice>
  );
}

export function Verify({ token }: { token: string }) {
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice; the token only works once.
    started.current = true;
    completeVerification(token)
      .then(() => setState('done'))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setState('error');
      });
  }, [token]);

  if (state === 'working') return <AuthCard title="Confirming your email…" />;
  if (state === 'error')
    return (
      <AuthCard title="Link didn't work" subtitle={error}>
        <p className="muted small">Sign in to get a fresh confirmation link.</p>
        <a className="btn primary full" href="#/signin">
          Go to sign in
        </a>
      </AuthCard>
    );
  return (
    <AuthCard title="Email confirmed 🎉" subtitle="Your profile is active and you're signed in. Your progress now syncs across devices.">
      <a className="btn primary big full" href="#/">
        Start learning
      </a>
    </AuthCard>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  return (
    <AuthCard title="Reset your password" subtitle="Enter your email and we'll send you a link to choose a new password.">
      {sent ? (
        <>
          <Notice tone="good">If an account exists for {email}, a reset link is on its way. It expires in 60 minutes.</Notice>
          <DevMailboxHint />
          <a className="btn full" href="#/signin">
            Back to sign in
          </a>
        </>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await api('/auth/forgot', { email: email.trim() });
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Something went wrong.');
            }
          }}
        >
          <Field label="Email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          {error && <Notice tone="bad">{error}</Notice>}
          <button className="btn primary big full">Send reset link</button>
          <p className="center small">
            <a href="#/signin">Back to sign in</a>
          </p>
        </form>
      )}
    </AuthCard>
  );
}

export function Reset({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (done)
    return (
      <AuthCard title="Password updated" subtitle="You can now sign in with your new password.">
        <a className="btn primary big full" href="#/signin">
          Sign in
        </a>
      </AuthCard>
    );

  return (
    <AuthCard title="Choose a new password">
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (password !== confirm) return setError("Passwords don't match.");
          setError('');
          try {
            await api('/auth/reset', { token, password });
            setDone(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
          }
        }}
      >
        <Field label="New password" type="password" name="new-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoFocus help="At least 8 characters." />
        <Field label="Confirm new password" type="password" name="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        {error && <Notice tone="bad">{error}</Notice>}
        <button className="btn primary big full">Update password</button>
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
  const [mails, setMails] = useState<Mail[] | null>(null);
  const [error, setError] = useState('');
  const load = () =>
    api<{ mails: Mail[] }>('/dev/outbox')
      .then((r) => setMails(r.mails))
      .catch(() => setError('The dev mailbox is only available in development without SMTP configured.'));
  useEffect(() => {
    load();
  }, []);

  return (
    <AuthCard title="Dev mailbox" subtitle="Emails the server would have sent. Configure SMTP in .env to send real emails.">
      {error && <Notice tone="bad">{error}</Notice>}
      {mails && mails.length === 0 && <p className="muted">No emails yet.</p>}
      <div className="stack">
        {mails?.map((m, i) => (
          <article key={i} className="mail">
            <div className="mail-meta">
              <strong>{m.subject}</strong>
              <span className="muted small">
                to {m.to} · {new Date(m.sentAt).toLocaleTimeString('en-US')}
              </span>
            </div>
            <p className="small">{m.text.split('\n')[0]}</p>
            <a className="btn primary small" href={m.link.slice(m.link.indexOf('#'))}>
              {m.subject.includes('Reset') ? 'Choose a new password' : 'Confirm email'}
            </a>
          </article>
        ))}
      </div>
      <button className="btn ghost full" onClick={load}>
        Refresh
      </button>
    </AuthCard>
  );
}
