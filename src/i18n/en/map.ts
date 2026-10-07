// English UI strings: map. The knowledge-map canvas (src/components/KnowledgeMap.tsx) and its feedback sentences
// (src/lib/knowledgeMap.ts). English is the source of truth; translations mirror these keys (see docs/TRANSLATING.md).
// "Idea" and "concept" both mean one node of the course's concept graph; an "island" is an idea the learner didn't
// recall; a "chunk" is a group of ideas joined by correct links.
import type { Message } from '../core.ts';

export default {
  // ---------- page ----------
  'map.notFound': 'Course not found',
  'map.allCourses': 'All courses',
  // Small heading above the page title.
  'map.eyebrow': 'Knowledge map',
  'map.unitCheckpoint': 'Unit {n} checkpoint',
  'map.lead': "Map it from memory, see what's missing, then connect the dots.",
  // Label of the scope picker (whole course or one unit).
  'map.scope.label': 'Map',
  'map.scope.wholeCourse': { one: 'Whole course ({count} idea)', other: 'Whole course ({count} ideas)' },
  // {count} is the number of ideas in that unit.
  'map.scope.unit': 'Unit {n}: {title} ({count})',
  'map.scope.empty': 'This unit has no ideas on the course map yet.',
  'map.scope.mapWhole': 'Map the whole course instead',

  // ---------- courses without a concept map ----------
  'map.soon.title': 'The map for {course} is coming soon',
  'map.soon.lead':
    "This course doesn't have its concept map yet. In the meantime, here is the same idea on paper: cover the list below, write down every key idea you remember, then check.",
  'map.soon.keyIdeas': 'The key ideas',
  'map.soon.backToCourse': 'Back to course',
  'map.soon.quiz': 'Test yourself with the quiz',

  // ---------- layers (stepper) ----------
  'map.layers': 'Layers',
  'map.layer.1.title': 'What do I already know?',
  // Short step labels: tight space.
  'map.layer.1.short': 'Recall',
  'map.layer.2.title': "What don't I know yet?",
  'map.layer.2.short': 'Find gaps',
  'map.layer.3.title': 'Connect the dots',
  'map.layer.3.short': 'Connect',
  'map.layer.locked': '(locked until you finish the layer before)',

  // ---------- screen-reader announcements ----------
  'map.announce.layer': 'Layer {n}: {title}',
  'map.announce.linkedPickLabel': 'Linked {a} and {b}. Pick a label below if you like.',
  'map.announce.linked': 'Linked {a} and {b}.',
  'map.announce.linkCancelled': 'Link cancelled.',
  'map.announce.tidied': 'Map tidied up.',
  'map.announce.cleared': 'Cleared. Start recalling from memory.',
  // {label} is the course's link label, e.g. "Recursion needs Base case."
  'map.announce.hint': 'Hint: {from} {label} {to}.',
  'map.announce.markedKnown': '{label}: marked as known now.',
  'map.announce.merged': 'Merged into {label}: it counts as recalled.',
  // Also shown in the Connect panel, with {label} in bold.
  'map.linkingFrom': 'Linking from {label}: now pick a second idea.',
  'map.confirm.startOverCourse': 'Start over for the whole course? Your recalled ideas, notes and links here will be cleared.',
  'map.confirm.startOverUnit': 'Start over for this unit? Your recalled ideas, notes and links here will be cleared.',

  // ---------- toolbar and footer ----------
  'map.view.label': 'View',
  'map.view.canvas': 'Canvas',
  'map.view.list': 'List',
  'map.zoomOut': 'Zoom out',
  'map.zoomIn': 'Zoom in',
  // Button: fit the whole map on screen.
  'map.fit': 'Fit',
  // Button: rearrange the ideas neatly.
  'map.tidy': 'Tidy up',
  'map.saved': 'Saved automatically.',
  'map.startOver': 'Start over',

  // ---------- node kinds (details panel tag, screen-reader labels) ----------
  'map.kind.recalled': 'recalled from memory',
  'map.kind.island': 'not recalled yet',
  'map.kind.learned': 'learned since',
  'map.kind.note': 'your own note',

  // Suggested link labels, offered when the course has none of its own. They read between two idea names:
  // "Loop is a Statement". Picking one stores it on the learner's link; it doesn't affect the score.
  'map.generic.isA': 'is a',
  'map.generic.isPartOf': 'is part of',
  'map.generic.needs': 'needs',
  'map.generic.causes': 'causes',
  'map.generic.replaces': 'replaces',
  'map.generic.isOppositeOf': 'is the opposite of',
  // Shown between two idea names when a link has no label.
  'map.link.linkedTo': 'linked to',
  'map.link.isLinkedTo': 'is linked to',
  'map.noLabel': '(no label)',

  // ---------- layer 1: recall ----------
  'map.recall.intro':
    'Type the ideas you remember, one at a time, and press Enter. No peeking: trying to recall before you look tends to make what you read next stick better.',
  'map.recall.counterLabel': 'Recalled {recalled} of {total}',
  // Big counter: {recalled} is a large number, <rest>…</rest> the smaller text next to it ("3 / 10 recalled").
  'map.recall.counter': '{recalled}<rest>/ {total} recalled</rest>',
  'map.recall.progress': 'Ideas recalled',
  'map.recall.locked':
    'Recall is closed here because the rest of the map has been revealed. Start over to try again from memory, or use layers 2 and 3.',
  'map.recall.inputLabel': 'An idea you remember',
  'map.recall.placeholder': 'e.g. a term, a rule, a technique',
  // Button: tight space.
  'map.recall.add': 'Add',
  'map.recall.undo': 'Not what I meant: keep my words',
  'map.recall.secondsLeft': { one: '{count} second left', other: '{count} seconds left' },
  'map.recall.stopTimer': 'Stop timer',
  'map.recall.sprint': 'Optional: 2-minute sprint',
  'map.recall.backToGaps': 'Back to the gaps',
  'map.recall.done': "I'm out of ideas: show me what's left",
  // Feedback after each entry. {label} is a course concept; {typed} is what the learner typed.
  'map.recall.timeUp': "Time. That was a good retrieval workout: keep adding if more comes to mind, or see what's left.",
  'map.recall.already': '{label} is already on your map.',
  'map.recall.recalled': 'Recalled: {label}.',
  'map.recall.recalledAll': 'Recalled: {label}. That is every idea here.',
  // Every 5th idea; {count} is 5, 10, 15...
  'map.recall.recalledRun': 'Recalled: {label}. {count} from memory, nice run.',
  'map.recall.otherUnit': '{label} is from unit {unit}. Good recall: it is saved on your whole-course map.',
  'map.recall.dupNote': 'You already noted that one.',
  'map.recall.keptNote': 'Kept "{typed}" as your own note. If the course calls it something else, you can merge it in after the reveal.',
  'map.recall.keptNoteInstead': 'Kept "{typed}" as your own note instead.',
  // Score messages (src/lib/knowledgeMap.ts). {count} is the number of ideas in this part of the course.
  'map.recall.msg.empty': 'This part of the course has no concepts to recall yet.',
  'map.recall.msg.all': { one: 'You recalled {count} idea from memory. That is the whole map.', other: 'You recalled all {count} ideas from memory. That is the whole map.' },
  'map.recall.msg.none':
    'Nothing came to mind this time, and that is a useful starting point: studies suggest that trying to recall first tends to make the next read stick better.',
  'map.recall.msg.strong': { other: 'You recalled {recalled} of {count} ideas from memory. That is strong recall; the few islands left are quick wins.' },
  'map.recall.msg.solid': {
    other: 'You recalled {recalled} of {count} ideas from memory. A solid base to build on; the islands below show exactly what to read next.',
  },
  'map.recall.msg.start': {
    other: 'You recalled {recalled} of {count} ideas from memory. Every idea you pulled out got a little stronger, and the islands below are your reading list.',
  },

  // ---------- layer 2: gaps ----------
  // {pct} is a percentage, e.g. "40%".
  'map.gaps.recalledPct': 'Recalled {pct}',
  'map.gaps.intro':
    "The dashed islands are the ideas you didn't recall. Open one to read what it is, follow it to its lesson, then mark it when it makes sense.",
  'map.gaps.marked': '{learned} of {total} marked so far.',
  'map.gaps.none': 'No islands: you recalled everything in this part of the course.',
  'map.gaps.notesHint': 'Select one of your own notes to merge it into a course idea if they name the same thing.',
  'map.gaps.backToConnecting': 'Back to connecting →',
  'map.gaps.connect': 'Connect the dots →',

  // ---------- layer 3: connect ----------
  'map.connect.intro':
    'Tap one idea, then another, to link them, or drag from the dot on an idea. Draw the links you could explain in a sentence; ideas tied to other ideas tend to be easier to recall and use.',
  'map.connect.pickFromList': 'Or pick two ideas from a list',
  // Labels of the three pickers in the "add a link" form: tight space.
  'map.connect.from': 'From',
  'map.connect.link': 'Link',
  'map.connect.to': 'To',
  'map.connect.chooseIdea': 'Choose an idea',
  'map.connect.addLink': 'Add link',
  'map.connect.check': 'Check my map',
  'map.connect.checkAgain': 'Check again',

  // ---------- check results ----------
  'map.results.aria': 'Map check',
  'map.results.title': 'Your map vs. the course map',
  // Under a big "{found}/{total}" number; {count} is the number of links found.
  'map.results.found': { other: 'links found' },
  'map.results.foundWithHint': { other: 'links found, {withHint} with a hint' },
  // Under a big number ({count}).
  'map.results.chunks': { one: 'chunk of understanding', other: 'chunks of understanding' },
  'map.results.ownLinks': { other: 'links of your own' },
  'map.results.progress': 'Course links found',
  'map.results.chunkExplain': 'A chunk is a group of ideas joined by course links, named after its best-connected idea.',
  'map.results.chunkIdeas': { one: '{count} idea', other: '{count} ideas' },
  'map.results.extra': {
    one: "{count} link you drew isn't in the course map. They might still be true: the course map is one expert's view, not the only one.",
    other: "{count} links you drew aren't in the course map. They might still be true: the course map is one expert's view, not the only one.",
  },
  'map.results.addToMap': 'Add to my map',
  'map.results.showHint': 'Show a link I missed',
  'map.results.allShown': 'All missed links are shown',
  // Link check messages (src/lib/knowledgeMap.ts). {count} is the number of links in the course map here.
  'map.results.msg.noLinks': 'The course map has no links inside this scope yet, so every link you draw is your own.',
  'map.results.msg.none': { other: 'The course map links these ideas in {count} ways. Draw a few you are sure of, then check again, or take a hint.' },
  'map.results.msg.all': { other: 'You found all {count} links in the course map. Connected knowledge like this tends to be easier to use.' },
  'map.results.msg.allWithHint': {
    other: 'You found all {count} links in the course map ({withHint} with a hint). Connected knowledge like this tends to be easier to use.',
  },
  'map.results.msg.some': { other: 'You found {got} of {count} links in the course map. Each one ties two ideas together.' },
  'map.results.msg.someWithHint': { other: 'You found {got} of {count} links in the course map ({withHint} with a hint). Each one ties two ideas together.' },

  // ---------- details panels ----------
  'map.detail.selected': 'Selected: {label}',
  'map.detail.close': 'Close details',
  // {lesson} is a link to the lesson.
  'map.detail.taughtIn': 'Taught in {lesson}',
  'map.detail.learnThis': 'Learn this',
  'map.detail.knowNow': 'I know this now',
  'map.detail.notYet': 'Not yet, actually',
  'map.detail.linkFromHere': 'Link from here',
  'map.detail.removeFromMap': 'Remove from my map',
  'map.detail.deleteNote': 'Delete note',
  'map.detail.mergeLabel': 'Same idea as a course concept? Merge it:',
  'map.detail.chooseConcept': 'Choose a concept',
  // Button: merge a note into a course concept.
  'map.detail.merge': 'Merge',
  'map.detail.mergeLater': 'After the reveal you can merge a note into a course concept.',
  'map.detail.removeLinkTo': 'Remove link to {label}',
  'map.detail.remove': 'Remove',
  'map.detail.recalledFromMemory': 'You recalled this one from memory.',
  'map.detail.selectedLink': 'Selected link',
  // Tag at the top of the link details panel.
  'map.detail.linkKind': 'Link',
  'map.detail.label': 'Label',
  // {from} and {to} are idea names; {label} is the course's link label (shown in italics).
  'map.detail.inCourseMap': 'In the course map: {from} {label} {to}.',
  'map.detail.inCourseMapHinted': 'In the course map (found with a hint): {from} {label} {to}.',
  'map.detail.notInCourseMap': "Not in the course map. It might still be true: can you say how they're related?",
  'map.detail.swap': 'Swap direction',
  'map.detail.removeLink': 'Remove link',

  // ---------- legend and list view ----------
  'map.legend': 'Legend',
  'map.legend.fromMemory': 'From memory',
  'map.legend.yourNote': 'Your note',
  'map.legend.notYet': 'Not yet',
  'map.legend.learnedSince': 'Learned since',
  'map.legend.inCourseMap': 'In the course map',
  'map.legend.ownLink': 'Your own link',
  'map.legend.hint': 'Hint',
  'map.list.ownNotes': 'Your own notes',
  'map.list.links': 'Links',
  'map.list.status.found': 'in the course map',
  'map.list.status.hinted': 'in the course map, with a hint',
  'map.list.status.extra': 'your own link',
  'map.list.empty': 'Nothing on your map yet. Add the first idea you remember.',
  'map.list.noLinks': 'No links yet. Select one idea, then another.',
  // Screen-reader hints after an idea's name in the list.
  'map.list.linkToThis': '(link to this)',
  'map.list.startLink': '(start a link)',

  // ---------- canvas ----------
  'map.canvas.aria':
    'Knowledge map canvas. Drag to pan, pinch or scroll to zoom. Ideas are buttons; arrow keys move the focused idea. The List view shows the same map as lists.',
  // Screen-reader label of an idea on the canvas; {kind} is one of the map.kind.* texts.
  'map.canvas.node': '{label}, {kind}',
  'map.canvas.nodeLinkTo': '{label}, {kind}. Press to link.',
  'map.canvas.nodeStartLink': '{label}, {kind}. Press to start a link.',
  // Small tag on the idea that names a chunk: tight space.
  'map.canvas.chunkTag': 'chunk',
  'map.canvas.empty': 'Your map is empty. Type the first idea you remember.',
} satisfies Record<string, Message>;
