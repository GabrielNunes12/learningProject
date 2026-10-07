// English UI strings: insights. The learning report (src/components/Insights.tsx), the sentences the report
// analysis writes (src/lib/insights.ts) and the small charts on Home, Review and Profile (src/components/charts.tsx).
// English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  // ---------- question formats ----------
  // Title-case names of the question formats: bar labels, tooltips and the start of a sentence.
  'insights.format.mcq': 'Multiple choice',
  'insights.format.numeric': 'Number answers',
  'insights.format.text': 'Short answers',
  'insights.format.output': 'Predict the output',
  'insights.format.bug': 'Bug hunts',
  'insights.format.order': 'Put in order',
  'insights.format.buckets': 'Sort into groups',
  'insights.format.trace': 'Code traces',
  'insights.format.truthtable': 'Truth tables',
  'insights.format.logicgrid': 'Logic grids',
  'insights.format.balance': 'Balance puzzles',
  // The same format names as they read in the middle of a sentence ("40% right on bug hunts vs …").
  'insights.formatInline.mcq': 'multiple choice',
  'insights.formatInline.numeric': 'number answers',
  'insights.formatInline.text': 'short answers',
  'insights.formatInline.output': 'predict the output',
  'insights.formatInline.bug': 'bug hunts',
  'insights.formatInline.order': 'put in order',
  'insights.formatInline.buckets': 'sort into groups',
  'insights.formatInline.trace': 'code traces',
  'insights.formatInline.truthtable': 'truth tables',
  'insights.formatInline.logicgrid': 'logic grids',
  'insights.formatInline.balance': 'balance puzzles',
  // One concrete habit per format, offered when that format is clearly the learner's weakest.
  'insights.formatAdvice.mcq': 'Try to answer in your head before reading the choices, then pick the one that matches.',
  'insights.formatAdvice.numeric': 'Estimate the answer first so a result that is way off stands out, and check the units.',
  'insights.formatAdvice.text': 'Say the idea in your own words first, then name the exact term the question asks for.',
  'insights.formatAdvice.output': 'Trace the code on paper: write each variable after every line before you type the output.',
  'insights.formatAdvice.bug': 'Read the error first, then trace the variables line by line to find where they go wrong.',
  'insights.formatAdvice.order': 'Place the first and last pieces first, then fill in the middle.',
  'insights.formatAdvice.buckets': 'Name the rule behind each group before you sort the first card.',
  'insights.formatAdvice.trace': 'Predict what each line changes before you step forward, then compare.',
  'insights.formatAdvice.truthtable': 'Fill one column at a time and lean on the helper columns.',
  'insights.formatAdvice.logicgrid': 'Mark what each clue rules out, not only what it confirms.',
  'insights.formatAdvice.balance': 'Gather the unknowns on one side first, then the plain numbers on the other.',

  // ---------- small helpers ----------
  // A lesson title quoted inside a sentence. {title} is the lesson title.
  'insights.quoted': '"{title}"',
  // Short lists of names: "a and b", "a, b and c". {items} is the first names already joined with the separator.
  'insights.list.separator': ', ',
  'insights.list.and': '{items} and {last}',
  // "a, b, c and 2 more": {items} are the names shown, {count} how many are left out.
  'insights.list.more': { one: '{items} and {count} more', other: '{items} and {count} more' },

  // ---------- "you missed X n of the last m times" ----------
  // {name} is a concept name, {misses} the wrong answers, {count} the answers looked at.
  'insights.miss.concept': { one: 'You missed {name} {misses} of the last {count} time.', other: 'You missed {name} {misses} of the last {count} times.' },
  'insights.miss.conceptAllTime': { one: 'You\'ve missed {name} {misses} of {count} time so far.', other: 'You\'ve missed {name} {misses} of {count} times so far.' },
  // {name} is a lesson title.
  'insights.miss.lesson': {
    one: 'You missed questions in "{name}" {misses} of the last {count} time.',
    other: 'You missed questions in "{name}" {misses} of the last {count} times.',
  },
  'insights.miss.lessonAllTime': {
    one: 'You\'ve missed questions in "{name}" {misses} of {count} time so far.',
    other: 'You\'ve missed questions in "{name}" {misses} of {count} times so far.',
  },

  // ---------- struggle patterns ----------
  // {format} is an in-sentence format name, e.g. "bug hunts".
  'insights.pattern.formats.title': 'Weakest format: {format}',
  // "Bug hunts 40% right vs multiple choice 90% (all answers so far)." {worst} is title-case, {best} in-sentence form.
  'insights.pattern.formats.detail': '{worst} {worstPct} right vs {best} {bestPct} (all answers so far).',
  'insights.pattern.forgetting.title': 'Right once, wrong later',
  // {items} is a list of concept or lesson names; {count} how many.
  'insights.pattern.forgetting.detail': {
    one: '{items}: you answered a question on it right at least twice, then missed it on your latest try. That\'s normal forgetting, and the cue to review.',
    other: '{items}: you answered questions on these right at least twice, then missed them on your latest try. That\'s normal forgetting, and the cue to review.',
  },
  'insights.pattern.pileup.title': 'Reviews are piling up',
  'insights.pattern.pileup.detail': { one: '{count} review is due.', other: '{count} reviews are due.' },
  // {days} is a duration such as "4 days".
  'insights.pattern.pileup.detailOldest': { one: '{count} review is due, the oldest for {days}.', other: '{count} reviews are due, the oldest for {days}.' },
  'insights.pattern.skipped.title': 'Core lessons you skipped',
  // {lessons} is a list of quoted lesson titles; {count} how many.
  'insights.pattern.skipped.detail': {
    one: '{lessons} is a core lesson you haven\'t opened, though you\'ve done later ones.',
    other: '{lessons} are core lessons you haven\'t opened, though you\'ve done later ones.',
  },

  // ---------- tips ----------
  'insights.tip.clearReviews.title': { one: 'Clear your {count} due review first', other: 'Clear your {count} due reviews first' },
  'insights.tip.clearReviews.evidence': { one: '{count} review is due.', other: '{count} reviews are due.' },
  // {days} is a duration such as "4 days".
  'insights.tip.clearReviews.evidenceOldest': {
    one: '{count} review is due; the oldest has waited {days}.',
    other: '{count} reviews are due; the oldest has waited {days}.',
  },
  'insights.tip.clearReviews.advice': 'Do them before new lessons. Spaced review tends to work best when it happens close to the due date.',
  // {name} is a concept name or a quoted lesson title.
  'insights.tip.weak.title': 'Revisit {name}',
  'insights.tip.weak.adviceConcept':
    'Reread the lesson "{lesson}", then do a short mixed practice: mixing it with other ideas tends to help you pick the right approach, not just repeat it.',
  'insights.tip.weak.adviceLesson': 'Redo the lesson, then a short mixed practice on {course}.',
  'insights.tip.forgetting.title': 'Review {name} sooner',
  'insights.tip.forgetting.evidence': 'You\'d answered {name} right at least twice, then missed it on your latest try.',
  'insights.tip.forgetting.advice':
    'Retrieval practice spread over several days tends to make memories last. Practise your weakest questions today and let the schedule bring them back.',
  // {format} is a title-case format name, e.g. "Bug hunts".
  'insights.tip.format.title': '{format}: try a different approach',
  // {worst} and {best} are in-sentence format names.
  'insights.tip.format.evidence': '{worstPct} right on {worst} vs {bestPct} on {best}.',
  'insights.tip.skipped.title': 'Do the core lesson "{lesson}"',
  'insights.tip.skipped.evidence': 'It\'s a core lesson in {course} that you haven\'t opened, though you\'ve moved past it.',
  'insights.tip.skipped.advice': 'Core lessons carry most of a course; later lessons often build on them.',
  'insights.tip.confirm.title': 'Check what you know with a quiz',
  'insights.tip.confirm.evidence.concepts': { one: 'You\'ve mastered {count} concept.', other: 'You\'ve mastered {count} concepts.' },
  'insights.tip.confirm.evidence.lessons': { one: 'You\'ve mastered {count} lesson.', other: 'You\'ve mastered {count} lessons.' },
  'insights.tip.confirm.evidence.topics': { one: 'You\'ve mastered {count} topic.', other: 'You\'ve mastered {count} topics.' },
  'insights.tip.confirm.advice': 'A quiz mixes questions from the whole course, a quick way to confirm it sticks and find gaps.',
  'insights.tip.mix.title': 'Mix your practice',
  'insights.tip.mix.evidence.concepts': { one: '{count} concept still trips you up now and then.', other: '{count} concepts still trip you up now and then.' },
  'insights.tip.mix.evidence.lessons': { one: '{count} lesson still trips you up now and then.', other: '{count} lessons still trip you up now and then.' },
  'insights.tip.mix.evidence.topics': { one: '{count} topic still trips you up now and then.', other: '{count} topics still trip you up now and then.' },
  'insights.tip.mix.evidenceNone': 'Nothing stands out as weak right now.',
  'insights.tip.mix.advice': 'Practising several topics in one session tends to help you choose the right method, not just recall it.',

  // ---------- tip buttons ----------
  'insights.action.startReviews': 'Start reviews',
  // {lesson} is a lesson title.
  'insights.action.openLesson': 'Open "{lesson}"',
  'insights.action.redoLesson': 'Redo the lesson',
  // {concept} is a concept name.
  'insights.action.practiseConcept': 'Practise {concept}',
  'insights.action.mixedPractice': 'Mixed practice',
  'insights.action.practiseWeakest': 'Practise weakest',
  'insights.action.openLessonPlain': 'Open lesson',
  // {course} is a course title.
  'insights.action.courseQuiz': '{course} quiz',

  // ---------- the report page ----------
  'insights.title': 'Your learning report',
  'insights.subtitle': 'What you miss, what you\'re struggling with, and how to improve.',
  // {course} is the course title (shown in bold).
  'insights.subtitleCourse': 'What you miss, what you\'re struggling with, and how to improve in {course}.',
  'insights.filter': 'Filter by course',
  'insights.allCourses': 'All courses',
  'insights.notFound.title': 'Course not found',
  // {id} is the course id from the address bar.
  'insights.notFound.body': 'There\'s no course called "{id}". <link>See the report for all your courses</link>.',

  // What an item of the report is: a concept, a lesson (courses without a concept map), or a topic (a mix of both).
  'insights.noun.concepts': 'Concepts',
  'insights.noun.lessons': 'Lessons',
  'insights.noun.topics': 'Topics',

  // Mastery states (legend, chip labels).
  'insights.state.mastered': 'Mastered',
  'insights.state.learning': 'In progress',
  'insights.state.struggling': 'Struggling',
  'insights.state.untested': 'Not practised yet',
  'insights.state.none': 'No questions yet',

  // ---------- empty state ----------
  'insights.empty.title': 'Not enough practice yet',
  'insights.empty.start': 'Answer a few questions and this report fills in.',
  'insights.empty.startIn': 'Answer a few questions in {course} and this report fills in.',
  'insights.empty.answered': { one: 'You\'ve answered {count} question.', other: 'You\'ve answered {count} questions.' },
  'insights.empty.answeredIn': { one: 'You\'ve answered {count} question in {course}.', other: 'You\'ve answered {count} questions in {course}.' },
  'insights.empty.more': { one: '{count} more answer and this report fills in.', other: '{count} more answers and this report fills in.' },
  // What the report will show. <b>…</b> is the bold section name.
  'insights.empty.needsAttention': '<b>Needs attention:</b> concepts you keep missing, ranked by your recent answers.',
  'insights.empty.patterns': '<b>Patterns:</b> which question formats trip you up, what you got right once but forgot, and reviews piling up.',
  'insights.empty.strengths': '<b>Strengths:</b> what you\'ve answered right three times in a row.',
  'insights.empty.tips': '<b>Tips:</b> a few concrete next steps, each based on your own answers.',
  'insights.empty.openCourse': 'Open the course',
  'insights.empty.continue': 'Continue learning',
  // Button to the review page.
  'insights.empty.review': 'Review',

  // ---------- sections ----------
  'insights.tips.title': 'How to improve',
  'insights.tips.basis': 'Based on your own answers',
  'insights.weak.title': 'Needs attention',
  'insights.weak.ranked': 'Ranked by recent misses',
  'insights.patterns.title': 'Struggle patterns',
  'insights.strengths.title': 'Strengths',
  'insights.strengths.count.concepts': { one: '{count} concept mastered', other: '{count} concepts mastered' },
  'insights.strengths.count.lessons': { one: '{count} lesson mastered', other: '{count} lessons mastered' },
  'insights.strengths.count.topics': { one: '{count} topic mastered', other: '{count} topics mastered' },
  // After the first chips: "and 3 more".
  'insights.strengths.more': { one: 'and {count} more', other: 'and {count} more' },
  'insights.strengths.none.concepts':
    'Nothing mastered yet. A concept counts as mastered once every question you\'ve answered on it has been right three times in a row.',
  'insights.strengths.none.lessons':
    'Nothing mastered yet. A lesson counts as mastered once every question you\'ve answered on it has been right three times in a row.',
  'insights.strengths.none.topics':
    'Nothing mastered yet. A topic counts as mastered once every question you\'ve answered on it has been right three times in a row.',
  'insights.map.title': 'Mastery by course',

  // ---------- overview tiles ----------
  // {count} is 7 or 30.
  'insights.window.label': { one: 'Accuracy, last {count} day', other: 'Accuracy, last {count} days' },
  // {count} questions answered in the period; {right} of them right on the latest try.
  'insights.window.detail': { one: 'Latest try on {count} question: {right} right', other: 'Latest try on {count} questions: {right} right' },
  'insights.window.empty': 'No answers in this period',
  // Counts of concepts/lessons/topics in each state. <b>…</b> wraps the number.
  'insights.counts.mastered': { one: '<b>{count}</b> mastered', other: '<b>{count}</b> mastered' },
  'insights.counts.learning': { one: '<b>{count}</b> in progress', other: '<b>{count}</b> in progress' },
  'insights.counts.struggling': { one: '<b>{count}</b> struggling', other: '<b>{count}</b> struggling' },
  'insights.counts.untested': { one: '{count} not practised yet', other: '{count} not practised yet' },
  'insights.due.label': 'Reviews due',
  'insights.due.oldest': { one: 'Oldest waiting {count} day', other: 'Oldest waiting {count} days' },
  'insights.due.today': 'Due today',
  'insights.due.none': 'All caught up',

  // ---------- needs attention ----------
  'insights.weak.nothing': 'Nothing stands out right now.',
  // {min} is the answers needed for a verdict (3).
  'insights.weak.thin.concepts': {
    one: '{count} concept has fewer than {min} answers, so it\'s too early to tell.',
    other: '{count} concepts have fewer than {min} answers, so it\'s too early to tell.',
  },
  'insights.weak.thin.lessons': {
    one: '{count} lesson has fewer than {min} answers, so it\'s too early to tell.',
    other: '{count} lessons have fewer than {min} answers, so it\'s too early to tell.',
  },
  'insights.weak.thin.topics': {
    one: '{count} topic has fewer than {min} answers, so it\'s too early to tell.',
    other: '{count} topics have fewer than {min} answers, so it\'s too early to tell.',
  },
  // Pieces of the grey line under a weak item, joined with " · ". {title} is a lesson title.
  'insights.weak.lesson': 'Lesson "{title}"',
  'insights.weak.lastToday': 'last answered today',
  'insights.weak.lastYesterday': 'last answered yesterday',
  'insights.weak.lastDaysAgo': { one: 'last answered {count} day ago', other: 'last answered {count} days ago' },
  // Reviews of this item due now.
  'insights.weak.due': { one: '{count} due', other: '{count} due' },
  // Short button.
  'insights.weak.practise': 'Practise',
  'insights.weak.practiseLabel': 'Practise {name} with related ideas',
  'insights.weak.more': { one: 'and {count} more in the course views below', other: 'and {count} more in the course views below' },

  // ---------- sparkline ----------
  'insights.spark.empty': 'no history',
  'insights.spark.right': 'right',
  'insights.spark.wrong': 'wrong',
  // {results} is a comma-separated list of "right"/"wrong".
  'insights.spark.label': { one: 'Latest {count} answer, oldest first: {results}', other: 'Latest {count} answers, oldest first: {results}' },
  // Tooltip on one point. {result} is "right" or "wrong"; {pct} the accuracy over the last 3 answers.
  'insights.spark.point': 'Answer {index} of {total}: {result} (last 3: {pct} right)',

  // ---------- patterns ----------
  'insights.types.title': 'Accuracy by question format',
  // {format} is a title-case format name.
  'insights.types.tip': '{format}: {right} of {total} right',
  'insights.types.row': '{right} of {total} right ({pct})',
  'insights.types.needMore': 'Each format needs {min} answers before it\'s shown here.',
  'insights.types.hidden': {
    one: '{count} format with fewer than {min} answers is left out. All answers so far count.',
    other: '{count} formats with fewer than {min} answers are left out. All answers so far count.',
  },
  'insights.patterns.none': 'No clear patterns yet: no format gap, nothing forgotten, reviews under control, and no skipped core lessons.',

  // ---------- mastery map ----------
  'insights.chip.noQuestions': 'No practice questions yet',
  'insights.chip.untested': { one: '{count} question, not practised yet', other: '{count} questions, not practised yet' },
  // {right}/{total} answers right; {count} recent answers and {pct} their accuracy.
  'insights.chip.score': '{right}/{total} right',
  'insights.chip.scoreThin': '{right}/{total} right (too few answers to judge)',
  'insights.chip.scoreRecent': '{right}/{total} right, last {count}: {pct}',
  'insights.chip.scoreRecentThin': '{right}/{total} right, last {count}: {pct} (too few answers to judge)',
  // Screen-reader label of a chip: "Loops: Mastered. 5/5 right".
  'insights.chip.label': '{name}: {state}. {detail}',
  'insights.legend': 'Legend',
  'insights.course.masteredConcepts': { one: '{mastered} of {count} concept mastered', other: '{mastered} of {count} concepts mastered' },
  'insights.course.masteredLessons': {
    one: '{mastered} of {count} lesson mastered · grouped by lesson until this course has a concept map',
    other: '{mastered} of {count} lessons mastered · grouped by lesson until this course has a concept map',
  },
  // Short button: show the report for this course only.
  'insights.course.focus': 'Focus',

  // ---------- Home card ----------
  // {miss} is a full sentence such as "You missed Loops 4 of the last 6 times."
  'insights.teaser.weak': '{miss} See how to improve.',
  'insights.teaser.mastered.concepts': {
    one: '{count} concept mastered. See what to practise next.',
    other: '{count} concepts mastered. See what to practise next.',
  },
  'insights.teaser.mastered.lessons': {
    one: '{count} lesson mastered. See what to practise next.',
    other: '{count} lessons mastered. See what to practise next.',
  },
  'insights.teaser.mastered.topics': { one: '{count} topic mastered. See what to practise next.', other: '{count} topics mastered. See what to practise next.' },
  'insights.teaser.default': 'See what you miss, what you struggle with, and how to improve.',

  // ---------- charts (Home, Review, Profile) ----------
  // Label on the daily-goal line of the XP chart.
  'insights.chart.goal': 'goal {goal}',
  // Tooltip on a day: "Mon, Oct 6: 40 XP". {day} is a date or "Today".
  'insights.chart.xpTip': '{day}: {count} XP',
  'insights.chart.xpLabel': 'XP earned over the last 7 days',
  'insights.chart.tomorrow': 'Tomorrow',
  // Tooltip on a day of the review forecast. {day} is a weekday, "Today" or "Tomorrow".
  'insights.chart.dueTip': { one: '{day}: {count} due', other: '{day}: {count} due' },
  'insights.chart.reviews': { one: '{count} review', other: '{count} reviews' },
  'insights.chart.forecastLabel': 'Reviews due over the next 7 days',
  // Memory strength of a question (Leitner boxes 1–6), weakest first.
  'insights.box.1': 'Relearning',
  'insights.box.2': 'New',
  'insights.box.3': 'Familiar',
  'insights.box.4': 'Solid',
  'insights.box.5': 'Strong',
  'insights.box.6': 'Mastered',
  'insights.chart.strengthLabel': 'Questions by memory strength',
  // {box} is a memory strength name such as "Solid".
  'insights.chart.strengthTip': { one: '{box}: {count} question', other: '{box}: {count} questions' },
  // {weeks} is 18; {count} days with any XP.
  'insights.chart.heatmapLabel': { one: 'Activity over the last {weeks} weeks: {count} active day', other: 'Activity over the last {weeks} weeks: {count} active days' },
  'insights.chart.activeDays': { one: '{count} active day', other: '{count} active days' },
  // Ends of the heatmap colour scale.
  'insights.chart.less': 'Less',
  'insights.chart.more': 'More',
} satisfies Record<string, Message>;
