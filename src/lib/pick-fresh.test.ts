import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pickFresh } from './pick-fresh.ts';

const ITEMS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

test('prefers items that were never seen', () => {
  const seen = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9 };
  for (let i = 0; i < 20; i += 1) assert.equal(pickFresh(ITEMS, seen, Math.random), 'j');
});

test('when everything was seen, picks from the oldest ones', () => {
  const seen = Object.fromEntries(ITEMS.map((item, i) => [item, 100 + i]));
  for (let i = 0; i < 50; i += 1) {
    assert.ok(['a', 'b'].includes(pickFresh(ITEMS, seen, Math.random) as string));
  }
});

test('returns null for an empty list', () => {
  assert.equal(pickFresh([], {}, Math.random), null);
});
