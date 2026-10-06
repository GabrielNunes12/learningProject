// Tests for the Big-O race's pure logic. Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  axisLog10,
  barExtent,
  formatCount,
  formatFactor,
  formatOps,
  humanTime,
  linearReference,
  nToSlider,
  ops,
  opsLog10,
  quickSizes,
  sci,
  sliderToN,
  timeFor,
  type Curve,
} from '../src/lib/growthsim.ts';

const ALL: Curve[] = ['1', 'log n', 'n', 'n log n', 'n^2', '2^n'];

describe('operation counts', () => {
  test('values at n = 1024', () => {
    assert.equal(ops('1', 1024), 1);
    assert.equal(ops('log n', 1024), 10);
    assert.equal(ops('n', 1024), 1024);
    assert.equal(ops('n log n', 1024), 10240);
    assert.equal(ops('n^2', 1024), 1048576);
    assert.equal(ops('2^n', 10), 1024);
  });
  test('log10 form agrees with the plain numbers where they fit', () => {
    for (const c of ALL)
      for (const n of [2, 10, 100, 1000]) {
        const plain = ops(c, n);
        if (Number.isFinite(plain)) assert.ok(Math.abs(10 ** opsLog10(c, n) - plain) / plain < 1e-9, `${c} @ ${n}`);
      }
  });
  test('2^n overflows a double but log10 does not', () => {
    assert.equal(ops('2^n', 2000), Infinity);
    assert.ok(Math.abs(opsLog10('2^n', 1_000_000) - 301029.9957) < 0.001);
  });
  test('n = 1: log n is 0 operations', () => {
    assert.equal(opsLog10('log n', 1), -Infinity);
    assert.equal(formatOps('log n', 1), '0');
  });
});

describe('formatting', () => {
  test('exact digits up to 10^15', () => {
    assert.equal(formatOps('n', 1_000_000), '1,000,000');
    assert.equal(formatOps('n^2', 1_000_000), '1,000,000,000,000');
    assert.equal(formatOps('n log n', 1000), '9,966');
    assert.equal(formatOps('log n', 1000), '10');
    assert.equal(formatOps('log n', 10), '3.3');
  });
  test('scientific beyond 10^15', () => {
    assert.equal(formatOps('2^n', 100), '1.3 × 10³⁰');
    assert.equal(formatOps('n^2', 1e8), '1.0 × 10¹⁶');
    assert.equal(formatCount(301029.9957), '9.9 × 10³⁰¹⁰²⁹');
  });
  test('sci rounds 9.96 up to the next power', () => {
    assert.deepEqual(sci(Math.log10(9.96e20)), { mantissa: '1.0', exponent: 21 });
  });
  test('human time at 1 µs per operation', () => {
    assert.equal(humanTime(-Infinity), '0 µs');
    assert.equal(timeFor('n', 10), '10 µs');
    assert.equal(timeFor('n', 1000), '1 ms');
    assert.equal(timeFor('n', 2000), '2 ms');
    assert.equal(timeFor('n', 1_000_000), '1 s');
    assert.equal(timeFor('n log n', 1_000_000), '20 s');
    assert.equal(timeFor('n^2', 1000), '1 s');
    assert.equal(timeFor('n^2', 1_000_000), '12 days');
    assert.equal(humanTime(Math.log10(17 * 60e6)), '17 min');
    assert.equal(timeFor('2^n', 30), '18 min');
    assert.equal(timeFor('2^n', 64), '584,542 years');
    assert.equal(timeFor('2^n', 100), '4.0 × 10¹⁶ years');
    assert.equal(humanTime(Math.log10(3.2e14 * 365.25 * 86400e6)), '3.2 × 10¹⁴ years');
  });
});

describe('slider and axes', () => {
  test('log slider covers 1 … maxN and round-trips', () => {
    assert.equal(sliderToN(0, 1_000_000), 1);
    assert.equal(sliderToN(1000, 1_000_000), 1_000_000);
    assert.equal(sliderToN(500, 1_000_000), 1000);
    for (const n of [1, 10, 100, 1000, 1_000_000]) assert.equal(sliderToN(nToSlider(n, 1_000_000), 1_000_000), n);
  });
  test('quick sizes respect maxN', () => {
    assert.deepEqual(quickSizes(1000), [10, 100, 1000]);
    assert.deepEqual(quickSizes(1_000_000), [10, 100, 1000, 1_000_000]);
    assert.deepEqual(quickSizes(50), [10]);
  });
  test('linear axis is sized to O(n), so O(n²) flies off', () => {
    const curves: Curve[] = ['n', 'n^2'];
    assert.equal(linearReference(curves), 'n');
    const ax = axisLog10(curves, 1000, 'linear');
    assert.ok(Math.abs(ax - Math.log10(2000)) < 1e-9);
    assert.equal(barExtent(opsLog10('n', 1000), ax, 'linear').overLog, 0);
    const sq = barExtent(opsLog10('n^2', 1000), ax, 'linear');
    assert.equal(sq.frac, 1);
    assert.ok(Math.abs(sq.overLog - Math.log10(500)) < 1e-9);
    assert.equal(formatFactor(sq.overLog), '500');
    // 2^n at a million overflows a double; the factor is still formatted
    const huge = barExtent(opsLog10('2^n', 1_000_000), axisLog10(['n', '2^n'], 1_000_000, 'linear'), 'linear');
    assert.match(formatFactor(huge.overLog), /× 10³⁰¹⁰²³$/);
    assert.equal(formatFactor(Math.log10(1.66)), '1.7');
    assert.equal(formatFactor(Math.log10(51.2)), '51');
  });
  test('log axis rounds up to a power of ten and caps', () => {
    assert.equal(axisLog10(['n', 'n^2'], 1000, 'log'), 6);
    assert.equal(axisLog10(['n', '2^n'], 1000, 'log'), 30);
    const b = barExtent(opsLog10('n', 1000), 6, 'log');
    assert.ok(Math.abs(b.frac - 0.5) < 1e-9);
    assert.equal(barExtent(0, 6, 'log').frac, 0);
  });
});
