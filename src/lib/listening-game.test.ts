import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextRound, scoreAnswer, INITIAL_SCORE, type MinimalPair } from './listening-game.ts';

const PAIRS: MinimalPair[] = [
  { a: 'ship', b: 'sheep', contrast: ['ih', 'iy'] },
  { a: 'van', b: 'fan', contrast: ['v', 'f'] },
];

test('round plays one of the two words and offers both', () => {
  const round = nextRound(PAIRS, null, () => 0);
  assert.ok([round.pair.a, round.pair.b].includes(round.target));
  assert.deepEqual([...round.options].sort(), [round.pair.a, round.pair.b].sort());
});

test('does not repeat the same pair twice in a row', () => {
  let previous = nextRound(PAIRS, null, Math.random);
  for (let i = 0; i < 50; i += 1) {
    const round = nextRound(PAIRS, previous.pair, Math.random);
    assert.notEqual(round.pair, previous.pair);
    previous = round;
  }
});

test('correct answer raises score and streak, wrong one resets streak', () => {
  const afterRight = scoreAnswer(INITIAL_SCORE, true);
  assert.deepEqual(afterRight, { correct: 1, total: 1, streak: 1, bestStreak: 1 });
  const afterWrong = scoreAnswer(afterRight, false);
  assert.deepEqual(afterWrong, { correct: 1, total: 2, streak: 0, bestStreak: 1 });
});
