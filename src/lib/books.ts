import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { clampPosition, START, type ReaderPosition } from '@/lib/reader';

const BASE_URL = process.env.EXPO_PUBLIC_AUDIO_BASE_URL;
const KEY_PREFIX = 'books/v1';
const DIR_NAME = 'books-v1';
const progressKey = (id: string) => `book-progress:v1:${id}`;

export interface BookEntry {
  id: string;
  title: string;
  author: string | null;
  sentenceCount: number;
  /** File name on the server, includes a content hash. */
  file: string;
}

export interface Book {
  id: string;
  title: string;
  sentences: string[];
}

const isBookEntry = (value: unknown): value is BookEntry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as BookEntry).id === 'string' &&
  typeof (value as BookEntry).title === 'string' &&
  typeof (value as BookEntry).sentenceCount === 'number' &&
  typeof (value as BookEntry).file === 'string' &&
  /^[a-z0-9-]+\.[0-9a-f]+\.json$/.test((value as BookEntry).file);

const isBook = (value: unknown): value is Book =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Book).id === 'string' &&
  Array.isArray((value as Book).sentences) &&
  (value as Book).sentences.every((s) => typeof s === 'string');

/** Books live in the documents folder (not cache), so they stay available offline. */
function booksDir(): Directory {
  const dir = new Directory(Paths.document, DIR_NAME);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

let lastCatalog: BookEntry[] = [];

/** The book list from the server; falls back to the last saved list when offline. */
export async function fetchCatalog(): Promise<BookEntry[]> {
  lastCatalog = await fetchCatalogUncached();
  return lastCatalog;
}

/** One book's entry, from the list already loaded (or a fresh one). */
export async function getCatalogEntry(id: string): Promise<BookEntry | null> {
  const list = lastCatalog.length > 0 ? lastCatalog : await fetchCatalog();
  return list.find((entry) => entry.id === id) ?? null;
}

async function fetchCatalogUncached(): Promise<BookEntry[]> {
  const cached = new File(booksDir(), 'index.json');
  try {
    if (!BASE_URL) throw new Error('EXPO_PUBLIC_AUDIO_BASE_URL is not set');
    const response = await fetch(`${BASE_URL}/${KEY_PREFIX}/index.json`);
    // No list uploaded yet: the private bucket answers 403 (or 404), which means "no books", not a network problem.
    if (response.status === 403 || response.status === 404) return [];
    if (!response.ok) throw new Error(`Book list request failed: ${response.status}`);
    const text = await response.text();
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Book list is not an array');
    // Saved for offline use; a failed save must not hide the list.
    await Promise.resolve(cached.write(text)).catch((error) => console.warn('Could not save the book list', error));
    return parsed.filter(isBookEntry);
  } catch (error) {
    if (!cached.exists) throw error;
    console.warn('Using the saved book list', error);
    const parsed: unknown = JSON.parse(await cached.text());
    return Array.isArray(parsed) ? parsed.filter(isBookEntry) : [];
  }
}

/** Downloads a book once, then reads it from the phone. */
export async function loadBook(entry: BookEntry): Promise<Book> {
  const local = new File(booksDir(), entry.file);
  if (!local.exists) {
    if (!BASE_URL) throw new Error('EXPO_PUBLIC_AUDIO_BASE_URL is not set');
    await File.downloadFileAsync(`${BASE_URL}/${KEY_PREFIX}/${entry.file}`, local, { idempotent: true });
  }
  const parsed: unknown = JSON.parse(await local.text());
  if (!isBook(parsed) || parsed.sentences.length === 0) throw new Error(`Book file ${entry.file} is invalid`);
  return parsed;
}

export async function loadProgress(id: string): Promise<ReaderPosition | null> {
  try {
    const raw = await AsyncStorage.getItem(progressKey(id));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const pos = parsed as ReaderPosition | null;
    return pos && Number.isInteger(pos.sentence) && Number.isInteger(pos.shown) ? pos : null;
  } catch (error) {
    console.warn(`Could not load progress for ${id}`, error);
    return null;
  }
}

export function saveProgress(id: string, pos: ReaderPosition): void {
  AsyncStorage.setItem(progressKey(id), JSON.stringify(pos)).catch((error) =>
    console.warn(`Could not save progress for ${id}`, error),
  );
}

/** Saved position fitted to the book (or the start). */
export function resumePosition(saved: ReaderPosition | null, sentenceLengths: readonly number[]): ReaderPosition {
  return saved ? clampPosition(saved, sentenceLengths) : START;
}
