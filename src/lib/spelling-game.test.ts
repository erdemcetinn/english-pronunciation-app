import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkSpelling, isSpellable, normalizeTyped } from './spelling-game.ts';

const LIMITS = { minLength: 3, maxLength: 7 };

test('isSpellable: plain lowercase words within the length limits', () => {
  assert.equal(isSpellable('house', LIMITS), true);
  assert.equal(isSpellable('to', LIMITS), false);
  assert.equal(isSpellable('information', LIMITS), false);
  assert.equal(isSpellable("don't", LIMITS), false);
  assert.equal(isSpellable('e-mail', LIMITS), false);
});

test('normalizeTyped: lowercases, drops non-letters, caps at word length', () => {
  assert.equal(normalizeTyped('Ho Use!', 5), 'house');
  assert.equal(normalizeTyped('housework', 5), 'house');
});

test('checkSpelling: marks each slot, missing letters count as wrong', () => {
  assert.deepEqual(checkSpelling('house', 'house'), { isCorrect: true, slots: [true, true, true, true, true] });
  assert.deepEqual(checkSpelling('hoyse', 'house'), { isCorrect: false, slots: [true, true, false, true, true] });
  assert.deepEqual(checkSpelling('ho', 'house'), { isCorrect: false, slots: [true, true, false, false, false] });
});
