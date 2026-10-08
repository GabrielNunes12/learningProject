// The interviewer: for a learner starting out who isn't sure what they need. Three questions (what you want to do,
// how much you've programmed, how much time a day) become a track, a first step and a daily goal. Pure so node:test
// can load it.

export type Goal = 'python-backend' | 'jvm-backend' | 'csharp-games' | 'game-engines' | 'thinking-tools';
export const GOALS: Goal[] = ['python-backend', 'jvm-backend', 'csharp-games', 'game-engines', 'thinking-tools'];

export type Experience = 'none' | 'some' | 'pro';
export const EXPERIENCE: Experience[] = ['none', 'some', 'pro'];

/** Minutes a day the learner can give. */
export const PACES = [5, 15, 30, 60] as const;
export type Pace = (typeof PACES)[number];
/** Daily XP goal per pace (same options as the profile's goal picker). */
export const PACE_GOAL: Record<Pace, number> = { 5: 20, 15: 50, 30: 100, 60: 200 };

/** The course every track opens with: how to learn. */
export const FIRST_COURSE = 'learn-anything-fast';

export interface TrackLike {
  id: string;
  nodes: { course: string }[];
}

export interface Plan {
  track: string;
  /**
   * The first step. `learn`: start a course from its first lesson. `level`: take a course's find-your-level quiz, so
   * someone who has programmed before starts where their knowledge ends instead of at lesson one.
   */
  start: { course: string; kind: 'learn' | 'level' };
  dailyGoal: number;
}

/** The track's main course: its first course after Learn Anything Fast (the language, or the first thinking skill). */
export const mainCourse = (track: TrackLike) => track.nodes.find((n) => n.course !== FIRST_COURSE)?.course ?? track.nodes[0]?.course;

export function interviewPlan(track: TrackLike, experience: Experience, pace: Pace): Plan {
  const main = mainCourse(track);
  // New to programming (or to the thinking track's subjects): start with how to learn. Otherwise find your level.
  const start: Plan['start'] =
    experience === 'none' || track.id === 'thinking-tools' || !main ? { course: track.nodes[0]?.course ?? FIRST_COURSE, kind: 'learn' } : { course: main, kind: 'level' };
  return { track: track.id, start, dailyGoal: PACE_GOAL[pace] };
}
