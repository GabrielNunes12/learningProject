// Tests for the knowledge-map logic. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  ALL,
  addHint,
  addLink,
  addNote,
  addRecall,
  advance,
  checkMap,
  chunks,
  editDistance,
  edgeEnd,
  emptyMap,
  fitView,
  arrangeLayout,
  CELL_W,
  forceLayout,
  gridLayout,
  hull,
  isNote,
  linkVocabulary,
  matchConcept,
  mergeNote,
  nextHint,
  nextSlot,
  noteScope,
  normalize,
  normalizeMap,
  nodeSize,
  pairKey,
  placeMissing,
  recallMessage,
  recallScore,
  removeLink,
  removeNode,
  resetScope,
  scopeLayer,
  scopeOf,
  separate,
  setLearned,
  stem,
  unrecallToNote,
  visibleNodes,
  zoomAt,
  type MapCourse,
} from '../src/lib/knowledgeMap.ts';
import type { Concept } from '../src/types.ts';

const concepts: Concept[] = [
  { id: 'list-comprehension', label: 'List comprehension', lesson: 'l1', aliases: ['comprehensions'] },
  { id: 'for-loop', label: 'For loop', lesson: 'l1' },
  { id: 'recursion', label: 'Recursion', lesson: 'l2', summary: 'A function calling itself.' },
  { id: 'base-case', label: 'Base case', lesson: 'l2' },
  { id: 'dictionary', label: 'Dictionary', lesson: 'l3', aliases: ['dict', 'hash map'] },
  { id: 'map', label: 'Map', lesson: 'l3' },
];

const course: MapCourse = {
  id: 'demo',
  concepts,
  links: [
    { from: 'list-comprehension', to: 'for-loop', label: 'replaces' },
    { from: 'recursion', to: 'base-case', label: 'needs' },
    { from: 'recursion', to: 'for-loop', label: 'is an alternative to' },
    { from: 'dictionary', to: 'map', label: 'is a' },
    { from: 'dictionary', to: 'other/hashing', label: 'needs' },
  ],
  units: [
    { id: 'u1', lessons: [{ id: 'l1' }, { id: 'l2' }] },
    { id: 'u2', lessons: [{ id: 'l3' }] },
  ],
};

const id = (input: string) => matchConcept(input, concepts)?.id ?? null;

describe('matching free recall to concepts', () => {
  test('normalises case, spacing, punctuation and accents', () => {
    assert.equal(normalize('  List-Comprehension!! '), 'list comprehension');
    assert.equal(normalize('Café & crème'), 'cafe and creme');
    assert.equal(id('LIST   comprehension'), 'list-comprehension');
    assert.equal(id('for-loop'), 'for-loop');
    assert.equal(id('forloop'), 'for-loop');
  });

  test('simple plurals and stems', () => {
    assert.equal(stem('dictionaries'), 'dictionary');
    assert.equal(stem('classes'), 'class');
    assert.equal(stem('loops'), 'loop');
    assert.equal(stem('class'), 'class');
    assert.equal(id('for loops'), 'for-loop');
    assert.equal(id('Dictionaries'), 'dictionary');
    assert.equal(id('base cases'), 'base-case');
  });

  test('aliases count', () => {
    assert.equal(id('dict'), 'dictionary');
    assert.equal(id('hashmaps'), 'dictionary');
  });

  test('small typos are forgiven relative to length; short words must be exact', () => {
    assert.equal(editDistance('recursoin', 'recursion'), 1, 'a transposition is one edit');
    assert.equal(editDistance('kitten', 'sitting'), 3);
    assert.equal(id('recursoin'), 'recursion');
    assert.equal(id('recurion'), 'recursion');
    assert.equal(id('dictionnary'), 'dictionary');
    assert.equal(id('mop'), null, 'no typo allowance for short words');
    assert.equal(id('rekursshun'), null, 'too many edits');
  });

  test('part of a multi-word label when 5+ letters, and entries that contain a whole label', () => {
    assert.equal(matchConcept('comprehension', [concepts[0]])?.kind, 'exact', 'alias "comprehensions" stems to the same');
    assert.equal(matchConcept('comprehen', concepts)?.id, 'list-comprehension');
    assert.equal(matchConcept('comprehen', concepts)?.kind, 'partial');
    assert.equal(id('base'), 'base-case', 'a whole word of a label');
    assert.equal(id('bas'), null, 'under 4 letters is too vague');
    assert.equal(id('ase c'), null, 'fragments under 5 letters are too vague');
    assert.equal(id('comprehensoin'), 'list-comprehension', 'a typo inside one word of a label');
    assert.equal(id('python list comprehensions'), 'list-comprehension');
    assert.equal(id('something unrelated'), null);
    assert.equal(id(''), null);
    assert.equal(id('!!!'), null);
  });

  test("a concept's own label beats another concept's alias for partial matches", () => {
    const cs: Concept[] = [
      { id: 'decorators', label: 'Decorators', lesson: 'l', aliases: ['functions are objects'] },
      { id: 'functions', label: 'Functions & arguments', lesson: 'l' },
    ];
    assert.equal(matchConcept('functoins', cs)?.id, 'functions');
  });

  test('exact beats a typo match; ties prefer concepts not yet on the map', () => {
    const cs: Concept[] = [
      { id: 'a', label: 'Mapping', lesson: 'l' },
      { id: 'b', label: 'Mappings', lesson: 'l' },
    ];
    assert.equal(matchConcept('mapping', cs)?.id, 'a');
    assert.equal(matchConcept('mapping', cs, (x) => x === 'b')?.id, 'b');
  });
});

describe('scope', () => {
  test('a unit scope holds the concepts its lessons teach and the expert links inside it', () => {
    const s = scopeOf(course, 'u1');
    assert.deepEqual(
      s.concepts.map((c) => c.id),
      ['list-comprehension', 'for-loop', 'recursion', 'base-case'],
    );
    assert.equal(s.links.length, 3);
    const all = scopeOf(course, ALL);
    assert.equal(all.concepts.length, 6);
    assert.equal(all.links.length, 4, 'cross-course links are left out');
    assert.equal(scopeOf(course, 'nope').key, ALL, 'an unknown unit falls back to the whole course');
  });

  test('courses without a graph give an empty scope', () => {
    const s = scopeOf({ id: 'x', units: [{ id: 'u', lessons: [{ id: 'l' }] }] }, ALL);
    assert.equal(s.concepts.length, 0);
    assert.equal(s.links.length, 0);
  });

  test('link vocabulary: distinct labels, most used first', () => {
    assert.deepEqual(linkVocabulary(course), ['needs', 'is a', 'is an alternative to', 'replaces']);
  });

  test('visible nodes: recalled + notes in layer 1, islands from layer 2', () => {
    let m = addRecall(emptyMap(), 'recursion', { x: 0, y: 0 });
    m = addNote(m, 'u1', 'stack frames', { x: 10, y: 0 }).map;
    m = addNote(m, 'u2', 'hashing', { x: 20, y: 0 }).map;
    const u1 = scopeOf(course, 'u1');
    assert.deepEqual(
      visibleNodes(m, u1, 1).map((n) => `${n.id}:${n.kind}`),
      ['recursion:recalled', 'note:u1:1:note'],
    );
    m = setLearned(m, 'for-loop', true);
    assert.deepEqual(
      visibleNodes(m, u1, 2).map((n) => n.kind),
      ['island', 'learned', 'recalled', 'island', 'note'],
    );
    assert.equal(visibleNodes(m, scopeOf(course, ALL), 1).filter((n) => n.kind === 'note').length, 2, 'whole course shows every note');
  });
});

describe('map edits', () => {
  test('recall adds once and keeps a position', () => {
    let m = addRecall(emptyMap(), 'recursion', { x: 5, y: 6 });
    m = addRecall(m, 'recursion', { x: 99, y: 99 });
    assert.deepEqual(m.recalled, ['recursion']);
    assert.deepEqual(m.pos.recursion, { x: 5, y: 6 });
  });

  test('notes get unique ids that carry their scope', () => {
    let m = emptyMap();
    const a = addNote(m, 'u1', ' my idea ', { x: 0, y: 0 });
    m = a.map;
    const b = addNote(m, 'u1', 'another', { x: 0, y: 0 });
    assert.notEqual(a.id, b.id);
    assert.ok(isNote(a.id));
    assert.equal(noteScope(a.id), 'u1');
    assert.equal(noteScope(addNote(m, ALL, 'x', { x: 0, y: 0 }).id), ALL);
    assert.equal(a.map.notes[0].text, 'my idea');
  });

  test('links are undirected: a second link between the same nodes relabels it', () => {
    let m = addLink(emptyMap(), 'a', 'b');
    m = addLink(m, 'b', 'a', 'needs');
    assert.equal(m.links.length, 1);
    assert.equal(m.links[0].label, 'needs');
    assert.equal(addLink(m, 'a', 'a').links.length, 1, 'no self links');
    assert.equal(removeLink(m, 'b', 'a').links.length, 0);
  });

  test('merging a note into a concept moves its position and links and counts as recalled', () => {
    let m = emptyMap();
    const n = addNote(m, 'u1', 'calling itself', { x: 40, y: 50 });
    m = addLink(addRecall(n.map, 'base-case', { x: 0, y: 0 }), n.id, 'base-case', 'needs');
    m = mergeNote(m, n.id, 'recursion');
    assert.equal(m.notes.length, 0);
    assert.ok(m.recalled.includes('recursion'));
    assert.deepEqual(m.pos.recursion, { x: 40, y: 50 });
    assert.equal(m.pos[n.id], undefined);
    assert.deepEqual(m.links, [{ from: 'recursion', to: 'base-case', label: 'needs' }]);
  });

  test('merging drops links that would become self links or duplicates', () => {
    let m = addRecall(emptyMap(), 'recursion', { x: 0, y: 0 });
    const n = addNote(m, ALL, 'self call', { x: 0, y: 0 });
    m = addLink(addLink(n.map, n.id, 'recursion'), n.id, 'base-case');
    m = addLink(m, 'recursion', 'base-case');
    m = mergeNote(m, n.id, 'recursion');
    assert.deepEqual(
      m.links.map((l) => pairKey(l.from, l.to)),
      [pairKey('recursion', 'base-case')],
    );
  });

  test('a wrong match can be turned back into a note, keeping links', () => {
    let m = addLink(addRecall(emptyMap(), 'map', { x: 3, y: 4 }), 'map', 'dictionary');
    m = unrecallToNote(m, 'map', 'u2', 'maps (the function)');
    assert.equal(m.recalled.length, 0);
    assert.equal(m.notes[0].text, 'maps (the function)');
    assert.deepEqual(m.pos[m.notes[0].id], { x: 3, y: 4 });
    assert.equal(m.links[0].from, m.notes[0].id);
  });

  test('removing a node removes its links; a concept keeps its position for later', () => {
    let m = addLink(addRecall(emptyMap(), 'map', { x: 0, y: 0 }), 'map', 'dictionary');
    const n = addNote(m, ALL, 'x', { x: 1, y: 1 });
    m = removeNode(addLink(n.map, n.id, 'map'), 'map');
    assert.equal(m.links.length, 0);
    assert.equal(m.recalled.length, 0);
    m = removeNode(m, n.id);
    assert.equal(m.notes.length, 0);
    assert.equal(m.pos[n.id], undefined);
  });

  test('layers advance per scope and never go back; the shared layer is the furthest', () => {
    let m = advance(emptyMap(), 'u1', 2);
    assert.equal(scopeLayer(m, 'u1'), 2);
    assert.equal(scopeLayer(m, 'u2'), 1);
    m = advance(m, 'u1', 1);
    assert.equal(scopeLayer(m, 'u1'), 2);
    m = advance(m, 'u2', 3);
    assert.equal(m.layer, 3);
  });

  test('start over for a unit forgets only that unit', () => {
    let m = addRecall(addRecall(emptyMap(), 'recursion', { x: 0, y: 0 }), 'map', { x: 1, y: 0 });
    m = addNote(m, 'u1', 'mine', { x: 2, y: 0 }).map;
    m = addNote(m, 'u2', 'theirs', { x: 3, y: 0 }).map;
    m = addLink(m, 'recursion', 'map');
    m = addHint(addHint(m, pairKey('recursion', 'base-case')), pairKey('dictionary', 'map'));
    m = advance(advance(m, 'u1', 3), 'u2', 2);
    m = resetScope(m, scopeOf(course, 'u1'));
    assert.deepEqual(m.recalled, ['map']);
    assert.deepEqual(
      m.notes.map((n) => n.text),
      ['theirs'],
    );
    assert.equal(m.links.length, 0);
    assert.deepEqual(m.hinted, [pairKey('dictionary', 'map')]);
    assert.equal(scopeLayer(m, 'u1'), 1);
    assert.equal(m.layer, 2);
    assert.equal(m.pos.recursion, undefined);
    assert.ok(m.pos.map);
    assert.deepEqual(resetScope(m, scopeOf(course, ALL)).recalled, []);
  });

  test('normalizeMap repairs partial data', () => {
    const m = normalizeMap({ recalled: ['a'] } as never);
    assert.deepEqual(m.links, []);
    assert.deepEqual(m.pos, {});
    assert.equal(normalizeMap(undefined).layer, 1);
  });
});

describe('scores', () => {
  test('recall score and message are honest and positive', () => {
    const s = scopeOf(course, 'u1');
    let m = addRecall(emptyMap(), 'recursion', { x: 0, y: 0 });
    m = addRecall(m, 'map', { x: 0, y: 0 }); // out of scope: not counted here
    const r = recallScore(m, s);
    assert.deepEqual(r, { recalled: 1, total: 4, fraction: 0.25 });
    assert.match(recallMessage(r), /1 of 4/);
    assert.match(recallMessage({ recalled: 0, total: 4, fraction: 0 }), /tends to/);
    assert.match(recallMessage({ recalled: 4, total: 4, fraction: 1 }), /all 4/);
    assert.match(recallMessage({ recalled: 3, total: 4, fraction: 0.75 }), /strong/);
  });

  test('check compares undirected links among in-scope concepts; extra links are neutral', () => {
    const s = scopeOf(course, 'u1');
    let m = addLink(emptyMap(), 'for-loop', 'list-comprehension'); // expert, reversed direction
    m = addLink(m, 'base-case', 'for-loop'); // not in the expert map
    const r = checkMap(m, s);
    assert.equal(r.total, 3);
    assert.equal(r.found, 1);
    assert.equal(r.status[pairKey('for-loop', 'list-comprehension')], 'found');
    assert.equal(r.status[pairKey('base-case', 'for-loop')], 'extra');
    assert.equal(r.missed.length, 2);
    assert.equal(r.correct[0].label, 'replaces');
  });

  test('hints: next hint prefers links between recalled nodes; drawing a hinted link counts as "with a hint"', () => {
    const s = scopeOf(course, 'u1');
    let m = addRecall(addRecall(emptyMap(), 'recursion', { x: 0, y: 0 }), 'base-case', { x: 0, y: 0 });
    let r = checkMap(m, s);
    const h = nextHint(r, m)!;
    assert.equal(pairKey(h.from, h.to), pairKey('recursion', 'base-case'));
    m = addHint(m, pairKey(h.from, h.to));
    r = checkMap(m, s);
    assert.equal(r.shownHints.length, 1);
    assert.notEqual(pairKey(nextHint(r, m)!.from, nextHint(r, m)!.to), pairKey('recursion', 'base-case'), 'moves on to another link');
    m = addLink(m, 'base-case', 'recursion');
    r = checkMap(m, s);
    assert.equal(r.found, 0);
    assert.equal(r.withHint, 1);
    assert.equal(r.shownHints.length, 0);
  });

  test('chunks are connected components of correct links, named by the best-connected member', () => {
    const order = concepts.map((c) => c.id);
    const cs = chunks(
      [
        { from: 'recursion', to: 'base-case' },
        { from: 'recursion', to: 'for-loop' },
        { from: 'dictionary', to: 'map' },
      ],
      order,
    );
    assert.equal(cs.length, 2);
    assert.equal(cs[0].name, 'recursion');
    assert.equal(cs[0].members.length, 3);
    assert.equal(cs[1].name, 'dictionary', 'tie broken by course order');
    assert.deepEqual(chunks([], order), []);
  });
});

describe('layout and view', () => {
  test('new nodes land in free grid slots spiralling out from the centre', () => {
    const a = nextSlot([]);
    assert.deepEqual(a, { x: 0, y: 0 });
    const b = nextSlot([a]);
    assert.notDeepEqual(b, a);
    const placed = placeMissing({ x: { x: 0, y: 0 } }, ['x', 'y', 'z']);
    assert.deepEqual(placed.x, { x: 0, y: 0 });
    const ps = Object.values(placed);
    assert.equal(new Set(ps.map((p) => `${p.x},${p.y}`)).size, 3);
  });

  test('grid layout is centred and in reading order', () => {
    const g = gridLayout(['a', 'b', 'c', 'd'], 2);
    assert.equal(g.a.x, -g.b.x);
    assert.equal(g.a.y, g.b.y);
    assert.ok(g.c.y > g.a.y);
  });

  test('layouts follow the canvas shape: fewer columns on a tall phone canvas', () => {
    const ids = Array.from({ length: 24 }, (_, i) => `n${i}`);
    const cols = (g: Record<string, { x: number }>) => new Set(Object.values(g).map((p) => p.x)).size;
    assert.ok(cols(gridLayout(ids, undefined, 0.6)) < cols(gridLayout(ids)), 'portrait grid is narrower');
    const links = ids.slice(1).map((id, i) => ({ from: ids[i], to: id }));
    const box = (g: Record<string, { x: number; y: number }>) => {
      const ps = Object.values(g);
      return { w: Math.max(...ps.map((p) => p.x)) - Math.min(...ps.map((p) => p.x)), h: Math.max(...ps.map((p) => p.y)) - Math.min(...ps.map((p) => p.y)) };
    };
    const tall = box(forceLayout(ids, links, undefined, 0.6));
    const wide = box(forceLayout(ids, links));
    assert.ok(tall.h / tall.w > wide.h / wide.w, 'portrait force layout is taller for its width');
  });

  test('tidy-up keeps linked ideas together and parks the rest in a grid below', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `n${i}`);
    const links = [
      { from: 'n0', to: 'n1' },
      { from: 'n1', to: 'n2' },
    ];
    const lay = arrangeLayout(ids, links);
    assert.deepEqual(Object.keys(lay).sort(), [...ids].sort());
    const linkedBottom = Math.max(lay.n0.y, lay.n1.y, lay.n2.y);
    assert.ok(ids.slice(3).every((id) => lay[id].y > linkedBottom), 'loose ideas sit below the chunk');
    const width = (g: Record<string, { x: number }>) => Math.max(...Object.values(g).map((p) => p.x)) - Math.min(...Object.values(g).map((p) => p.x));
    assert.ok(width(lay) < width(forceLayout(ids, links)), 'much narrower than one big circle');
    assert.deepEqual(arrangeLayout(['a', 'b', 'c'], []), gridLayout(['a', 'b', 'c']), 'no links: plain grid');
    const two = arrangeLayout(['a', 'b', 'c', 'd'], [{ from: 'a', to: 'b' }, { from: 'c', to: 'd' }]);
    const gap = Math.hypot(two.b.x - two.c.x, two.b.y - two.c.y);
    assert.ok(gap < 3 * CELL_W, `separate chunks are packed side by side (gap ${gap})`);
  });

  test('force layout is deterministic, keeps linked nodes closer, and leaves no overlaps', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const links = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
      { from: 'd', to: 'e' },
    ];
    const one = forceLayout(ids, links);
    assert.deepEqual(forceLayout(ids, links), one);
    const dist = (p: string, q: string) => Math.hypot(one[p].x - one[q].x, one[p].y - one[q].y);
    assert.ok(dist('a', 'b') < dist('a', 'e'));
    const pts = ids.map((i) => one[i]);
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        assert.ok(Math.abs(pts[i].x - pts[j].x) >= 150 || Math.abs(pts[i].y - pts[j].y) >= 40, `${ids[i]} and ${ids[j]} overlap`);
    assert.deepEqual(Object.keys(forceLayout(['a', 'b'], [])), ['a', 'b'], 'falls back to a grid');
  });

  test('separate pushes stacked rectangles apart', () => {
    const p = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    separate(p, 100, 40);
    assert.ok(Math.abs(p[0].x - p[1].x) >= 100 || Math.abs(p[0].y - p[1].y) >= 40);
  });

  test('fit-to-screen centres the points and zoom keeps the pointer fixed', () => {
    const v = fitView(
      [
        { x: -100, y: 0 },
        { x: 100, y: 0 },
      ],
      400,
      300,
    );
    assert.ok(Math.abs(v.x - 200) < 1e-9);
    assert.ok(Math.abs(v.y - 150) < 1e-9);
    assert.deepEqual(fitView([], 400, 300), { x: 200, y: 150, k: 1 });
    const z = zoomAt({ x: 10, y: 20, k: 1 }, 2, 110, 70);
    assert.equal(z.k, 2);
    // The world point under (110, 70) stays under it.
    assert.equal((110 - z.x) / z.k, 100);
    assert.equal((70 - z.y) / z.k, 50);
    assert.equal(zoomAt({ x: 0, y: 0, k: 2 }, 100, 0, 0).k, 2.5, 'clamped');
  });

  test('edges end on the target box; node sizes wrap long labels', () => {
    assert.deepEqual(edgeEnd({ x: -100, y: 0 }, { x: 0, y: 0 }, 50, 20), { x: -50, y: 0 });
    assert.deepEqual(edgeEnd({ x: 0, y: 100 }, { x: 0, y: 0 }, 50, 20), { x: 0, y: 20 });
    assert.deepEqual(edgeEnd({ x: 10, y: 0 }, { x: 0, y: 0 }, 50, 20), { x: 0, y: 0 }, 'inside the box: no clipping');
    assert.equal(nodeSize('Map').h, 38);
    assert.equal(nodeSize('A rather long concept label that wraps').h, 56);
  });

  test('hull wraps the outer points', () => {
    const h = hull([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 5, y: 5 },
    ]);
    assert.equal(h.length, 4);
    assert.equal(hull([{ x: 1, y: 1 }]).length, 1);
  });
});
