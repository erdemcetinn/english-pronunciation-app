import { Pressable, StyleSheet, Text } from 'react-native';

import { SUCCESS_COLOR } from '@/constants/game';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** idle · selected (picked, not checked yet) · correct · wrong (picked but wrong) · neutral (other options after answering) */
export type LetterOptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'neutral';

interface LetterOptionProps {
  title: string;
  subtitle?: string;
  state: LetterOptionState;
  onPress: () => void;
  accessibilityLabel: string;
}

/** A big tappable answer: a letter (speed mode) or a sound button (sound mode). */
export function LetterOption({ title, subtitle, state, onPress, accessibilityLabel }: LetterOptionProps) {
  const colors = useTheme();
  const borderColor = {
    idle: 'transparent',
    neutral: 'transparent',
    selected: colors.accent,
    correct: SUCCESS_COLOR,
    wrong: colors.warning,
  }[state];

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.option, { backgroundColor: pressed ? colors.tilePressed : colors.tile, borderColor }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 110,
    borderRadius: Radius.lg,
    borderWidth: 3,
    padding: Spacing.sm,
  },
  title: { fontSize: 40, fontWeight: '700' },
  subtitle: { fontSize: 20 },
});
