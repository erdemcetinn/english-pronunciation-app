import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextVowelRound, stressedVowelIndex } from './vowel-game.ts';

const VOWELS = new Set(['i', 'ɪ', 'ʌ', 'aʊ', 'eɪ', 'ɝ']);

test('one-syllable word: the only vowel', () => {
  assert.equal(stressedVowelIndex(['ʃ', 'ɪ', 'p'], VOWELS), 1);
});

test('multi-syllable word: first vowel after the primary stress mark', () => {
  // about /əˈbaʊt/
  assert.equal(stressedVowelIndex(['ə', 'ˈ', 'b', 'aʊ', 't'], VOWELS), 3);
  // university /ˌjunəˈvɝsəti/ (secondary stress is ignored)
  assert.equal(stressedVowelIndex(['ˌ', 'j', 'u', 'n', 'ə', 'ˈ', 'v', 'ɝ', 's', 'ə', 't', 'i'], VOWELS), 7);
});

test('returns -1 when no stressed vowel is found', () => {
  assert.equal(stressedVowelIndex(['ð', 'ə'], VOWELS), -1);
});

test('round targets the chosen vowel and skips words where it is not stressed', () => {
  const words: Record<string, string[]> = {
    city: ['ˈ', 's', 'ɪ', 't', 'i'], // stressed ɪ, not i
    see: ['s', 'i'],
  };
  const round = nextVowelRound({
    vowels: [{ id: 'iy', ipa: 'i' }],
    distractors: { iy: ['ih', 'ey'] },
    shuffle: (ids) => [...ids],
    wordsFor: () => ['city', 'see'],
    segmentsFor: (w) => words[w],
    vowelSymbols: VOWELS,
    random: () => 0,
  });
  assert.deepEqual(round, {
    word: 'see',
    vowelId: 'iy',
    segments: ['s', 'i'],
    blankIndex: 1,
    options: ['iy', 'ih', 'ey'],
  });
});

test('uses the word picker when given', () => {
  const words: Record<string, string[]> = { see: ['s', 'i'], eat: ['i', 't'] };
  const round = nextVowelRound({
    vowels: [{ id: 'iy', ipa: 'i' }],
    distractors: { iy: ['ih', 'ey'] },
    shuffle: (ids) => [...ids],
    wordsFor: () => ['see', 'eat'],
    segmentsFor: (w) => words[w],
    vowelSymbols: VOWELS,
    random: () => 0,
    pickWord: () => 'eat',
  });
  assert.equal(round?.word, 'eat');
});
