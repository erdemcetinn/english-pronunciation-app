// Turns PDF text lines into clean sentences for the step-by-step reader.

/** A line seen on at least this share of pages (and 3+ pages) is a running header or footer. */
const REPEATED_LINE_SHARE = 0.3;
const MIN_REPEATED_PAGES = 3;
/** Short lines without end punctuation are treated as headings. */
const HEADING_MAX_LENGTH = 60;
const ENDS_SENTENCE_OR_CLAUSE = /[.!?:;,"'”’)\]]$/;
const PAGE_NUMBER = /^(page\s*)?[\divxlc]+$/i;
const ABBREVIATIONS = /\b(Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|vs|etc|e\.g|i\.e|No|Vol|Ch|Fig|Mt)\.$/i;

const normalize = (line) => line.normalize('NFKC').replace(/\s+/g, ' ').trim();

function repeatedLines(pages) {
  const pagesWithLine = new Map();
  for (const lines of pages) {
    for (const line of new Set(lines)) pagesWithLine.set(line, (pagesWithLine.get(line) ?? 0) + 1);
  }
  const threshold = Math.max(MIN_REPEATED_PAGES, pages.length * REPEATED_LINE_SHARE);
  return new Set([...pagesWithLine].filter(([, count]) => count >= threshold).map(([line]) => line));
}

/** Share of words that must start with a capital or digit for a line to look like a heading. */
const HEADING_CAPITALIZED_SHARE = 0.6;

const isTitleLike = (line) => {
  const words = line.split(' ');
  return words.filter((w) => /^[\p{Lu}\d]/u.test(w)).length / words.length >= HEADING_CAPITALIZED_SHARE;
};

/** "Chapter One": short, title-like, no end punctuation, and the text before it finished a sentence. */
const isHeading = (line, textSoFar) =>
  line.length <= HEADING_MAX_LENGTH &&
  !ENDS_SENTENCE_OR_CLAUSE.test(line) &&
  !line.endsWith('-') &&
  isTitleLike(line) &&
  (textSoFar.trim() === '' || textSoFar.endsWith('\n') || /[.!?"'”’]$/.test(textSoFar.trim()));

/**
 * pages: string[][] (lines per page) -> one text.
 * Drops page numbers and running headers, re-joins words hyphenated across lines,
 * and keeps headings as separate blocks (separated by a blank line).
 */
export function cleanPages(pages) {
  const normalized = pages.map((lines) => lines.map(normalize).filter(Boolean));
  const headers = repeatedLines(normalized);
  const lines = normalized.flat().filter((line) => !headers.has(line) && !PAGE_NUMBER.test(line));

  let text = '';
  for (const line of lines) {
    if (isHeading(line, text)) {
      text = `${text.trimEnd()}\n\n${line}\n\n`;
    } else if (/[a-z]-$/.test(text) && /^[a-z]/.test(line)) {
      text = text.slice(0, -1) + line; // exam- / ple -> example
    } else {
      text = text.endsWith('\n') || text === '' ? text + line : `${text} ${line}`;
    }
  }
  return text.trim().replace(/\n{3,}/g, '\n\n');
}

/** Text -> sentences. Blank-line blocks (headings) never merge with the text around them. */
export function splitSentences(text) {
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const sentences = [];
  for (const block of text.split(/\n{2,}/)) {
    let pending = '';
    for (const { segment } of segmenter.segment(block.replace(/\s+/g, ' ').trim())) {
      const part = segment.trim();
      if (!part) continue;
      pending = pending ? `${pending} ${part}` : part;
      if (!ABBREVIATIONS.test(pending)) {
        sentences.push(pending);
        pending = '';
      }
    }
    if (pending) sentences.push(pending);
  }
  return sentences;
}

export function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
