export interface MinimalPair {
  a: string;
  b: string;
  /** Phoneme ids that differ, in the same order as a/b. */
  contrast: [string, string];
}

export interface Round {
  pair: MinimalPair;
  /** The word that is played; the player must pick it. */
  target: string;
  /** Both words, in random screen order. */
  options: [string, string];
}

export interface Score {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
}

export const INITIAL_SCORE: Score = { correct: 0, total: 0, streak: 0, bestStreak: 0 };

type Random = () => number;
/** Chooses one key from a list (e.g. preferring unseen ones); null if none. */
export type KeyPicker = (keys: readonly string[]) => string | null;

export const pairKey = (pair: MinimalPair) => `${pair.a}|${pair.b}`;

const pickIndex = (length: number, random: Random) => Math.floor(random() * length);

/**
 * Picks a pair (never the previous one), a random target and a random option order.
 * `pickKey` decides which pair, e.g. preferring unseen ones; default is uniform random.
 */
export function nextRound(
  pairs: readonly MinimalPair[],
  previous: MinimalPair | null,
  random: Random,
  pickKey?: KeyPicker,
): Round {
  const choices = pairs.length > 1 ? pairs.filter((p) => p !== previous) : pairs;
  const pickedKey = pickKey?.(choices.map(pairKey));
  const pair = choices.find((p) => pairKey(p) === pickedKey) ?? choices[pickIndex(choices.length, random)];
  const target = random() < 0.5 ? pair.a : pair.b;
  const options: [string, string] = random() < 0.5 ? [pair.a, pair.b] : [pair.b, pair.a];
  return { pair, target, options };
}

export function scoreAnswer(score: Score, isCorrect: boolean): Score {
  const streak = isCorrect ? score.streak + 1 : 0;
  return {
    correct: score.correct + (isCorrect ? 1 : 0),
    total: score.total + 1,
    streak,
    bestStreak: Math.max(score.bestStreak, streak),
  };
}
