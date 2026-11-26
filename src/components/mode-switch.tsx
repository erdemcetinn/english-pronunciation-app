import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ModeSwitchProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Small segmented control for a header (e.g. Sounds | Letters). */
export function ModeSwitch<T extends string>({ options, value, onChange }: ModeSwitchProps<T>) {
  const colors = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.tile }]}>
      {options.map((option) => {
        const isOn = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isOn }}
            style={[styles.segment, isOn && { backgroundColor: colors.accent }]}>
            <Text style={[styles.text, { color: isOn ? '#FFFFFF' : colors.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: Radius.lg, padding: 2 },
  segment: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.lg },
  text: { fontSize: 13, fontWeight: '600' },
});
