import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { recordAttempt, type Attempt, type AttemptLog } from '@/lib/skill-score';

/** sounds: phoneme ids from the listening games · letters: A-Z from the letter games */
export type SkillKind = 'sounds' | 'letters';

const storageKey = (kind: SkillKind) => `skill-log:v1:${kind}`;

let logs: Readonly<Record<SkillKind, AttemptLog>> = { sounds: {}, letters: {} };
const listeners = new Set<() => void>();

function isAttemptLog(value: unknown): value is AttemptLog {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((list) => Array.isArray(list) && list.every((a) => typeof a?.isCorrect === 'boolean'))
  );
}

function save(kind: SkillKind): void {
  AsyncStorage.setItem(storageKey(kind), JSON.stringify(logs[kind])).catch((error) =>
    console.warn(`Could not save ${kind} scores`, error),
  );
}

/** Adds one answer to the score history and saves it. */
export function recordSkill(kind: SkillKind, id: string, attempt: Omit<Attempt, 'at'>): void {
  logs = { ...logs, [kind]: recordAttempt(logs[kind], id, { ...attempt, at: Date.now() }) };
  listeners.forEach((notify) => notify());
  save(kind);
}

/** Restores saved score histories; call once at app start. */
export async function loadSkillLogs(): Promise<void> {
  const kinds: SkillKind[] = ['sounds', 'letters'];
  for (const kind of kinds) {
    try {
      const raw = await AsyncStorage.getItem(storageKey(kind));
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isAttemptLog(parsed)) logs = { ...logs, [kind]: parsed };
    } catch (error) {
      console.warn(`Could not load ${kind} scores`, error);
    }
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSkillLog(kind: SkillKind): AttemptLog {
  return useSyncExternalStore(subscribe, () => logs[kind]);
}
