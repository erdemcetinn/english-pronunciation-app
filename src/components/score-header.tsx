import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { Score } from '@/lib/listening-game';

export function ScoreHeader({ score }: { score: Score }) {
  const colors = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.score, { color: colors.text }]}>
        {score.correct} / {score.total}
      </Text>
      <Text style={[styles.streak, { color: colors.textSecondary }]}>
        Streak {score.streak} · Best {score.bestStreak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  score: { fontSize: 28, fontWeight: '700' },
  streak: { fontSize: 14 },
});
