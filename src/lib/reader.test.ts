import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isFinished, nextPosition, previousPosition, progressPercent, START, wordsOf } from './reader.ts';

const LENGTHS = [3, 2]; // sentence 0 has 3 words, sentence 1 has 2

test('wordsOf splits on whitespace', () => {
  assert.deepEqual(wordsOf(' It was  cold. '), ['It', 'was', 'cold.']);
});

test('next adds one word, then moves to the first word of the next sentence', () => {
  let pos = START;
  assert.deepEqual(pos, { sentence: 0, shown: 1 });
  pos = nextPosition(pos, LENGTHS);
  pos = nextPosition(pos, LENGTHS);
  assert.deepEqual(pos, { sentence: 0, shown: 3 });
  pos = nextPosition(pos, LENGTHS);
  assert.deepEqual(pos, { sentence: 1, shown: 1 });
});

test('next stays put at the very end, which counts as finished', () => {
  const end = { sentence: 1, shown: 2 };
  assert.deepEqual(nextPosition(end, LENGTHS), end);
  assert.equal(isFinished(end, LENGTHS), true);
  assert.equal(isFinished({ sentence: 1, shown: 1 }, LENGTHS), false);
});

test('previous removes a word, or goes back to the full previous sentence', () => {
  assert.deepEqual(previousPosition({ sentence: 0, shown: 2 }, LENGTHS), { sentence: 0, shown: 1 });
  assert.deepEqual(previousPosition({ sentence: 1, shown: 1 }, LENGTHS), { sentence: 0, shown: 3 });
  assert.deepEqual(previousPosition(START, LENGTHS), START);
});

test('progressPercent counts finished sentences', () => {
  assert.equal(progressPercent({ sentence: 0, shown: 1 }, 200), 0);
  assert.equal(progressPercent({ sentence: 50, shown: 1 }, 200), 25);
});
