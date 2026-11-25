import { ALL_LETTERS, CORE_LETTERS, LETTERS } from '@/data/letters';

export const LETTER_KEYS = LETTERS.map((l) => l.key);
export const EXTEND_LABEL = '+ O, U';

export const letterPool = (isExtended: boolean) => (isExtended ? ALL_LETTERS : CORE_LETTERS);
export const ipaLabel = (ipa: readonly string[]) => `/${ipa.join('')}/`;
