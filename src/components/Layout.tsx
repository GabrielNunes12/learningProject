import { useEffect, useRef, useState, type ReactNode } from 'react';
import { questionByKey } from '../content';
import { signOut, useAuth } from '../lib/auth';
import { useRoute } from '../lib/router';
import { dueKeys, levelInfo, streak, useProgress, xpToday } from '../lib/storage';
import { accentStyle, Avatar, Ring, useBodyAccent } from './ui';
import { BrandMark, Icon, type IconName } from './icons';
import type { MessageKey } from '../i18n/core';
import { useT } from '../i18n/react';
import { LanguageChip } from './LanguageSwitcher';

export function useDueCount() {
  const p = useProgress();
  return dueKeys(p).filter((k) => questionByKey.has(k)).length;
}

const NAV: { id: string; label: MessageKey; icon: IconName }[] = [
  { id: '', label: 'nav.home', icon: 'home' },
  { id: 'courses', label: 'nav.courses', icon: 'grid' },
  { id: 'roadmap', label: 'nav.roadmap', icon: 'route' },
  { id: 'review', label: 'nav.review', icon: 'review' },
  { id: 'profile', label: 'nav.profile', icon: 'user' },
];

export function NavBar() {
  const { t } = useT();
  const [section] = useRoute();
  const p = useProgress();
  const { user } = useAuth();
  const due = useDueCount();
  const lvl = levelInfo(p.xp);
  const goal = xpToday(p) / Math.max(p.dailyGoal, 1);
  const active = (id: string) => (section ?? '') === id || (id === 'courses' && section === 'course');

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="#/">
            <span className="brand-mark" aria-hidden>
              <BrandMark />
            </span>
            <span className="brand-name">ProjectLearn</span>
          </a>

          <nav className="nav-links" aria-label={t('nav.main')}>
            {NAV.slice(0, 3).map((n) => (
              <a key={n.id} href={`#/${n.id}`} className={active(n.id) ? 'active' : ''} aria-current={active(n.id) ? 'page' : undefined}>
                {t(n.label)}
                {n.id === 'review' && due > 0 && <span className="badge">{due}</span>}
              </a>
            ))}
          </nav>

          <div className="nav-right">
            <LanguageChip />
            <a className="chip tip tip-below" href="#/profile" data-tip={t('nav.streakTip', { count: streak(p) })}>
              <Icon name="flame" size={16} /> {streak(p)}
            </a>
            <a className="chip tip tip-below goal-chip" href="#/profile" data-tip={t('nav.goalTip', { today: xpToday(p), goal: p.dailyGoal, level: lvl.level })}>
              <Ring value={goal} size={20} stroke={3} label={t('nav.goalRing')} />
              <span>{t('nav.xp', { xp: p.xp })}</span>
            </a>
            {user ? (
              <UserMenu username={user.username} />
            ) : user === null ? (
              <div className="nav-auth">
                <a className="btn ghost small" href="#/signin">
                  {t('common.signIn')}
                </a>
                <a className="btn primary small" href="#/signup">
                  {t('nav.getStarted')}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="tabbar" aria-label={t('nav.main')}>
        {NAV.map((n) => (
          <a key={n.id} href={`#/${n.id}`} className={active(n.id) ? 'active' : ''} aria-current={active(n.id) ? 'page' : undefined}>
            <span className="tab-icon" aria-hidden>
              <Icon name={n.icon} size={22} />
            </span>
            {t(n.label)}
            {n.id === 'review' && due > 0 && <span className="badge">{due}</span>}
          </a>
        ))}
      </nav>
    </>
  );
}

function UserMenu({ username }: { username: string }) {
  const { t, tx } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label={t('nav.accountMenu')}>
        <Avatar name={username} size={34} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">{tx('nav.signedInAs', { name: <strong>{username}</strong> })}</div>
          <a role="menuitem" href="#/profile" onClick={() => setOpen(false)}>
            {t('nav.profileStats')}
          </a>
          <a role="menuitem" href="#/review" onClick={() => setOpen(false)}>
            {t('nav.review')}
          </a>
          <button
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              window.location.hash = '#/';
            }}
          >
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <NavBar />
      <main className={`page${wide ? ' wide' : ''}`}>{children}</main>
    </>
  );
}

/** Header for full-screen lesson / quiz / review sessions. */
export function PlayerHeader({ exitHref, done, total, right }: { exitHref: string; done: number; total: number; right?: ReactNode }) {
  const { t } = useT();
  return (
    <header className="player-header">
      <div className="player-header-inner">
        <a className="close" href={exitHref} aria-label={t('nav.exit')}>
          ✕
        </a>
        <div className="segments" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label={t('common.progress')}>
          {total <= 24 ? (
            Array.from({ length: total }, (_, i) => <span key={i} className={i < done ? 'on' : i === done ? 'current' : ''} />)
          ) : (
            <span className="on" style={{ flex: `0 0 ${(done / total) * 100}%` }} />
          )}
        </div>
        <div className="player-right">
          {/* Switching language mid-lesson keeps the learner's place. */}
          <LanguageChip compact />
          {right}
        </div>
      </div>
    </header>
  );
}

/** The player while a course's lessons download, or after the download failed. */
export function PlayerLoading({ exitHref, total, color, failed }: { exitHref: string; total: number; color?: string; failed: boolean }) {
  const { t } = useT();
  useBodyAccent(color);
  return (
    <div className="player" style={accentStyle(color)}>
      <PlayerHeader exitHref={exitHref} done={0} total={total} />
      <main className="player-body">
        {failed ? (
          <section className="center empty-state" role="alert">
            <h1>{t('lesson.loadFailed.title')}</h1>
            <p className="lead">{t('lesson.loadFailed.body')}</p>
            <button type="button" className="btn primary" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </button>
          </section>
        ) : (
          <p className="center muted player-loading" role="status">
            {t('common.loading')}
          </p>
        )}
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="lead">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

