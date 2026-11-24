import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IpaText } from '@/components/ipa-text';
import { ToggleChip } from '@/components/toggle-chip';
import { VoiceChip } from '@/components/voice-chip';
import { Radius, Spacing } from '@/constants/theme';
import { getPhonemeById } from '@/data/phonemes';
import { getPracticeWords } from '@/data/words';
import { useSeenWords } from '@/hooks/use-seen-words';
import { useTheme } from '@/hooks/use-theme';
import { buildSession } from '@/lib/practice-session';
import { playWord, prefetchWords } from '@/lib/play-word';

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const phoneme = getPhonemeById(id);
  const { seen, markSeen } = useSeenWords(id);
  const [session, setSession] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [isWordHidden, setIsWordHidden] = useState(false);
  const [isIpaHidden, setIsIpaHidden] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Build the set once, as soon as the seen history has loaded.
  useEffect(() => {
    if (seen && !session) setSession(buildSession(getPracticeWords(id), seen));
  }, [id, seen, session]);

  const word = session?.[index];

  useEffect(() => {
    if (!word) return;
    void playWord(word);
    markSeen(word);
    setIsRevealed(false);
  }, [word, markSeen]);

  // Download the next two words in the background so "Next" plays instantly.
  useEffect(() => {
    if (session) prefetchWords(session.slice(index + 1, index + 3));
  }, [session, index]);

  if (!phoneme) return <Message text="Sound not found." />;
  if (!session) return <Message loading />;
  if (!word) return <Message text="No practice words for this sound." />;

  const isFirst = index === 0;
  const isLast = index === session.length - 1;
  const goBack = () => setIndex(Math.max(0, index - 1));
  const goNext = () => {
    if (!isLast) return setIndex(index + 1);
    setSession(buildSession(getPracticeWords(id), seen ?? {}));
    setIndex(0);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: `Practice /${phoneme.ipa}/` }} />

      <View style={styles.topRow}>
        <Text style={[styles.progress, { color: colors.textSecondary }]}>
          {index + 1} / {session.length}
        </Text>
        <View style={styles.toggles}>
          <VoiceChip />
          <ToggleChip label="Hide word" isOn={isWordHidden} onToggle={() => setIsWordHidden(!isWordHidden)} />
          <ToggleChip label="Hide IPA" isOn={isIpaHidden} onToggle={() => setIsIpaHidden(!isIpaHidden)} />
        </View>
      </View>

      <Pressable
        onPress={() => void playWord(word)}
        accessibilityLabel={`Play ${word} again`}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: pressed ? colors.tilePressed : colors.tile },
        ]}>
        {isWordHidden && !isRevealed ? (
          <Text style={[styles.word, { color: colors.textSecondary }]}>?</Text>
        ) : (
          <Text style={[styles.word, { color: colors.text }]}>{word}</Text>
        )}
        {isIpaHidden && !isRevealed ? (
          <Text style={[styles.ipa, { color: colors.textSecondary }]}>/ ? /</Text>
        ) : (
          <IpaText word={word} highlight={phoneme.ipa} style={styles.ipa} />
        )}
        <Text style={[styles.hint, { color: colors.accent }]}>▶︎ Tap to hear again</Text>
      </Pressable>

      {(isWordHidden || isIpaHidden) && (
        <Pressable onPress={() => setIsRevealed(!isRevealed)} style={styles.reveal}>
          <Text style={[styles.revealText, { color: colors.accent }]}>
            {isRevealed ? 'Hide answer' : 'Show answer'}
          </Text>
        </Pressable>
      )}

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
          <Text style={[styles.buttonText, styles.nextText]}>{isLast ? 'New set' : 'Next word'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Message({ text, loading }: { text?: string; loading?: boolean }) {
  const colors = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      {loading ? <ActivityIndicator /> : <Text style={{ color: colors.text }}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progress: { fontSize: 15, paddingTop: Spacing.xs },
  toggles: { alignItems: 'flex-end', gap: Spacing.sm },
  reveal: { alignSelf: 'center', padding: Spacing.sm },
  revealText: { fontSize: 16, fontWeight: '600' },
  card: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
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
