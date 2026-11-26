import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildLetterBank, checkSpelling, isSpellable, toAsciiCapitals } from './spelling-game.ts';

const LIMITS = { minLength: 3, maxLength: 7 };

test('isSpellable: plain lowercase words within the length limits', () => {
  assert.equal(isSpellable('house', LIMITS), true);
  assert.equal(isSpellable('to', LIMITS), false);
  assert.equal(isSpellable('information', LIMITS), false);
  assert.equal(isSpellable("don't", LIMITS), false);
  assert.equal(isSpellable('e-mail', LIMITS), false);
});

test('checkSpelling: marks each slot, missing letters count as wrong', () => {
  const house = ['H', 'O', 'U', 'S', 'E'];
  assert.deepEqual(checkSpelling([...house], house), { isCorrect: true, slots: [true, true, true, true, true] });
  assert.deepEqual(checkSpelling(['H', 'O', 'Y', 'S', 'E'], house), { isCorrect: false, slots: [true, true, false, true, true] });
  assert.deepEqual(checkSpelling(['H', 'O'], house), { isCorrect: false, slots: [true, true, false, false, false] });
});

test('toAsciiCapitals: plain A-Z, never the Turkish dotted İ', () => {
  assert.deepEqual(toAsciiCapitals('earlier'), ['E', 'A', 'R', 'L', 'I', 'E', 'R']);
});

const keepOrder = <T>(items: readonly T[]) => [...items];

test('letter bank: each letter of the word once (tiles are reusable) plus confusable decoys', () => {
  const bank = buildLetterBank('book', { decoyCount: 2, shuffle: keepOrder });
  assert.deepEqual(bank.slice(0, 3).map((t) => t.letter), ['B', 'O', 'K']);
  assert.equal(bank.length, 5);
  // B -> V, P and K -> C, Q are the confusable decoys; none are in the word.
  assert.ok(bank.slice(3).every((t) => ['V', 'P', 'C', 'Q', 'U'].includes(t.letter)));
  assert.equal(new Set(bank.map((t) => t.id)).size, bank.length);
});

test('letter bank: fills up with other letters when confusables run out', () => {
  const bank = buildLetterBank('aaa', { decoyCount: 5, shuffle: keepOrder });
  const decoys = bank.slice(1).map((t) => t.letter);
  assert.equal(decoys.length, 5);
  assert.equal(new Set(decoys).size, 5);
  assert.ok(!decoys.includes('A'));
});
