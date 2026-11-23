import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SeenMap } from '@/lib/practice-session';

const keyFor = (phonemeId: string) => `seen-words:v1:${phonemeId}`;

function isSeenMap(value: unknown): value is SeenMap {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((v) => typeof v === 'number')
  );
}

/** Loads which practice words were shown for a phoneme. Returns {} on any failure. */
export async function loadSeen(phonemeId: string): Promise<SeenMap> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(phonemeId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isSeenMap(parsed) ? parsed : {};
  } catch (error) {
    console.warn(`Could not load seen words for ${phonemeId}`, error);
    return {};
  }
}

export async function saveSeen(phonemeId: string, seen: SeenMap): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(phonemeId), JSON.stringify(seen));
  } catch (error) {
    console.warn(`Could not save seen words for ${phonemeId}`, error);
  }
}
