import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { GameId } from '@/lib/skill-store';

/** Header button that opens a game's own scores. */
export function ScoresButton({ game }: { game: GameId }) {
  const colors = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/test/scores/[game]', params: { game } })}
      accessibilityLabel="Show scores for this game"
      hitSlop={8}>
      <Text style={[styles.text, { color: colors.accent }]}>Scores</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 17, fontWeight: '600' },
});
