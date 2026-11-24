import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shuffled } from './practice-session.ts';
import { createVoiceBag } from './voice-bag.ts';

const VOICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

test('gives every voice once before repeating any', () => {
  const bag = createVoiceBag(VOICES, shuffled);
  const round = Array.from({ length: 10 }, () => bag.next());
  assert.equal(new Set(round).size, 10);
});

test('never repeats a voice back to back across rounds', () => {
  const bag = createVoiceBag(VOICES, shuffled);
  let previous = bag.next();
  for (let i = 0; i < 500; i += 1) {
    const current = bag.next();
    assert.notEqual(current, previous);
    previous = current;
  }
});

test('second round is a full set again', () => {
  const bag = createVoiceBag(VOICES, shuffled);
  Array.from({ length: 10 }, () => bag.next());
  const round2 = Array.from({ length: 10 }, () => bag.next());
  assert.equal(new Set(round2).size, 10);
});
