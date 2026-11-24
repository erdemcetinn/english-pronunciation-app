import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SeenMap } from '@/lib/practice-session';

const keyFor = (listId: string) => `seen-words:v1:${listId}`;

function isSeenMap(value: unknown): value is SeenMap {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((v) => typeof v === 'number')
  );
}

/** Loads which items of a list (practice words of a phoneme, game rounds) were shown. Returns {} on any failure. */
export async function loadSeen(listId: string): Promise<SeenMap> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(listId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isSeenMap(parsed) ? parsed : {};
  } catch (error) {
    console.warn(`Could not load seen words for ${listId}`, error);
    return {};
  }
}

export async function saveSeen(listId: string, seen: SeenMap): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(listId), JSON.stringify(seen));
  } catch (error) {
    console.warn(`Could not save seen words for ${listId}`, error);
  }
}
