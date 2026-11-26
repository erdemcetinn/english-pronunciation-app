import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SUCCESS_COLOR } from '@/constants/game';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SpellingSlotsProps {
  length: number;
  typed: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  /** Index of the letter being spelled out right now (highlighted). */
  activeIndex: number | null;
  /** After checking: true/false per slot; null while typing. */
  results: readonly boolean[] | null;
}

/** One underlined box per letter. Typing goes to a hidden input laid over the boxes. */
export function SpellingSlots({ length, typed, onChangeText, onSubmit, activeIndex, results }: SpellingSlotsProps) {
  const colors = useTheme();
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const lineColor = (index: number) => {
    if (results) return results[index] ? SUCCESS_COLOR : colors.warning;
    if (index === activeIndex) return colors.accent;
    return index === typed.length ? colors.text : colors.textSecondary;
  };

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel={`${length} letter word, tap to type`}>
      <View style={styles.row}>
        {Array.from({ length }, (_, index) => (
          <View key={index} style={[styles.slot, { borderBottomColor: lineColor(index) }]}>
            <Text style={[styles.letter, { color: colors.text }]}>{typed[index] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={input}
        value={typed}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        editable={!results}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        caretHidden
        returnKeyType="done"
        submitBehavior="submit"
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  slot: { width: 36, height: 52, borderBottomWidth: 3, alignItems: 'center', justifyContent: 'flex-end' },
  letter: { fontSize: 32, fontWeight: '700' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
