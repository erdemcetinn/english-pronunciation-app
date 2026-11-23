import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IpaText } from '@/components/ipa-text';
import { Radius, Spacing } from '@/constants/theme';
import { getPhonemeById } from '@/data/phonemes';
import { getPracticeWords } from '@/data/words';
import { useTheme } from '@/hooks/use-theme';
import { speakWord } from '@/lib/speech';

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const phoneme = getPhonemeById(id);
  const words = getPracticeWords(id);
  const [index, setIndex] = useState(0);
  const word = words[index];

  useEffect(() => {
    if (word) speakWord(word);
  }, [word]);

  if (!phoneme || !word) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No practice words for this sound.</Text>
      </View>
    );
  }

  const isLast = index === words.length - 1;
  const isFirst = index === 0;
  const goNext = () => setIndex(isLast ? 0 : index + 1);
  const goBack = () => setIndex(Math.max(0, index - 1));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Practice /${phoneme.ipa}/` }} />

      <Text style={[styles.progress, { color: colors.textSecondary }]}>
        {index + 1} / {words.length}
      </Text>

      <Pressable
        onPress={() => speakWord(word)}
        accessibilityLabel={`Play ${word} again`}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: pressed ? colors.tilePressed : colors.tile },
        ]}>
        <Text style={[styles.word, { color: colors.text }]}>{word}</Text>
        <IpaText word={word} highlight={phoneme.ipa} style={styles.ipa} />
        <Text style={[styles.hint, { color: colors.accent }]}>▶︎ Tap to hear again</Text>
      </Pressable>

      <View style={styles.buttons}>
        <Pressable
          onPress={goBack}
          disabled={isFirst}
          accessibilityLabel="Previous word"
          style={({ pressed }) => [
            styles.button,
            styles.back,
            { backgroundColor: colors.tile, opacity: isFirst ? 0.4 : pressed ? 0.8 : 1 },
          ]}>
          <Text style={[styles.buttonText, { color: colors.text }]}>Back</Text>
        </Pressable>
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.button,
            styles.next,
            { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
          ]}>
          <Text style={[styles.buttonText, styles.nextText]}>{isLast ? 'Start over' : 'Next word'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: Spacing.lg, gap: Spacing.lg, justifyContent: 'center' },
  progress: { textAlign: 'center', fontSize: 15 },
  card: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl * 2,
    borderRadius: Radius.lg,
  },
  word: { fontSize: 44, fontWeight: '700' },
  ipa: { fontSize: 28 },
  hint: { fontSize: 14, marginTop: Spacing.sm },
  buttons: { flexDirection: 'row', gap: Spacing.sm },
  button: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  back: { flex: 1 },
  next: { flex: 2 },
  buttonText: { fontSize: 18, fontWeight: '600' },
  nextText: { color: '#FFFFFF' },
});
