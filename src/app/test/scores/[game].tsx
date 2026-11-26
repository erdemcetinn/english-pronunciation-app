import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScoreTile } from '@/components/score-tile';
import { SkillCard } from '@/components/skill-card';
import { GAME_SCORES } from '@/constants/game-scores';
import { ipaLabel } from '@/constants/letters-game';
import { letterLabel, soundLabel } from '@/constants/skill-labels';
import { Spacing } from '@/constants/theme';
import { LETTERS } from '@/data/letters';
import { getPhonemeById } from '@/data/phonemes';
import { useTheme } from '@/hooks/use-theme';
import { letterScore, soundScore, type Attempt } from '@/lib/skill-score';
import { GAME_KIND, useGameLog, type GameId } from '@/lib/skill-store';

const isGameId = (value: unknown): value is GameId => typeof value === 'string' && value in GAME_KIND;

/** Tile text for a phoneme id or a letter. */
function tileText(item: string, isSounds: boolean): { title: string; subtitle: string } {
  if (isSounds) {
    const phoneme = getPhonemeById(item);
    return { title: phoneme?.ipa ?? item, subtitle: phoneme?.examples[0] ?? '' };
  }
  const letter = LETTERS.find((l) => l.letter === item);
  return { title: item, subtitle: letter ? ipaLabel(letter.ipa) : '' };
}

export default function GameScoresScreen() {
  const { game } = useLocalSearchParams<{ game: string }>();
  const colors = useTheme();
  const log = useGameLog(isGameId(game) ? game : 'pairs');
  const [selected, setSelected] = useState<string | null>(null);

  if (!isGameId(game)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Game not found.</Text>
      </View>
    );
  }

  const config = GAME_SCORES[game];
  const isSounds = GAME_KIND[game] === 'sounds';
  const scoreOf = (attempts: readonly Attempt[]) => (isSounds ? soundScore(attempts) : letterScore(attempts));
  const selectedAttempts = selected ? (log[selected] ?? []) : [];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `${config.title} scores` }} />
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        {config.formula} Tap a {isSounds ? 'sound' : 'letter'} for details.
      </Text>

      {selected && (
        <View style={styles.detail}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>
            {isSounds ? soundLabel(selected) : letterLabel(selected)}
          </Text>
          <SkillCard
            score={scoreOf(selectedAttempts)}
            attempts={selectedAttempts}
            labelFor={isSounds ? soundLabel : letterLabel}
            formula={config.formula}
            sources={config.title}
          />
        </View>
      )}

      <View style={styles.grid}>
        {config.items.map((item) => {
          const attempts = log[item] ?? [];
          const { title, subtitle } = tileText(item, isSounds);
          return (
            <ScoreTile
              key={item}
              title={title}
              subtitle={subtitle}
              score={scoreOf(attempts)}
              attemptCount={attempts.length}
              onPress={() => setSelected(item === selected ? null : item)}
              accessibilityLabel={isSounds ? `Sound ${title}` : `Letter ${title}`}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, gap: Spacing.lg },
  note: { fontSize: 13 },
  detail: { gap: Spacing.sm },
  detailTitle: { fontSize: 20, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
