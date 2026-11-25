import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextLetterRound, summarizeTimes } from './letter-game.ts';

const POOL = ['A', 'E', 'I', 'O', 'U'];
const keepOrder = <T>(items: readonly T[]) => [...items];
const reverse = <T>(items: readonly T[]) => [...items].reverse();

test('any letter can be the target, repeats included (no "not the last one" shortcut)', () => {
  assert.equal(nextLetterRound({ pool: POOL, optionCount: 3, shuffle: keepOrder, random: () => 0 }).target, 'A');
  assert.equal(nextLetterRound({ pool: POOL, optionCount: 3, shuffle: keepOrder, random: () => 0.99 }).target, 'U');
});

test('options contain the target plus distinct distractors from the pool', () => {
  const round = nextLetterRound({ pool: POOL, optionCount: 3, shuffle: keepOrder, random: () => 0 });
  assert.equal(round.target, 'A');
  assert.equal(round.options.length, 3);
  assert.ok(round.options.includes('A'));
  assert.equal(new Set(round.options).size, 3);
  assert.ok(round.options.every((l) => POOL.includes(l)));
});

test('options are shuffled, so the target is not always first', () => {
  const round = nextLetterRound({ pool: ['A', 'E', 'I'], optionCount: 3, shuffle: reverse, random: () => 0 });
  assert.equal(round.target, 'A');
  assert.notEqual(round.options[0], 'A');
});

test('option count is capped at the pool size', () => {
  const round = nextLetterRound({ pool: ['A', 'E', 'I'], optionCount: 5, shuffle: keepOrder, random: () => 0 });
  assert.equal(round.options.length, 3);
});

test('summarizeTimes: average and best, null when empty', () => {
  assert.deepEqual(summarizeTimes([]), { average: null, best: null });
  assert.deepEqual(summarizeTimes([900, 600, 1200]), { average: 900, best: 600 });
});
