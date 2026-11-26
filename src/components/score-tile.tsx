import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreBadge } from '@/components/score-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TILE_SIZE = 76;

interface ScoreTileProps {
  title: string;
  subtitle: string;
  score: number | null;
  attemptCount: number;
  /** Red dot top right, e.g. a sound that doesn't exist in Turkish. */
  hasDot?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

/** Square tile for a sound or a letter, with its score badge in the top left corner. */
export function ScoreTile({ title, subtitle, score, attemptCount, hasDot = false, onPress, accessibilityLabel }: ScoreTileProps) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={score === null ? accessibilityLabel : `${accessibilityLabel}, score ${score}`}
      style={({ pressed }) => [styles.tile, { backgroundColor: pressed ? colors.tilePressed : colors.tile }]}>
      <View style={styles.badge}>
        <ScoreBadge score={score} attemptCount={attemptCount} />
      </View>
      {hasDot && <View style={[styles.dot, { backgroundColor: colors.warning }]} />}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  badge: { position: 'absolute', top: 4, left: 4 },
  dot: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 6, height: 6, borderRadius: 3 },
  title: { fontSize: 26, fontWeight: '600' },
  subtitle: { fontSize: 12 },
});
