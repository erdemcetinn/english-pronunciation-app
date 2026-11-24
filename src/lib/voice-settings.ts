import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import voices from '@/data/voices.json';

export interface Voice {
  id: string;
  gender: 'female' | 'male';
}

export type VoiceMode =
  | { kind: 'device' }
  | { kind: 'random' }
  | { kind: 'voice'; voiceId: string };

export const VOICES: readonly Voice[] = voices as Voice[];
const STORAGE_KEY = 'voice-mode:v1';
const DEFAULT_MODE: VoiceMode = { kind: 'device' };

let currentMode: VoiceMode = DEFAULT_MODE;
const listeners = new Set<() => void>();

function isVoiceMode(value: unknown): value is VoiceMode {
  if (typeof value !== 'object' || value === null || !('kind' in value)) return false;
  if (value.kind === 'device' || value.kind === 'random') return true;
  return value.kind === 'voice' && 'voiceId' in value && VOICES.some((v) => v.id === value.voiceId);
}

export function getVoiceMode(): VoiceMode {
  return currentMode;
}

export function setVoiceMode(mode: VoiceMode): void {
  currentMode = mode;
  listeners.forEach((notify) => notify());
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mode)).catch((error) =>
    console.warn('Could not save voice mode', error),
  );
}

/** Restores the saved voice mode; call once at app start. */
export async function loadVoiceMode(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (isVoiceMode(parsed)) setVoiceMode(parsed);
  } catch (error) {
    console.warn('Could not load voice mode', error);
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useVoiceMode(): VoiceMode {
  return useSyncExternalStore(subscribe, getVoiceMode);
}

export function voiceModeLabel(mode: VoiceMode): string {
  if (mode.kind === 'device') return 'Device';
  if (mode.kind === 'random') return 'Random';
  return mode.voiceId;
}
