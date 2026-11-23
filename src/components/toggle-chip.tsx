import { Pressable, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ToggleChipProps {
  label: string;
  isOn: boolean;
  onToggle: () => void;
}

export function ToggleChip({ label, isOn, onToggle }: ToggleChipProps) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOn }}
      style={[styles.chip, { backgroundColor: isOn ? colors.accent : colors.tile }]}>
      <Text style={[styles.text, { color: isOn ? '#FFFFFF' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.lg },
  text: { fontSize: 14, fontWeight: '600' },
});
