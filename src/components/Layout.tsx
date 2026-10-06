import { useEffect, useRef, useState, type ReactNode } from 'react';
import { questionByKey } from '../content';
import { signOut, useAuth } from '../lib/auth';
import { useRoute } from '../lib/router';
import { dueKeys, levelInfo, streak, useProgress, xpToday } from '../lib/storage';
import { Avatar, Ring } from './ui';
import { BrandMark, Icon, type IconName } from './icons';

export function useDueCount() {
  const p = useProgress();
  return dueKeys(p).filter((k) => questionByKey.has(k)).length;
}

const NAV: { id: string; label: string; icon: IconName }[] = [
  { id: '', label: 'Home', icon: 'home' },
  { id: 'courses', label: 'Courses', icon: 'grid' },
  { id: 'roadmap', label: 'Roadmap', icon: 'route' },
  { id: 'review', label: 'Review', icon: 'review' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export function NavBar() {
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

          <nav className="nav-links" aria-label="Main">
            {NAV.slice(0, 3).map((n) => (
              <a key={n.id} href={`#/${n.id}`} className={active(n.id) ? 'active' : ''} aria-current={active(n.id) ? 'page' : undefined}>
                {n.label}
                {n.id === 'review' && due > 0 && <span className="badge">{due}</span>}
              </a>
            ))}
          </nav>

          <div className="nav-right">
            <a className="chip tip tip-below" href="#/profile" data-tip={`${streak(p)}-day streak`}>
              <Icon name="flame" size={16} /> {streak(p)}
            </a>
            <a className="chip tip tip-below goal-chip" href="#/profile" data-tip={`Today ${xpToday(p)} / ${p.dailyGoal} XP · Level ${lvl.level}`}>
              <Ring value={goal} size={20} stroke={3} label="Daily goal progress" />
              <span>{p.xp} XP</span>
            </a>
            {user ? (
              <UserMenu username={user.username} />
            ) : user === null ? (
              <div className="nav-auth">
                <a className="btn ghost small" href="#/signin">
                  Sign in
                </a>
                <a className="btn primary small" href="#/signup">
                  Get started
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.id} href={`#/${n.id}`} className={active(n.id) ? 'active' : ''} aria-current={active(n.id) ? 'page' : undefined}>
            <span className="tab-icon" aria-hidden>
              <Icon name={n.icon} size={22} />
            </span>
            {n.label}
            {n.id === 'review' && due > 0 && <span className="badge">{due}</span>}
          </a>
        ))}
      </nav>
    </>
  );
}

function UserMenu({ username }: { username: string }) {
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
      <button className="avatar-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu">
        <Avatar name={username} size={34} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            Signed in as <strong>{username}</strong>
          </div>
          <a role="menuitem" href="#/profile" onClick={() => setOpen(false)}>
            Profile & stats
          </a>
          <a role="menuitem" href="#/review" onClick={() => setOpen(false)}>
            Review
          </a>
          <button
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              window.location.hash = '#/';
            }}
          >
            Sign out
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
  return (
    <header className="player-header">
      <div className="player-header-inner">
        <a className="close" href={exitHref} aria-label="Exit">
          ✕
        </a>
        <div className="segments" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Progress">
          {total <= 24 ? (
            Array.from({ length: total }, (_, i) => <span key={i} className={i < done ? 'on' : i === done ? 'current' : ''} />)
          ) : (
            <span className="on" style={{ flex: `0 0 ${(done / total) * 100}%` }} />
          )}
        </div>
        <div className="player-right">{right}</div>
      </div>
    </header>
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

