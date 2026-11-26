import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { OptionState } from '@/components/answer-option';
import { ListenButton } from '@/components/listen-button';
import { ScoreHeader } from '@/components/score-header';
import { ToggleChip } from '@/components/toggle-chip';
import { VowelOption } from '@/components/vowel-option';
import { GAME_VOICES, SUCCESS_COLOR } from '@/constants/game';
import { Radius, Spacing } from '@/constants/theme';
import { getPhonemeById, PHONEMES } from '@/data/phonemes';
import { GAME_VOWEL_IDS, VOWEL_DISTRACTORS } from '@/data/vowel-distractors';
import { getIpaSegments, getPracticeWords } from '@/data/words';
import { useSeenWords } from '@/hooks/use-seen-words';
import { useTheme } from '@/hooks/use-theme';
import { INITIAL_SCORE, scoreAnswer } from '@/lib/listening-game';
import { playWord, prefetchWords } from '@/lib/play-word';
import { pickFresh } from '@/lib/pick-fresh';
import { shuffled, type SeenMap } from '@/lib/practice-session';
import { nextVowelRound, type VowelRound } from '@/lib/vowel-game';

const GAME_VOWELS = PHONEMES.filter((p) => GAME_VOWEL_IDS.includes(p.id));
// All vowel symbols (incl. unstressed ə/ɚ) so stress detection sees every vowel.
const VOWEL_SYMBOLS = new Set(
  PHONEMES.filter((p) => p.group === 'monophthong' || p.group === 'diphthong').map((p) => p.ipa),
);

const SEEN_LIST_ID = 'game-vowel';

/** Next round, preferring words the player hasn't seen yet. */
const newRound = (seen: SeenMap): VowelRound | null =>
  nextVowelRound({
    vowels: GAME_VOWELS,
    distractors: VOWEL_DISTRACTORS,
    shuffle: shuffled,
    wordsFor: getPracticeWords,
    segmentsFor: getIpaSegments,
    vowelSymbols: VOWEL_SYMBOLS,
    random: Math.random,
    pickWord: (words) => pickFresh(words, seen, Math.random),
  });

function optionState(id: string, round: VowelRound, answer: string | null): OptionState {
  if (!answer) return 'idle';
  if (id === round.vowelId) return 'correct';
  return id === answer ? 'wrong' : 'neutral';
}

export default function FindTheVowelScreen() {
  const colors = useTheme();
  const { seen, markSeen } = useSeenWords(SEEN_LIST_ID);
  const [round, setRound] = useState<VowelRound | null>(null);
  const [upcoming, setUpcoming] = useState<VowelRound | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(INITIAL_SCORE);
  const [isWordHidden, setIsWordHidden] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Start once the seen history has loaded, so the first rounds are fresh too.
  useEffect(() => {
    if (!seen || isStarted) return;
    const first = newRound(seen);
    setRound(first);
    // Treat the current word as seen so the upcoming round can't repeat it.
    setUpcoming(newRound(first ? { ...seen, [first.word]: Date.now() } : seen));
    setIsStarted(true);
  }, [seen, isStarted]);

  useEffect(() => {
    if (!round) return;
    void playWord(round.word, GAME_VOICES);
    markSeen(round.word);
  }, [round, markSeen]);

  useEffect(() => {
    if (upcoming) prefetchWords([upcoming.word], GAME_VOICES);
  }, [upcoming]);

  if (!isStarted) return <View style={[styles.center, { backgroundColor: colors.background }]} />;

  if (!round) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No words available.</Text>
      </View>
    );
  }

  const correctVowel = getPhonemeById(round.vowelId);
  const isCorrect = answer === round.vowelId;

  const choose = (id: string) => {
    if (answer) {
      // After answering, tapping a vowel plays its example word for comparison.
      const example = getPhonemeById(id)?.examples[0];
      if (example) void playWord(example, GAME_VOICES);
      return;
    }
    setAnswer(id);
    setScore(scoreAnswer(score, id === round.vowelId));
  };

  const goNext = () => {
    setRound(upcoming);
    setUpcoming(newRound(upcoming ? { ...seen, [upcoming.word]: Date.now() } : (seen ?? {})));
    setAnswer(null);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <ScoreHeader score={score} />
      <View style={styles.toggleRow}>
        <ToggleChip label="Hide word" isOn={isWordHidden} onToggle={() => setIsWordHidden(!isWordHidden)} />
      </View>

      <ListenButton onPress={() => void playWord(round.word, GAME_VOICES)} />

      <View style={styles.wordBox}>
        <Text style={[styles.word, { color: colors.text }]}>
          {isWordHidden && !answer ? '• • •' : round.word}
        </Text>
        <Text style={[styles.ipa, { color: colors.textSecondary }]}>
          /
          {round.segments.map((segment, i) =>
            i === round.blankIndex ? (
              <Text key={i} style={{ color: answer ? SUCCESS_COLOR : colors.accent, fontWeight: '700' }}>
                {answer ? segment : ' _ '}
              </Text>
            ) : (
              <Text key={i}>{segment}</Text>
            ),
          )}
          /
        </Text>
      </View>

      <Text style={[styles.question, { color: colors.text }]}>Which vowel is missing?</Text>
      <View style={styles.options}>
        {round.options.map((id) => {
          const phoneme = getPhonemeById(id);
          if (!phoneme) return null;
          return (
            <VowelOption key={id} phoneme={phoneme} state={optionState(id, round, answer)} onPress={() => choose(id)} />
          );
        })}
      </View>

      {answer && (
        <>
          <Text style={[styles.feedback, { color: isCorrect ? SUCCESS_COLOR : colors.warning }]}>
            {isCorrect ? 'Correct!' : `It was /${correctVowel?.ipa}/ as in "${correctVowel?.examples[0]}"`}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Tap a vowel to hear its example word</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, gap: Spacing.lg },
  toggleRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  wordBox: { alignItems: 'center', gap: Spacing.sm },
  word: { fontSize: 36, fontWeight: '700' },
  ipa: { fontSize: 30 },
  question: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  options: { flexDirection: 'row', gap: Spacing.sm },
  feedback: { textAlign: 'center', fontSize: 18, fontWeight: '700' },
  hint: { textAlign: 'center', fontSize: 13 },
  next: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
