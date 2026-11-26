import rawWords from './words.json';

interface WordData {
  /** Phoneme id -> practice words, easiest/most frequent first. */
  practice: Record<string, string[]>;
  /** Word -> IPA segments (stress marks are separate segments). */
  ipa: Record<string, string[]>;
}

const WORDS: WordData = rawWords;

export function getPracticeWords(phonemeId: string): readonly string[] {
  return WORDS.practice[phonemeId] ?? [];
}

export function getIpaSegments(word: string): readonly string[] {
  return WORDS.ipa[word] ?? [];
}

/** Every word that has IPA (and therefore audio). */
export const ALL_WORDS: readonly string[] = Object.keys(WORDS.ipa);
