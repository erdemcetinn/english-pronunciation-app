import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { SUCCESS_COLOR } from '@/constants/game';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** idle · correct · wrong (picked but wrong) · neutral (other options after answering) */
export type LetterOptionState = 'idle' | 'correct' | 'wrong' | 'neutral';

interface LetterOptionProps {
  title: string;
  subtitle?: string;
  state: LetterOptionState;
  onPress: () => void;
  accessibilityLabel: string;
  /** Smaller tile for big letter grids. */
  isCompact?: boolean;
  /** Dimmed and not tappable (e.g. a letter tile already used). */
  isDisabled?: boolean;
  style?: ViewStyle;
}

/** A big tappable letter tile (speed game answers, spelling letter bank). */
export function LetterOption({
  title,
  subtitle,
  state,
  onPress,
  accessibilityLabel,
  isCompact = false,
  isDisabled = false,
  style,
}: LetterOptionProps) {
  const colors = useTheme();
  const borderColor = {
    idle: 'transparent',
    neutral: 'transparent',
    correct: SUCCESS_COLOR,
    wrong: colors.warning,
  }[state];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.option,
        isCompact && styles.compact,
        isDisabled && styles.disabled,
        { backgroundColor: pressed ? colors.tilePressed : colors.tile, borderColor },
        style,
      ]}>
      <Text style={[styles.title, isCompact && styles.compactTitle, { color: colors.text }]}>{title}</Text>
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
  compact: { minHeight: 64 },
  disabled: { opacity: 0.25 },
  title: { fontSize: 40, fontWeight: '700' },
  compactTitle: { fontSize: 28 },
  subtitle: { fontSize: 20 },
});
