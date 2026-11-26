import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IpaText } from '@/components/ipa-text';
import { LetterOption } from '@/components/letter-option';
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
import { playLetter, playWord, preloadClips, prefetchWords } from '@/lib/play-word';
import { shuffled, type SeenMap } from '@/lib/practice-session';
import { buildLetterBank, checkSpelling, isSpellable, type LetterTile, type SpellingResult } from '@/lib/spelling-game';
import { VOICES, type VoiceMode } from '@/lib/voice-settings';

const SEEN_LIST_ID = 'game-spelling';
const WORD_LIMITS = { minLength: 3, maxLength: 7 };
/** Extra letters in the bank, so the word can't be guessed from the tiles without listening. */
const DECOY_COUNT = 3;
const SPELL_STEP_MS = 900;
/** Extra bottom space: keeps the content centered but a little above the middle. */
const LIFT = 96;
const TILE_WIDTH = '18%';
const SPELLABLE_WORDS = ALL_WORDS.filter((word) => isSpellable(word, WORD_LIMITS));

interface SpellingRound {
  word: string;
  /** Capital letters of the word, in order. */
  letters: string[];
  /** Tiles to pick from, in screen order. */
  bank: LetterTile[];
  /** One speaker spells the whole word, like a real person would. */
  voiceId: string;
  voice: VoiceMode;
}

function newRound(seen: SeenMap): SpellingRound {
  const word = pickFresh(SPELLABLE_WORDS, seen, Math.random) ?? SPELLABLE_WORDS[0];
  const voiceId = VOICES[Math.floor(Math.random() * VOICES.length)].id;
  return {
    word,
    letters: [...word.toUpperCase()],
    bank: shuffled(buildLetterBank(word, { decoyCount: DECOY_COUNT, shuffle: shuffled })),
    voiceId,
    voice: { kind: 'voice', voiceId },
  };
}

export default function SpellingScreen() {
  const colors = useTheme();
  const { seen, markSeen } = useSeenWords(SEEN_LIST_ID);
  const [round, setRound] = useState<SpellingRound | null>(null);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<SpellingResult | null>(null);
  const [score, setScore] = useState(INITIAL_SCORE);
  /** The word whose letter clips are on the phone; letters only play after that. */
  const [readyWord, setReadyWord] = useState<string | null>(null);

  const voice = round?.voice;
  const playOne = useCallback((letter: string) => voice && void playLetter(letter, voice), [voice]);
  const sequence = usePlaySequence(playOne, SPELL_STEP_MS);
  const { start } = sequence;
  const letters = useMemo(() => round?.letters ?? [], [round]);

  // Start once the seen history has loaded, so the first words are fresh too.
  useEffect(() => {
    if (seen && !round) setRound(newRound(seen));
  }, [seen, round]);

  useEffect(() => {
    if (!round) return;
    let isActive = true;
    markSeen(round.word);
    prefetchWords([round.word], round.voice);
    void preloadClips(
      round.letters.map((l) => getLetter(l).key),
      round.voiceId,
    ).then(() => {
      if (isActive) setReadyWord(round.word);
    });
    return () => {
      isActive = false;
    };
  }, [round, markSeen]);

  // One letter at a time: the next letter plays only after you pick the current one.
  // Deleting a letter replays the letter for that slot.
  const isReady = round !== null && readyWord === round.word;
  useEffect(() => {
    if (!isReady || result || typed.length >= letters.length) return;
    playOne(letters[typed.length]);
  }, [isReady, result, typed.length, letters, playOne]);

  if (!round) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  const isComplete = typed.length === round.word.length;

  const pickTile = (tile: LetterTile) => {
    if (result || isComplete) return;
    setTyped(typed + tile.letter.toLowerCase());
  };

  const deleteLast = () => {
    if (result || typed.length === 0) return;
    sequence.stop();
    setTyped(typed.slice(0, -1));
  };

  const check = () => {
    if (!isComplete || result) return;
    const checked = checkSpelling(typed, round.word);
    sequence.stop();
    setResult(checked);
    setScore(scoreAnswer(score, checked.isCorrect));
    void playWord(round.word, round.voice);
  };

  /** Replays the letter you're on; once every slot is filled, spells the whole word. */
  const replay = () => {
    if (isComplete) start(letters);
    else playOne(letters[typed.length]);
  };

  const goNext = () => {
    sequence.stop();
    setRound(newRound(seen ?? {}));
    setTyped('');
    setResult(null);
  };

  const tileStyle = ({ pressed }: { pressed: boolean }) => [
    styles.secondary,
    { backgroundColor: pressed ? colors.tilePressed : colors.tile },
  ];
  const rowTileStyle = (state: { pressed: boolean }) => [...tileStyle(state), styles.rowItem];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <ScoreHeader score={score} />
      <Text style={[styles.question, { color: colors.textSecondary }]}>
        Tap the letter you hear; the next one plays after you pick. {round.word.length} letters.
      </Text>

      <SpellingSlots
        length={round.word.length}
        typed={typed}
        activeIndex={result ? null : (sequence.playingIndex ?? typed.length)}
        results={result?.slots ?? null}
        onDeleteLast={deleteLast}
      />

      {!result && (
        <View style={styles.bank}>
          {round.bank.map((tile) => (
            <LetterOption
              key={tile.id}
              title={tile.letter}
              state="idle"
              isCompact
              isDisabled={isComplete}
              onPress={() => pickTile(tile)}
              accessibilityLabel={`Letter ${tile.letter}`}
              style={styles.tile}
            />
          ))}
        </View>
      )}

      {!result && (
        <View style={styles.row}>
          <Pressable onPress={deleteLast} accessibilityLabel="Delete the last letter" style={rowTileStyle}>
            <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>⌫ Delete</Text>
          </Pressable>
          <Pressable
            onPress={replay}
            accessibilityLabel={isComplete ? 'Spell the whole word' : 'Play this letter again'}
            style={rowTileStyle}>
            <Text style={[styles.secondaryText, { color: colors.accent }]}>
              {isComplete ? '▶︎ Whole word' : '▶︎ Letter again'}
            </Text>
          </Pressable>
        </View>
      )}

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

      {!result && (
        <Pressable onPress={goNext} accessibilityLabel="Skip to the next word" style={tileStyle}>
          <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Skip word ⏭</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, paddingBottom: Spacing.lg + LIFT, gap: Spacing.lg },
  question: { textAlign: 'center', fontSize: 16 },
  bank: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  tile: { flex: 0, width: TILE_WIDTH },
  row: { flexDirection: 'row', gap: Spacing.sm },
  rowItem: { flex: 1 },
  secondary: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  secondaryText: { fontSize: 18, fontWeight: '600' },
  answer: { alignItems: 'center', gap: Spacing.xs },
  feedback: { fontSize: 20, fontWeight: '700' },
  ipa: { fontSize: 20 },
  hint: { fontSize: 12 },
  action: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
