// Builds Polly SSML that forces the exact pronunciation we display.
// Polly's en-US IPA set differs from our display symbols in a few places.
const POLLY_SYMBOLS = { r: 'ɹ', g: 'ɡ', tʃ: 't͡ʃ', dʒ: 'd͡ʒ' };

export function toPollyIpa(segments) {
  return segments.map((s) => POLLY_SYMBOLS[s] ?? s).join('');
}

const escapeXml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function wordSsml(word, segments) {
  const ph = escapeXml(toPollyIpa(segments));
  return `<speak><phoneme alphabet="ipa" ph="${ph}">${escapeXml(word)}</phoneme></speak>`;
}
