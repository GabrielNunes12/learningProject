// English UI strings: lesson. The lesson player (src/components/LessonPlayer.tsx), the shared question shell and
// classic questions (QuestionFrame.tsx, QuestionView.tsx), the question-session player (Session.tsx, used by review,
// mixed practice and the quiz) and the "Correct answer" texts built in src/lib/answers.ts.
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  // ---------- lesson player ----------
  // Screen-reader label of the XP pill in the player header.
  'lesson.xpEarnedAria': '{xp} XP earned this lesson',
  // "Make it shorter" step at the end of a lesson. {title} is the lesson title.
  'lesson.shorter.heading': 'Squeeze “{title}” into anchors',
  'lesson.shorter.intro':
    'Two or three anchors, four words at most each: the cues that will bring this lesson back to you. Fragments beat full sentences.',
  // Button.
  'lesson.shorter.done': 'Finish the lesson',

  // ---------- worked example ----------
  'lesson.example.eyebrow': 'Worked example',
  'lesson.example.attemptLabel': 'Your answer first. A rough guess counts; the steps unlock after you commit to one.',
  'lesson.example.placeholder': 'Work it out and write your answer',
  'lesson.example.yourAnswer': 'Your answer',
  'lesson.example.compare': 'Compare it with your answer above. Where did your reasoning go a different way?',
  'lesson.example.stepOf': 'Step {step} of {total}',
  'lesson.example.ready': 'Ready when you are.',
  'lesson.example.writeToUnlock': 'Write your answer to unlock the steps.',
  // Buttons.
  'lesson.example.lockIn': 'Lock in my answer',
  'lesson.example.showFirstStep': 'Show first step',
  'lesson.example.nextStep': 'Next step',
  'lesson.example.showAnswer': 'Show answer',
  // Self-assessment buttons after comparing with the worked answer: "I didn't get it" / "I got it".
  'lesson.example.notQuite': 'Not quite',
  'lesson.example.hadIt': 'I had it',

  // ---------- lesson complete ----------
  'lesson.complete.title': 'Lesson complete!',
  // Result tiles (tight space).
  'lesson.complete.totalXp': 'Total XP',
  'lesson.complete.accuracy': 'Accuracy',
  // XP earned today / daily goal, e.g. "30/50 today".
  'lesson.complete.today': '{today}/{goal} today',
  // {course} is the course title.
  'lesson.complete.certTitle': 'You finished {course}!',
  'lesson.complete.certText': 'Get your certificate: download it as a PDF and share it on LinkedIn, X or Facebook.',
  'lesson.complete.takeaway': 'Key takeaway',
  'lesson.complete.checkpoint': 'Unit checkpoint: map what you know',
  // <link>…</link> becomes a link to the sign-up page.
  'lesson.complete.signupNudge': '<link>Create a free profile</link> to keep your progress on every device.',
  'lesson.complete.backToCourse': 'Back to course',
  // {title} is the next lesson's title.
  'lesson.complete.next': 'Next: {title} →',
  'lesson.complete.quiz': 'Take the course quiz →',

  // ---------- question kinds (small uppercase label above the prompt) ----------
  'lesson.kind.mcq': 'Choose one',
  'lesson.kind.numeric': 'Enter a number',
  'lesson.kind.text': 'Type your answer',
  'lesson.kind.output': 'Predict the output',
  'lesson.kind.bug': 'Find the bug: click the broken line',
  // Second part of a bug hunt, once the broken line is found.
  'lesson.kind.pickFix': 'Now pick the fix',

  // ---------- classic questions ----------
  // Before the expected program output, when the answer is revealed.
  'lesson.question.itPrints': 'It prints:',
  'lesson.question.codeLinesAria': 'Code: pick the line with the bug',
  // Screen-reader label of one clickable code line.
  'lesson.question.lineAria': 'Line {line}',
  // Above the error message the buggy program produces.
  'lesson.question.whenYouRun': 'When you run it',
  'lesson.question.lineFound': '✓ Line {line} is the culprit. Which change fixes it?',
  'lesson.question.outputPlaceholder': 'Type exactly what it prints',
  'lesson.question.outputAria': 'Output',
  // Placeholder of a number answer: use the decimal separator learners type in this language.
  'lesson.question.numericPlaceholder': 'e.g. 0.25, 1/4 or 42',
  'lesson.question.textPlaceholder': 'Type your answer',
  'lesson.question.outputTip': 'One line per printed line. Press Ctrl/⌘ + Enter to check.',

  // ---------- question feedback (QuestionFrame) ----------
  'lesson.frame.needHint': 'Need a hint?',
  // {hint} is the hint text; <b>…</b> is bold.
  'lesson.frame.hintLine': '<b>Hint:</b> {hint}',
  // Heading of the explanation shown after answering.
  'lesson.frame.why': 'Why',
  // Right on the second try or later.
  'lesson.frame.gotIt': 'Got it!',
  'lesson.frame.xpGained': '+{xp} XP',
  'lesson.frame.secondTries': 'Second tries count too.',
  'lesson.frame.notQuite': 'Not quite.',
  'lesson.frame.retryNudge': 'Think it through once more — retries are where learning happens.',
  'lesson.frame.incorrect': 'Incorrect',
  'lesson.frame.heresAnswer': 'Here’s the answer',
  'lesson.frame.readWhy': "Read why, and it'll come back in your reviews.",
  // Button.
  'lesson.frame.showAnswer': 'Show answer',
  // {answer} is the correct answer; <b>…</b> is bold.
  'lesson.frame.correctAnswer': '<b>Correct answer:</b> {answer}',

  // ---------- correct-answer texts (src/lib/answers.ts) ----------
  // A number answer with its unit, e.g. "42 ms".
  'lesson.answer.withUnit': '{value} {unit}',
  // Bug hunt: the broken line and its fix.
  'lesson.answer.bugFix': 'Line {line}: {fix}',
  // Trace: {expr} is code like "n = 2" (keep the backticks).
  'lesson.answer.traceValue': '`{expr}` after line {line}',
  // Truth table answers: one letter for true and for false.
  'lesson.answer.true': 'T',
  'lesson.answer.false': 'F',

  // ---------- question sessions (review, mixed practice, quiz) ----------
  // Screen-reader label of the score pill.
  'lesson.session.correctSoFar': { one: '{count} correct so far', other: '{count} correct so far' },
  'lesson.session.shorterHeading': 'Squeeze this session into anchors',
  'lesson.session.shorterIntro': 'What will you remember, or do differently next time? Two or three anchors, four words at most each.',
  // Button.
  'lesson.session.seeResults': 'See results',
} satisfies Record<string, Message>;
