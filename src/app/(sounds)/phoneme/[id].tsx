import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GROUP_LABELS } from '@/constants/groups';
import { Radius, Spacing } from '@/constants/theme';
import { getPhonemeById } from '@/data/phonemes';
import { useTheme } from '@/hooks/use-theme';
import { speakWord } from '@/lib/speech';

export default function PhonemeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const phoneme = getPhonemeById(id);

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
          <Text style={[styles.word, { color: colors.text }]}>{word}</Text>
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
                <Link key={otherId} href={{ pathname: '/phoneme/[id]', params: { id: otherId } }} asChild>
                  <Pressable style={[styles.chip, { backgroundColor: colors.tile }]}>
                    <Text style={[styles.chipText, { color: colors.text }]}>
                      {other.ipa} <Text style={{ color: colors.textSecondary }}>{other.examples[0]}</Text>
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
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
  play: { fontSize: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.lg },
  chipText: { fontSize: 17 },
});
