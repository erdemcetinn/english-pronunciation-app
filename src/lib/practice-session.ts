/** Word -> timestamp (ms) when it was last shown in practice. */
export type SeenMap = Readonly<Record<string, number>>;

export const SESSION_SIZE = 20;
export const NEW_WORD_RATIO = 0.7;

interface SessionOptions {
  size?: number;
  newRatio?: number;
  shuffle?: <T>(items: readonly T[]) => T[];
}

/** Fisher-Yates shuffle that returns a new array. */
export function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Picks a practice set: ~70% unseen words (pool order = easiest first),
 * ~30% review words seen longest ago. Falls back to whichever side has words left.
 */
export function buildSession(
  pool: readonly string[],
  seen: SeenMap,
  { size = SESSION_SIZE, newRatio = NEW_WORD_RATIO, shuffle = shuffled }: SessionOptions = {},
): string[] {
  const unseen = pool.filter((word) => !(word in seen));
  const reviewable = pool
    .filter((word) => word in seen)
    .sort((a, b) => seen[a] - seen[b]);

  const reviewTarget = Math.min(reviewable.length, size - Math.round(size * newRatio));
  const newCount = Math.min(unseen.length, size - reviewTarget);
  const reviewCount = Math.min(reviewable.length, size - newCount);

  const newWords = unseen.slice(0, newCount);
  const reviewWords = reviewable.slice(0, reviewCount);

  // First session keeps the easy-first order; later ones mix new and review words.
  return reviewWords.length === 0 ? newWords : shuffle([...newWords, ...reviewWords]);
}
