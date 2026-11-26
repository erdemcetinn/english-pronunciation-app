import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  letterScore,
  MIN_ATTEMPTS,
  recordAttempt,
  scoreBand,
  soundScore,
  speedPoints,
  topConfusion,
  WINDOW,
  type Attempt,
} from './skill-score.ts';

const right = (extra: Partial<Attempt> = {}): Attempt => ({ isCorrect: true, at: 0, ...extra });
const wrong = (chosen: string, extra: Partial<Attempt> = {}): Attempt => ({ isCorrect: false, chosen, at: 0, ...extra });
const times = <T>(n: number, make: () => T) => Array.from({ length: n }, make);

test('recordAttempt keeps only the last WINDOW attempts and does not mutate', () => {
  const log = { ih: times(WINDOW, () => wrong('iy')) };
  const next = recordAttempt(log, 'ih', right());
  assert.equal(next.ih.length, WINDOW);
  assert.equal(next.ih[WINDOW - 1].isCorrect, true);
  assert.equal(log.ih.length, WINDOW);
  assert.equal(log.ih[WINDOW - 1].isCorrect, false);
});

test('soundScore: null under MIN_ATTEMPTS, otherwise accuracy x 100', () => {
  assert.equal(soundScore(times(MIN_ATTEMPTS - 1, () => right())), null);
  assert.equal(soundScore([right(), right(), right(), wrong('x'), wrong('x')]), 60);
});

test('speedPoints: full at 0.8 s or faster, zero at 2.5 s or slower, linear between', () => {
  assert.equal(speedPoints(500), 100);
  assert.equal(speedPoints(800), 100);
  assert.equal(speedPoints(1650), 50);
  assert.equal(speedPoints(3000), 0);
});

test('letterScore: 80% speed + 20% accuracy; wrong timed answers give 0 speed', () => {
  // 4 fast correct (100 speed each) + 1 wrong (0 speed): speed 80, accuracy 80 -> 80
  const attempts = [...times(4, () => right({ ms: 700 })), wrong('I', { ms: 400 })];
  assert.equal(letterScore(attempts), 80);
  // all correct but slow: speed 0, accuracy 100 -> 20
  assert.equal(letterScore(times(5, () => right({ ms: 3000 }))), 20);
});

test('letterScore: accuracy only when there is no timed attempt (spelling)', () => {
  assert.equal(letterScore([right(), right(), right(), right(), wrong('E')]), 80);
  assert.equal(letterScore(times(MIN_ATTEMPTS - 1, () => right())), null);
});

test('topConfusion: the most frequent wrong choice', () => {
  assert.deepEqual(topConfusion([wrong('iy'), wrong('eh'), wrong('iy'), right()]), { id: 'iy', count: 2 });
  assert.equal(topConfusion([right()]), null);
});

test('scoreBand: 85+ good, 60-84 ok, below 60 weak', () => {
  assert.equal(scoreBand(85), 'good');
  assert.equal(scoreBand(84), 'ok');
  assert.equal(scoreBand(60), 'ok');
  assert.equal(scoreBand(59), 'weak');
});
