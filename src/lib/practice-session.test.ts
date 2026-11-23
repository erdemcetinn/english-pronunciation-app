import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildSession, type SeenMap } from './practice-session.ts';

const pool = Array.from({ length: 100 }, (_, i) => `w${i}`);
const noShuffle = <T>(items: readonly T[]): T[] => [...items];
const seenFirst = (count: number): SeenMap =>
  Object.fromEntries(pool.slice(0, count).map((w, i) => [w, 1000 + i]));

test('first session is all new words, most frequent first', () => {
  const session = buildSession(pool, {}, { shuffle: noShuffle });
  assert.deepEqual(session, pool.slice(0, 20));
});

test('later session is 14 new + 6 review words', () => {
  const seen = seenFirst(20);
  const session = buildSession(pool, seen, { shuffle: noShuffle });
  assert.equal(session.length, 20);
  assert.equal(session.filter((w) => w in seen).length, 6);
  assert.deepEqual(session.filter((w) => !(w in seen)), pool.slice(20, 34));
});

test('review picks the words seen longest ago', () => {
  const seen = seenFirst(20);
  const review = buildSession(pool, seen, { shuffle: noShuffle }).filter((w) => w in seen);
  assert.deepEqual(review, pool.slice(0, 6));
});

test('fills with review words when few new words remain', () => {
  const session = buildSession(pool, seenFirst(95), { shuffle: noShuffle });
  assert.equal(session.length, 20);
  assert.equal(session.filter((w) => !(w in seenFirst(95))).length, 5);
});

test('never repeats a word inside one session and handles small pools', () => {
  const small = pool.slice(0, 8);
  const session = buildSession(small, {}, { shuffle: noShuffle });
  assert.equal(new Set(session).size, session.length);
  assert.equal(session.length, 8);
});

test('ignores seen entries for words no longer in the pool', () => {
  const session = buildSession(pool.slice(0, 30), { gone: 1 }, { shuffle: noShuffle });
  assert.equal(session.includes('gone'), false);
});
