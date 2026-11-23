// ARPAbet (CMU dict) -> American English IPA, split into segments.
import { readFileSync } from 'node:fs';

const VOWELS = {
  IY: 'i', IH: 'ɪ', EH: 'ɛ', AE: 'æ', AA: 'ɑ', AO: 'ɔ', UH: 'ʊ', UW: 'u',
  EY: 'eɪ', AY: 'aɪ', OY: 'ɔɪ', AW: 'aʊ', OW: 'oʊ',
};
const CONSONANTS = {
  P: 'p', B: 'b', T: 't', D: 'd', K: 'k', G: 'g', CH: 'tʃ', JH: 'dʒ',
  M: 'm', N: 'n', NG: 'ŋ', F: 'f', V: 'v', TH: 'θ', DH: 'ð', S: 's', Z: 'z',
  SH: 'ʃ', ZH: 'ʒ', HH: 'h', W: 'w', Y: 'j', R: 'r', L: 'l',
};

// Legal English syllable onsets (ARPAbet), used to place stress marks.
const ONSETS = new Set([
  'P R', 'P L', 'B R', 'B L', 'T R', 'T W', 'D R', 'D W', 'K R', 'K L', 'K W', 'G R', 'G L',
  'F R', 'F L', 'TH R', 'SH R', 'S P', 'S T', 'S K', 'S M', 'S N', 'S L', 'S W', 'S F',
  'S P R', 'S P L', 'S T R', 'S K R', 'S K W', 'P Y', 'B Y', 'K Y', 'F Y', 'M Y', 'HH Y', 'V Y',
]);

const isVowel = (phone) => /\d$/.test(phone);

function vowelToIpa(base, stress) {
  if (base === 'AH') return stress === '0' ? 'ə' : 'ʌ';
  if (base === 'ER') return stress === '0' ? 'ɚ' : 'ɝ';
  const ipa = VOWELS[base];
  if (!ipa) throw new Error(`Unknown vowel ${base}`);
  return ipa;
}

export function phoneToIpa(phone) {
  if (!isVowel(phone)) {
    const ipa = CONSONANTS[phone];
    if (!ipa) throw new Error(`Unknown consonant ${phone}`);
    return ipa;
  }
  return vowelToIpa(phone.slice(0, -1), phone.slice(-1));
}

/** Index of the first consonant of the stressed syllable's onset. */
function onsetStart(phones, vowelIndex) {
  let start = vowelIndex;
  while (start > 0 && !isVowel(phones[start - 1])) {
    const candidate = phones.slice(start - 1, vowelIndex).join(' ');
    const isSingle = vowelIndex - (start - 1) === 1;
    if (!isSingle && !ONSETS.has(candidate)) break;
    start -= 1;
  }
  return start;
}

/**
 * Converts ARPAbet phones to IPA segments, with stress marks as their own segments.
 * Single-syllable words get no stress mark (dictionary convention).
 */
export function toIpaSegments(phones) {
  const vowelCount = phones.filter(isVowel).length;
  const marks = new Map();
  if (vowelCount > 1) {
    phones.forEach((phone, i) => {
      const stress = isVowel(phone) ? phone.slice(-1) : null;
      if (stress === '1') marks.set(onsetStart(phones, i), 'ˈ');
      if (stress === '2') marks.set(onsetStart(phones, i), 'ˌ');
    });
  }
  return phones.flatMap((phone, i) =>
    marks.has(i) ? [marks.get(i), phoneToIpa(phone)] : [phoneToIpa(phone)],
  );
}

/** Loads CMU dict as Map<word, phones[]>, keeping the first pronunciation only. */
export function loadCmu(path) {
  const entries = new Map();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const [rawWord, ...phones] = line.split('#')[0].trim().split(/\s+/);
    if (!rawWord || phones.length === 0) continue;
    const word = rawWord.replace(/\(\d+\)$/, '');
    if (!entries.has(word)) entries.set(word, phones);
  }
  return entries;
}

/** True when a CMU phone is the given phoneme (respecting stress for AH/ER). */
export function matchesPhoneme(phone, phoneme) {
  if (phone.replace(/\d$/, '') !== phoneme.arpabet) return false;
  if (!phoneme.stress) return true;
  const isStressed = /[12]$/.test(phone);
  return phoneme.stress === 'stressed' ? isStressed : !isStressed;
}

/** Stricter match for practice lists: plain vowels must be stressed to be clearly heard. */
export function matchesForPractice(phone, phoneme) {
  if (!matchesPhoneme(phone, phoneme)) return false;
  if (phoneme.stress || !isVowel(phone)) return true;
  return /[12]$/.test(phone);
}
