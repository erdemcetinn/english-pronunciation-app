import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LetterOption, type LetterOptionState } from '@/components/letter-option';
import { ListenButton } from '@/components/listen-button';
import { ScoreHeader } from '@/components/score-header';
import { ToggleChip } from '@/components/toggle-chip';
import { GAME_VOICES, SUCCESS_COLOR } from '@/constants/game';
import { EXTEND_LABEL, ipaLabel, letterKeys, speedPool, type LetterSet } from '@/constants/letters-game';
import { Spacing } from '@/constants/theme';
import { getLetter } from '@/data/letters';
import { useTheme } from '@/hooks/use-theme';
import { nextLetterRound, summarizeTimes, type LetterRound } from '@/lib/letter-game';
import { INITIAL_SCORE, scoreAnswer } from '@/lib/listening-game';
import { playLetter, prefetchAllVoices } from '@/lib/play-word';
import { shuffled } from '@/lib/practice-session';
import { recordSkill } from '@/lib/skill-store';

const NEXT_DELAY_CORRECT_MS = 600;
const NEXT_DELAY_WRONG_MS = 1800;

const newRound = (pool: readonly string[]): LetterRound =>
  nextLetterRound({ pool, optionCount: pool.length, shuffle: shuffled, random: Math.random });

/** Pools larger than this are shown as a grid of smaller tiles. */
const ROW_MAX = 5;
const GRID_TILE_WIDTH = '18%';

const SET_CHIPS: readonly { set: LetterSet; label: string }[] = [
  { set: 'vowels', label: 'A E I' },
  { set: 'consonants', label: 'B C D G J R Y…' },
];

const formatSeconds = (ms: number | null) => (ms === null ? '-' : `${(ms / 1000).toFixed(2)} s`);

function optionState(letter: string, round: LetterRound, answer: string | null): LetterOptionState {
  if (!answer) return 'idle';
  if (letter === round.target) return 'correct';
  return letter === answer ? 'wrong' : 'neutral';
}

export default function LetterSpeedScreen() {
  const colors = useTheme();
  const [letterSet, setLetterSet] = useState<LetterSet>('vowels');
  const [isExtended, setIsExtended] = useState(false);
  const pool = speedPool(letterSet, isExtended);
  const isGrid = pool.length > ROW_MAX;
  const [round, setRound] = useState(() => newRound(pool));
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(INITIAL_SCORE);
  const [times, setTimes] = useState<readonly number[]>([]);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => prefetchAllVoices(letterKeys(pool)), [pool]);

  // Play the letter; the clock starts once playback has started.
  useEffect(() => {
    let isActive = true;
    startedAt.current = null;
    void playLetter(round.target, GAME_VOICES).then(() => {
      if (isActive) startedAt.current = Date.now();
    });
    return () => {
      isActive = false;
    };
  }, [round]);

  // Move on automatically: quickly after a hit, a bit slower after a miss.
  useEffect(() => {
    if (!answer) return;
    const delay = answer === round.target ? NEXT_DELAY_CORRECT_MS : NEXT_DELAY_WRONG_MS;
    const timer = setTimeout(() => {
      setRound(newRound(pool));
      setAnswer(null);
    }, delay);
    return () => clearTimeout(timer);
  }, [answer, round, pool]);

  const choose = (letter: string) => {
    if (answer) return;
    const isCorrect = letter === round.target;
    const elapsed = startedAt.current === null ? null : Date.now() - startedAt.current;
    setAnswer(letter);
    setScore(scoreAnswer(score, isCorrect));
    setLastTime(isCorrect ? elapsed : null);
    if (isCorrect && elapsed !== null) setTimes([...times, elapsed]);
    if (!isCorrect) void playLetter(round.target, GAME_VOICES);
    recordSkill('letters', round.target, {
      isCorrect,
      chosen: isCorrect ? undefined : letter,
      ms: elapsed ?? undefined,
    });
  };

  /** Switching letters starts fresh: times from different sets aren't comparable. */
  const restart = (set: LetterSet, extended: boolean) => {
    setLetterSet(set);
    setIsExtended(extended);
    setRound(newRound(speedPool(set, extended)));
    setAnswer(null);
    setScore(INITIAL_SCORE);
    setTimes([]);
    setLastTime(null);
  };

  const { average, best } = summarizeTimes(times);
  const target = getLetter(round.target);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        {SET_CHIPS.map(({ set, label }) => (
          <ToggleChip key={set} label={label} isOn={letterSet === set} onToggle={() => set !== letterSet && restart(set, false)} />
        ))}
        {letterSet === 'vowels' && (
          <ToggleChip label={EXTEND_LABEL} isOn={isExtended} onToggle={() => restart('vowels', !isExtended)} />
        )}
      </View>
      <ScoreHeader score={score} />
      <Text style={[styles.times, { color: colors.textSecondary }]}>
        Last {formatSeconds(lastTime)} · Avg {formatSeconds(average)} · Best {formatSeconds(best)}
      </Text>

      <ListenButton onPress={() => void playLetter(round.target, GAME_VOICES)} />

      <Text style={[styles.question, { color: colors.text }]}>Which letter? Be quick!</Text>

      <View style={[styles.options, isGrid && styles.grid]}>
        {pool.map((letter) => (
          <LetterOption
            key={letter}
            title={letter}
            isCompact={isGrid}
            style={isGrid ? styles.gridTile : undefined}
            state={optionState(letter, round, answer)}
            onPress={() => choose(letter)}
            accessibilityLabel={`Choose ${letter}`}
          />
        ))}
      </View>

      <Text style={[styles.feedback, { color: answer === round.target ? SUCCESS_COLOR : colors.warning }]}>
        {answer ? `${target.letter} is ${ipaLabel(target.ipa)}` : ' '}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: Spacing.sm },
  times: { fontSize: 14, textAlign: 'center' },
  question: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  options: { flexDirection: 'row', gap: Spacing.sm },
  grid: { flexWrap: 'wrap', justifyContent: 'center' },
  gridTile: { flex: 0, width: GRID_TILE_WIDTH },
  feedback: { textAlign: 'center', fontSize: 20, fontWeight: '700' },
});
