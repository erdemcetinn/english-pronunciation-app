import { CONSONANT_SET_LETTERS, CORE_LETTERS, getLetter, VOWEL_LETTERS } from '@/data/letters';

export const letterKeys = (letters: readonly string[]) => letters.map((l) => getLetter(l).key);

export const EXTEND_LABEL = '+ O, U';

export const letterPool = (isExtended: boolean) => (isExtended ? VOWEL_LETTERS : CORE_LETTERS);
export const ipaLabel = (ipa: readonly string[]) => `/${ipa.join('')}/`;

/** Speed game modes: the A/E/I(/O/U) vowels, or a wider set of mostly consonant letters. */
export type LetterSet = 'vowels' | 'consonants';

export const speedPool = (set: LetterSet, isExtended: boolean) =>
  set === 'vowels' ? letterPool(isExtended) : CONSONANT_SET_LETTERS;
