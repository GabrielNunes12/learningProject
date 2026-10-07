// English UI strings: games. English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
// The interactive steps in src/components/games (balance, buckets, logic grid, order, trace, truth table) and the
// text their pure helpers in src/lib build (balance.ts move descriptions and refusals, truthTableUi.ts spoken logic).
// Many strings are screen-reader announcements: they are never seen, only heard, so keep them short and natural.
import type { Message } from '../core.ts';

export default {
  // ---------- shared by several games ----------
  // Small counter chip; {moves} is the number (rendered bold).
  'games.common.moves': 'Moves {moves}',
  // Small button: undo the last move.
  'games.common.undo': '↶ Undo',
  // Small button: empty the whole board.
  'games.common.clear': 'Clear',
  // Screen reader: undo was pressed.
  'games.common.undone': 'Undone.',

  // ---------- balance the equation (BalanceGame + src/lib/balance.ts) ----------
  // Step type label shown above the question.
  'games.balance.kind': 'Balance the equation',
  // Disabled main button once x stands alone / while it doesn't.
  'games.balance.solved': 'Solved!',
  'games.balance.solveToContinue': 'Solve it to continue',
  // A move done to both sides. {amount} is a number or term like "3", "2x" or "(−1)"; keep the math symbol first.
  'games.balance.move.add': '+ {amount} to both sides',
  'games.balance.move.subtract': '− {amount} from both sides',
  'games.balance.move.multiply': '× {amount} on both sides',
  'games.balance.move.divide': '÷ {amount} on both sides',
  // Why a move is refused. {v} is the variable letter (usually x).
  'games.balance.reason.wholeNumbers': 'Stick to whole numbers for the amount.',
  'games.balance.reason.noVarMultiply': 'Multiplying or dividing by {v} isn’t a balance move here: add or take away {v}-terms instead.',
  'games.balance.reason.addZero': 'Adding 0 changes nothing. Pick an amount.',
  'games.balance.reason.subtractZero': 'Taking away 0 changes nothing. Pick an amount.',
  'games.balance.reason.multiplyZero': 'Multiplying by 0 turns both sides into 0: still balanced, but every clue about {v} is gone.',
  'games.balance.reason.multiplyOne': 'Multiplying by 1 changes nothing.',
  'games.balance.reason.divideZero': 'You can’t divide by 0.',
  'games.balance.reason.divideOne': 'Dividing by 1 changes nothing.',
  // {k} is the divisor, {numbers} the numbers that wouldn't divide evenly, as a list ("3 and 9").
  'games.balance.reason.fractionsMoveFirst':
    'Dividing everything by {k} would break {numbers} into fractions. Move the loose numbers off the side with {v} first, then divide.',
  'games.balance.reason.fractionsTryCommon':
    'Dividing everything by {k} would break {numbers} into fractions. Try a number that goes into every number on the scale, like the number in front of {v}.',
  'games.balance.reason.tooBig': 'Those numbers would get huge. Try a move that makes things simpler.',
  'games.balance.typeWholeNumber': 'Type a whole number for the amount.',
  // Screen reader, after a move. {move} is a move like "− 3 from both sides", {equation} like "2x = 6".
  'games.balance.announce.moved': '{move}. Now {equation}.',
  'games.balance.announce.solved': {
    one: '{move}. {equation}. Solved: {v} = {value}, in {count} move.',
    other: '{move}. {equation}. Solved: {v} = {value}, in {count} moves.',
  },
  'games.balance.announce.undone': 'Undone. Back to {equation}.',
  'games.balance.announce.restart': 'Back to the start: {equation}.',
  // What a pan holds, read by screen readers. {v} is the variable letter: "2 x-tiles", "1 minus-x balloon".
  'games.balance.pan.xTiles': { one: '{count} {v}-tile', other: '{count} {v}-tiles' },
  'games.balance.pan.oneWeights': { one: '{count} one-weight', other: '{count} one-weights' },
  'games.balance.pan.minusXBalloons': { one: '{count} minus-{v} balloon', other: '{count} minus-{v} balloons' },
  'games.balance.pan.minusOneBalloons': { one: '{count} minus-one balloon', other: '{count} minus-one balloons' },
  'games.balance.pan.empty': 'empty',
  // {left} / {right} describe each pan, e.g. "2 x-tiles and 3 one-weights".
  'games.balance.scaleLabel': 'Balance scale, level. Left pan: {left}. Right pan: {right}.',
  // Chip: par is the fewest moves possible. {par} is the number (rendered bold).
  'games.balance.par': { one: 'Par {par} move', other: 'Par {par} moves' },
  'games.balance.stars': '{stars} of 3 stars',
  'games.balance.yourSteps': 'Your steps',
  // Screen reader, before each equation in the step list: "then − 3 from both sides: 2x = 6".
  'games.balance.then': 'then {move}: ',
  'games.balance.padTitle': 'Do the same to both sides',
  'games.balance.operation': 'Operation',
  'games.balance.op.add': 'Add',
  'games.balance.op.subtract': 'Subtract',
  'games.balance.op.multiply': 'Multiply',
  'games.balance.op.divide': 'Divide',
  'games.balance.smaller': 'Smaller amount',
  'games.balance.amount': 'Amount',
  'games.balance.bigger': 'Bigger amount',
  // Toggle button showing the variable letter: the amount is a number of x-terms rather than plain units.
  'games.balance.xTermsLabel': 'Amount is {v}-terms',
  'games.balance.xTermsTip': 'Use {v}-terms (key {v})',
  'games.balance.quickAmounts': 'Quick amounts from the scale',
  'games.balance.doIt': 'Do it to both sides',
  'games.balance.restart': 'Restart',
  'games.balance.showHow': 'Show me how',
  'games.balance.tip': 'Every move counts, even ones you undo. Enter does the move.',
  // Result line. {moves} is the number of moves (bold), {v} = {value} the solution, e.g. "x = 4".
  'games.balance.onPar': {
    one: '{v} = {value} in {moves} move: right on par!',
    other: '{v} = {value} in {moves} moves: right on par!',
  },
  'games.balance.overPar': {
    one: '{v} = {value} in {moves} move. Par is {par}: can you see the shortcut?',
    other: '{v} = {value} in {moves} moves. Par is {par}: can you see the shortcut?',
  },

  // ---------- sort the cards (BucketsGame) ----------
  'games.buckets.kind': 'Sort the cards',
  // Main button once every card is placed.
  'games.buckets.finish': 'Finish',
  // Main button while sorting (very short).
  'games.buckets.sortedCount': '{done}/{total} sorted',
  // Screen reader. {text} is the card, {bucket} the bucket's name.
  'games.buckets.announce.right': 'Right: {text} goes in {bucket}.',
  'games.buckets.announce.miss': 'Miss: {text} belongs in {bucket}.',
  'games.buckets.announce.next': 'Next: {text}.',
  'games.buckets.announce.last': 'That was the last card.',
  'games.buckets.announce.tryAnother': 'Not {bucket}. Try another bucket for {text}.',
  'games.buckets.announce.newDeck': 'New deck. First card: {text}.',
  // HUD; {n} is the current card number (bold).
  'games.buckets.cardOf': 'Card {n}/{total}',
  // HUD; {misses} is the number (bold).
  'games.buckets.misses': 'Misses {misses}',
  'games.buckets.cardsSorted': 'Cards sorted',
  'games.buckets.cardLabel': 'Card {n} of {total}: {text}',
  'games.buckets.dragMe': 'Drag me to a bucket',
  'games.buckets.deckSorted': 'Deck sorted',
  'games.buckets.cleanSweep': 'Clean sweep!',
  // End-of-deck stats line: {cards} · {misses} · {time}, e.g. "8 cards · 1 miss · 0:42".
  'games.buckets.doneStats': '{cards} · {misses} · {time}',
  'games.buckets.cards': { one: '{count} card', other: '{count} cards' },
  'games.buckets.missCount': { one: '{count} miss', other: '{count} misses' },
  'games.buckets.perfectRun': 'A perfect run has no misses.',
  'games.buckets.bucketLabel': { one: 'Bucket {n}: {label}, {count} card', other: 'Bucket {n}: {label}, {count} cards' },
  // {max} is the highest number key (2 to 4).
  'games.buckets.howto': 'Drag the card onto a bucket, tap a bucket, or press 1–{max}.',

  // ---------- put these in order (OrderGame) ----------
  'games.order.kind': 'Put these in order',
  // Screen reader after a move. {text} is the piece.
  'games.order.announce.moved': '{text}: now position {pos} of {total}.',
  'games.order.announce.checked': {
    one: '{count} of {total} pieces are in the right place.',
    other: '{count} of {total} pieces are in the right place.',
  },
  'games.order.movesLabel': { one: '{count} move', other: '{count} moves' },
  'games.order.inPlaceCount': '{done}/{total} in place',
  // Tip next to the move counter; ⠿ is the drag handle drawn on each card.
  'games.order.tip': 'Drag the ⠿ handle, or use ↑ ↓',
  'games.order.listLabel': 'Pieces in your order',
  'games.order.position': 'Position {pos}: {text}',
  'games.order.positionInPlace': 'Position {pos}: {text}, in place',
  'games.order.positionWrong': 'Position {pos}: {text}, in the wrong place',
  // Tiny badges on a card after a check.
  'games.order.markRight': '✓ in place',
  'games.order.markWrong': '✗ wrong spot',
  'games.order.moveUp': 'Move “{text}” up',
  'games.order.moveDown': 'Move “{text}” down',
  'games.order.howto': 'Focus a piece and press the up or down arrow key to move it, Home or End to send it to the top or bottom.',
  // {moves} is the number of moves (bold).
  'games.order.fewest': {
    one: 'Sorted in {moves} move: the fewest possible!',
    other: 'Sorted in {moves} moves: the fewest possible!',
  },
  'games.order.notFewest': {
    one: 'Sorted in {moves} move. The fewest possible was {fewest}.',
    other: 'Sorted in {moves} moves. The fewest possible was {fewest}.',
  },

  // ---------- solve the logic grid (LogicGridGame) ----------
  'games.logicGrid.kind': 'Solve the logic grid',
  // Main button while rows are still unmatched (very short).
  'games.logicGrid.matchedCount': '{done}/{total} matched',
  // A cell's state, read by screen readers: a match (✓), not a match (✗), or empty.
  'games.logicGrid.mark.yes': 'yes',
  'games.logicGrid.mark.no': 'no',
  'games.logicGrid.mark.blank': 'blank',
  // Screen reader / cell label. {row} and {col} are the two items the cell pairs, {mark} one of yes / no / blank.
  'games.logicGrid.cell': '{row} and {col}: {mark}',
  'games.logicGrid.cellWrong': '{row} and {col}: {mark}, wrong',
  'games.logicGrid.cellMissed': '{row} and {col}: {mark}, you had this as a match',
  'games.logicGrid.announce.set': '{row} and {col}: {mark}.',
  'games.logicGrid.announce.crossed': 'The rest of its row and column are crossed out.',
  'games.logicGrid.announce.cleared': 'Grid cleared. Undo brings it back.',
  'games.logicGrid.announce.helpersOn': 'Helpers on: a check mark crosses out the rest of its row and column.',
  'games.logicGrid.announce.helpersOff': 'Helpers off.',
  'games.logicGrid.announce.solved': 'Solved! Every match is right.',
  'games.logicGrid.announce.wrong': {
    one: "{count} check mark is wrong. They're highlighted in the grid.",
    other: "{count} check marks are wrong. They're highlighted in the grid.",
  },
  'games.logicGrid.gridLabel': 'Logic grid',
  'games.logicGrid.clues': 'Clues',
  // Next to the clue list title: how many clues have been crossed off.
  'games.logicGrid.cluesUsed': '{used}/{total} used',
  'games.logicGrid.clueTip': "Tap a clue to cross it off once you've used it.",
  'games.logicGrid.helperLabel': 'Auto cross-out helper',
  // Toggle button (very short): automatic ✗ marks.
  'games.logicGrid.helper': 'Auto-✗',
  'games.logicGrid.tapTip': 'Tap: ✗ → ✓ · hold or right-click: ✓',
  'games.logicGrid.solution': 'Solution',
  'games.logicGrid.solutionSoFar': 'Solution so far',
  'games.logicGrid.unknown': 'unknown',
  'games.logicGrid.wrongSr': ' (wrong)',
  'games.logicGrid.inferredNote': 'Faded entries come from the bottom block: tick them in the rows above too.',
  'games.logicGrid.legend': 'Matches you had wrong.',
  'games.logicGrid.result': {
    one: 'Solved! All {size} rows matched from {count} clue.',
    other: 'Solved! All {size} rows matched from {count} clues.',
  },
  // Screen-reader instructions. O marks a match and X rules one out (V works for a match too).
  'games.logicGrid.howto':
    'Each cell pairs the item of its row with the item of its column. Use the arrow keys to move. Press O for a match, X to rule it out, Space to cycle, Backspace to clear.',
  'games.logicGrid.howtoHelpers': 'Helpers are on: a match crosses out the rest of its row and column.',

  // ---------- trace the code (TraceGame) ----------
  'games.trace.kind': 'Trace the code',
  // Disabled main button until the trace reaches its last step.
  'games.trace.stepToEnd': 'Step to the end',
  // Screen reader. {line} is a line number, {name} a variable name.
  'games.trace.announce.notStarted': { one: 'Nothing has run yet. {count} step.', other: 'Nothing has run yet. {count} steps.' },
  'games.trace.announce.predict': 'Line {line} ran. Predict the value of {name}.',
  'games.trace.announce.step': 'Step {n} of {total}: line {line} ran.',
  // {changes} lists the variables that changed, e.g. "x = 3, total = 10".
  'games.trace.announce.changed': 'Changed: {changes}.',
  'games.trace.announce.nothingChanged': 'Nothing changed.',
  'games.trace.code': 'Code',
  // Panel title: the program's variables.
  'games.trace.memory': 'Memory',
  'games.trace.notStarted': 'Nothing has run yet. Press Step to run line {line}.',
  'games.trace.noVars': 'No variables yet.',
  'games.trace.predictIt': 'unknown: predict it',
  'games.trace.hidden': 'hidden for now',
  // Panel title: what the program printed.
  'games.trace.output': 'Output',
  // {name} is the variable (shown as code).
  'games.trace.question': 'Line {line} just ran. What is {name} now?',
  'games.trace.placeholder': 'Type the value',
  'games.trace.notQuite': '✗ Not quite. Look at line {line} again and retry.',
  'games.trace.showMe': 'Show me',
  // After a prediction. {value} is "name = value" shown as code.
  'games.trace.right': '✓ Right: {value}',
  'games.trace.gotIt': '✓ Got it: {value}',
  'games.trace.notThisTime': '✗ Not this time: {value}',
  'games.trace.hereItIs': 'Here it is: {value}',
  'games.trace.backLabel': 'Back one step',
  // Small buttons.
  'games.trace.back': '← Back',
  'games.trace.pause': '❚❚ Pause',
  'games.trace.play': '▶ Play',
  'games.trace.forwardLabel': 'Step forward',
  'games.trace.forward': 'Step →',
  // Counter under the code.
  'games.trace.ready': { one: 'Ready · {count} step', other: 'Ready · {count} steps' },
  'games.trace.stepOf': 'Step {n} of {total}',
  // Appended to the counter after " · " once every step has been seen.
  'games.trace.done': 'done',
  // Timeline slider.
  'games.trace.frame': 'Frame',
  'games.trace.notStartedShort': 'Not started',
  'games.trace.stepOfLine': 'Step {n} of {total}, line {line}',
  // Tooltip on a timeline tick that marks a prediction.
  'games.trace.prediction': 'Prediction',
  'games.trace.tip': {
    one: 'One value to predict (marked on the timeline). Keys: ← → to step.',
    other: '{count} values to predict (marked on the timeline). Keys: ← → to step.',
  },

  // ---------- fill in the truth table (TruthTableGame + src/lib/truthTableUi.ts) ----------
  'games.truth.kind': 'Fill in the truth table',
  // One-letter cell values for true and false. Use your language's initials (e.g. V / F). Typing either letter
  // fills a cell: T, V and 1 mean true; F and 0 mean false.
  'games.truth.t': 'T',
  'games.truth.f': 'F',
  // Cell values read by screen readers.
  'games.truth.true': 'true',
  'games.truth.false': 'false',
  'games.truth.blank': 'blank',
  // Logic operators read aloud by screen readers: "not (P and Q) implies R".
  'games.truth.say.not': 'not',
  'games.truth.say.and': 'and',
  'games.truth.say.or': 'or',
  'games.truth.say.xor': 'xor',
  'games.truth.say.implies': 'implies',
  'games.truth.say.iff': 'if and only if',
  // Main button while cells are empty (very short).
  'games.truth.filledCount': '{done}/{total} filled',
  // Screen reader: a row's input values. {values} lists "P true, Q false".
  'games.truth.row': 'Row {n}: {values}',
  // One input in a row: variable name then its value ("P true").
  'games.truth.varValue': '{name} {value}',
  // Screen reader after setting a cell. {col} is the column's expression read aloud.
  'games.truth.announce.set': '{col}, row {row}: {value}.',
  'games.truth.announce.allRight': { one: 'All {count} row is right.', other: 'All {count} rows are right.' },
  'games.truth.announce.rowsRight': '{right} of {total} rows right.',
  'games.truth.announce.cellsToFix': { one: '{count} cell needs fixing.', other: '{count} cells need fixing.' },
  'games.truth.announce.cleared': 'Table cleared.',
  // HUD chips; the number after the label is bold.
  'games.truth.rowsDone': 'Rows ✓ {n}',
  'games.truth.rowsRightChip': 'Rows right {n}',
  'games.truth.filledChip': 'Filled {n}',
  // {t} / {f} are the one-letter values above.
  'games.truth.tapTip': 'Tap a cell: {t} → {f} → blank',
  'games.truth.tableLabel': 'Truth table',
  // Column header label for a column whose values are already filled in.
  'games.truth.givenLabel': '{col} (given)',
  // Tiny tag under a pre-filled column header.
  'games.truth.given': 'given',
  // Cell label. {row} is the row read aloud, {col} the column, {value} true / false / blank.
  'games.truth.cell': '{row}. {col}: {value}',
  'games.truth.cellRight': '{row}. {col}: {value}, right',
  'games.truth.cellWrong': '{row}. {col}: {value}, wrong',
  'games.truth.cellMissed': '{row}. {col}: {value}, you had {mine}',
  'games.truth.legend': 'Cells you had wrong (your answer in the corner).',
  'games.truth.result': {
    one: 'Every row checks out: {count} cell, all right.',
    other: 'Every row checks out: {count} cells, all right.',
  },
  // Screen-reader instructions. {t} / {f} are the one-letter values above.
  'games.truth.howto':
    'Tab into the table, then use the arrow keys to move between empty cells. Press {t} or {f} to fill a cell and move down the column, Space to cycle through true, false and blank, and Backspace to clear.',
} satisfies Record<string, Message>;
