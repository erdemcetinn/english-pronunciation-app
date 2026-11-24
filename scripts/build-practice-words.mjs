// Builds src/data/words.json (practice pool per phoneme + IPA for every word used)
// and src/data/minimal-pairs.json (listening game pairs).
// Usage: node scripts/build-practice-words.mjs
// Inputs (data/raw, gitignored):
//   cmudict.dict                 https://github.com/cmusphinx/cmudict
//   freq/google-10000-usa.txt    https://github.com/first20hours/google-10000-english
// Minimal pairs also require the word to be in /usr/share/dict/words (filters names).
import { readFileSync, writeFileSync } from 'node:fs';

import { loadCmu, loadOverrides, matchesForPractice, toIpaSegments } from './lib/arpabet.mjs';
import { findMinimalPairs } from './lib/minimal-pairs.mjs';

const POOL_SIZE = 150;
const MIN_WORD_LENGTH = 2;
const PAIRS_PER_CONTRAST = 30;
const SYSTEM_DICT = '/usr/share/dict/words';
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
    if (picked.length >= POOL_SIZE) break;
    const phones = cmu.get(word);
    if (!phones || picked.includes(word)) continue;
    if (phones.some((ph) => matchesForPractice(ph, phoneme))) picked.push(word);
  }
  return picked;
}

const phonemes = JSON.parse(readFileSync(root('src/data/phonemes.json'), 'utf8'));
// Preferred readings (read = /rid/, not /rɛd/) replace the CMU entry.
const cmu = new Map([...loadCmu(root('data/raw/cmudict.dict')), ...loadOverrides(root('scripts/pronunciation-overrides.txt'))]);
const frequent = loadFrequentWords();

const practice = Object.fromEntries(phonemes.map((p) => [p.id, pickWords(p, frequent, cmu)]));

const dictionary = new Set(readFileSync(SYSTEM_DICT, 'utf8').split('\n'));
const pairCandidates = frequent.filter((w) => cmu.has(w) && dictionary.has(w));
const pairs = findMinimalPairs(pairCandidates, cmu, phonemes, PAIRS_PER_CONTRAST);

const allWords = [...new Set([...Object.values(practice).flat(), ...pairs.flatMap((p) => [p.a, p.b])])].sort();
const ipa = Object.fromEntries(allWords.map((w) => [w, toIpaSegments(cmu.get(w))]));

const short = Object.entries(practice).filter(([, words]) => words.length < POOL_SIZE);
if (short.length > 0) console.warn('Fewer words than wanted:', short.map(([id, w]) => `${id}=${w.length}`).join(', '));

writeFileSync(root('src/data/words.json'), JSON.stringify({ practice, ipa }) + '\n');
writeFileSync(root('src/data/minimal-pairs.json'), JSON.stringify(pairs) + '\n');
console.log(`Wrote ${allWords.length} words for ${phonemes.length} phonemes, ${pairs.length} minimal pairs`);
