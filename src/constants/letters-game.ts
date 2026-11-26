import { CORE_LETTERS, getLetter, VOWEL_LETTERS } from '@/data/letters';

/** Clips the letter names game uses (vowel letters only). */
export const LETTER_KEYS = VOWEL_LETTERS.map((l) => getLetter(l).key);
export const EXTEND_LABEL = '+ O, U';

export const letterPool = (isExtended: boolean) => (isExtended ? VOWEL_LETTERS : CORE_LETTERS);
export const ipaLabel = (ipa: readonly string[]) => `/${ipa.join('')}/`;
