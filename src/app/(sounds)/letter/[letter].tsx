import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SkillCard } from '@/components/skill-card';
import { letterLabel } from '@/constants/skill-labels';
import { GAME_VOICES } from '@/constants/game';
import { ipaLabel, speedPool } from '@/constants/letters-game';
import { Radius, Spacing } from '@/constants/theme';
import { LETTERS } from '@/data/letters';
import { useTheme } from '@/hooks/use-theme';
import { playLetter } from '@/lib/play-word';
import { hasSpeedData, letterScore, type Attempt } from '@/lib/skill-score';
import { useSkillLog } from '@/lib/skill-store';

const SPEED_LETTERS = new Set([...speedPool('vowels', true), ...speedPool('consonants', false)]);

/** Explains which formula the score uses right now. */
function formulaFor(letter: string, attempts: readonly Attempt[]): string {
  if (hasSpeedData(attempts)) return 'Score: 80% speed + 20% accuracy, from your recent answers.';
  if (!SPEED_LETTERS.has(letter)) return 'Speed not measured (this letter is not in Letter names: speed). Score: accuracy.';
  return 'Score: accuracy for now. Speed counts (80%) after 5 answers in Letter names: speed.';
}

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
        onPress={() => void playLetter(data.letter, GAME_VOICES)}
        style={({ pressed }) => [styles.play, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}>
        <Text style={styles.playText}>▶︎ Hear the letter name</Text>
      </Pressable>
      <SkillCard
        score={letterScore(attempts)}
        attempts={attempts}
        labelFor={letterLabel}
        formula={formulaFor(data.letter, attempts)}
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
