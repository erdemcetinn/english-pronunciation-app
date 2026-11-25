import { Directory, File, Paths } from 'expo-file-system';

import { getLetterSegmentsByKey } from '@/data/letters';
import { getIpaSegments } from '@/data/words';

const BASE_URL = process.env.EXPO_PUBLIC_AUDIO_BASE_URL;
const KEY_PREFIX = 'audio/v1';
const CACHE_DIR_NAME = 'audio-v1';

const inFlight = new Map<string, Promise<string>>();

export const isRemoteAudioConfigured = Boolean(BASE_URL);

/** IPA of a clip: a dictionary word, or a letter name key like letter-a. */
function clipSegments(word: string): readonly string[] {
  const segments = getIpaSegments(word);
  return segments.length > 0 ? segments : getLetterSegmentsByKey(word);
}

/** Short hash of the word's IPA: if a pronunciation is fixed, the old cached file is ignored. */
function ipaFingerprint(word: string): string {
  let hash = 5381;
  for (const char of clipSegments(word).join('')) hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0;
  return hash.toString(36);
}

function localFile(voice: string, word: string): File {
  return new File(Paths.cache, CACHE_DIR_NAME, voice, `${word}.${ipaFingerprint(word)}.mp3`);
}

async function download(voice: string, word: string): Promise<string> {
  if (!BASE_URL) throw new Error('EXPO_PUBLIC_AUDIO_BASE_URL is not set');
  const dir = new Directory(Paths.cache, CACHE_DIR_NAME, voice);
  dir.create({ intermediates: true, idempotent: true });
  const url = `${BASE_URL}/${KEY_PREFIX}/${voice}/${encodeURIComponent(word)}.mp3`;
  const file = await File.downloadFileAsync(url, localFile(voice, word), { idempotent: true });
  return file.uri;
}

/** Local file URI for a word's audio; downloads once, then serves from the phone. */
export function getAudioUri(voice: string, word: string): Promise<string> {
  const cached = localFile(voice, word);
  if (cached.exists) return Promise.resolve(cached.uri);

  const key = `${voice}/${word}`;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = download(voice, word).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
