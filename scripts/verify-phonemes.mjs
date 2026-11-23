// Checks src/data/phonemes.json against the CMU Pronouncing Dictionary.
// Usage: node scripts/verify-phonemes.mjs
// Needs data/raw/cmudict.dict (https://github.com/cmusphinx/cmudict).
import { readFileSync } from 'node:fs';

import { loadCmu, matchesPhoneme } from './lib/arpabet.mjs';

const PHONEMES_PATH = new URL('../src/data/phonemes.json', import.meta.url);
const CMU_PATH = new URL('../data/raw/cmudict.dict', import.meta.url);

function verify(phonemes, cmu) {
  const errors = [];
  const ids = new Set(phonemes.map((p) => p.id));
  if (ids.size !== phonemes.length) errors.push('duplicate ids');

  for (const phoneme of phonemes) {
    for (const other of phoneme.confusedWith) {
      if (!ids.has(other)) errors.push(`${phoneme.id}: unknown confusedWith "${other}"`);
    }
    for (const word of phoneme.examples) {
      const phones = cmu.get(word);
      if (!phones) errors.push(`${phoneme.id}: "${word}" not in CMU dict`);
      else if (!phones.some((ph) => matchesPhoneme(ph, phoneme))) {
        errors.push(`${phoneme.id}: "${word}" is ${phones.join(' ')}, no ${phoneme.arpabet}`);
      }
    }
  }
  return errors;
}

const phonemes = JSON.parse(readFileSync(PHONEMES_PATH, 'utf8'));
const errors = verify(phonemes, loadCmu(CMU_PATH));
if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK: ${phonemes.length} phonemes, all examples verified in CMU dict`);
