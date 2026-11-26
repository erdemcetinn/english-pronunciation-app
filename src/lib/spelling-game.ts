const LETTERS_ONLY = /^[a-z]+$/;

export interface LengthLimits {
  minLength: number;
  maxLength: number;
}

/** Words the game can spell out: only a-z, within the length limits. */
export function isSpellable(word: string, { minLength, maxLength }: LengthLimits): boolean {
  return LETTERS_ONLY.test(word) && word.length >= minLength && word.length <= maxLength;
}

/** Keyboard text -> what goes in the slots: lowercase letters, at most `length`. */
export function normalizeTyped(text: string, length: number): string {
  return text.toLowerCase().replace(/[^a-z]/g, '').slice(0, length);
}

export interface SpellingResult {
  isCorrect: boolean;
  /** One entry per letter of the word: true when the typed letter matches. */
  slots: boolean[];
}

export function checkSpelling(typed: string, word: string): SpellingResult {
  const slots = [...word].map((letter, index) => typed[index] === letter);
  return { isCorrect: typed === word, slots };
}
