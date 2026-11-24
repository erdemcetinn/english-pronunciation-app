import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnswerOption, type OptionState } from '@/components/answer-option';
import { Radius, Spacing } from '@/constants/theme';
import { MINIMAL_PAIRS } from '@/data/minimal-pairs';
import { getPhonemeById } from '@/data/phonemes';
import { useTheme } from '@/hooks/use-theme';
import { INITIAL_SCORE, nextRound, scoreAnswer, type Round } from '@/lib/listening-game';
import { playWord, prefetchWords } from '@/lib/play-word';
import type { VoiceMode } from '@/lib/voice-settings';

// The game always rotates through all Polly speakers: hearing many voices trains the ear faster.
const GAME_VOICES: VoiceMode = { kind: 'random' };

const newRound = (previous: Round | null) => nextRound(MINIMAL_PAIRS, previous?.pair ?? null, Math.random);

function contrastLabel(round: Round): string {
  const [a, b] = round.pair.contrast.map((id) => getPhonemeById(id)?.ipa ?? id);
  return `/${a}/ vs /${b}/`;
}

function optionState(word: string, round: Round, answer: string | null): OptionState {
  if (!answer) return 'idle';
  if (word === round.target) return 'correct';
  return word === answer ? 'wrong' : 'neutral';
}

export default function TestScreen() {
  const colors = useTheme();
  const [round, setRound] = useState<Round>(() => newRound(null));
  const [upcoming, setUpcoming] = useState<Round>(() => newRound(round));
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(INITIAL_SCORE);

  useEffect(() => {
    void playWord(round.target, GAME_VOICES);
  }, [round]);

  useEffect(() => {
    prefetchWords([upcoming.target], GAME_VOICES);
  }, [upcoming]);

  const choose = (word: string) => {
    if (answer) return void playWord(word, GAME_VOICES);
    setAnswer(word);
    setScore(scoreAnswer(score, word === round.target));
  };

  const goNext = () => {
    setRound(upcoming);
    setUpcoming(newRound(upcoming));
    setAnswer(null);
  };

  const isCorrect = answer === round.target;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: colors.text }]}>
          {score.correct} / {score.total}
        </Text>
        <Text style={[styles.streak, { color: colors.textSecondary }]}>
          Streak {score.streak} · Best {score.bestStreak}
        </Text>
      </View>

      <Text style={[styles.contrast, { color: colors.textSecondary }]}>{contrastLabel(round)}</Text>

      <Pressable
        onPress={() => void playWord(round.target, GAME_VOICES)}
        accessibilityLabel="Play the word again"
        style={({ pressed }) => [styles.listen, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}>
        <Text style={styles.listenIcon}>▶︎</Text>
        <Text style={styles.listenText}>Listen again</Text>
      </Pressable>

      <Text style={[styles.question, { color: colors.text }]}>Which word did you hear?</Text>

      <View style={styles.options}>
        {round.options.map((word) => (
          <AnswerOption key={word} word={word} state={optionState(word, round, answer)} onPress={() => choose(word)} />
        ))}
      </View>

      {answer && (
        <>
          <Text style={[styles.feedback, { color: isCorrect ? '#30A46C' : colors.warning }]}>
            {isCorrect ? 'Correct!' : `It was "${round.target}"`}
          </Text>
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [styles.next, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.nextText}>Next</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  score: { fontSize: 28, fontWeight: '700' },
  streak: { fontSize: 14 },
  contrast: { textAlign: 'center', fontSize: 16 },
  listen: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  listenIcon: { color: '#FFFFFF', fontSize: 40 },
  listenText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  question: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  options: { flexDirection: 'row', gap: Spacing.md },
  feedback: { textAlign: 'center', fontSize: 20, fontWeight: '700' },
  next: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
