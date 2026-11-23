import { Text, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { getIpaSegments } from '@/data/words';

interface IpaTextProps {
  word: string;
  /** IPA symbol to highlight, e.g. the sound being practiced. */
  highlight?: string;
  style?: TextStyle;
}

/** Shows a word's IPA as /…/, with the target sound in the accent color. */
export function IpaText({ word, highlight, style }: IpaTextProps) {
  const colors = useTheme();
  const segments = getIpaSegments(word);
  if (segments.length === 0) return null;

  return (
    <Text style={[{ color: colors.textSecondary }, style]}>
      /
      {segments.map((segment, i) => (
        <Text
          key={i}
          style={segment === highlight ? { color: colors.accent, fontWeight: '700' } : undefined}>
          {segment}
        </Text>
      ))}
      /
    </Text>
  );
}
