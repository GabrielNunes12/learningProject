// Content model. Courses live as JSON files in src/content/topics/ and must match these shapes.

/** "core" = the 20% of ideas that give 80% of the value. "extra" = optional deep dive. */
export type Pareto = 'core' | 'extra';

export interface ExplainStep {
  type: 'explain';
  title?: string;
  body: string;
}

/** A worked example whose solution is revealed one step at a time. */
export interface ExampleStep {
  type: 'example';
  title?: string;
  problem: string;
  steps: string[];
  answer?: string;
}

interface QuestionBase {
  /** Stable id, unique within the lesson. Spaced-repetition history is keyed on it. */
  id: string;
  prompt: string;
  explanation: string;
  hint?: string;
}

export interface McqStep extends QuestionBase {
  type: 'mcq';
  choices: string[];
  /** Index into choices of the correct option. */
  answer: number;
}

export interface NumericStep extends QuestionBase {
  type: 'numeric';
  answer: number;
  /** Absolute tolerance. Defaults to 0 for integers, 1% for decimals. */
  tolerance?: number;
  unit?: string;
}

export interface TextStep extends QuestionBase {
  type: 'text';
  /** Accepted answers; compared ignoring case, spaces and punctuation. */
  accept: string[];
}

/** Show code; the learner types exactly what it prints. */
export interface OutputStep extends QuestionBase {
  type: 'output';
  /** The program, without ``` fences. */
  code: string;
  /** Highlighting language, e.g. "python". */
  language?: string;
  /** What the code prints. Compared line by line, ignoring extra spaces and blank lines at the ends. */
  output: string;
}

/** Show broken code; the learner clicks the faulty line, then picks the fix. */
export interface BugStep extends QuestionBase {
  type: 'bug';
  /** The program, without ``` fences. */
  code: string;
  /** Highlighting language, e.g. "python". */
  language?: string;
  /** What running it gives: the error message or the wrong output. */
  error?: string;
  /** 1-based line numbers that count as finding the bug (usually one). */
  lines: number[];
  /** Candidate fixes, shown once the line is found. */
  fixes: string[];
  /** Index into fixes of the correct one. */
  answer: number;
}

// ---------- mini-games: graded like questions, so they join quizzes and spaced review ----------

/** Drag the pieces into the right order. */
export interface OrderStep extends QuestionBase {
  type: 'order';
  /** The pieces in the CORRECT order (3–8, all different). The game shuffles them. */
  items: string[];
}

/** Sort cards into buckets, one card at a time. */
export interface BucketsStep extends QuestionBase {
  type: 'buckets';
  /** 2–4 bucket labels. */
  buckets: string[];
  /** Cards, each with the index of the bucket it belongs in. */
  items: { text: string; bucket: number }[];
}

/** One moment in a code trace: the line that just ran and the variables afterwards. */
export interface TraceFrame {
  /** 1-based line that just ran. */
  line: number;
  /** Every variable in scope after that line, as it would print (e.g. "[3, 1]", "'hi'", "None"). */
  vars: Record<string, string>;
  /** Everything printed so far, if the code prints. */
  out?: string;
  /** A short remark shown with this frame. */
  note?: string;
  /** Hide this variable's new value: the learner predicts it before seeing it. */
  ask?: string;
}

/** Step through code while the variables update; the learner predicts some values. */
export interface TraceStep extends QuestionBase {
  type: 'trace';
  /** The program, without ``` fences. */
  code: string;
  language?: string;
  frames: TraceFrame[];
}

export type QuestionStep = McqStep | NumericStep | TextStep | OutputStep | BugStep | OrderStep | BucketsStep | TraceStep;
/** Questions checked by QuestionView's classic answer UI (not a mini-game). */
export type ClassicQuestionStep = McqStep | NumericStep | TextStep | OutputStep | BugStep;

// ---------- simulators: ungraded playgrounds with an optional goal ----------

export interface SimTable {
  name: string;
  columns: string[];
  rows: (string | number | null)[][];
}

export type SimConfig =
  | {
      sim: 'git';
      /** Commands run before the learner starts, e.g. ["git commit", "git switch -c feature"]. Default: one commit on main. */
      setup?: string[];
      /** Reaching it unlocks Continue. */
      goal?: {
        text: string;
        /** Branch HEAD must be on. */
        head?: string;
        /** Branches that must exist. */
        branches?: string[];
        /** Each `from` branch's tip must be contained in `into`. */
        merged?: { from: string; into: string }[];
        /** Minimum number of commits reachable from each branch. */
        minCommits?: Record<string, number>;
      };
    }
  | {
      sim: 'dice';
      /** 1–3 dice. */
      dice: number;
      /** 2–20 sides; 2 sides reads as a coin. */
      sides: number;
      /** Totals that count as a hit, e.g. [7]. */
      target: number[];
      /** Rolls needed to unlock Continue. */
      goalRolls?: number;
    }
  | {
      sim: 'growth';
      /** Complexity classes to race. */
      curves: ('1' | 'log n' | 'n' | 'n log n' | 'n^2' | '2^n')[];
      /** Largest input size on the slider (default 1000). */
      maxN?: number;
    }
  | {
      sim: 'join';
      left: SimTable;
      right: SimTable;
      /** [left column, right column] joined with "=". */
      on: [string, string];
      /** Join types offered (default all four). */
      joins?: ('inner' | 'left' | 'right' | 'full')[];
    };

export type SimStep = { type: 'sim'; title?: string; /** Markdown task / intro. */ body?: string } & SimConfig;

export type Step = ExplainStep | ExampleStep | QuestionStep | SimStep;

export interface Lesson {
  /** Unique within the course. */
  id: string;
  title: string;
  pareto: Pareto;
  minutes?: number;
  /** One sentence: the thing to remember from this lesson. Shown on the cheat sheet. */
  takeaway: string;
  steps: Step[];
}

export interface Unit {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

/** A course as written in JSON. Small courses may use a flat "lessons" list instead of "units". */
export interface CourseFile {
  id: string;
  title: string;
  icon: string;
  color?: string;
  description: string;
  order?: number;
  /** Groups courses on the Courses page, e.g. "Programming". */
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  /** The handful of ideas that carry most of the course. */
  keyIdeas: string[];
  units?: Unit[];
  lessons?: Lesson[];
}

/** A loaded course: always has units, plus every lesson flattened in order. */
export interface Course extends CourseFile {
  units: Unit[];
  lessons: Lesson[];
}

export const QUESTION_TYPES = ['mcq', 'numeric', 'text', 'output', 'bug', 'order', 'buckets', 'trace'] as const;

export const isQuestion = (s: Step): s is QuestionStep => (QUESTION_TYPES as readonly string[]).includes(s.type);
