import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IpaText } from '@/components/ipa-text';
import { ScoreHeader } from '@/components/score-header';
import { SpellingSlots } from '@/components/spelling-slots';
import { SUCCESS_COLOR } from '@/constants/game';
import { Radius, Spacing } from '@/constants/theme';
import { getLetter } from '@/data/letters';
import { ALL_WORDS } from '@/data/words';
import { usePlaySequence } from '@/hooks/use-play-sequence';
import { useSeenWords } from '@/hooks/use-seen-words';
import { useTheme } from '@/hooks/use-theme';
import { INITIAL_SCORE, scoreAnswer } from '@/lib/listening-game';
import { pickFresh } from '@/lib/pick-fresh';
import { playLetter, playWord, prefetchWords } from '@/lib/play-word';
import type { SeenMap } from '@/lib/practice-session';
import { checkSpelling, isSpellable, normalizeTyped, type SpellingResult } from '@/lib/spelling-game';
import { VOICES, type VoiceMode } from '@/lib/voice-settings';

const SEEN_LIST_ID = 'game-spelling';
const WORD_LIMITS = { minLength: 3, maxLength: 7 };
const SPELL_STEP_MS = 900;
const SPELLABLE_WORDS = ALL_WORDS.filter((word) => isSpellable(word, WORD_LIMITS));

interface SpellingRound {
  word: string;
  /** One speaker spells the whole word, like a real person would. */
  voice: VoiceMode;
}

function newRound(seen: SeenMap): SpellingRound {
  const word = pickFresh(SPELLABLE_WORDS, seen, Math.random) ?? SPELLABLE_WORDS[0];
  const voiceId = VOICES[Math.floor(Math.random() * VOICES.length)].id;
  return { word, voice: { kind: 'voice', voiceId } };
}

export default function SpellingScreen() {
  const colors = useTheme();
  const { seen, markSeen } = useSeenWords(SEEN_LIST_ID);
  const [round, setRound] = useState<SpellingRound | null>(null);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<SpellingResult | null>(null);
  const [score, setScore] = useState(INITIAL_SCORE);

  const voice = round?.voice;
  const playOne = useCallback((letter: string) => voice && void playLetter(letter, voice), [voice]);
  const sequence = usePlaySequence(playOne, SPELL_STEP_MS);
  const letters = useMemo(() => [...(round?.word ?? '')].map((l) => l.toUpperCase()), [round]);

  // Start once the seen history has loaded, so the first words are fresh too.
  useEffect(() => {
    if (seen && !round) setRound(newRound(seen));
  }, [seen, round]);

  const { start } = sequence;
  useEffect(() => {
    if (!round) return;
    markSeen(round.word);
    prefetchWords([...letters.map((l) => getLetter(l).key), round.word], round.voice);
    start(letters);
  }, [round, letters, start, markSeen]);

  if (!round) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  const isComplete = typed.length === round.word.length;

  const check = () => {
    if (!isComplete || result) return;
    const checked = checkSpelling(typed, round.word);
    sequence.stop();
    setResult(checked);
    setScore(scoreAnswer(score, checked.isCorrect));
    void playWord(round.word, round.voice);
  };

  const goNext = () => {
    setRound(newRound(seen ?? {}));
    setTyped('');
    setResult(null);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <ScoreHeader score={score} />
      <Text style={[styles.question, { color: colors.textSecondary }]}>
        Listen to the letters and type the word. {round.word.length} letters.
      </Text>

      <SpellingSlots
        length={round.word.length}
        typed={typed}
        onChangeText={(text) => setTyped(normalizeTyped(text, round.word.length))}
        onSubmit={check}
        activeIndex={sequence.playingIndex}
        results={result?.slots ?? null}
      />

      <Pressable onPress={() => start(letters)} accessibilityLabel="Spell the word again">
        <Text style={[styles.replay, { color: colors.accent }]}>▶︎ Spell again</Text>
      </Pressable>

      {result && (
        <Pressable onPress={() => void playWord(round.word, round.voice)} style={styles.answer}>
          <Text style={[styles.feedback, { color: result.isCorrect ? SUCCESS_COLOR : colors.warning }]}>
            {result.isCorrect ? 'Correct!' : `It was "${round.word}"`}
          </Text>
          <IpaText word={round.word} style={styles.ipa} />
          <Text style={[styles.hint, { color: colors.accent }]}>▶︎ tap to hear the word</Text>
        </Pressable>
      )}

      <Pressable
        onPress={result ? goNext : check}
        disabled={!result && !isComplete}
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: colors.accent, opacity: !result && !isComplete ? 0.4 : pressed ? 0.8 : 1 },
        ]}>
        <Text style={styles.actionText}>{result ? 'Next' : 'Check'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, gap: Spacing.lg },
  question: { textAlign: 'center', fontSize: 16 },
  replay: { textAlign: 'center', fontSize: 16, fontWeight: '600' },
  answer: { alignItems: 'center', gap: Spacing.xs },
  feedback: { fontSize: 20, fontWeight: '700' },
  ipa: { fontSize: 20 },
  hint: { fontSize: 12 },
  action: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
