import rawLetters from './letters.json';

export interface LetterName {
  /** Capital letter shown on screen. */
  letter: string;
  /** Audio key, e.g. letter-a (audio/v1/{voice}/letter-a.mp3). */
  key: string;
  /** IPA of the letter's English name: A /eɪ/. */
  ipa: string[];
}

export const LETTERS: readonly LetterName[] = rawLetters;

/** The three letters Turkish speakers mix up most: A says /eɪ/, E says /i/, I says /aɪ/. */
export const CORE_LETTERS: readonly string[] = ['A', 'E', 'I'];
export const ALL_LETTERS: readonly string[] = LETTERS.map((l) => l.letter);

const BY_LETTER = new Map(LETTERS.map((l) => [l.letter, l]));
const BY_KEY = new Map(LETTERS.map((l) => [l.key, l]));

export function getLetter(letter: string): LetterName {
  const found = BY_LETTER.get(letter);
  if (!found) throw new Error(`Unknown letter "${letter}"`);
  return found;
}

export function getLetterSegmentsByKey(key: string): readonly string[] {
  return BY_KEY.get(key)?.ipa ?? [];
}
