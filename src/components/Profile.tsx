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

export function Profile() {
  const p = useProgress();
  const { user, sync } = useAuth();
  const lvl = levelInfo(p.xp);
  const mastered = Object.values(p.cards).filter((c) => c.box >= MASTERED_BOX).length;
  const lessonsDone = Object.keys(p.completed).length;
  const started = courses.filter((c) => courseStats(c, p).started);

  return (
    <Page wide>
      <section className="profile-head">
        <Avatar name={user?.username ?? 'Guest'} size={84} />
        <div className="grow">
          <h1>{user ? user.username : 'Guest learner'}</h1>
          {user ? (
            <p className="muted">
              {user.email} <span className="verified">✓ verified</span> · joined{' '}
              {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          ) : (
            <p className="muted">Progress is stored only in this browser.</p>
          )}
          <div className="level-line">
            <span className="level-badge small">{lvl.level}</span>
            <div className="grow">
              <div className="level-text">
                <strong>
                  Level {lvl.level} · {lvl.title}
                </strong>
                <span className="muted small">
                  {lvl.into} / {lvl.needed} XP
                </span>
              </div>
              <ProgressBar value={lvl.into / lvl.needed} label="Progress to next level" />
            </div>
          </div>
        </div>
        {user ? (
          <span className={`sync-pill ${sync}`}>
            {sync === 'saving' ? 'Saving…' : sync === 'offline' ? 'Offline — will retry' : <><Icon name="check" size={14} /> Synced</>}
          </span>
        ) : (
          <div className="profile-cta">
            <a className="btn primary" href="#/signup">
              Create profile
            </a>
            <a className="btn ghost" href="#/signin">
              Sign in
            </a>
          </div>
        )}
      </section>

      <div className="stat-grid six">
        <Stat label="Total XP" value={p.xp} />
        <Stat
          label="Current streak"
          value={
            <>
              <Icon name="flame" size={18} className="flame" /> {streak(p)}
            </>
          }
        />
        <Stat label="Best streak" value={bestStreak(p)} />
        <Stat label="Lessons done" value={lessonsDone} />
        <Stat label="Questions mastered" value={mastered} />
        <Stat label="Courses started" value={started.length} />
      </div>

      <div className="profile-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Activity</h2>
          </div>
          <ActivityHeatmap p={p} />
        </section>

        <section className="panel">
          <h2>Daily goal</h2>
          <p className="muted small">How much XP do you want to earn each day? A lesson is about 30–50 XP.</p>
          <div className="goal-options" role="radiogroup" aria-label="Daily XP goal">
            {GOAL_OPTIONS.map((g) => (
              <button key={g} role="radio" aria-checked={p.dailyGoal === g} className={`goal-option${p.dailyGoal === g ? ' on' : ''}`} onClick={() => setDailyGoal(g)}>
                <strong>{g} XP</strong>
                <span>{g === 20 ? 'Casual' : g === 50 ? 'Regular' : g === 100 ? 'Serious' : 'Intense'}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Course progress</h2>
          <span className="row wrap">
            <a className="small" href={href('notebook')}>
              Notebook →
            </a>
            <a className="small" href={href('insights')}>
              Your learning report →
            </a>
          </span>
        </div>
        {started.length === 0 ? (
          <p className="muted">
            No courses started yet. <a href="#/courses">Pick one →</a>
          </p>
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
                        Core {s.coreDone}/{s.coreTotal} · {Math.round(s.mastery * 100)}% mastered
                        {p.quizBest[c.id] !== undefined && ` · quiz ${p.quizBest[c.id]}%`}
                      </span>
                    </div>
                    <ProgressBar value={s.total ? s.completed / s.total : 0} label={`${c.title} progress`} />
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
      setMsg({ tone: 'good', text: 'Password changed. Other devices have been signed out.' });
      setCurrent('');
      setNext('');
    } catch (err) {
      setMsg({ tone: 'bad', text: err instanceof ApiError ? err.message : 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Account</h2>
      <div className="settings-grid">
        <form onSubmit={changePassword} className="stack">
          <h3>Change password</h3>
          <Field label="Current password" type="password" name="current" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <Field label="New password" type="password" name="new-password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required help="At least 8 characters." />
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <div>
            <button className="btn" disabled={busy}>
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
        <div className="stack">
          <h3>Session</h3>
          <p className="muted small">Signing out removes your progress from this browser. It stays saved in your account.</p>
          <div>
            <button
              className="btn"
              onClick={async () => {
                await signOut();
                window.location.hash = '#/';
              }}
            >
              Sign out
            </button>
          </div>
          <h3 className="danger-title">Delete account</h3>
          {!deleting ? (
            <div>
              <button className="btn danger-outline" onClick={() => setDeleting(true)}>
                Delete my account…
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
                  setDeleteErr(err instanceof ApiError ? err.message : 'Something went wrong.');
                }
              }}
            >
              <Notice tone="bad">This permanently deletes your profile and all synced progress. It can't be undone.</Notice>
              <Field label="Confirm with your password" type="password" name="delete-password" autoComplete="current-password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} error={deleteErr} required />
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setDeleting(false)}>
                  Cancel
                </button>
                <button className="btn danger">Delete forever</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function DataSettings({ signedIn }: { signedIn: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <section className="panel">
      <h2>Your data</h2>
      <p className="muted small">
        {signedIn ? 'Progress syncs to your account automatically. You can still keep a backup file.' : 'Back up your progress to a file, or restore it on another browser.'}
      </p>
      <div className="row wrap">
        <button className="btn" onClick={exportProgress}>
          Export progress
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import progress
        </button>
        <button
          className="btn danger-outline"
          onClick={() => {
            if (confirm('Erase all learning progress? Export first if you want a backup.')) resetProgress();
          }}
        >
          Reset progress
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
              alert(err instanceof Error ? err.message : 'Could not read that file.');
            }
          }}
        />
      </div>
    </section>
  );
}
