// Turns PDF text lines into clean sentences for the step-by-step reader.

/** A line seen on at least this share of pages (and 3+ pages) is a running header or footer. */
const REPEATED_LINE_SHARE = 0.3;
const MIN_REPEATED_PAGES = 3;
/** First/last lines of a page repeating on this many pages are headers (e.g. alternating chapter titles). */
const MIN_REPEATED_EDGE_PAGES = 3;
/** Short lines without end punctuation are treated as headings. */
const HEADING_MAX_LENGTH = 60;
const ENDS_SENTENCE_OR_CLAUSE = /[.!?:;,"'”’)\]]$/;
const PAGE_NUMBER = /^(page\s*)?[\divxlc]+$/i;
/** Ends in ? or !, maybe inside quotes or brackets: "Black Dog!" / (back then!) */
const QUOTE_END = /[?!]["'”’)\]]*$/;
const ABBREVIATIONS = /\b(Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|vs|etc|e\.g|i\.e|No|Vol|Ch|Fig|Mt)\.$/i;
/** A single capital initial like the H. in "H. Beam Piper". */
const INITIAL = /(^|\s)[A-Z]\.$/;

/** NFKC (ligatures), no private-use glyphs, single spaces, and "sea- chest" -> "sea-chest". */
const normalize = (line) =>
  line
    .normalize('NFKC')
    .replace(/[\uE000-\uF8FF]/g, '') // private-use glyphs (PDF bullet symbols)
    .replace(/\s+/g, ' ')
    .replace(/([a-z])- ([a-z])/g, '$1-$2')
    .trim();

/** Footers like "Book Title Page 2/142" differ only in numbers: compare them with digits masked. */
const withoutDigits = (line) => line.replace(/\d+/g, '#');

function countPages(linesPerPage) {
  const pagesWithLine = new Map();
  for (const lines of linesPerPage) {
    for (const line of new Set(lines)) pagesWithLine.set(line, (pagesWithLine.get(line) ?? 0) + 1);
  }
  return pagesWithLine;
}

const linesSeenOn = (counts, minPages) =>
  new Set([...counts].filter(([, count]) => count >= minPages).map(([line]) => line));

const edgeLines = (lines) => (lines.length <= 1 ? lines : [lines[0], lines[lines.length - 1]]).map(withoutDigits);

/** Lines to drop from one page: page numbers and repeated headers/footers at the top or bottom. */
function pageBody(lines, repeatedAnywhere, repeatedAtEdge) {
  const lastIndex = lines.length - 1;
  return lines.filter((line, index) => {
    if (repeatedAnywhere.has(line)) return false;
    const isEdge = index === 0 || index === lastIndex;
    return !(isEdge && (PAGE_NUMBER.test(line) || repeatedAtEdge.has(withoutDigits(line))));
  });
}

/** Share of words that must start with a capital or digit for a line to look like a heading. */
const HEADING_CAPITALIZED_SHARE = 0.6;

const isTitleLike = (line) => {
  const words = line.split(' ');
  return words.filter((w) => /^[\p{Lu}\d]/u.test(w)).length / words.length >= HEADING_CAPITALIZED_SHARE;
};

const EXPLICIT_HEADING =
  /^(chapter|part|book)\s+([ivxlc]+|\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

/**
 * "Chapter One": short, title-like, no end punctuation, and the text before it finished a sentence.
 * Lines starting with Chapter/Part/Book count even when they end in a quote ('Admiral Benbow').
 */
function isHeading(line, textSoFar) {
  const isAfterSentence =
    textSoFar.trim() === '' || textSoFar.endsWith('\n') || /[.!?]["'”’)\]]*$/.test(textSoFar.trim());
  if (line.length > HEADING_MAX_LENGTH || line.endsWith('-') || !isAfterSentence) return false;
  if (EXPLICIT_HEADING.test(line)) return true;
  return !ENDS_SENTENCE_OR_CLAUSE.test(line) && isTitleLike(line);
}

/**
 * pages: string[][] (lines per page) -> one text.
 * Drops page numbers and running headers, re-joins words hyphenated across lines,
 * and keeps headings as separate blocks (separated by a blank line).
 */
export function cleanPages(pages) {
  const normalized = pages.map((lines) => lines.map(normalize).filter(Boolean));
  const repeatedAnywhere = linesSeenOn(
    countPages(normalized),
    Math.max(MIN_REPEATED_PAGES, normalized.length * REPEATED_LINE_SHARE),
  );
  const repeatedAtEdge = linesSeenOn(countPages(normalized.map(edgeLines)), MIN_REPEATED_EDGE_PAGES);
  const lines = normalized.flatMap((page) => pageBody(page, repeatedAnywhere, repeatedAtEdge));

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
      // "Black Dog!" said he. -> one sentence (? or ! followed by lowercase text did not end the sentence).
      const previous = sentences.at(-1);
      if (!pending && /^[a-z]/.test(part) && previous && QUOTE_END.test(previous)) {
        sentences.pop();
        pending = previous;
      }
      pending = pending ? `${pending} ${part}` : part;
      if (!ABBREVIATIONS.test(pending) && !INITIAL.test(pending)) {
        sentences.push(pending);
        pending = '';
      }
    }
    if (pending) sentences.push(pending);
  }
  return sentences;
}

/** Drops everything before the first line containing `marker` (e.g. after a table of contents). */
export function startAtLine(pages, marker) {
  const pageIndex = pages.findIndex((lines) => lines.some((line) => line.includes(marker)));
  if (pageIndex === -1) throw new Error(`--start-at text not found: "${marker}"`);
  const lineIndex = pages[pageIndex].findIndex((line) => line.includes(marker));
  return [pages[pageIndex].slice(lineIndex), ...pages.slice(pageIndex + 1)];
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

/** Sentences longer than this are read in parts, as if they had a full stop. */
export const MAX_SENTENCE_WORDS = 30;
/** No part is shorter than this (avoids 2-word leftovers). */
export const MIN_CHUNK_WORDS = 8;
const NATURAL_BREAK = /[,;:—–)]$|-{2}$/;

/** Splits one long word list at natural breaks (comma, semicolon, dash...), or at MAX words if there are none. */
function chunkWords(words) {
  const chunks = [];
  let rest = words;
  while (rest.length > MAX_SENTENCE_WORDS) {
    // Latest natural break that leaves at least MIN words on both sides.
    let cut = -1;
    for (let i = MAX_SENTENCE_WORDS - 1; i >= MIN_CHUNK_WORDS - 1; i -= 1) {
      if (NATURAL_BREAK.test(rest[i]) && rest.length - (i + 1) >= MIN_CHUNK_WORDS) {
        cut = i + 1;
        break;
      }
    }
    if (cut === -1) cut = rest.length - MAX_SENTENCE_WORDS < MIN_CHUNK_WORDS ? rest.length - MIN_CHUNK_WORDS : MAX_SENTENCE_WORDS;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  return [...chunks, rest];
}

/** Breaks very long sentences into readable parts; short sentences stay as they are. */
export function chunkLongSentences(sentences) {
  return sentences.flatMap((sentence) => {
    const words = sentence.split(' ');
    return words.length <= MAX_SENTENCE_WORDS ? [sentence] : chunkWords(words).map((part) => part.join(' '));
  });
}
