import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  chunkLongSentences,
  cleanPages,
  MAX_SENTENCE_WORDS,
  MIN_CHUNK_WORDS,
  slugify,
  splitSentences,
  startAtLine,
} from './book-text.mjs';

test('cleanPages drops page numbers and running headers, joins hyphenated words', () => {
  const pages = [
    ['THE GREAT BOOK', 'It was a fine exam-', 'ple of the art.', '1'],
    ['THE GREAT BOOK', 'She said it was', 'good.', '2'],
    ['THE GREAT BOOK', 'Then they left.', '3'],
  ];
  assert.equal(cleanPages(pages), 'It was a fine example of the art. She said it was good. Then they left.');
});

test('cleanPages keeps a lone "I" inside a page (only edge lines can be page numbers)', () => {
  assert.equal(cleanPages([['Top line here.', 'Then he said that', 'I', 'was right.', '7']]), 'Top line here. Then he said that I was right.');
});

test('cleanPages drops alternating chapter headers that repeat at page edges', () => {
  const pages = Array.from({ length: 18 }, (_, i) =>
    i % 2 === 0 ? ['THE BOOK', `Line ${i} of the story,`] : [`CHAPTER ${Math.floor(i / 6) + 1}`, `more ${i} text,`],
  );
  const text = cleanPages(pages);
  assert.ok(!text.includes('THE BOOK'));
  assert.ok(!text.includes('CHAPTER'));
});

test('cleanPages drops numbered footers like "Title Page 2/142"', () => {
  const pages = [2, 3, 4].map((n) => [`Line on page ${n} goes on,`, `Treasure Island Page ${n}/142`]);
  assert.ok(!cleanPages(pages).includes('Treasure Island Page'));
});

test('cleanPages fixes "sea- chest" and keeps Chapter lines ending in a quote as headings', () => {
  assert.equal(
    cleanPages([["Chapter I - At the 'Admiral Benbow'", 'His sea- chest was here.']]),
    "Chapter I - At the 'Admiral Benbow'\n\nHis sea-chest was here.",
  );
});

test('a heading after "party.)" is still a heading', () => {
  assert.equal(
    cleanPages([['known by the party.)', 'Part V. My Sea Adventure', 'Chapter XXII - How It Began', 'There was no return.']]),
    'known by the party.)\n\nPart V. My Sea Adventure\n\nChapter XXII - How It Began\n\nThere was no return.',
  );
});

test('a sentence starting with "Part of" is not a heading', () => {
  assert.equal(cleanPages([['It ended.', 'Part of the crew', 'stayed behind.']]), 'It ended. Part of the crew stayed behind.');
});

test('startAtLine drops everything before the marker line', () => {
  assert.deepEqual(startAtLine([['Contents', 'Part One 2'], ['x', 'Part One. Start', 'Text.']], 'Part One. Start'), [
    ['Part One. Start', 'Text.'],
  ]);
});

test('cleanPages keeps short headings as their own block', () => {
  const pages = [['Chapter One', 'It began at night.']];
  assert.equal(cleanPages(pages), 'Chapter One\n\nIt began at night.');
});

test('cleanPages keeps two headings in a row apart', () => {
  assert.equal(cleanPages([['CHAPTER I', 'The Beginning', 'It began at night.']]), 'CHAPTER I\n\nThe Beginning\n\nIt began at night.');
});

test('cleanPages drops private-use bullet glyphs', () => {
  assert.equal(cleanPages([['\uf0b7 to Share the work.']]), 'to Share the work.');
});

test('cleanPages normalizes ligatures and spaces', () => {
  assert.equal(cleanPages([['The  ﬁrst  oﬃce was here.']]), 'The first office was here.');
});

test('splitSentences splits on sentence ends but not after Mr./Dr.', () => {
  assert.deepEqual(splitSentences('Mr. Smith met Dr. Jones. They talked! Did it work? Yes.'), [
    'Mr. Smith met Dr. Jones.',
    'They talked!',
    'Did it work?',
    'Yes.',
  ]);
});

test('splitSentences keeps "Black Dog!" said he. together', () => {
  assert.deepEqual(splitSentences('“Black Dog!” said he. “And who else?” returned the other. It was late.'), [
    '“Black Dog!” said he.',
    '“And who else?” returned the other.',
    'It was late.',
  ]);
});

test('splitSentences keeps "(back then!) took me" and "H. Beam Piper" together', () => {
  assert.deepEqual(splitSentences('Tanya (yes, that Tanya, back then!) took me to H. Beam Piper. It worked.'), [
    'Tanya (yes, that Tanya, back then!) took me to H. Beam Piper.',
    'It worked.',
  ]);
});

test('splitSentences treats headings (blank-line blocks) as their own sentence', () => {
  assert.deepEqual(splitSentences('Chapter One\n\nIt began at night. It was cold.'), [
    'Chapter One',
    'It began at night.',
    'It was cold.',
  ]);
});

test('slugify makes a safe id', () => {
  assert.equal(slugify("The Pilgrim's Progress: Part 1"), 'the-pilgrims-progress-part-1');
});

const words = (n, prefix = 'w') => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

test('chunkLongSentences leaves normal sentences alone', () => {
  assert.deepEqual(chunkLongSentences(['A short one.', 'Another.']), ['A short one.', 'Another.']);
});

test('chunkLongSentences cuts a long sentence at a comma near the middle', () => {
  const sentence = [...words(18, 'a'), 'end,', ...words(20, 'b'), 'stop.'].join(' ');
  const chunks = chunkLongSentences([sentence]);
  assert.equal(chunks.length, 2);
  assert.ok(chunks[0].endsWith('end,'));
  assert.ok(chunks[1].endsWith('stop.'));
  assert.equal(chunks.join(' '), sentence);
});

test('chunkLongSentences cuts at MAX words when there is no punctuation, never leaves a tiny tail', () => {
  const sentence = words(64).join(' ');
  const chunks = chunkLongSentences([sentence]);
  assert.ok(chunks.every((c) => c.split(' ').length <= MAX_SENTENCE_WORDS + MIN_CHUNK_WORDS));
  assert.ok(chunks.every((c) => c.split(' ').length >= MIN_CHUNK_WORDS));
  assert.equal(chunks.join(' '), sentence);
});
