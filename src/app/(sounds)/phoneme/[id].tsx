import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IpaText } from '@/components/ipa-text';
import { GROUP_LABELS } from '@/constants/groups';
import { Radius, Spacing } from '@/constants/theme';
import { getPhonemeById } from '@/data/phonemes';
import { getPracticeWords } from '@/data/words';
import { useSeenWords } from '@/hooks/use-seen-words';
import { useTheme } from '@/hooks/use-theme';
import type { SeenMap } from '@/lib/practice-session';
import { speakWord } from '@/lib/speech';

export default function PhonemeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const router = useRouter();
  const phoneme = getPhonemeById(id);
  const { seen } = useSeenWords(id);

  if (!phoneme) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Sound not found.</Text>
      </View>
    );
  }

  const subtitle = [GROUP_LABELS[phoneme.group], phoneme.subgroup].filter(Boolean).join(' · ');

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `/${phoneme.ipa}/` }} />

      <View style={styles.hero}>
        <Text style={[styles.ipa, { color: colors.text }]}>{phoneme.ipa}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        {phoneme.notInTurkish && (
          <Text style={[styles.badge, { color: colors.warning, borderColor: colors.warning }]}>
            Not in Turkish
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => router.push({ pathname: '/practice/[id]', params: { id: phoneme.id } })}
        style={({ pressed }) => [styles.practice, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}>
        <Text style={styles.practiceText}>Practice this sound</Text>
      </Pressable>
      {seen && (
        <Text style={[styles.seenCount, { color: colors.textSecondary }]}>
          {countSeen(seen, getPracticeWords(phoneme.id))} / {getPracticeWords(phoneme.id).length} words seen
        </Text>
      )}

      <Text style={[styles.heading, { color: colors.text }]}>Examples</Text>
      {phoneme.examples.map((word) => (
        <Pressable
          key={word}
          onPress={() => speakWord(word)}
          accessibilityLabel={`Play ${word}`}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: pressed ? colors.tilePressed : colors.tile },
          ]}>
          <View>
            <Text style={[styles.word, { color: colors.text }]}>{word}</Text>
            <IpaText word={word} highlight={phoneme.ipa} style={styles.rowIpa} />
          </View>
          <Text style={[styles.play, { color: colors.accent }]}>▶︎</Text>
        </Pressable>
      ))}

      {phoneme.confusedWith.length > 0 && (
        <>
          <Text style={[styles.heading, { color: colors.text }]}>Often confused with</Text>
          <View style={styles.chips}>
            {phoneme.confusedWith.map((otherId) => {
              const other = getPhonemeById(otherId);
              if (!other) return null;
              return (
                <Pressable
                  key={otherId}
                  onPress={() => router.push({ pathname: '/phoneme/[id]', params: { id: otherId } })}
                  style={[styles.chip, { backgroundColor: colors.tile }]}>
                  <Text style={[styles.chipText, { color: colors.text }]}>
                    {other.ipa} <Text style={{ color: colors.textSecondary }}>{other.examples[0]}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function countSeen(seen: SeenMap, pool: readonly string[]): number {
  return pool.filter((word) => word in seen).length;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, gap: Spacing.sm },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  ipa: { fontSize: 72, fontWeight: '600' },
  subtitle: { fontSize: 15, textTransform: 'capitalize' },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  heading: { fontSize: 18, fontWeight: '700', marginTop: Spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  word: { fontSize: 20 },
  rowIpa: { fontSize: 16, marginTop: 2 },
  practice: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  seenCount: { textAlign: 'center', fontSize: 13 },
  practiceText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  play: { fontSize: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.lg },
  chipText: { fontSize: 17 },
});
