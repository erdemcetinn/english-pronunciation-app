import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { recordAttempt, type Attempt, type AttemptLog } from '@/lib/skill-score';

/** sounds: phoneme ids from the listening games · letters: A-Z from the letter games */
export type SkillKind = 'sounds' | 'letters';
export type GameId = 'pairs' | 'vowel' | 'letters-speed' | 'spelling';

/** Which combined score (Sounds tab) each game feeds. */
export const GAME_KIND: Readonly<Record<GameId, SkillKind>> = {
  pairs: 'sounds',
  vowel: 'sounds',
  'letters-speed': 'letters',
  spelling: 'letters',
};

/** A combined log (all games of a kind) or one game's own log. */
type LogId = SkillKind | `game:${GameId}`;
const LOG_IDS: readonly LogId[] = [
  'sounds',
  'letters',
  ...(Object.keys(GAME_KIND) as GameId[]).map((game) => `game:${game}` as const),
];

const storageKey = (id: LogId) => `skill-log:v1:${id}`;
const EMPTY: AttemptLog = {};

let logs: Readonly<Partial<Record<LogId, AttemptLog>>> = {};
const listeners = new Set<() => void>();

function isAttemptLog(value: unknown): value is AttemptLog {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((list) => Array.isArray(list) && list.every((a) => typeof a?.isCorrect === 'boolean'))
  );
}

function save(id: LogId): void {
  AsyncStorage.setItem(storageKey(id), JSON.stringify(logs[id] ?? EMPTY)).catch((error) =>
    console.warn(`Could not save ${id} scores`, error),
  );
}

/** Adds one answer to the game's own scores and to the combined Sounds tab scores, then saves both. */
export function recordAnswer(game: GameId, itemId: string, answer: Omit<Attempt, 'at'>): void {
  const attempt = { ...answer, at: Date.now() };
  const targets: LogId[] = [GAME_KIND[game], `game:${game}`];
  logs = {
    ...logs,
    ...Object.fromEntries(targets.map((id) => [id, recordAttempt(logs[id] ?? EMPTY, itemId, attempt)])),
  };
  listeners.forEach((notify) => notify());
  targets.forEach(save);
}

/** Restores saved score histories; call once at app start. */
export async function loadSkillLogs(): Promise<void> {
  for (const id of LOG_IDS) {
    try {
      const raw = await AsyncStorage.getItem(storageKey(id));
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isAttemptLog(parsed)) logs = { ...logs, [id]: parsed };
    } catch (error) {
      console.warn(`Could not load ${id} scores`, error);
    }
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Combined scores of all games of a kind (Sounds tab). */
export function useSkillLog(kind: SkillKind): AttemptLog {
  return useSyncExternalStore(subscribe, () => logs[kind] ?? EMPTY);
}

/** Scores from one game only. */
export function useGameLog(game: GameId): AttemptLog {
  return useSyncExternalStore(subscribe, () => logs[`game:${game}`] ?? EMPTY);
}
