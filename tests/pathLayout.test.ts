// Tests for the course-map layout math. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { amplitudeFor, layoutPath, PATH_DEFAULTS, pathThrough, placePopover } from '../src/lib/pathLayout.ts';

describe('layoutPath', () => {
  test('one node per lesson, in order, with fixed vertical spacing inside a group', () => {
    const l = layoutPath({ width: 600, groups: [4] });
    assert.equal(l.nodes.length, 4);
    assert.deepEqual(
      l.nodes.map((n) => n.index),
      [0, 1, 2, 3],
    );
    for (let i = 1; i < 4; i++) assert.equal(l.nodes[i].y - l.nodes[i - 1].y, PATH_DEFAULTS.gap);
  });

  test('x follows a sine-like curve around the centre', () => {
    const l = layoutPath({ width: 600, groups: [9] });
    const cx = 300;
    assert.equal(l.nodes[0].x, cx);
    assert.ok(l.nodes[2].x > cx, 'swings right');
    assert.ok(l.nodes[6].x < cx, 'then left');
    assert.equal(l.nodes[8].x, cx, 'back to the centre after one period');
    for (const n of l.nodes) assert.ok(Math.abs(n.x - cx) <= l.amplitude + 0.05);
  });

  test('unit banners take vertical space between groups', () => {
    const l = layoutPath({ width: 600, groups: [2, 3], bannerHeights: [100, 140] });
    assert.equal(l.banners.length, 2);
    assert.equal(l.banners[0].y, 0);
    assert.equal(l.banners[0].height, 100);
    assert.equal(l.nodes[0].y, 100 + PATH_DEFAULTS.afterBanner);
    const lastOfFirst = l.nodes[1];
    const b2 = l.banners[1];
    assert.equal(b2.y, lastOfFirst.y + PATH_DEFAULTS.afterGroup);
    assert.equal(l.nodes[2].y, b2.y + 140 + PATH_DEFAULTS.afterBanner);
    assert.equal(l.nodes[2].group, 1);
    assert.equal(l.nodes[2].index, 2, 'indexes run across groups');
    assert.equal(l.height, l.nodes[4].y + PATH_DEFAULTS.afterGroup);
  });

  test('empty groups get no banner and no space', () => {
    const l = layoutPath({ width: 600, groups: [0, 2] });
    assert.equal(l.banners.length, 1);
    assert.equal(l.banners[0].group, 1);
    assert.equal(l.banners[0].y, 0);
    assert.ok(l.nodes.every((n) => n.group === 1));
  });

  test('spaceAbove pushes a node and everything after it down', () => {
    const a = layoutPath({ width: 600, groups: [3] });
    const b = layoutPath({ width: 600, groups: [3], spaceAbove: [0, 30] });
    assert.equal(b.nodes[0].y, a.nodes[0].y);
    assert.equal(b.nodes[1].y, a.nodes[1].y + 30);
    assert.equal(b.nodes[2].y, a.nodes[2].y + 30);
    assert.equal(b.height, a.height + 30);
  });

  test('nothing overflows on a 360px phone (≈328px container)', () => {
    for (const width of [280, 328, 360]) {
      const l = layoutPath({ width, groups: [5, 7] });
      assert.ok(l.amplitude < PATH_DEFAULTS.maxAmplitude, 'amplitude shrinks');
      for (const n of l.nodes) {
        assert.ok(n.x - PATH_DEFAULTS.nodeSpan / 2 >= 0, `left edge inside at ${width}`);
        assert.ok(n.x + PATH_DEFAULTS.nodeSpan / 2 <= width, `right edge inside at ${width}`);
      }
    }
  });

  test('path string goes through every node', () => {
    const l = layoutPath({ width: 500, groups: [3] });
    assert.ok(l.path.startsWith(`M ${l.nodes[0].x} ${l.nodes[0].y}`));
    assert.equal((l.path.match(/C /g) ?? []).length, 2);
    assert.ok(l.path.endsWith(`${l.nodes[2].x} ${l.nodes[2].y}`));
  });

  test('no lessons: empty layout', () => {
    const l = layoutPath({ width: 500, groups: [] });
    assert.equal(l.nodes.length, 0);
    assert.equal(l.path, '');
    assert.equal(l.height, 0);
  });
});

describe('amplitudeFor / pathThrough', () => {
  test('amplitude is capped on wide screens and never negative', () => {
    assert.equal(amplitudeFor(1200), PATH_DEFAULTS.maxAmplitude);
    assert.equal(amplitudeFor(50), 0);
  });

  test('pathThrough handles one point', () => {
    assert.equal(pathThrough([{ x: 1, y: 2 }]), 'M 1 2');
    assert.equal(pathThrough([]), '');
  });
});

describe('placePopover', () => {
  const base = { nodeRadius: 32, containerHeight: 2000, popWidth: 260, popHeight: 180 };

  test('centred under the node when there is room', () => {
    const p = placePopover({ ...base, nodeX: 300, nodeY: 400, containerWidth: 600 });
    assert.equal(p.left, 170);
    assert.equal(p.top, 400 + 32 + 12);
    assert.equal(p.above, false);
    assert.equal(p.arrowX, 130);
  });

  test('clamped inside the container on both sides', () => {
    const l = placePopover({ ...base, nodeX: 20, nodeY: 400, containerWidth: 600 });
    assert.equal(l.left, 8);
    assert.equal(l.arrowX, 16);
    const r = placePopover({ ...base, nodeX: 590, nodeY: 400, containerWidth: 600 });
    assert.equal(r.left + r.width, 592);
  });

  test('narrower than the container on a phone', () => {
    const p = placePopover({ ...base, nodeX: 150, nodeY: 400, containerWidth: 240 });
    assert.equal(p.width, 224);
    assert.equal(p.left, 8);
  });

  test('flips above the node near the bottom', () => {
    const p = placePopover({ ...base, nodeX: 300, nodeY: 1950, containerWidth: 600 });
    assert.equal(p.above, true);
    assert.equal(p.top, 1950 - 32 - 12 - 180);
  });
});
