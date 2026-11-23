import type { Phoneme, PhonemeGroup } from '@/types/phoneme';
import rawPhonemes from './phonemes.json';

export const PHONEMES: readonly Phoneme[] = rawPhonemes as Phoneme[];

export const GROUP_ORDER: readonly PhonemeGroup[] = [
  'monophthong',
  'diphthong',
  'plosive',
  'affricate',
  'nasal',
  'fricative',
  'approximant',
];

export function getPhonemesByGroup(group: PhonemeGroup): Phoneme[] {
  return PHONEMES.filter((p) => p.group === group);
}

export function getPhonemeById(id: string): Phoneme | undefined {
  return PHONEMES.find((p) => p.id === id);
}
