import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PhonemeTile } from '@/components/phoneme-tile';
import { GROUP_LABELS } from '@/constants/groups';
import { Spacing } from '@/constants/theme';
import { GROUP_ORDER, getPhonemesByGroup } from '@/data/phonemes';
import { useTheme } from '@/hooks/use-theme';

export default function SoundsScreen() {
  const colors = useTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}>
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
          Not in Turkish, practice these first
        </Text>
      </View>
      {GROUP_ORDER.map((group) => (
        <View key={group} style={styles.section}>
          <Text style={[styles.heading, { color: colors.text }]}>{GROUP_LABELS[group]}</Text>
          <View style={styles.grid}>
            {getPhonemesByGroup(group).map((phoneme) => (
              <PhonemeTile key={phoneme.id} phoneme={phoneme} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, gap: Spacing.lg },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendText: { fontSize: 13 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  section: { gap: Spacing.sm },
  heading: { fontSize: 20, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
