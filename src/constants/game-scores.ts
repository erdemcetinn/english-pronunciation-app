import { CONSONANT_SET_LETTERS, LETTERS, VOWEL_LETTERS } from '@/data/letters';
import { MINIMAL_PAIRS } from '@/data/minimal-pairs';
import { PHONEMES } from '@/data/phonemes';
import { GAME_VOWEL_IDS } from '@/data/vowel-distractors';
import type { GameId } from '@/lib/skill-store';

export interface GameScoreConfig {
  title: string;
  /** Items this game asks about, in display order: phoneme ids or letters. */
  items: readonly string[];
  /** Short note on how the score is made. */
  formula: string;
}

const pairSounds = new Set(MINIMAL_PAIRS.flatMap((pair) => pair.contrast));
const phonemeIdsWhere = (keep: (id: string) => boolean) => PHONEMES.map((p) => p.id).filter(keep);

export const GAME_SCORES: Readonly<Record<GameId, GameScoreConfig>> = {
  pairs: {
    title: 'Word pairs',
    items: phonemeIdsWhere((id) => pairSounds.has(id)),
    formula: 'Score: share of correct answers in your last 20 for each sound, in this game.',
  },
  vowel: {
    title: 'Find the vowel',
    items: phonemeIdsWhere((id) => GAME_VOWEL_IDS.includes(id)),
    formula: 'Score: share of correct answers in your last 20 for each vowel, in this game.',
  },
  'letters-speed': {
    title: 'Letter names: speed',
    items: [...new Set([...VOWEL_LETTERS, ...CONSONANT_SET_LETTERS])].sort(),
    formula: 'Score: 80% speed + 20% accuracy once a letter has 5 answers, accuracy only before that.',
  },
  spelling: {
    title: 'Spelling',
    items: LETTERS.map((l) => l.letter),
    formula: 'Score: share of letters you picked right in your last 20 (no timing in spelling).',
  },
};
