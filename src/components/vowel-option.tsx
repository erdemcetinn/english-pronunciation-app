import { Pressable, StyleSheet, Text } from 'react-native';

import type { OptionState } from '@/components/answer-option';
import { SUCCESS_COLOR } from '@/constants/game';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Phoneme } from '@/types/phoneme';

interface VowelOptionProps {
  phoneme: Phoneme;
  state: OptionState;
  onPress: () => void;
}

/** A vowel choice: IPA symbol plus an example word; green/red after answering. */
export function VowelOption({ phoneme, state, onPress }: VowelOptionProps) {
  const colors = useTheme();
  const borderColor = state === 'correct' ? SUCCESS_COLOR : state === 'wrong' ? colors.warning : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Vowel ${phoneme.ipa} as in ${phoneme.examples[0]}`}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: pressed ? colors.tilePressed : colors.tile, borderColor },
      ]}>
      <Text style={[styles.ipa, { color: colors.text }]}>{phoneme.ipa}</Text>
      <Text style={[styles.example, { color: colors.textSecondary }]}>{phoneme.examples[0]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 3,
  },
  ipa: { fontSize: 34, fontWeight: '600' },
  example: { fontSize: 14 },
});
