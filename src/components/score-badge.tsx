import { StyleSheet, Text, View } from 'react-native';

import { scoreColor } from '@/constants/score';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MIN_ATTEMPTS } from '@/lib/skill-score';

interface ScoreBadgeProps {
  score: number | null;
  attemptCount: number;
}

/** Colored "67/100" score pill, or "2/5" progress until there are enough answers. Nothing before the first answer. */
export function ScoreBadge({ score, attemptCount }: ScoreBadgeProps) {
  const colors = useTheme();
  if (score === null) {
    if (attemptCount === 0) return null;
    return (
      <Text style={[styles.progress, { color: colors.textSecondary }]}>
        {attemptCount}/{MIN_ATTEMPTS}
      </Text>
    );
  }
  return (
    <View style={[styles.pill, { backgroundColor: scoreColor(score, colors) }]}>
      <Text style={styles.pillText}>{score}/100</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { fontSize: 10, fontWeight: '600' },
  pill: { borderRadius: Radius.md, paddingHorizontal: 4, paddingVertical: 1, alignItems: 'center' },
  pillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});
