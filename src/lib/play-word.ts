import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import { getLetter } from '@/data/letters';
import { getAudioUri, isRemoteAudioConfigured } from '@/lib/audio-cache';
import { shuffled } from '@/lib/practice-session';
import { speakWord } from '@/lib/speech';
import { createVoiceBag } from '@/lib/voice-bag';
import { getVoiceMode, VOICES, type VoiceMode } from '@/lib/voice-settings';

let player: AudioPlayer | null = null;
const voiceBag = createVoiceBag(
  VOICES.map((v) => v.id),
  shuffled,
);
/** Voice chosen ahead of time for a word (random mode), so prefetch and play agree. */
const plannedVoices = new Map<string, string>();
/** Increases on every play request; a download that finishes late must not play over a newer request. */
let playToken = 0;

function getPlayer(): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(null);
    setAudioModeAsync({ playsInSilentMode: true }).catch((error) =>
      console.warn('Could not set audio mode', error),
    );
  }
  return player;
}

function voiceFor(word: string, mode: VoiceMode): string | null {
  if (!isRemoteAudioConfigured || mode.kind === 'device') return null;
  if (mode.kind === 'voice') return mode.voiceId;
  const planned = plannedVoices.get(word);
  plannedVoices.delete(word);
  return planned ?? voiceBag.next();
}

function stopAll(): void {
  Speech.stop();
  player?.pause();
}

/** Plays the clip `key`; the device voice says `spokenText` when Polly audio is off or fails. */
async function playClip(key: string, spokenText: string, mode: VoiceMode): Promise<void> {
  stopAll();
  const token = ++playToken;
  const voice = voiceFor(key, mode);
  if (!voice) return speakWord(spokenText);

  try {
    const uri = await getAudioUri(voice, key);
    if (token !== playToken) return; // a newer clip was requested while this one downloaded
    const audio = getPlayer();
    audio.replace({ uri });
    audio.play();
  } catch (error) {
    console.warn(`Polly audio failed for ${voice}/${key}, using device voice`, error);
    if (token === playToken) speakWord(spokenText);
  }
}

/**
 * Plays a word with the given voice mode (default: the user's setting).
 * Falls back to the device voice on any error.
 */
export function playWord(word: string, mode: VoiceMode = getVoiceMode()): Promise<void> {
  return playClip(word, word, mode);
}

/**
 * Plays the English name of a letter: A /eɪ/, E /i/, I /aɪ/.
 * The device fallback gets the lowercase letter: iOS reads a lone capital as "capital A".
 */
export function playLetter(letter: string, mode: VoiceMode = getVoiceMode()): Promise<void> {
  return playClip(getLetter(letter).key, letter.toLowerCase(), mode);
}

/** Downloads upcoming words in the background so they play instantly. */
export function prefetchWords(words: readonly string[], mode: VoiceMode = getVoiceMode()): void {
  if (!isRemoteAudioConfigured || mode.kind === 'device') return;
  for (const word of words) {
    const voice = mode.kind === 'voice' ? mode.voiceId : (plannedVoices.get(word) ?? voiceBag.next());
    if (mode.kind === 'random') plannedVoices.set(word, voice);
    getAudioUri(voice, word).catch(() => {
      // Ignored here: playWord retries and falls back to the device voice.
    });
  }
}

/** Downloads every voice for the given clips (small sets only, e.g. letter names), so timing games never wait. */
export function prefetchAllVoices(keys: readonly string[]): void {
  if (!isRemoteAudioConfigured) return;
  for (const { id } of VOICES) {
    for (const key of keys) {
      getAudioUri(id, key).catch(() => {
        // Ignored here: playback retries and falls back to the device voice.
      });
    }
  }
}

/** Resolves when the clips are on the phone (failures are skipped), so a timed sequence plays without gaps. */
export async function preloadClips(keys: readonly string[], voiceId: string): Promise<void> {
  if (!isRemoteAudioConfigured) return;
  await Promise.allSettled(keys.map((key) => getAudioUri(voiceId, key)));
}
