type Random = () => number;
type Shuffle = <T>(items: readonly T[]) => T[];

export interface LetterRound {
  /** The letter whose name is played (speed mode) or shown (sound mode). */
  target: string;
  /** Target plus distractors, in screen order. */
  options: string[];
}

interface LetterRoundInput {
  pool: readonly string[];
  previous: string | null;
  optionCount: number;
  shuffle: Shuffle;
  random: Random;
}

/** Picks a target (never the previous one) and up to optionCount distinct options. */
export function nextLetterRound({ pool, previous, optionCount, shuffle, random }: LetterRoundInput): LetterRound {
  const choices = pool.length > 1 ? pool.filter((l) => l !== previous) : pool;
  const target = choices[Math.floor(random() * choices.length)];
  const distractors = shuffle(pool.filter((l) => l !== target)).slice(0, optionCount - 1);
  return { target, options: shuffle([target, ...distractors]) };
}

export interface TimeSummary {
  average: number | null;
  best: number | null;
}

/** Average and best reaction time in ms (only correct answers should be passed in). */
export function summarizeTimes(times: readonly number[]): TimeSummary {
  if (times.length === 0) return { average: null, best: null };
  const total = times.reduce((sum, t) => sum + t, 0);
  return { average: Math.round(total / times.length), best: Math.min(...times) };
}
