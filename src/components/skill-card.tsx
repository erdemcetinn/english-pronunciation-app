import { StyleSheet, Text, View } from 'react-native';

import { scoreColor } from '@/constants/score';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { averageCorrectMs, MIN_ATTEMPTS, topConfusion, type Attempt } from '@/lib/skill-score';

interface SkillCardProps {
  score: number | null;
  attempts: readonly Attempt[];
  /** Turns a confused id into a label, e.g. "iy" -> "/i/ (see)". */
  labelFor: (id: string) => string;
  /** Short line on what the score is made of. */
  formula: string;
  /** Where the answers come from, shown before the first answer. */
  sources: string;
}

/** Score summary for one sound or letter: score, recent accuracy, speed and the most common mix-up. */
export function SkillCard({ score, attempts, labelFor, formula, sources }: SkillCardProps) {
  const colors = useTheme();
  const correct = attempts.filter((a) => a.isCorrect).length;
  const confusion = topConfusion(attempts);
  const averageMs = averageCorrectMs(attempts);
  const muted = { color: colors.textSecondary };

  return (
    <View style={[styles.card, { backgroundColor: colors.tile }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>Your score</Text>
        <Text style={[styles.score, { color: score === null ? colors.textSecondary : scoreColor(score, colors) }]}>
          {score === null ? '-' : score}
        </Text>
      </View>
      {attempts.length === 0 && <Text style={[styles.line, muted]}>No answers yet. Play {sources}.</Text>}
      {attempts.length > 0 && score === null && (
        <Text style={[styles.line, muted]}>
          {attempts.length}/{MIN_ATTEMPTS} answers, the score appears after {MIN_ATTEMPTS}.
        </Text>
      )}
      {attempts.length > 0 && (
        <Text style={[styles.line, muted]}>
          Recent answers: {correct} of {attempts.length} correct
          {averageMs !== null ? ` · avg ${(averageMs / 1000).toFixed(2)} s` : ''}
        </Text>
      )}
      {confusion && (
        <Text style={[styles.line, { color: colors.text }]}>
          Mixed up most with {labelFor(confusion.id)} ({confusion.count}×)
        </Text>
      )}
      <Text style={[styles.formula, muted]}>{formula}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 18, fontWeight: '700' },
  score: { fontSize: 32, fontWeight: '800' },
  line: { fontSize: 15 },
  formula: { fontSize: 12, marginTop: Spacing.xs },
});
