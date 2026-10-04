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

export type QuestionStep = McqStep | NumericStep | TextStep;
export type Step = ExplainStep | ExampleStep | QuestionStep;

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

export const isQuestion = (s: Step): s is QuestionStep =>
  s.type === 'mcq' || s.type === 'numeric' || s.type === 'text';
