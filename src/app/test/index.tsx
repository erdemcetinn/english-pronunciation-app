import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const GAMES: readonly { href: Href; title: string; description: string }[] = [
  { href: '/test/pairs', title: 'Word pairs', description: 'Hear a word and pick it: ship or sheep?' },
  { href: '/test/vowel', title: 'Find the vowel', description: 'Hear a word and fill in its missing vowel: /ʃ_p/' },
  { href: '/test/letters-speed', title: 'Letter names: speed', description: 'Hear A, E or I and tap the letter as fast as you can' },
  { href: '/test/letters-sound', title: 'Letter names: sound', description: 'See a letter and find how its name sounds' },
];

export default function TestMenuScreen() {
  const colors = useTheme();
  const router = useRouter();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      {GAMES.map((game) => (
        <Pressable
          key={game.title}
          onPress={() => router.push(game.href)}
          style={({ pressed }) => [styles.card, { backgroundColor: pressed ? colors.tilePressed : colors.tile }]}>
          <Text style={[styles.title, { color: colors.text }]}>{game.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{game.description}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, gap: Spacing.md },
  card: { padding: Spacing.lg, borderRadius: Radius.lg, gap: Spacing.xs },
  title: { fontSize: 20, fontWeight: '700' },
  description: { fontSize: 15 },
});
