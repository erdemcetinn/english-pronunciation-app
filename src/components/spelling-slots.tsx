import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SUCCESS_COLOR } from '@/constants/game';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SpellingSlotsProps {
  length: number;
  /** Capital letters picked so far. */
  picked: readonly string[];
  /** Index of the slot being filled now (highlighted). */
  activeIndex: number | null;
  /** After checking: true/false per slot; null while answering. */
  results: readonly boolean[] | null;
  /** Tapping the boxes removes the last letter. */
  onDeleteLast: () => void;
}

/** One underlined box per letter of the word. */
export function SpellingSlots({ length, picked, activeIndex, results, onDeleteLast }: SpellingSlotsProps) {
  const colors = useTheme();

  const lineColor = (index: number) => {
    if (results) return results[index] ? SUCCESS_COLOR : colors.warning;
    return index === activeIndex ? colors.accent : colors.textSecondary;
  };

  return (
    <Pressable onPress={onDeleteLast} disabled={!!results} accessibilityLabel={`${length} letter word`}>
      <View style={styles.row}>
        {Array.from({ length }, (_, index) => (
          <View key={index} style={[styles.slot, { borderBottomColor: lineColor(index) }]}>
            <Text style={[styles.letter, { color: colors.text }]}>{picked[index] ?? ''}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  slot: { width: 36, height: 52, borderBottomWidth: 3, alignItems: 'center', justifyContent: 'flex-end' },
  letter: { fontSize: 32, fontWeight: '700' },
});
