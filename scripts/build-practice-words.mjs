// Builds src/data/words.json: practice words per phoneme + IPA for every word used.
// Usage: node scripts/build-practice-words.mjs
// Inputs (data/raw, gitignored):
//   cmudict.dict                 https://github.com/cmusphinx/cmudict
//   freq/google-10000-usa.txt    https://github.com/first20hours/google-10000-english
import { readFileSync, writeFileSync } from 'node:fs';

import { loadCmu, matchesForPractice, toIpaSegments } from './lib/arpabet.mjs';

const WORDS_PER_PHONEME = 20;
const MIN_WORD_LENGTH = 2;
const root = (path) => new URL(`../${path}`, import.meta.url);

// Frequent in web text but not useful for learners (names, abbreviations, brands).
const BLOCKLIST = new Set(readFileSync(root('scripts/blocklist.txt'), 'utf8').split(/\s+/).filter(Boolean));

function loadFrequentWords() {
  return readFileSync(root('data/raw/freq/google-10000-usa.txt'), 'utf8')
    .split('\n')
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z]+$/.test(w) && w.length >= MIN_WORD_LENGTH && !BLOCKLIST.has(w));
}

function pickWords(phoneme, frequent, cmu) {
  const picked = [...phoneme.examples];
  for (const word of frequent) {
    if (picked.length >= WORDS_PER_PHONEME) break;
    const phones = cmu.get(word);
    if (!phones || picked.includes(word)) continue;
    if (phones.some((ph) => matchesForPractice(ph, phoneme))) picked.push(word);
  }
  return picked;
}

const phonemes = JSON.parse(readFileSync(root('src/data/phonemes.json'), 'utf8'));
const cmu = loadCmu(root('data/raw/cmudict.dict'));
const frequent = loadFrequentWords();

const practice = Object.fromEntries(phonemes.map((p) => [p.id, pickWords(p, frequent, cmu)]));
const allWords = [...new Set(Object.values(practice).flat())].sort();
const ipa = Object.fromEntries(allWords.map((w) => [w, toIpaSegments(cmu.get(w))]));

const short = Object.entries(practice).filter(([, words]) => words.length < WORDS_PER_PHONEME);
if (short.length > 0) console.warn('Fewer words than wanted:', short.map(([id, w]) => `${id}=${w.length}`).join(', '));

writeFileSync(root('src/data/words.json'), JSON.stringify({ practice, ipa }) + '\n');
console.log(`Wrote ${allWords.length} words for ${phonemes.length} phonemes`);
