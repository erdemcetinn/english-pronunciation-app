import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnswerOption, type OptionState } from '@/components/answer-option';
import { ListenButton } from '@/components/listen-button';
import { ScoreHeader } from '@/components/score-header';
import { GAME_VOICES, SUCCESS_COLOR } from '@/constants/game';
import { Radius, Spacing } from '@/constants/theme';
import { MINIMAL_PAIRS } from '@/data/minimal-pairs';
import { getPhonemeById } from '@/data/phonemes';
import { useSeenWords } from '@/hooks/use-seen-words';
import { useTheme } from '@/hooks/use-theme';
import { INITIAL_SCORE, nextRound, pairKey, scoreAnswer, type Round } from '@/lib/listening-game';
import { pickFresh } from '@/lib/pick-fresh';
import type { SeenMap } from '@/lib/practice-session';
import { playWord, prefetchWords } from '@/lib/play-word';
import { recordSkill } from '@/lib/skill-store';

const SEEN_LIST_ID = 'game-pairs';

/** Next round, preferring pairs the player hasn't seen yet. */
const newRound = (previous: Round | null, seen: SeenMap) =>
  nextRound(MINIMAL_PAIRS, previous?.pair ?? null, Math.random, (keys) => pickFresh(keys, seen, Math.random));

function contrastLabel(round: Round): string {
  const [a, b] = round.pair.contrast.map((id) => getPhonemeById(id)?.ipa ?? id);
  return `/${a}/ vs /${b}/`;
}

/** Phoneme id that makes `word` different from the other word in its pair. */
const soundOf = (word: string, round: Round) =>
  word === round.pair.a ? round.pair.contrast[0] : round.pair.contrast[1];

function optionState(word: string, round: Round, answer: string | null): OptionState {
  if (!answer) return 'idle';
  if (word === round.target) return 'correct';
  return word === answer ? 'wrong' : 'neutral';
}

export default function WordPairsScreen() {
  const colors = useTheme();
  const { seen, markSeen } = useSeenWords(SEEN_LIST_ID);
  const [round, setRound] = useState<Round | null>(null);
  const [upcoming, setUpcoming] = useState<Round | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(INITIAL_SCORE);

  // Start once the seen history has loaded, so the first rounds are fresh too.
  useEffect(() => {
    if (!seen || round) return;
    const first = newRound(null, seen);
    setRound(first);
    setUpcoming(newRound(first, seen));
  }, [seen, round]);

  useEffect(() => {
    if (!round) return;
    void playWord(round.target, GAME_VOICES);
    markSeen(pairKey(round.pair));
  }, [round, markSeen]);

  useEffect(() => {
    if (upcoming) prefetchWords([upcoming.target], GAME_VOICES);
  }, [upcoming]);

  if (!round || !upcoming) return <View style={[styles.center, { backgroundColor: colors.background }]} />;

  const choose = (word: string) => {
    if (answer) return void playWord(word, GAME_VOICES);
    const isCorrect = word === round.target;
    setAnswer(word);
    setScore(scoreAnswer(score, isCorrect));
    recordSkill('sounds', soundOf(round.target, round), {
      isCorrect,
      chosen: isCorrect ? undefined : soundOf(word, round),
    });
  };

  const goNext = () => {
    setRound(upcoming);
    setUpcoming(newRound(upcoming, seen ?? {}));
    setAnswer(null);
  };

  const isCorrect = answer === round.target;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <ScoreHeader score={score} />

      <Text style={[styles.contrast, { color: colors.textSecondary }]}>{contrastLabel(round)}</Text>

      <ListenButton onPress={() => void playWord(round.target, GAME_VOICES)} />

      <Text style={[styles.question, { color: colors.text }]}>Which word did you hear?</Text>

      <View style={styles.options}>
        {round.options.map((word) => (
          <AnswerOption key={word} word={word} state={optionState(word, round, answer)} onPress={() => choose(word)} />
        ))}
      </View>

      {answer && (
        <>
          <Text style={[styles.feedback, { color: isCorrect ? SUCCESS_COLOR : colors.warning }]}>
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
  center: { flex: 1 },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  contrast: { textAlign: 'center', fontSize: 16 },
  question: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  options: { flexDirection: 'row', gap: Spacing.md },
  feedback: { textAlign: 'center', fontSize: 20, fontWeight: '700' },
  next: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
