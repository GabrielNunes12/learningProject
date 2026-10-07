import { useEffect, useRef } from 'react';
import { addStudyTime } from '../lib/storage';
import { activeDelta, FLUSH_MS, TICK_MS, type Clock } from '../lib/studyTime';

/**
 * Counts active time on a course while the component is mounted (lessons, sessions, the knowledge map).
 * The course can change mid-session (mixed practice): time is credited to whichever course is current.
 */
export function useStudyTimer(courseId: string | undefined) {
  const course = useRef(courseId);
  course.current = courseId;

  useEffect(() => {
    const now = Date.now();
    const clock: Clock = { lastTick: now, lastActive: now };
    const pending = new Map<string, number>();
    let lastFlush = now;

    const sample = () => {
      const t = Date.now();
      const ms = activeDelta(clock, t, document.visibilityState === 'visible');
      clock.lastTick = t;
      if (ms > 0 && course.current) pending.set(course.current, (pending.get(course.current) ?? 0) + ms);
    };
    const flush = () => {
      sample();
      for (const [id, ms] of pending) addStudyTime(id, ms);
      pending.clear();
      lastFlush = Date.now();
    };
    const active = () => {
      // Coming back after a break: don't count the break, start from now.
      const t = Date.now();
      if (t - clock.lastActive > TICK_MS) sample();
      clock.lastActive = t;
    };
    const tick = setInterval(() => {
      sample();
      if (Date.now() - lastFlush >= FLUSH_MS) flush();
    }, TICK_MS);
    const onHide = () => document.visibilityState === 'hidden' && flush();
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, active, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, active, { capture: true }));
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
}
