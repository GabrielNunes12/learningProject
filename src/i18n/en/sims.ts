// English UI strings: sims. The lesson playgrounds in src/components/sims (dice, Git, Big-O race, JOIN) and the
// text their pure models build in src/lib (dicesim, gitsim, growthsim, joinsim); also the dev-only #/dev/games page.
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  // ---------- the card around every simulator (SimStepView) ----------
  // Small label above the simulator's title.
  'sims.playground': 'Playground',
  'sims.goal.label': 'Goal',
  'sims.goal.reached': 'Goal reached!',
  'sims.goal.keepPlaying': "Keep playing, or continue when you're ready.",
  'sims.goal.rollAtLeast': { one: 'Roll at least {count} time.', other: 'Roll at least {count} times.' },

  // ---------- dice / coin simulator ----------
  // Coin sides. Full names, a one-letter abbreviation shown on the coin and chart axis, and a lowercase form
  // used inside sentences ("Hits (heads)").
  'sims.dice.heads': 'Heads',
  'sims.dice.tails': 'Tails',
  'sims.dice.headsShort': 'H',
  'sims.dice.tailsShort': 'T',
  'sims.dice.headsLower': 'heads',
  'sims.dice.tailsLower': 'tails',
  // What counts as a hit. {values} is a list of numbers like "7" or "7 or 11".
  'sims.dice.targetFace': 'a {values}',
  'sims.dice.targetTotal': 'a total of {values}',
  // Badge next to the dice when the roll hits the target.
  'sims.dice.hitBadge': 'hit',
  'sims.dice.flipGroup': 'Flip the coin',
  'sims.dice.rollGroup': 'Roll the dice',
  // Buttons: flip/roll {count} times at once. Tight space.
  'sims.dice.flipTimes': 'Flip ×{count}',
  'sims.dice.rollTimes': 'Roll ×{count}',
  'sims.dice.reset': 'Reset',
  // Status line before anything happens. {target} is e.g. "heads" or "a total of 7".
  'sims.dice.startFlip': 'Target: {target}. Flip to start.',
  'sims.dice.startRoll': 'Target: {target}. Roll to start.',
  'sims.dice.resetDone': 'Reset. No rolls yet.',
  // Status line after one roll: three sentences joined by a space, e.g. "Rolled 3 + 4 = 7. Hit! Observed 16.7% after 6 rolls."
  'sims.dice.rolledFace': 'Rolled {face}.',
  'sims.dice.rolledOne': 'Rolled a {total}.',
  'sims.dice.rolledSum': 'Rolled {sum} = {total}.',
  'sims.dice.hit': 'Hit!',
  'sims.dice.miss': 'Miss.',
  'sims.dice.observedAfterRolls': { one: 'Observed {observed} after {count} roll.', other: 'Observed {observed} after {count} rolls.' },
  // Status line after a batch, e.g. "100 more rolls: 17 hits. Observed 16.2% after 111."
  // {hits} is sims.dice.hits; {count} in observedAfter is the total number of rolls.
  'sims.dice.moreFlips': { one: '{count} more flip: {hits}.', other: '{count} more flips: {hits}.' },
  'sims.dice.moreRolls': { one: '{count} more roll: {hits}.', other: '{count} more rolls: {hits}.' },
  'sims.dice.hits': { one: '{count} hit', other: '{count} hits' },
  'sims.dice.observedAfter': 'Observed {observed} after {count}.',
  // Stat labels.
  'sims.dice.flips': 'Flips',
  'sims.dice.rolls': 'Rolls',
  'sims.dice.hitsOf': 'Hits ({target})',
  'sims.dice.observed': 'Observed',
  'sims.dice.exact': 'Exact',
  // {gap} is a number with one decimal, e.g. "1.3".
  'sims.dice.gapFlips': {
    one: 'After {count} flip, observed is {gap} percentage points from exact.',
    other: 'After {count} flips, observed is {gap} percentage points from exact.',
  },
  'sims.dice.gapRolls': {
    one: 'After {count} roll, observed is {gap} percentage points from exact.',
    other: 'After {count} rolls, observed is {gap} percentage points from exact.',
  },
  // Before any roll. {outcomes} is the number of outcomes, {count} how many of them hit.
  'sims.dice.orderedOutcomes': {
    one: '{outcomes} equally likely ordered outcomes, {count} of them hits.',
    other: '{outcomes} equally likely ordered outcomes, {count} of them hit.',
  },
  'sims.dice.outcomes': {
    one: '{outcomes} equally likely outcomes, {count} of them hits.',
    other: '{outcomes} equally likely outcomes, {count} of them hit.',
  },
  // Histogram of totals.
  'sims.dice.histSides': 'How often each side came up, against the exact share',
  'sims.dice.histTotals': 'How often each total came up, against the exact share',
  'sims.dice.legendObserved': 'observed',
  'sims.dice.legendTarget': 'target',
  'sims.dice.legendExact': 'exact',
  // Tooltip on a histogram bar. {name} is the total or coin side; {observed} and {exact} are percentages.
  'sims.dice.barTipSeen': '{name}: {observed} seen · exact {exact}',
  'sims.dice.barTipNotRolled': '{name}: not rolled yet · exact {exact}',
  'sims.dice.colSide': 'Side',
  'sims.dice.colTotal': 'Total',
  'sims.dice.colSeen': 'Times seen',
  'sims.dice.colObserved': 'Observed share',
  'sims.dice.colExact': 'Exact share',
  'sims.dice.targetRow': '{name} (target)',
  // Running hit-rate chart.
  'sims.dice.rateTitle': 'Hit rate so far',
  'sims.dice.logScaleFlips': '(flips on a log scale)',
  'sims.dice.logScaleRolls': '(rolls on a log scale)',
  'sims.dice.rateAriaFlips': {
    one: 'Running hit rate for {target}: {rate} after {count} flip; the exact probability is {exact}.',
    other: 'Running hit rate for {target}: {rate} after {count} flips; the exact probability is {exact}.',
  },
  'sims.dice.rateAriaRolls': {
    one: 'Running hit rate for {target}: {rate} after {count} roll; the exact probability is {exact}.',
    other: 'Running hit rate for {target}: {rate} after {count} rolls; the exact probability is {exact}.',
  },
  'sims.dice.rateAriaNoFlips': 'Running hit rate: no flips yet. The exact probability is {exact}.',
  'sims.dice.rateAriaNoRolls': 'Running hit rate: no rolls yet. The exact probability is {exact}.',
  // Label on the chart's dashed line at the exact probability.
  'sims.dice.exactLine': 'exact {exact}',
  'sims.dice.flipToDraw': 'Flip to draw the line',
  'sims.dice.rollToDraw': 'Roll to draw the line',
  // Hover label on the chart, e.g. "250 rolls: 15.6%".
  'sims.dice.hoverFlips': { one: '{count} flip: {rate}', other: '{count} flips: {rate}' },
  'sims.dice.hoverRolls': { one: '{count} roll: {rate}', other: '{count} rolls: {rate}' },
  // Axis tick for thousands of rolls: "1k", "10k". Very tight space.
  'sims.dice.thousands': '{count}k',

  // ---------- Git playground ----------
  // Git's own output (errors, "Switched to branch…", git log) stays English like the real program;
  // these are the playground's own texts. Commands inside them (git switch -c, help) are typed as-is.
  'sims.git.terminal': 'Terminal',
  'sims.git.startOver': 'Start over',
  'sims.git.terminalOutput': 'Terminal output',
  'sims.git.emptyHint': 'Type a Git command and press Enter. Tap a suggestion to fill it in, or type help.',
  'sims.git.inputLabel': 'Git command (on branch {branch})',
  // Button that runs the typed command. Tight space.
  'sims.git.run': 'Run',
  'sims.git.suggestions': 'Command suggestions (fill the input)',
  // Commit message pre-filled by the "git commit -m" suggestion; the learner types over it.
  'sims.git.commitPlaceholder': 'Describe your change',
  // Screen-reader description of the commit graph. {summary} is sims.git.graph.summary.
  'sims.git.graphLabel': 'Commit graph: {summary}',
  'sims.git.graph.summary': '{commits}. Branches: {branches}.',
  'sims.git.graph.commits': { one: '{count} commit', other: '{count} commits' },
  // {total} commits, {count} of which are merge commits.
  'sims.git.graph.commitsWithMerges': {
    one: '{total} commits, {count} of them merge commit',
    other: '{total} commits, {count} of them merge commits',
  },
  // One branch tip, e.g. "main at 3f9a2c1". The list is joined with "; ".
  'sims.git.graph.tip': '{branch} at {commit}',
  'sims.git.graph.tipHead': '{branch} at {commit} (HEAD)',
  // The "help" command: a title, then one description per command (the commands themselves stay as typed).
  'sims.git.help.title': 'This playground understands:',
  'sims.git.help.commit': 'save a new snapshot on the current branch',
  'sims.git.help.branchList': 'list branches (* marks the current one)',
  'sims.git.help.branchCreate': 'create a branch here (without switching)',
  'sims.git.help.branchDelete': 'delete a merged branch',
  'sims.git.help.switch': 'move HEAD to another branch',
  'sims.git.help.switchCreate': 'create a branch and switch to it',
  'sims.git.help.checkout': 'the older spelling of switch [-c]',
  'sims.git.help.merge': 'merge a branch into the current one',
  'sims.git.help.log': 'list commits reachable from HEAD',
  'sims.git.help.status': 'show the current branch',
  'sims.git.help.clear': 'clear the terminal',
  // Hints printed under a command. {command} is a Git command, shown as typed.
  'sims.git.hint.startWithGit': 'Git commands start with "git", e.g. {command}',
  'sims.git.hint.typeCommand': 'Type a Git command such as git status, or "help" to see what works here.',
  'sims.git.hint.noFiles': 'There are no files in this playground: git commit saves a new snapshot straight away.',
  'sims.git.hint.unsupported': '{command} is a real command, but this playground only simulates commits, branches and merges.',
  'sims.git.hint.typeHelp': 'Type "help" to see the commands this playground understands.',
  // "Undo cheat sheet" is the title of a lesson in the Git course.
  'sims.git.hint.amend': 'git commit --amend is real (see "Undo cheat sheet"), but this playground only makes new commits.',
  'sims.git.hint.quoteMessage': 'Put the message in quotes: git commit -m "Add login form"',
  'sims.git.hint.branchFlag': "{command} isn't simulated here. Try git branch <name> or git branch -d <name>.",
  // "Safety nets" is the title of a lesson in the Git course.
  'sims.git.hint.detach': 'Detached HEAD is covered in "Safety nets"; this playground keeps HEAD on a branch.',
  'sims.git.hint.createIt': 'To create it, use {command}',
  'sims.git.hint.checkoutCommit': 'Checking out a commit gives a detached HEAD (see "Safety nets"); this playground keeps HEAD on a branch.',
  'sims.git.hint.mergeName': 'Name the branch to merge into this one, e.g. git merge feature',
  'sims.git.hint.mergeOne': 'Merge one branch at a time here, e.g. git merge feature',
  'sims.git.hint.oneline': '(This playground always prints the short --oneline format.)',

  // ---------- Big-O race ----------
  // Names of complexity classes, shown next to O(1), O(log n)…
  'sims.growth.curve.constant': 'constant',
  'sims.growth.curve.logarithmic': 'logarithmic',
  'sims.growth.curve.linear': 'linear',
  'sims.growth.curve.linearithmic': 'linearithmic',
  'sims.growth.curve.quadratic': 'quadratic',
  'sims.growth.curve.exponential': 'exponential',
  // Durations at 1 µs per operation. Keep the unit symbols µs, ms, s, min, h unless your language writes them differently.
  'sims.growth.time.us': '{count} µs',
  'sims.growth.time.ms': '{count} ms',
  'sims.growth.time.s': '{count} s',
  'sims.growth.time.min': '{count} min',
  'sims.growth.time.h': '{count} h',
  'sims.growth.time.days': { one: '{count} day', other: '{count} days' },
  'sims.growth.time.years': { one: '{count} year', other: '{count} years' },
  // {value} is a huge number in scientific notation, e.g. "3.2 × 10¹⁴".
  'sims.growth.time.yearsSci': '{value} years',
  'sims.growth.inputSize': 'Input size',
  'sims.growth.presets': 'Jump to an input size',
  'sims.growth.barScale': 'Bar scale',
  // Scale toggle buttons. Tight space.
  'sims.growth.linear': 'Linear',
  'sims.growth.log': 'Log',
  // {n} is the input size, already formatted.
  'sims.growth.lanesLabel': 'Work at n = {n}, at 1 microsecond per operation',
  // Shown at the end of a bar that runs off the track. {factor} is a number like "500" or "1.3 × 10³⁰".
  'sims.growth.pastEdge': '{factor}× past the edge',
  'sims.growth.offChart': 'off the chart even on a log scale',
  // Operation count and time for one class, e.g. "1,000 ops · 1 ms". Keep {ops} and {time}.
  'sims.growth.opsAndTime': '{ops} ops · {time}',
  // {curve} is notation like "O(n)"; {count} an operation count, already formatted.
  'sims.growth.captionLinear': 'Linear scale: the track is twice the {curve} count ({count} operations), so faster-growing classes run off the edge.',
  // {max} is a power of ten like "10⁶".
  'sims.growth.captionLog': 'Log scale: every tenth of the track is another ×10 (up to {max}).',
  'sims.growth.timesAssume': 'Times assume 1 µs per operation.',
  'sims.growth.chartTitle': 'Operations as n grows',
  'sims.growth.chartNote': '(both axes logarithmic; tap or drag to pick n)',
  // {max} and {n} are input sizes; {curves} a list like "O(n) and O(n²)".
  'sims.growth.chartLabel': 'Line chart of operations against n, from 1 to {max}, for {curves}. The marker is at n = {n}.',

  // ---------- JOIN playground ----------
  // Which side a table is on. Tight space.
  'sims.join.left': 'left',
  'sims.join.right': 'right',
  'sims.join.leftTable': '{name} (left table)',
  'sims.join.rightTable': '{name} (right table)',
  // Screen-reader label of a source row. {values} are the row's cells; NULL stays NULL.
  'sims.join.rowMatched': '{table} row {values}: has a match',
  'sims.join.rowKept': '{table} row {values}: no match, kept with NULLs',
  'sims.join.rowDropped': '{table} row {values}: no match, dropped',
  'sims.join.joinType': 'Join type',
  'sims.join.result': 'Result',
  // {join} is the SQL keyword, e.g. "LEFT JOIN".
  'sims.join.rowCount': { one: '{join}: {count} row', other: '{join}: {count} rows' },
  'sims.join.resultTable': 'Result of the {join}',
  'sims.join.resultRow': 'Result row {number}: {values}',
  'sims.join.noRows': 'No rows.',
  'sims.join.note': "Hover or tap a result row to see where it came from. Without ORDER BY, row order isn't guaranteed.",
  // Plain-language summary under the tables. SQL words (NULL, ORDER BY) stay as they are.
  'sims.join.pairs': { one: '{count} matching pair, one result row each.', other: '{count} matching pairs, one result row each.' },
  // {rows} names rows of one table, e.g. "Ana, Ben".
  'sims.join.repeats': {
    one: '{rows} matches more than once, so it repeats.',
    other: '{rows} match more than once, so they repeat.',
  },
  // {table} has no partner for {rows}; {other} is the other table's name.
  'sims.join.noMatchKept': 'No match in {table}: {rows}, kept, with NULLs for {other}.',
  'sims.join.noMatchDropped': 'No match in {table}: {rows}, dropped.',
  // Adds a note to one of the two sentences above when a key is NULL. {sentence} is that sentence.
  'sims.join.withNullNote': '{sentence} (NULL never equals anything, not even NULL.)',

  // ---------- dev-only page #/dev/games ----------
  'sims.dev.title': 'Mini-games & simulators',
  'sims.dev.count': { one: '{count} visual step in the courses. Development only.', other: '{count} visual steps in the courses. Development only.' },
  'sims.dev.stepNumber': '(step {number})',
  'sims.dev.testMode': 'test mode',
  'sims.dev.all': '← All',
} satisfies Record<string, Message>;
