import { Directory, File, Paths } from 'expo-file-system';

const BASE_URL = process.env.EXPO_PUBLIC_AUDIO_BASE_URL;
const KEY_PREFIX = 'audio/v1';
const CACHE_DIR_NAME = 'audio-v1';

const inFlight = new Map<string, Promise<string>>();

export const isRemoteAudioConfigured = Boolean(BASE_URL);

function localFile(voice: string, word: string): File {
  return new File(Paths.cache, CACHE_DIR_NAME, voice, `${word}.mp3`);
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
