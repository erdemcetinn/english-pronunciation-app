import * as Speech from 'expo-speech';

const LANGUAGE = 'en-US';
const DEFAULT_RATE = 0.9;

/** Speaks a word with the device voice, cutting off anything still playing. */
export function speakWord(word: string, rate: number = DEFAULT_RATE): void {
  Speech.stop();
  Speech.speak(word, {
    language: LANGUAGE,
    rate,
    onError: (error) => console.warn(`Speech failed for "${word}"`, error),
  });
}
