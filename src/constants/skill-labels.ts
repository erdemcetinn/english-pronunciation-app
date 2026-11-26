import { ipaLabel } from '@/constants/letters-game';
import { LETTERS } from '@/data/letters';
import { getPhonemeById } from '@/data/phonemes';

/** "iy" -> "/i/ (see)" */
export function soundLabel(id: string): string {
  const phoneme = getPhonemeById(id);
  return phoneme ? `/${phoneme.ipa}/ (${phoneme.examples[0]})` : id;
}

/** "E" -> "E /i/" */
export function letterLabel(letter: string): string {
  const found = LETTERS.find((l) => l.letter === letter);
  return found ? `${letter} ${ipaLabel(found.ipa)}` : letter;
}
