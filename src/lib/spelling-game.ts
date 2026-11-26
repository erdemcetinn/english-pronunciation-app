const LETTERS_ONLY = /^[a-z]+$/;

export interface LengthLimits {
  minLength: number;
  maxLength: number;
}

/** Words the game can spell out: only a-z, within the length limits. */
export function isSpellable(word: string, { minLength, maxLength }: LengthLimits): boolean {
  return LETTERS_ONLY.test(word) && word.length >= minLength && word.length <= maxLength;
}

export interface SpellingResult {
  isCorrect: boolean;
  /** One entry per letter of the word: true when the typed letter matches. */
  slots: boolean[];
}

/** Compares picked capital letters with the word's capital letters, slot by slot. */
export function checkSpelling(picked: readonly string[], letters: readonly string[]): SpellingResult {
  const slots = letters.map((letter, index) => picked[index] === letter);
  return { isCorrect: picked.length === letters.length && slots.every(Boolean), slots };
}

/**
 * a-z -> A-Z without locale rules. On a Turkish phone toUpperCase/toLowerCase may turn
 * i into İ or I into ı, which breaks matching and letter lookups.
 */
export function toAsciiCapitals(word: string): string[] {
  return [...word].map((c) => (c >= 'a' && c <= 'z' ? String.fromCharCode(c.charCodeAt(0) - 32) : c));
}

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

/** Letters whose English names are easy to mix up (for decoys in the letter bank). */
const CONFUSABLE: Readonly<Record<string, readonly string[]>> = {
  A: ['E', 'I', 'R', 'H'], E: ['I', 'A'], I: ['E', 'A', 'Y'], O: ['U'], U: ['O', 'Q'],
  B: ['V', 'P'], C: ['S', 'K', 'Z'], D: ['T'], F: ['S'], G: ['J'], H: ['A'], J: ['G'],
  K: ['C', 'Q'], L: ['R'], M: ['N'], N: ['M'], P: ['B'], Q: ['K', 'U'], R: ['A', 'L'],
  S: ['C', 'F', 'X'], T: ['D'], V: ['B', 'W'], W: ['V'], X: ['S'], Y: ['I', 'W'], Z: ['C'],
};

export interface LetterTile {
  id: number;
  /** Capital letter shown on the tile. */
  letter: string;
}

interface BankOptions {
  decoyCount: number;
  shuffle: <T>(items: readonly T[]) => T[];
}

/**
 * Each letter of the word once (a tile can be used any number of times) plus decoys:
 * confusable letters first, then random others.
 */
export function buildLetterBank(word: string, { decoyCount, shuffle }: BankOptions): LetterTile[] {
  const letters = [...new Set(toAsciiCapitals(word))];
  const inWord = new Set(letters);
  const notInWord = (l: string) => !inWord.has(l);
  const confusable = [...new Set(letters.flatMap((l) => CONFUSABLE[l] ?? []))].filter(notInWord);
  const others = ALPHABET.filter((l) => notInWord(l) && !confusable.includes(l));
  const decoys = [...shuffle(confusable), ...shuffle(others)].slice(0, decoyCount);
  return [...letters, ...decoys].map((letter, id) => ({ id, letter }));
}
