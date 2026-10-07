// English UI strings: thinking. Thinking on paper: the three phases that open and close every study session
// (src/components/paper/Ritual.tsx), the sheet of paper (src/components/paper/PaperSheet.tsx), the Notebook page and
// its Home teaser (src/components/Notebook.tsx), and the "what is missing" lines from src/lib/thinking.ts.
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  // ---------- the three phases (product terms: pick one punchy equivalent each and reuse it everywhere) ----------
  // Phase 1, at the start of a lesson: write down guesses before learning, even wrong ones, and sort them into piles.
  // The idea is "dare to be wrong first". Shown as a step tag and as a bold lead-in in the Notebook.
  'thinking.phase.wrong': 'Make it wrong',
  // Phase 2, at the end of a session: squeeze what was learned into 2–3 tiny "anchors" (4 words at most each).
  'thinking.phase.shorter': 'Make it shorter',
  // Phase 3, at the start of a later session: rebuild an old sheet from memory on blank paper, then fix it.
  'thinking.phase.again': 'Make it again',

  // ---------- missing-step messages (src/lib/thinking.ts), shown in the bottom bar while a phase is not done ----------
  'thinking.missing.wrongKeywords': { one: 'Add {count} more keyword. Guesses count.', other: 'Add {count} more keywords. Guesses count.' },
  // "Columns" are the pile areas on the paper, below the tray.
  'thinking.missing.wrongPiles': {
    one: 'Sort them into {count} pile: drag keywords down into the columns.',
    other: 'Sort them into {count} piles: drag keywords down into the columns.',
  },
  // {count} is the word limit per anchor (4). Words are counted by the spaces between them.
  'thinking.missing.anchorTooLong': { one: 'Each anchor is {count} word or fewer.', other: 'Each anchor is {count} words or fewer.' },
  'thinking.missing.moreAnchors': { one: 'Write {count} more anchor.', other: 'Write {count} more anchors.' },
  'thinking.missing.recall': {
    one: 'Write {count} more keyword from memory first.',
    other: 'Write {count} more keywords from memory first.',
  },

  // ---------- sheet titles for review/practice/quiz sessions (Notebook, "Make it again") ----------
  'thinking.session.review': 'Review',
  // {course} is a course title.
  'thinking.session.reviewCourse': 'Review: {course}',
  'thinking.session.practice': 'Mixed practice',
  'thinking.session.practiceCourse': 'Mixed practice: {course}',
  'thinking.session.quiz': 'Quiz',
  'thinking.session.quizCourse': 'Quiz: {course}',

  // ---------- make it wrong (start of a lesson) ----------
  // {topic} is the lesson title.
  'thinking.wrong.heading': 'What do you already think about “{topic}”?',
  'thinking.wrong.lead':
    'Put keywords on the paper before the lesson: guesses, half-memories, even wrong ones. Then sort them into piles that feel related. Nothing here is graded; a messy first try gives the lesson something to hook onto.',
  // Accessible name of the sheet. {topic} is the lesson title.
  'thinking.wrong.sheetLabel': 'Your first guesses about {topic}',
  // {time} is the time spent so far, like "2:05" (minutes:seconds).
  'thinking.wrong.ready': 'Good. {time} on paper.',
  // Button.
  'thinking.wrong.start': 'Start the lesson',

  // ---------- make it shorter (end of a session) ----------
  // Placeholder of the first two anchor inputs.
  'thinking.shorter.placeholder': 'a few words',
  'thinking.shorter.placeholderOptional': 'optional third anchor',
  // Accessible name of an anchor input. {n} is its number; {count} is the word limit.
  'thinking.shorter.anchorLabel': { one: 'Anchor {n}, {count} word at most', other: 'Anchor {n}, {count} words at most' },
  // Word counter next to an anchor input: "2/4 words". {count} is the limit.
  'thinking.shorter.wordCount': { one: '{n}/{count} word', other: '{n}/{count} words' },
  // Heading above the list of course ideas the learner's anchors mention.
  'thinking.shorter.hitHeading': 'Your anchors name',
  'thinking.shorter.ownWords': 'Your anchors are in your own words, which is fine: they only have to bring the idea back for you.',
  'thinking.shorter.missedHeading': 'Behind the questions you missed',
  'thinking.shorter.alsoHeading': 'Also in this lesson',
  'thinking.shorter.notMistake': 'Not a mistake: worth one more look before you move on.',
  'thinking.shorter.beforeHeading': 'Before the lesson you wrote',
  'thinking.shorter.firstGuesses': 'Your first guesses',
  'thinking.shorter.rebuildNext': "You'll rebuild this sheet from memory at the start of your next session, and fix what's wrong.",
  'thinking.shorter.ready': 'Short enough. Messy is fine.',
  // Button: shows what the anchors cover.
  'thinking.shorter.squeeze': 'Squeeze it',

  // ---------- make it again (start of a later session) ----------
  // {title} is the sheet's title (a lesson title or a session name).
  'thinking.again.heading': 'Rebuild “{title}” from memory',
  'thinking.again.lead':
    'Blank paper, no peeking. Write the keywords and anchors you remember from that sheet, and arrange them the way they connect now. Pulling it back out is what makes it stick.',
  'thinking.again.sheetLabel': 'Rebuilding {title} from memory',
  'thinking.again.compareHeading': 'Compare and clean it up',
  'thinking.again.compareLead':
    "Here's your old sheet. Keep what still holds, fix what was wrong, drop what doesn't matter. Your clean version replaces the old one.",
  'thinking.again.oldSheet': 'Your old sheet',
  'thinking.again.verdictHeading': 'Keep, fix or drop',
  // Small tag after an item that was one of the sheet's anchors (not a plain keyword).
  'thinking.again.anchorTag': 'anchor',
  // Badge on an old item the learner wrote again from memory.
  'thinking.again.remembered': 'remembered',
  // {item} is a keyword or anchor the learner wrote.
  'thinking.again.verdictGroup': 'What to do with {item}',
  // Three short toggle buttons (tight space).
  'thinking.again.keep': 'Keep',
  'thinking.again.fix': 'Fix',
  'thinking.again.drop': 'Drop',
  'thinking.again.fixLabel': 'Corrected version of {item}',
  'thinking.again.cleanSheet': 'Your clean sheet',
  'thinking.again.cleanNote': 'What you wrote from memory. Re-sort it, add what you just fixed, draw how it connects.',
  'thinking.again.savedHeading': 'Clean sheet saved',
  // Result tiles (short labels).
  'thinking.again.tileRemembered': 'Remembered',
  'thinking.again.tileFixed': 'Fixed',
  'thinking.again.tileXp': 'XP',
  'thinking.again.nextRedo': {
    one: 'Next redo of this sheet in {count} day. Each time, the gap grows.',
    other: 'Next redo of this sheet in {count} days. Each time, the gap grows.',
  },
  'thinking.again.recalled': { one: '{count} keyword from memory.', other: '{count} keywords from memory.' },
  'thinking.again.broughtBack': 'You brought back {got} of {total}.',
  // Buttons.
  'thinking.again.compare': 'Compare with my old sheet',
  'thinking.again.save': 'Save the clean sheet',

  // ---------- the sheet of paper ----------
  'thinking.paper.placeholder': 'Type a keyword, press Enter',
  'thinking.paper.tools': 'Sheet tools',
  'thinking.paper.tool': 'Tool',
  // Tool toggle: typing keywords vs drawing with a pen (tight space).
  'thinking.paper.keywords': 'Keywords',
  'thinking.paper.pen': 'Pen',
  'thinking.paper.undoInk': 'Undo ink',
  // Button that adds a pile (a column to sort keywords into).
  'thinking.paper.addPile': '+ Pile',
  // Keyword counter: "5/24 keywords". {count} is the maximum.
  'thinking.paper.count': { one: '{n}/{count} keyword', other: '{n}/{count} keywords' },
  // Name shown for a pile the learner has not named. {n} is its number.
  'thinking.paper.pile': 'Pile {n}',
  // The same, inside a sentence read by screen readers ("loop, in pile 2").
  'thinking.paper.pileInline': 'pile {n}',
  'thinking.paper.pilePlaceholder': 'Pile {n}: name it',
  'thinking.paper.pileNameLabel': 'Name of pile {n}',
  // Faint label in the tray, the strip at the top of the paper.
  'thinking.paper.trayLabel': 'new keywords land here, drag them down into a pile',
  // Accessible names of a keyword on the paper. {text} is the keyword, {pile} a pile name, {old} its earlier wording.
  'thinking.paper.chipInPile': '{text}, in {pile}',
  'thinking.paper.chipInTray': '{text}, not sorted yet',
  'thinking.paper.chipInPileFixed': '{text}, in {pile}, corrected from {old}',
  'thinking.paper.chipInTrayFixed': '{text}, not sorted yet, corrected from {old}',
  // Tooltip on a corrected keyword. {old} is what it said before.
  'thinking.paper.was': 'Was: {old}',
  'thinking.paper.empty': 'Empty paper. Start with any word that comes to mind.',
  'thinking.paper.moveGroup': 'Move "{text}"',
  // Before a row of pile buttons: "Move <keyword> to [Pile 1] [Pile 2] [Tray]".
  'thinking.paper.moveTo': 'Move {text} to',
  // Button: back to the tray, the strip for unsorted keywords.
  'thinking.paper.tray': 'Tray',
  'thinking.paper.remove': 'Remove',
  'thinking.paper.newKeyword': 'New keyword',
  'thinking.paper.add': 'Add',
  // {max} is the number of piles (2 or 3). "Delete" is the keyboard key.
  'thinking.paper.hint':
    'Drag a keyword into a pile, or tap it and choose. With a keyboard: focus a keyword, press 1–{max} to sort it, Delete to remove.',

  // ---------- the Notebook page ----------
  'thinking.notebook.title': 'Notebook',
  'thinking.notebook.subtitle': 'Every sheet you thought on: your first guesses, your anchors, and the clean versions you rebuilt from memory.',
  'thinking.notebook.streak': 'Thinking streak',
  // Under the streak: on how many of the last 7 days the learner did a thinking phase.
  'thinking.notebook.daysThisWeek': '{days} of the last 7 days',
  // Share of old keywords brought back in "Make it again".
  'thinking.notebook.recall': 'Rebuilt from memory',
  'thinking.notebook.redos': { one: '{count} redo', other: '{count} redos' },
  // After the redo count: how many sheets are waiting to be rebuilt.
  'thinking.notebook.due': { one: '{count} due', other: '{count} due' },
  'thinking.notebook.methodHeading': 'How every session works',
  // The three steps. {phase} is the phase name (thinking.phase.*); <b>…</b> is bold.
  'thinking.notebook.methodWrong': "<b>{phase}.</b> Before a lesson, put what you think you know on paper and sort it, even if it's wrong.",
  'thinking.notebook.methodShorter': '<b>{phase}.</b> After every session, squeeze it into 2–3 anchors of four words or fewer.',
  'thinking.notebook.methodAgain':
    '<b>{phase}.</b> Next session, rebuild an old sheet from a blank page, then fix and reorganise it. The gap grows each time.',
  'thinking.notebook.empty': 'No sheets yet. Your first lesson starts with one.',
  'thinking.notebook.pickLesson': 'Pick a lesson',
  'thinking.notebook.sessionAnchors': 'Session anchors',
  // Under a sheet title. "×" means "times".
  'thinking.notebook.rebuilt': 'rebuilt {count}×, last time {remembered}/{total} from memory',
  'thinking.notebook.firstDraft': 'first draft',
  'thinking.notebook.nextRedoNow': 'next redo due now',
  'thinking.notebook.nextRedoToday': 'next redo later today',
  'thinking.notebook.nextRedoTomorrow': 'next redo tomorrow',
  'thinking.notebook.nextRedoDays': { one: 'next redo in {count} day', other: 'next redo in {count} days' },
  // Accessible names of a sheet. {title} is the sheet's title.
  'thinking.notebook.cleanSheetFor': 'Clean sheet for {title}',
  'thinking.notebook.firstDraftFor': 'First draft for {title}',
  'thinking.notebook.showSheet': 'Show sheet',
  'thinking.notebook.hideSheet': 'Hide sheet',

  // ---------- Home teaser card ----------
  'thinking.teaser.eyebrow': 'Thinking on paper',
  'thinking.teaser.due': {
    one: '{count} sheet ready to rebuild from memory. Your next session opens with one.',
    other: '{count} sheets ready to rebuild from memory. Your next session opens with one.',
  },
  // Two sentences shown together: "Thinking streak: 3 days. 5 sheets in your notebook."
  'thinking.teaser.streak': { one: 'Thinking streak: {count} day.', other: 'Thinking streak: {count} days.' },
  'thinking.teaser.sheets': { one: '{count} sheet in your notebook.', other: '{count} sheets in your notebook.' },
} satisfies Record<string, Message>;
