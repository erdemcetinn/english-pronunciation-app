import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cleanPages, slugify, splitSentences } from './book-text.mjs';

test('cleanPages drops page numbers and running headers, joins hyphenated words', () => {
  const pages = [
    ['THE GREAT BOOK', 'It was a fine exam-', 'ple of the art.', '1'],
    ['THE GREAT BOOK', 'She said it was', 'good.', '2'],
    ['THE GREAT BOOK', 'Then they left.', '3'],
  ];
  assert.equal(cleanPages(pages), 'It was a fine example of the art. She said it was good. Then they left.');
});

test('cleanPages keeps short headings as their own block', () => {
  const pages = [['Chapter One', 'It began at night.']];
  assert.equal(cleanPages(pages), 'Chapter One\n\nIt began at night.');
});

test('cleanPages keeps two headings in a row apart', () => {
  assert.equal(cleanPages([['CHAPTER I', 'The Beginning', 'It began at night.']]), 'CHAPTER I\n\nThe Beginning\n\nIt began at night.');
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
