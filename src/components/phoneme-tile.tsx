import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Phoneme } from '@/types/phoneme';

const TILE_SIZE = 76;

export function PhonemeTile({ phoneme }: { phoneme: Phoneme }) {
  const colors = useTheme();

  return (
    <Link href={{ pathname: '/phoneme/[id]', params: { id: phoneme.id } }} asChild>
      <Pressable
        accessibilityLabel={`Sound ${phoneme.ipa}, as in ${phoneme.examples[0]}`}
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: pressed ? colors.tilePressed : colors.tile },
        ]}>
        {phoneme.notInTurkish && (
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        )}
        <Text style={[styles.ipa, { color: colors.text }]}>{phoneme.ipa}</Text>
        <Text style={[styles.example, { color: colors.textSecondary }]} numberOfLines={1}>
          {phoneme.examples[0]}
        </Text>
      </Pressable>
    </Link>
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
  dot: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ipa: { fontSize: 26, fontWeight: '600' },
  example: { fontSize: 12 },
});
