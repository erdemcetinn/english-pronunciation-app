/** One answer about one sound or letter. */
export interface Attempt {
  isCorrect: boolean;
  /** What the player picked instead (phoneme id or letter), only when wrong. */
  chosen?: string;
  /** Reaction time in ms; only the timed letter game sets it. */
  ms?: number;
  at: number;
}

/** Sound or letter id -> its most recent attempts (oldest first). */
export type AttemptLog = Readonly<Record<string, readonly Attempt[]>>;

/** Scores use only recent answers, so improvement shows up. */
export const WINDOW = 20;
/** A score is shown only after this many attempts. */
export const MIN_ATTEMPTS = 5;

const SPEED_WEIGHT = 0.8;
const FAST_MS = 800;
const SLOW_MS = 2500;
const GOOD_SCORE = 85;
const OK_SCORE = 60;

const isTimed = (a: Attempt) => a.ms !== undefined;

/**
 * Appends an answer, keeping the last WINDOW timed and the last WINDOW untimed answers separately,
 * so many untimed spelling answers can't push the speed answers out.
 */
export function recordAttempt(log: AttemptLog, id: string, attempt: Attempt): AttemptLog {
  const all = [...(log[id] ?? []), attempt];
  const keep = new Set([...all.filter(isTimed).slice(-WINDOW), ...all.filter((a) => !isTimed(a)).slice(-WINDOW)]);
  return { ...log, [id]: all.filter((a) => keep.has(a)) };
}

/** True when a letter has enough timed answers for the speed part of its score. */
export const hasSpeedData = (attempts: readonly Attempt[]) => attempts.filter(isTimed).length >= MIN_ATTEMPTS;

const accuracy = (attempts: readonly Attempt[]) => attempts.filter((a) => a.isCorrect).length / attempts.length;

/** Sound score 0-100: share of correct answers. */
export function soundScore(attempts: readonly Attempt[]): number | null {
  if (attempts.length < MIN_ATTEMPTS) return null;
  return Math.round(accuracy(attempts) * 100);
}

/** 100 at FAST_MS or faster, 0 at SLOW_MS or slower, linear between. */
export function speedPoints(ms: number): number {
  const share = (SLOW_MS - ms) / (SLOW_MS - FAST_MS);
  return Math.round(Math.min(1, Math.max(0, share)) * 100);
}

/**
 * Letter score 0-100: 80% speed + 20% accuracy.
 * Speed counts only timed answers, and a wrong answer scores 0 speed however fast it was.
 * Until there are MIN_ATTEMPTS timed answers the score is accuracy alone, so one slow answer can't swing it.
 */
export function letterScore(attempts: readonly Attempt[]): number | null {
  if (attempts.length < MIN_ATTEMPTS) return null;
  const accuracyPoints = accuracy(attempts) * 100;
  if (!hasSpeedData(attempts)) return Math.round(accuracyPoints);
  const timed = attempts.filter(isTimed);
  const speed = timed.reduce((sum, a) => sum + (a.isCorrect ? speedPoints(a.ms ?? SLOW_MS) : 0), 0) / timed.length;
  return Math.round(SPEED_WEIGHT * speed + (1 - SPEED_WEIGHT) * accuracyPoints);
}

/** Average reaction time of correct timed answers, in ms. */
export function averageCorrectMs(attempts: readonly Attempt[]): number | null {
  const times = attempts.filter((a) => a.isCorrect && a.ms !== undefined).map((a) => a.ms ?? 0);
  return times.length === 0 ? null : Math.round(times.reduce((s, t) => s + t, 0) / times.length);
}

/** The wrong choice made most often, e.g. heard /ɪ/ but picked /i/. */
export function topConfusion(attempts: readonly Attempt[]): { id: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const a of attempts) if (!a.isCorrect && a.chosen) counts.set(a.chosen, (counts.get(a.chosen) ?? 0) + 1);
  let best: { id: string; count: number } | null = null;
  for (const [id, count] of counts) if (!best || count > best.count) best = { id, count };
  return best;
}

export type ScoreBand = 'good' | 'ok' | 'weak';

export function scoreBand(score: number): ScoreBand {
  if (score >= GOOD_SCORE) return 'good';
  return score >= OK_SCORE ? 'ok' : 'weak';
}
