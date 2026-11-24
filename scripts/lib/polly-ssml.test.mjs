import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toPollyIpa, wordSsml } from './polly-ssml.mjs';

test('maps display symbols to Polly IPA', () => {
  assert.equal(toPollyIpa(['tʃ', 'ɝ', 'tʃ']), 't͡ʃɝt͡ʃ');
  assert.equal(toPollyIpa(['r', 'ɛ', 'd']), 'ɹɛd');
  assert.equal(toPollyIpa(['ˈ', 'g', 'oʊ']), 'ˈɡoʊ');
});

test('wraps the word in a phoneme tag', () => {
  assert.equal(
    wordSsml('read', ['r', 'i', 'd']),
    '<speak><phoneme alphabet="ipa" ph="ɹid">read</phoneme></speak>',
  );
});
