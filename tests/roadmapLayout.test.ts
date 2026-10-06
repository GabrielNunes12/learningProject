// Tests for the roadmap layout math and node statuses. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  chooseLayoutOptions,
  computeLevels,
  edgePath,
  layoutRoadmap,
  nodeStatuses,
  orderLevels,
  suggestNext,
  type LayoutInput,
  type LayoutOptions,
} from '../src/lib/roadmapLayout.ts';

// Same shape as the "Java & Spring backend developer" track.
const jvm: LayoutInput[] = [
  { id: 'laf' },
  { id: 'java', after: ['laf'] },
  { id: 'git', after: ['laf'] },
  { id: 'kotlin', after: ['java'] },
  { id: 'sql', after: ['java'] },
  { id: 'testing', after: ['java', 'git'] },
  { id: 'spring', after: ['sql', 'testing'] },
];

const opts = (direction: 'horizontal' | 'vertical'): LayoutOptions => ({
  direction,
  nodeWidth: 200,
  nodeHeight: 90,
  levelGap: 50,
  siblingGap: 20,
  padding: 10,
});

describe('computeLevels', () => {
  test('roots are level 0, others are 1 + the deepest prerequisite', () => {
    const l = computeLevels(jvm);
    assert.deepEqual(Object.fromEntries(l), { laf: 0, java: 1, git: 1, kotlin: 2, sql: 2, testing: 2, spring: 3 });
  });

  test('uses the max over several prerequisites, not the first', () => {
    const l = computeLevels([{ id: 'a' }, { id: 'b', after: ['a'] }, { id: 'c', after: ['a', 'b'] }]);
    assert.equal(l.get('c'), 2);
  });

  test('ignores unknown prerequisites and survives a cycle', () => {
    assert.equal(computeLevels([{ id: 'a', after: ['ghost'] }]).get('a'), 0);
    const cyc = computeLevels([
      { id: 'a', after: ['b'] },
      { id: 'b', after: ['a'] },
    ]);
    assert.equal(cyc.size, 2);
  });
});

describe('orderLevels', () => {
  test('groups by level and orders children under their parents', () => {
    const nodes: LayoutInput[] = [
      { id: 'root' },
      { id: 'left', after: ['root'] },
      { id: 'right', after: ['root'] },
      // Listed first but its parent is on the right, so it should be placed second.
      { id: 'underRight', after: ['right'] },
      { id: 'underLeft', after: ['left'] },
    ];
    assert.deepEqual(orderLevels(nodes, computeLevels(nodes)), [['root'], ['left', 'right'], ['underLeft', 'underRight']]);
  });
});

describe('layoutRoadmap', () => {
  test('horizontal: levels flow left to right, siblings stack, shorter levels are centred', () => {
    const L = layoutRoadmap(jvm, opts('horizontal'));
    const at = (id: string) => L.nodes.find((n) => n.id === id)!;
    assert.equal(L.levelCount, 4);
    assert.equal(at('laf').x, 10);
    assert.equal(at('java').x, 10 + 250);
    assert.equal(at('spring').x, 10 + 3 * 250);
    // Level 2 has 3 nodes, the tallest: it spans the full height.
    assert.equal(at('kotlin').y, 10);
    assert.equal(at('testing').y, 10 + 2 * 110);
    // Single-node levels sit in the middle.
    assert.equal(at('laf').y, 10 + 110);
    assert.equal(L.width, 4 * 200 + 3 * 50 + 20);
    assert.equal(L.height, 3 * 90 + 2 * 20 + 20);
    // Same x within a level, distinct y.
    assert.equal(at('java').x, at('git').x);
    assert.notEqual(at('java').y, at('git').y);
  });

  test('vertical: levels flow top to bottom', () => {
    const L = layoutRoadmap(jvm, opts('vertical'));
    const at = (id: string) => L.nodes.find((n) => n.id === id)!;
    assert.equal(at('laf').y, 10);
    assert.equal(at('java').y, 10 + 140);
    assert.equal(at('java').y, at('git').y);
    assert.ok(at('java').x < at('git').x);
    assert.equal(L.width, 3 * 200 + 2 * 20 + 20);
    assert.equal(L.height, 4 * 90 + 3 * 50 + 20);
  });

  test('nodes are returned in reading order (level, then index)', () => {
    const L = layoutRoadmap(jvm, opts('horizontal'));
    for (let i = 1; i < L.nodes.length; i++) {
      const a = L.nodes[i - 1];
      const b = L.nodes[i];
      assert.ok(a.level < b.level || (a.level === b.level && a.index < b.index));
    }
  });

  test('one edge per prerequisite, anchored on the node edges', () => {
    const L = layoutRoadmap(jvm, opts('horizontal'));
    assert.equal(L.edges.length, 8);
    const e = L.edges.find((x) => x.from === 'laf' && x.to === 'java')!;
    const laf = L.nodes.find((n) => n.id === 'laf')!;
    const java = L.nodes.find((n) => n.id === 'java')!;
    assert.ok(e.path.startsWith(`M ${laf.x + 200} ${laf.y + 45} C`));
    assert.ok(e.path.endsWith(`${java.x} ${java.y + 45}`));

    const V = layoutRoadmap(jvm, opts('vertical'));
    const ve = V.edges.find((x) => x.from === 'laf' && x.to === 'java')!;
    const vl = V.nodes.find((n) => n.id === 'laf')!;
    assert.ok(ve.path.startsWith(`M ${vl.x + 100} ${vl.y + 90} C`));
  });

  test('empty input gives an empty map', () => {
    const L = layoutRoadmap([], opts('horizontal'));
    assert.deepEqual(L.nodes, []);
    assert.equal(L.levelCount, 0);
  });
});

describe('edgePath', () => {
  test('is a single smooth cubic with control points along the flow', () => {
    assert.equal(edgePath(0, 0, 100, 50, 'horizontal'), 'M 0 0 C 50 0, 50 50, 100 50');
    assert.equal(edgePath(0, 0, 50, 100, 'vertical'), 'M 0 0 C 0 50, 50 50, 50 100');
  });
});

describe('chooseLayoutOptions', () => {
  test('wide containers flow left to right, narrow ones top to bottom', () => {
    assert.equal(chooseLayoutOptions(jvm, 1100).direction, 'horizontal');
    assert.equal(chooseLayoutOptions(jvm, 700).direction, 'vertical');
    assert.equal(chooseLayoutOptions(jvm, 340).direction, 'vertical');
  });

  test('the chosen layout fits the container when it can', () => {
    for (const w of [340, 400, 700, 760, 900, 1100]) {
      const o = chooseLayoutOptions(jvm, w);
      const L = layoutRoadmap(jvm, o);
      assert.ok(L.width <= w, `width ${L.width} > ${w} (${o.direction})`);
    }
  });

  test('falls back to vertical when the levels would be too cramped side by side', () => {
    const long = Array.from({ length: 7 }, (_, i): LayoutInput => ({ id: `n${i}`, after: i ? [`n${i - 1}`] : undefined }));
    assert.equal(chooseLayoutOptions(long, 900).direction, 'vertical');
  });
});

describe('nodeStatuses', () => {
  const nodes: LayoutInput[] = [{ id: 'a' }, { id: 'b', after: ['a'] }, { id: 'c', after: ['a'] }, { id: 'd', after: ['b', 'c'] }];

  test('fresh start: only the roots are up next', () => {
    const s = nodeStatuses(nodes, {});
    assert.deepEqual(Object.fromEntries(s), { a: 'up-next', b: 'later', c: 'later', d: 'later' });
  });

  test('done, in progress, up next and later', () => {
    const s = nodeStatuses(nodes, {
      a: { done: true, started: true },
      b: { done: false, started: true },
      c: { done: false, started: false },
    });
    assert.deepEqual(Object.fromEntries(s), { a: 'done', b: 'in-progress', c: 'up-next', d: 'later' });
  });

  test('a started course is in progress even if its prerequisites are not done', () => {
    const s = nodeStatuses(nodes, { d: { done: false, started: true } });
    assert.equal(s.get('d'), 'in-progress');
  });

  test('suggestNext prefers in-progress, then up-next, else nothing', () => {
    const order = ['a', 'b', 'c', 'd'];
    assert.equal(suggestNext(order, nodeStatuses(nodes, {})), 'a');
    assert.equal(
      suggestNext(order, nodeStatuses(nodes, { a: { done: true, started: true }, c: { done: false, started: true } })),
      'c',
    );
    const all = { done: true, started: true };
    assert.equal(suggestNext(order, nodeStatuses(nodes, { a: all, b: all, c: all, d: all })), undefined);
  });
});
