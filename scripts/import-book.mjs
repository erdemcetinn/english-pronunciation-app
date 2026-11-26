// Turns a PDF into a book for the Read tab: clean sentences in data/books/<id>.json.
// Books stay out of git (copyright); upload them with scripts/upload-books.mjs.
//
// Usage:
//   node scripts/import-book.mjs --pdf <file.pdf> --title "Title" [--author "Name"] [--from 5] [--to 300]
//   --from / --to: page range to keep (skip cover, contents, index...).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { chunkLongSentences, cleanPages, slugify, splitSentences } from './lib/book-text.mjs';

const OUT_DIR = new URL('../data/books/', import.meta.url);
const PREVIEW_COUNT = 5;

function parseOptions() {
  const { values } = parseArgs({
    options: {
      pdf: { type: 'string' },
      title: { type: 'string' },
      author: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
    },
  });
  if (!values.pdf || !values.title) throw new Error('Usage: --pdf <file.pdf> --title "Title" [--author] [--from] [--to]');
  const toPage = (value) => (value === undefined ? undefined : Number.parseInt(value, 10));
  return { ...values, from: toPage(values.from), to: toPage(values.to) };
}

/** Lines of text per page, in reading order as pdf.js reports them. */
async function readPages(path, from, to) {
  const pdf = await getDocument({ data: new Uint8Array(readFileSync(path)), useSystemFonts: true }).promise;
  const first = Math.max(1, from ?? 1);
  const last = Math.min(pdf.numPages, to ?? pdf.numPages);
  const pages = [];
  for (let number = first; number <= last; number += 1) {
    const page = await pdf.getPage(number);
    const { items } = await page.getTextContent();
    let text = '';
    for (const item of items) {
      if (!('str' in item)) continue;
      text += item.str;
      if (item.hasEOL) text += '\n';
    }
    pages.push(text.split('\n'));
  }
  return { pages, totalPages: pdf.numPages, first, last };
}

async function main() {
  const options = parseOptions();
  const { pages, totalPages, first, last } = await readPages(options.pdf, options.from, options.to);
  const sentences = chunkLongSentences(splitSentences(cleanPages(pages)));
  if (sentences.length === 0) throw new Error('No text found. Is the PDF a scan (images only)?');

  const id = slugify(options.title);
  const book = { id, title: options.title, author: options.author ?? null, sentences };
  mkdirSync(OUT_DIR, { recursive: true });
  const outFile = new URL(`${id}.json`, OUT_DIR);
  writeFileSync(outFile, JSON.stringify(book));

  const words = sentences.reduce((sum, s) => sum + s.split(' ').length, 0);
  console.log(`Pages ${first}-${last} of ${totalPages} -> ${sentences.length} sentences, ${words} words`);
  console.log(`Saved ${outFile.pathname}\n`);
  console.log('First sentences:');
  sentences.slice(0, PREVIEW_COUNT).forEach((s) => console.log(`  • ${s}`));
  console.log('\nRandom sentences:');
  for (let i = 0; i < PREVIEW_COUNT; i += 1) console.log(`  • ${sentences[Math.floor(Math.random() * sentences.length)]}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
