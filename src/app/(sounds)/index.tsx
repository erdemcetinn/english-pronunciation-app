import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ModeSwitch } from '@/components/mode-switch';
import { PhonemeTile } from '@/components/phoneme-tile';
import { ScoreTile } from '@/components/score-tile';
import { GROUP_LABELS } from '@/constants/groups';
import { ipaLabel } from '@/constants/letters-game';
import { Spacing } from '@/constants/theme';
import { LETTERS } from '@/data/letters';
import { GROUP_ORDER, getPhonemesByGroup } from '@/data/phonemes';
import { useTheme } from '@/hooks/use-theme';
import { letterScore } from '@/lib/skill-score';
import { useSkillLog, type SkillKind } from '@/lib/skill-store';

const MODES: readonly { value: SkillKind; label: string }[] = [
  { value: 'sounds', label: 'Sounds' },
  { value: 'letters', label: 'Letters' },
];

export default function SoundsScreen() {
  const colors = useTheme();
  const [mode, setMode] = useState<SkillKind>('sounds');

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: mode === 'sounds' ? 'Sounds' : 'Letters',
          headerLeft: () => <ModeSwitch options={MODES} value={mode} onChange={setMode} />,
        }}
      />
      {mode === 'sounds' ? <SoundMap /> : <LetterMap />}
    </ScrollView>
  );
}

function SoundMap() {
  const colors = useTheme();
  const log = useSkillLog('sounds');
  return (
    <>
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
          Not in Turkish, practice these first. Scores come from Word pairs and Find the vowel.
        </Text>
      </View>
      {GROUP_ORDER.map((group) => (
        <View key={group} style={styles.section}>
          <Text style={[styles.heading, { color: colors.text }]}>{GROUP_LABELS[group]}</Text>
          <View style={styles.grid}>
            {getPhonemesByGroup(group).map((phoneme) => (
              <PhonemeTile key={phoneme.id} phoneme={phoneme} attempts={log[phoneme.id]} />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

function LetterMap() {
  const colors = useTheme();
  const router = useRouter();
  const log = useSkillLog('letters');
  return (
    <>
      <Text style={[styles.legendText, { color: colors.textSecondary }]}>
        How well you recognize letter names, from Letter names: speed and Spelling. 80% speed + 20% accuracy once a
        letter has 5 timed answers, accuracy only before that.
      </Text>
      <View style={styles.grid}>
        {LETTERS.map(({ letter, ipa }) => {
          const attempts = log[letter] ?? [];
          return (
            <ScoreTile
              key={letter}
              title={letter}
              subtitle={ipaLabel(ipa)}
              score={letterScore(attempts)}
              attemptCount={attempts.length}
              onPress={() => router.push({ pathname: '/letter/[letter]', params: { letter } })}
              accessibilityLabel={`Letter ${letter}`}
            />
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, gap: Spacing.lg },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendText: { fontSize: 13, flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  section: { gap: Spacing.sm },
  heading: { fontSize: 20, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
