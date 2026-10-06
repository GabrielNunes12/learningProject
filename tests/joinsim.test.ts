// Tests for the JOIN playground logic (src/lib/joinsim.ts). Run with: npm test
// Expected results were checked against sqlite3 and PostgreSQL 17 with the same data.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { aliases, describeJoin, joinSql, joinTables, rowLabel, sqlEquals, type JoinTable } from '../src/lib/joinsim.ts';

const customers: JoinTable = {
  name: 'customers',
  columns: ['id', 'name'],
  rows: [
    [1, 'Ana'],
    [2, 'Ben'],
    [3, 'Cara'],
    [4, 'Dev'],
    [5, 'Eli'],
  ],
};
const orders: JoinTable = {
  name: 'orders',
  columns: ['id', 'customer_id', 'total'],
  rows: [
    [101, 1, '40.00'],
    [102, 1, '25.00'],
    [103, 2, '80.00'],
    [104, 3, '15.00'],
    [105, 2, '50.00'],
    [106, null, '30.00'],
  ],
};
const on: [string, string] = ['id', 'customer_id'];
const pairs = (t: 'inner' | 'left' | 'right' | 'full') => joinTables(customers, orders, on, t).rows.map((r) => [r.left, r.right]);

describe('joinsim', () => {
  test('NULL never matches, not even NULL', () => {
    assert.equal(sqlEquals(null, null), false);
    assert.equal(sqlEquals(null, 1), false);
    assert.equal(sqlEquals(1, 1), true);
    assert.equal(sqlEquals(1, '1'), true);
    assert.equal(sqlEquals('a', 'b'), false);
  });

  test('inner join keeps only matching pairs, repeating the "one" side', () => {
    const r = joinTables(customers, orders, on, 'inner');
    assert.equal(r.rows.length, 5);
    assert.deepEqual(pairs('inner'), [[0, 0], [0, 1], [1, 2], [1, 4], [2, 3]]);
    assert.deepEqual(r.columns, ['c.id', 'c.name', 'o.id', 'o.customer_id', 'o.total']);
    assert.deepEqual(r.rows[0].values, [1, 'Ana', 101, 1, '40.00']);
    assert.deepEqual(r.unmatchedLeft, [3, 4]);
    assert.deepEqual(r.unmatchedRight, [5]);
  });

  test('left join pads unmatched left rows with NULLs', () => {
    const r = joinTables(customers, orders, on, 'left');
    assert.equal(r.rows.length, 7);
    assert.deepEqual(r.rows[5].values, [4, 'Dev', null, null, null]);
    assert.deepEqual(r.rows[6], { left: 4, right: null, values: [5, 'Eli', null, null, null] });
  });

  test('right join keeps every right row', () => {
    const r = joinTables(customers, orders, on, 'right');
    assert.equal(r.rows.length, 6);
    assert.deepEqual(pairs('right'), [[0, 0], [0, 1], [1, 2], [2, 3], [1, 4], [null, 5]]);
    assert.deepEqual(r.rows[5].values, [null, null, 106, null, '30.00']);
  });

  test('full join keeps both sides', () => {
    assert.equal(joinTables(customers, orders, on, 'full').rows.length, 8);
    assert.deepEqual(pairs('full').slice(-1), [[null, 5]]);
  });

  test('many-to-many duplicates both sides', () => {
    const a: JoinTable = { name: 'a', columns: ['k'], rows: [[1], [1], [null]] };
    const b: JoinTable = { name: 'b', columns: ['k'], rows: [[1], [1], [1], [null]] };
    assert.equal(joinTables(a, b, ['k', 'k'], 'inner').rows.length, 6);
    assert.equal(joinTables(a, b, ['k', 'k'], 'full').rows.length, 8);
    assert.deepEqual(aliases('a', 'b'), ['a', 'b']);
    assert.deepEqual(aliases('orders', 'orders'), ['t1', 't2']);
  });

  test('SQL text and labels', () => {
    assert.equal(joinSql(customers, orders, on, 'full'), 'SELECT *\nFROM customers c\nFULL OUTER JOIN orders o\n  ON c.id = o.customer_id;');
    assert.equal(rowLabel(customers, 3, 'id'), 'Dev');
    assert.equal(rowLabel(orders, 5, 'customer_id'), 'id 106');
  });

  test('description names what is kept and dropped', () => {
    const inner = describeJoin(customers, orders, on, 'inner');
    assert.equal(inner[0], '5 matching pairs, one result row each.');
    assert.ok(inner.some((l) => l.startsWith('Ana, Ben match more than once')));
    assert.ok(inner.includes('No match in customers: Dev, Eli, dropped.'));
    assert.ok(inner.includes('No match in orders: id 106, dropped. (NULL never equals anything, not even NULL.)'));
    const left = describeJoin(customers, orders, on, 'left');
    assert.ok(left.includes('No match in customers: Dev, Eli, kept, with NULLs for orders.'));
  });
});
