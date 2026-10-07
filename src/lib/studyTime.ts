// Counting active study time. Pure: the React hook (components/useStudyTimer.ts) feeds it clock readings.

/** No input for this long and the learner is considered away: the clock stops. */
export const IDLE_MS = 2 * 60_000;
/** How often the hook samples the clock. */
export const TICK_MS = 5_000;
/** How often counted time is saved (so a closed tab loses at most this much). */
export const FLUSH_MS = 60_000;

export interface Clock {
  /** Last sample time. */
  lastTick: number;
  /** Last keyboard, pointer or scroll activity. */
  lastActive: number;
}

/**
 * Time to count between the last sample and `now`: only while the page is visible, and only up to
 * IDLE_MS after the last activity (reading a long explanation still counts; walking away doesn't).
 * A sleeping laptop or a throttled background tab produces one huge gap: it's capped the same way.
 */
export function activeDelta(clock: Clock, now: number, visible: boolean): number {
  if (!visible || now <= clock.lastTick) return 0;
  const end = Math.min(now, clock.lastActive + IDLE_MS);
  return Math.max(0, end - clock.lastTick);
}
