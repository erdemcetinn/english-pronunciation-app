// Uploads every book in data/books/ to S3 and writes the catalog the app reads.
// Book files are named by content hash (cached forever); the small index is re-checked every minute.
//
// Usage: node scripts/upload-books.mjs --bucket <name> [--dry-run]
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const REGION = 'us-east-1';
const KEY_PREFIX = 'books/v1';
const BOOKS_DIR = new URL('../data/books/', import.meta.url);
const IMMUTABLE = 'public, max-age=31536000, immutable';
const INDEX_CACHE = 'public, max-age=60';

function loadBook(fileName) {
  const raw = readFileSync(new URL(fileName, BOOKS_DIR), 'utf8');
  const book = JSON.parse(raw);
  const isValid =
    typeof book.id === 'string' &&
    typeof book.title === 'string' &&
    Array.isArray(book.sentences) &&
    book.sentences.length > 0 &&
    book.sentences.every((s) => typeof s === 'string');
  if (!isValid) throw new Error(`${fileName} is not a valid book file`);
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 12);
  return { book, raw, file: `${book.id}.${hash}.json` };
}

async function main() {
  const { values } = parseArgs({
    options: { bucket: { type: 'string' }, 'dry-run': { type: 'boolean', default: false } },
  });
  if (!values.bucket) throw new Error('Missing --bucket (see `terraform output audio_bucket`)');

  const books = readdirSync(BOOKS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map(loadBook);
  if (books.length === 0) throw new Error('No books in data/books/. Run import-book.mjs first.');

  const index = books.map(({ book, file }) => ({
    id: book.id,
    title: book.title,
    author: book.author ?? null,
    sentenceCount: book.sentences.length,
    file,
  }));
  books.forEach(({ book, file }) => console.log(`${book.title}: ${book.sentences.length} sentences -> ${KEY_PREFIX}/${file}`));
  if (values['dry-run']) return;

  const s3 = new S3Client({ region: REGION });
  const put = (key, body, cacheControl) =>
    s3.send(
      new PutObjectCommand({
        Bucket: values.bucket,
        Key: `${KEY_PREFIX}/${key}`,
        Body: body,
        ContentType: 'application/json; charset=utf-8',
        CacheControl: cacheControl,
      }),
    );
  for (const { raw, file } of books) await put(file, raw, IMMUTABLE);
  await put('index.json', JSON.stringify(index), INDEX_CACHE);
  console.log(`Uploaded ${books.length} book(s) and index.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
