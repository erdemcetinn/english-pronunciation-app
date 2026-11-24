const PRIMARY_STRESS = 'ˈ';

/** Index of the primary-stressed vowel in IPA segments, or -1. */
export function stressedVowelIndex(segments: readonly string[], vowelSymbols: ReadonlySet<string>): number {
  const vowelIndexes = segments.flatMap((s, i) => (vowelSymbols.has(s) ? [i] : []));
  const stressMark = segments.indexOf(PRIMARY_STRESS);
  if (stressMark === -1) return vowelIndexes.length === 1 ? vowelIndexes[0] : -1;
  return vowelIndexes.find((i) => i > stressMark) ?? -1;
}

export interface VowelRound {
  word: string;
  vowelId: string;
  segments: readonly string[];
  blankIndex: number;
  /** Correct vowel id + its two distractors, in random order. */
  options: readonly string[];
}

interface RoundSource {
  vowels: readonly { id: string; ipa: string }[];
  distractors: Readonly<Record<string, readonly string[]>>;
  shuffle: (ids: readonly string[]) => string[];
  wordsFor: (vowelId: string) => readonly string[];
  segmentsFor: (word: string) => readonly string[];
  vowelSymbols: ReadonlySet<string>;
  random: () => number;
}

const MAX_TRIES = 20;

/** Picks a vowel uniformly, then a word whose primary-stressed vowel is that vowel, plus 3 options. */
export function nextVowelRound(source: RoundSource): VowelRound | null {
  const { vowels, distractors, shuffle, wordsFor, segmentsFor, vowelSymbols, random } = source;
  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    const vowel = vowels[Math.floor(random() * vowels.length)];
    const candidates = wordsFor(vowel.id).filter((word) => {
      const segments = segmentsFor(word);
      return segments[stressedVowelIndex(segments, vowelSymbols)] === vowel.ipa;
    });
    if (candidates.length === 0) continue;
    const word = candidates[Math.floor(random() * candidates.length)];
    const segments = segmentsFor(word);
    return {
      word,
      vowelId: vowel.id,
      segments,
      blankIndex: stressedVowelIndex(segments, vowelSymbols),
      options: shuffle([vowel.id, ...(distractors[vowel.id] ?? [])]),
    };
  }
  return null;
}
