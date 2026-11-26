import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SkillCard } from '@/components/skill-card';
import { ipaLabel } from '@/constants/letters-game';
import { Radius, Spacing } from '@/constants/theme';
import { LETTERS } from '@/data/letters';
import { useTheme } from '@/hooks/use-theme';
import { playLetter } from '@/lib/play-word';
import { letterScore } from '@/lib/skill-score';
import { useSkillLog } from '@/lib/skill-store';

const letterLabel = (letter: string) => {
  const found = LETTERS.find((l) => l.letter === letter);
  return found ? `${letter} ${ipaLabel(found.ipa)}` : letter;
};

export default function LetterDetailScreen() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const colors = useTheme();
  const log = useSkillLog('letters');
  const data = LETTERS.find((l) => l.letter === letter);

  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Letter not found.</Text>
      </View>
    );
  }

  const attempts = log[data.letter] ?? [];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: data.letter }} />
      <View style={styles.hero}>
        <Text style={[styles.letter, { color: colors.text }]}>{data.letter}</Text>
        <Text style={[styles.ipa, { color: colors.textSecondary }]}>{ipaLabel(data.ipa)}</Text>
      </View>
      <Pressable
        onPress={() => void playLetter(data.letter)}
        style={({ pressed }) => [styles.play, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}>
        <Text style={styles.playText}>▶︎ Hear the letter name</Text>
      </Pressable>
      <SkillCard
        score={letterScore(attempts)}
        attempts={attempts}
        labelFor={letterLabel}
        formula="Score: 80% speed (Letter names: speed) + 20% accuracy, from your last 20 answers."
        sources="Letter names: speed or Spelling"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, gap: Spacing.md },
  hero: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.lg },
  letter: { fontSize: 96, fontWeight: '800' },
  ipa: { fontSize: 24 },
  play: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  playText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
