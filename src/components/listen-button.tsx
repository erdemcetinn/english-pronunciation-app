import { Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 136;

export function ListenButton({ onPress }: { onPress: () => void }) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Play the word again"
      style={({ pressed }) => [styles.button, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}>
      <Text style={styles.icon}>▶︎</Text>
      <Text style={styles.text}>Listen again</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  icon: { color: '#FFFFFF', fontSize: 40 },
  text: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
