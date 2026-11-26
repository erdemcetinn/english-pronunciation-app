/** Where the reader is: which sentence, and how many of its words are on screen (at least 1). */
export interface ReaderPosition {
  sentence: number;
  shown: number;
}

export const START: ReaderPosition = { sentence: 0, shown: 1 };

export const wordsOf = (sentence: string): string[] => sentence.trim().split(/\s+/).filter(Boolean);

/** One more word; after the last word of a sentence, the next sentence starts with its first word. */
export function nextPosition(pos: ReaderPosition, sentenceLengths: readonly number[]): ReaderPosition {
  if (pos.shown < sentenceLengths[pos.sentence]) return { ...pos, shown: pos.shown + 1 };
  if (pos.sentence + 1 >= sentenceLengths.length) return pos;
  return { sentence: pos.sentence + 1, shown: 1 };
}

/** One word back; from a sentence's first word, back to the previous sentence in full. */
export function previousPosition(pos: ReaderPosition, sentenceLengths: readonly number[]): ReaderPosition {
  if (pos.shown > 1) return { ...pos, shown: pos.shown - 1 };
  if (pos.sentence === 0) return pos;
  return { sentence: pos.sentence - 1, shown: sentenceLengths[pos.sentence - 1] };
}

export function isFinished(pos: ReaderPosition, sentenceLengths: readonly number[]): boolean {
  return pos.sentence === sentenceLengths.length - 1 && pos.shown >= sentenceLengths[pos.sentence];
}

export function progressPercent(pos: ReaderPosition, sentenceCount: number): number {
  return sentenceCount === 0 ? 0 : Math.floor((pos.sentence / sentenceCount) * 100);
}

/** Keeps a saved position valid if the book was re-imported with fewer sentences. */
export function clampPosition(pos: ReaderPosition, sentenceLengths: readonly number[]): ReaderPosition {
  if (sentenceLengths.length === 0) return START;
  const sentence = Math.min(Math.max(0, pos.sentence), sentenceLengths.length - 1);
  const shown = Math.min(Math.max(1, pos.shown), sentenceLengths[sentence]);
  return { sentence, shown };
}
