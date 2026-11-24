// Finds minimal pairs: two words whose pronunciations differ in exactly one phoneme,
// where that phoneme pair is a known confusion (phonemes.json confusedWith).

// Contrasts that only differ in stress are not useful as listening pairs.
const EXCLUDED_IDS = new Set(['schwa', 'er0']);

/** Maps a CMU phone (e.g. "AH1") to our phoneme id (e.g. "ah"). */
export function createPhoneIdMapper(phonemes) {
  const byArpabet = new Map();
  for (const p of phonemes) {
    const key = p.stress ? `${p.arpabet}:${p.stress}` : p.arpabet;
    byArpabet.set(key, p.id);
  }
  return (phone) => {
    const base = phone.replace(/\d$/, '');
    const digit = phone.match(/\d$/)?.[0];
    if (digit !== undefined) {
      const stressed = byArpabet.get(`${base}:${digit === '0' ? 'unstressed' : 'stressed'}`);
      if (stressed) return stressed;
    }
    return byArpabet.get(base) ?? null;
  };
}

export function contrastKey(a, b) {
  return [a, b].sort().join('|');
}

export function buildContrastSet(phonemes) {
  const keys = new Set();
  for (const p of phonemes) {
    for (const other of p.confusedWith) {
      if (!EXCLUDED_IDS.has(p.id) && !EXCLUDED_IDS.has(other)) keys.add(contrastKey(p.id, other));
    }
  }
  return keys;
}

const stressOf = (phone) => phone.match(/\d$/)?.[0] ?? '-';

/**
 * Returns the differing phoneme ids if the two words are a minimal pair, else null.
 * Requires same length, same stress pattern and exactly one differing phoneme.
 */
export function findContrast(phonesA, phonesB, toId) {
  if (phonesA.length !== phonesB.length) return null;
  let diff = null;
  for (let i = 0; i < phonesA.length; i += 1) {
    if (stressOf(phonesA[i]) !== stressOf(phonesB[i])) return null;
    const idA = toId(phonesA[i]);
    const idB = toId(phonesB[i]);
    if (!idA || !idB) return null;
    if (idA === idB) continue;
    if (diff) return null;
    diff = [idA, idB];
  }
  return diff;
}

/**
 * Finds minimal pairs among frequent words. Pairs are bucketed by "skeleton"
 * (pronunciation with one slot blanked) so we never compare every word with every word.
 */
export function findMinimalPairs(words, cmu, phonemes, maxPerContrast) {
  const toId = createPhoneIdMapper(phonemes);
  const contrasts = buildContrastSet(phonemes);
  const rank = new Map(words.map((w, i) => [w, i]));
  const buckets = new Map();

  for (const word of words) {
    const phones = cmu.get(word);
    if (!phones) continue;
    phones.forEach((_, i) => {
      const skeleton = phones.map((ph, j) => (j === i ? `_${stressOf(ph)}` : ph)).join(' ');
      const list = buckets.get(skeleton) ?? [];
      buckets.set(skeleton, [...list, word]);
    });
  }

  const seen = new Set();
  const pairs = [];
  for (const group of buckets.values()) {
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        const [a, b] = [group[i], group[j]];
        const id = [a, b].sort().join('|');
        if (seen.has(id)) continue;
        seen.add(id);
        const diff = findContrast(cmu.get(a), cmu.get(b), toId);
        if (!diff || !contrasts.has(contrastKey(...diff))) continue;
        pairs.push({ a, b, contrast: diff, rank: Math.max(rank.get(a), rank.get(b)) });
      }
    }
  }

  const byContrast = new Map();
  for (const pair of pairs.sort((x, y) => x.rank - y.rank)) {
    const key = contrastKey(...pair.contrast);
    const list = byContrast.get(key) ?? [];
    if (list.length < maxPerContrast) byContrast.set(key, [...list, pair]);
  }
  return [...byContrast.values()].flat().map(({ a, b, contrast }) => ({ a, b, contrast }));
}
