import assert from 'node:assert/strict';
import { test } from 'node:test';

import { matchesForPractice, matchesPhoneme, toIpaSegments } from './arpabet.mjs';

const join = (phones) => toIpaSegments(phones.split(' ')).join('');

test('converts a one-syllable word without stress mark', () => {
  assert.equal(join('SH IY1 P'), 'ʃip');
});

test('distinguishes stressed ʌ from unstressed ə', () => {
  assert.equal(join('AH0 B AW1 T'), 'əˈbaʊt');
  assert.equal(join('K AH1 T'), 'kʌt');
});

test('puts stress mark before a legal onset cluster', () => {
  assert.equal(join('IH0 K S T R IY1 M'), 'ɪkˈstrim');
});

test('splits an illegal cluster between syllables', () => {
  assert.equal(join('W IH1 N T ER0'), 'ˈwɪntɚ');
  assert.equal(join('IH0 N T EH1 N D'), 'ɪnˈtɛnd');
});

test('matches AH only with the required stress', () => {
  const schwa = { arpabet: 'AH', stress: 'unstressed' };
  assert.equal(matchesPhoneme('AH0', schwa), true);
  assert.equal(matchesPhoneme('AH1', schwa), false);
});

test('writes IY and UW without length marks (US style)', () => {
  assert.equal(join('HH AE1 P IY0'), 'ˈhæpi');
  assert.equal(join('IH1 N T UW0'), 'ˈɪntu');
  assert.equal(join('F UW1 D'), 'fud');
});

test('practice match requires a stressed plain vowel', () => {
  const iy = { arpabet: 'IY' };
  assert.equal(matchesForPractice('IY0', iy), false);
  assert.equal(matchesForPractice('IY1', iy), true);
  assert.equal(matchesForPractice('T', { arpabet: 'T' }), true);
});
