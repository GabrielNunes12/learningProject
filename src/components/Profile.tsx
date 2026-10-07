import type { ReactNode } from 'react';
import { useRef, useState, type FormEvent } from 'react';
import { courses } from '../content';
import { api, ApiError } from '../lib/api';
import { deleteAccount, signOut, useAuth } from '../lib/auth';
import { href } from '../lib/router';
import { courseStats } from '../lib/stats';
import {
  bestStreak,
  exportProgress,
  GOAL_OPTIONS,
  importProgress,
  levelInfo,
  MASTERED_BOX,
  resetProgress,
  setDailyGoal,
  streak,
  useProgress,
} from '../lib/storage';
import { ActivityHeatmap } from './charts';
import { Page } from './Layout';
import { accentStyle, Avatar, Field, Notice, ProgressBar } from './ui';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { LanguageSelect } from './LanguageSwitcher';
import { tMaybe, type MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';

const GOAL_NAMES: Record<number, MessageKey> = { 20: 'profile.goal.casual', 50: 'profile.goal.regular', 100: 'profile.goal.serious' };

/** Status texts are kept as message keys (client) or as already-translated server text, and shown in the current language. */
const showText = (s: string) => tMaybe(s, s);

export function Profile() {
  const { t, tx, n, pct, date } = useT();
  const p = useProgress();
  const { user, sync } = useAuth();
  const lvl = levelInfo(p.xp);
  const mastered = Object.values(p.cards).filter((c) => c.box >= MASTERED_BOX).length;
  const lessonsDone = Object.keys(p.completed).length;
  const started = courses.filter((c) => courseStats(c, p).started);

  return (
    <Page wide>
      <section className="profile-head">
        <Avatar name={user?.username ?? t('profile.guest')} size={84} />
        <div className="grow">
          <h1>{user ? user.username : t('profile.guestLearner')}</h1>
          {user ? (
            <p className="muted">
              {tx(
                'profile.accountLine',
                { email: user.email, joined: date(user.createdAt, { month: 'long', year: 'numeric' }) },
                { verified: (c) => <span className="verified">{c}</span> },
              )}
            </p>
          ) : (
            <p className="muted">{t('profile.localOnly')}</p>
          )}
          <div className="level-line">
            <span className="level-badge small">{lvl.level}</span>
            <div className="grow">
              <div className="level-text">
                <strong>{t('profile.levelLine', { level: lvl.level, title: lvl.title })}</strong>
                <span className="muted small">{t('profile.levelXp', { into: lvl.into, needed: lvl.needed })}</span>
              </div>
              <ProgressBar value={lvl.into / lvl.needed} label={t('profile.levelProgress')} />
            </div>
          </div>
        </div>
        {user ? (
          <span className={`sync-pill ${sync}`}>
            {sync === 'saving' ? (
              t('profile.sync.saving')
            ) : sync === 'offline' ? (
              t('profile.sync.offline')
            ) : (
              <>
                <Icon name="check" size={14} /> {t('profile.sync.synced')}
              </>
            )}
          </span>
        ) : (
          <div className="profile-cta">
            <a className="btn primary" href="#/signup">
              {t('profile.createProfile')}
            </a>
            <a className="btn ghost" href="#/signin">
              {t('common.signIn')}
            </a>
          </div>
        )}
      </section>

      <div className="stat-grid six">
        <Stat label={t('profile.stat.totalXp')} value={n(p.xp)} />
        <Stat
          label={t('profile.stat.currentStreak')}
          value={
            <>
              <Icon name="flame" size={18} className="flame" /> {n(streak(p))}
            </>
          }
        />
        <Stat label={t('profile.stat.bestStreak')} value={n(bestStreak(p))} />
        <Stat label={t('profile.stat.lessonsDone')} value={n(lessonsDone)} />
        <Stat label={t('profile.stat.mastered')} value={n(mastered)} />
        <Stat label={t('profile.stat.coursesStarted')} value={n(started.length)} />
      </div>

      <div className="profile-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>{t('profile.activity')}</h2>
          </div>
          <ActivityHeatmap p={p} />
        </section>

        <section className="panel">
          <h2>{t('common.dailyGoal')}</h2>
          <p className="muted small">{t('profile.goal.help')}</p>
          <div className="goal-options" role="radiogroup" aria-label={t('profile.goal.label')}>
            {GOAL_OPTIONS.map((g) => (
              <button key={g} role="radio" aria-checked={p.dailyGoal === g} className={`goal-option${p.dailyGoal === g ? ' on' : ''}`} onClick={() => setDailyGoal(g)}>
                <strong>{t('common.xp', { count: g })}</strong>
                <span>{t(GOAL_NAMES[g] ?? 'profile.goal.intense')}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <LanguageSelect />
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('profile.courseProgress')}</h2>
          <span className="row wrap">
            <a className="small" href={href('notebook')}>
              {t('profile.notebookLink')}
            </a>
            <a className="small" href={href('insights')}>
              {t('profile.reportLink')}
            </a>
          </span>
        </div>
        {started.length === 0 ? (
          <p className="muted">{tx('profile.noCourses', {}, { link: (c) => <a href="#/courses">{c}</a> })}</p>
        ) : (
          <div className="course-progress-list">
            {started.map((c) => {
              const s = courseStats(c, p);
              return (
                <a key={c.id} className="course-progress" href={href('course', c.id)} style={accentStyle(c.color)}>
                  <CourseIcon icon={c.icon} color={c.color} size={44} />
                  <div className="grow">
                    <div className="level-text">
                      <strong>{c.title}</strong>
                      <span className="muted small">
                        {p.quizBest[c.id] !== undefined
                          ? t('profile.courseLineQuiz', { done: s.coreDone, total: s.coreTotal, mastery: pct(s.mastery), quiz: pct(p.quizBest[c.id] / 100) })
                          : t('profile.courseLine', { done: s.coreDone, total: s.coreTotal, mastery: pct(s.mastery) })}
                      </span>
                    </div>
                    <ProgressBar value={s.total ? s.completed / s.total : 0} label={t('profile.courseProgressLabel', { title: c.title })} />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {user && <AccountSettings />}
      <DataSettings signedIn={Boolean(user)} />
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="mini-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function AccountSettings() {
  const { t } = useT();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteErr, setDeleteErr] = useState('');

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api('/account/password', { current, next });
      setMsg({ tone: 'good', text: 'profile.account.passwordChanged' });
      setCurrent('');
      setNext('');
    } catch (err) {
      setMsg({ tone: 'bad', text: err instanceof ApiError ? err.message : 'profile.somethingWrong' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>{t('profile.account.title')}</h2>
      <div className="settings-grid">
        <form onSubmit={changePassword} className="stack">
          <h3>{t('profile.account.changePassword')}</h3>
          <Field label={t('profile.account.currentPassword')} type="password" name="current" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <Field label={t('profile.account.newPassword')} type="password" name="new-password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required help={t('profile.account.passwordHelp')} />
          {msg && <Notice tone={msg.tone}>{showText(msg.text)}</Notice>}
          <div>
            <button className="btn" disabled={busy}>
              {busy ? t('profile.sync.saving') : t('profile.account.updatePassword')}
            </button>
          </div>
        </form>
        <div className="stack">
          <h3>{t('profile.account.session')}</h3>
          <p className="muted small">{t('profile.account.signOutHelp')}</p>
          <div>
            <button
              className="btn"
              onClick={async () => {
                await signOut();
                window.location.hash = '#/';
              }}
            >
              {t('profile.account.signOut')}
            </button>
          </div>
          <h3 className="danger-title">{t('profile.account.delete')}</h3>
          {!deleting ? (
            <div>
              <button className="btn danger-outline" onClick={() => setDeleting(true)}>
                {t('profile.account.deleteStart')}
              </button>
            </div>
          ) : (
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await deleteAccount(deletePw);
                  window.location.hash = '#/';
                } catch (err) {
                  setDeleteErr(err instanceof ApiError ? err.message : 'profile.somethingWrong');
                }
              }}
            >
              <Notice tone="bad">{t('profile.account.deleteWarning')}</Notice>
              <Field label={t('profile.account.deleteConfirm')} type="password" name="delete-password" autoComplete="current-password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} error={deleteErr && showText(deleteErr)} required />
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setDeleting(false)}>
                  {t('common.cancel')}
                </button>
                <button className="btn danger">{t('profile.account.deleteForever')}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function DataSettings({ signedIn }: { signedIn: boolean }) {
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <section className="panel">
      <h2>{t('profile.data.title')}</h2>
      <p className="muted small">{signedIn ? t('profile.data.helpSignedIn') : t('profile.data.helpGuest')}</p>
      <div className="row wrap">
        <button className="btn" onClick={exportProgress}>
          {t('profile.data.export')}
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          {t('profile.data.import')}
        </button>
        <button
          className="btn danger-outline"
          onClick={() => {
            if (confirm(t('profile.data.resetConfirm'))) resetProgress();
          }}
        >
          {t('profile.data.reset')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              await importProgress(file);
            } catch (err) {
              alert(err instanceof Error ? err.message : t('profile.data.importFailed'));
            }
          }}
        />
      </div>
    </section>
  );
}
