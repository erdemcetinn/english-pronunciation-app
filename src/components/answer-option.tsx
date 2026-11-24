import { Pressable, StyleSheet, Text } from 'react-native';

import { IpaText } from '@/components/ipa-text';
import { SUCCESS_COLOR } from '@/constants/game';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** idle: not answered yet · correct: the played word · wrong: picked but wrong · neutral: the other word */
export type OptionState = 'idle' | 'correct' | 'wrong' | 'neutral';

interface AnswerOptionProps {
  word: string;
  state: OptionState;
  onPress: () => void;
}

/** One of the two choices; after answering it shows the IPA and turns green/red. */
export function AnswerOption({ word, state, onPress }: AnswerOptionProps) {
  const colors = useTheme();
  const isAnswered = state !== 'idle';
  const borderColor = state === 'correct' ? SUCCESS_COLOR : state === 'wrong' ? colors.warning : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={isAnswered ? `Play ${word}` : `Choose ${word}`}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: pressed ? colors.tilePressed : colors.tile, borderColor },
      ]}>
      <Text style={[styles.word, { color: colors.text }]}>{word}</Text>
      {isAnswered && <IpaText word={word} style={styles.ipa} />}
      {isAnswered && <Text style={[styles.hint, { color: colors.accent }]}>▶︎ tap to compare</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 140,
    borderRadius: Radius.lg,
    borderWidth: 3,
    padding: Spacing.md,
  },
  word: { fontSize: 30, fontWeight: '700' },
  ipa: { fontSize: 20 },
  hint: { fontSize: 12, marginTop: Spacing.xs },
});
