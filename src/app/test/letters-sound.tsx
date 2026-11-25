import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LetterOption, type LetterOptionState } from '@/components/letter-option';
import { ScoreHeader } from '@/components/score-header';
import { ToggleChip } from '@/components/toggle-chip';
import { GAME_VOICES, SUCCESS_COLOR } from '@/constants/game';
import { EXTEND_LABEL, ipaLabel, LETTER_KEYS, letterPool } from '@/constants/letters-game';
import { Radius, Spacing } from '@/constants/theme';
import { getLetter } from '@/data/letters';
import { useTheme } from '@/hooks/use-theme';
import { nextLetterRound, type LetterRound } from '@/lib/letter-game';
import { INITIAL_SCORE, scoreAnswer } from '@/lib/listening-game';
import { playLetter, prefetchAllVoices } from '@/lib/play-word';
import { shuffled } from '@/lib/practice-session';

const OPTION_COUNT = 3;

const newRound = (pool: readonly string[], previous: string | null): LetterRound =>
  nextLetterRound({ pool, previous, optionCount: OPTION_COUNT, shuffle: shuffled, random: Math.random });

function optionState(letter: string, round: LetterRound, selected: string | null, isChecked: boolean): LetterOptionState {
  if (!isChecked) return letter === selected ? 'selected' : 'idle';
  if (letter === round.target) return 'correct';
  return letter === selected ? 'wrong' : 'neutral';
}

export default function LetterSoundScreen() {
  const colors = useTheme();
  const [isExtended, setIsExtended] = useState(false);
  const [round, setRound] = useState(() => newRound(letterPool(false), null));
  const [selected, setSelected] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(INITIAL_SCORE);

  useEffect(() => prefetchAllVoices(LETTER_KEYS), []);

  const startRound = (pool: readonly string[], previous: string | null) => {
    setRound(newRound(pool, previous));
    setSelected(null);
    setIsChecked(false);
  };

  const pressOption = (letter: string) => {
    void playLetter(letter, GAME_VOICES);
    if (!isChecked) setSelected(letter);
  };

  const check = () => {
    if (!selected) return;
    setIsChecked(true);
    setScore(scoreAnswer(score, selected === round.target));
  };

  const toggleExtended = () => {
    setIsExtended(!isExtended);
    startRound(letterPool(!isExtended), null);
  };

  const isCorrect = selected === round.target;
  const target = getLetter(round.target);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <ToggleChip label={EXTEND_LABEL} isOn={isExtended} onToggle={toggleExtended} />
      </View>
      <ScoreHeader score={score} />

      <Text style={[styles.letter, { color: colors.text }]}>{target.letter}</Text>
      <Text style={[styles.question, { color: colors.textSecondary }]}>
        Tap each sound to listen. Which one is the name of this letter?
      </Text>

      <View style={styles.options}>
        {round.options.map((letter, index) => (
          <LetterOption
            key={letter}
            title={isChecked ? letter : `▶︎ ${index + 1}`}
            subtitle={isChecked ? ipaLabel(getLetter(letter).ipa) : undefined}
            state={optionState(letter, round, selected, isChecked)}
            onPress={() => pressOption(letter)}
            accessibilityLabel={isChecked ? `Play ${letter}` : `Play sound ${index + 1}`}
          />
        ))}
      </View>

      {isChecked && (
        <Text style={[styles.feedback, { color: isCorrect ? SUCCESS_COLOR : colors.warning }]}>
          {isCorrect ? 'Correct!' : `${target.letter} is ${ipaLabel(target.ipa)}`}
        </Text>
      )}

      <Pressable
        onPress={isChecked ? () => startRound(letterPool(isExtended), round.target) : check}
        disabled={!isChecked && !selected}
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: colors.accent, opacity: !isChecked && !selected ? 0.4 : pressed ? 0.8 : 1 },
        ]}>
        <Text style={styles.actionText}>{isChecked ? 'Next' : 'Check'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  letter: { fontSize: 96, fontWeight: '800', textAlign: 'center' },
  question: { textAlign: 'center', fontSize: 16 },
  options: { flexDirection: 'row', gap: Spacing.sm },
  feedback: { textAlign: 'center', fontSize: 20, fontWeight: '700' },
  action: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
