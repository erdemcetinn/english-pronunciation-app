/** For the vowel game: the two vowels most often confused with each stressed vowel. */
export const VOWEL_DISTRACTORS: Readonly<Record<string, readonly [string, string]>> = {
  iy: ['ih', 'ey'],
  ih: ['iy', 'eh'],
  eh: ['ae', 'ih'],
  ae: ['eh', 'ah'],
  aa: ['ah', 'ao'],
  ao: ['aa', 'ow'],
  uh: ['uw', 'ah'],
  uw: ['uh', 'ow'],
  ah: ['aa', 'ae'],
  er: ['ah', 'eh'],
  ey: ['eh', 'iy'],
  ay: ['oy', 'aa'],
  oy: ['ay', 'ao'],
  aw: ['ow', 'aa'],
  ow: ['ao', 'aw'],
};

export const GAME_VOWEL_IDS = Object.keys(VOWEL_DISTRACTORS);
