import { SUCCESS_COLOR } from '@/constants/game';
import type { ThemeColors } from '@/constants/theme';
import { scoreBand } from '@/lib/skill-score';

const OK_COLOR = '#F5A524';

/** 85+ green, 60-84 orange, below 60 red. */
export function scoreColor(score: number, colors: ThemeColors): string {
  const band = scoreBand(score);
  if (band === 'good') return SUCCESS_COLOR;
  return band === 'ok' ? OK_COLOR : colors.warning;
}
