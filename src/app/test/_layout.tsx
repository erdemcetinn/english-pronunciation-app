import { Stack } from 'expo-router';

import { ScoresButton } from '@/components/scores-button';

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Test', headerLargeTitle: true }} />
      <Stack.Screen
        name="pairs"
        options={{ title: 'Word pairs', headerRight: () => <ScoresButton game="pairs" /> }}
      />
      <Stack.Screen
        name="vowel"
        options={{ title: 'Find the vowel', headerRight: () => <ScoresButton game="vowel" /> }}
      />
      <Stack.Screen
        name="letters-speed"
        options={{ title: 'Letter names: speed', headerRight: () => <ScoresButton game="letters-speed" /> }}
      />
      <Stack.Screen
        name="spelling"
        options={{ title: 'Spelling', headerRight: () => <ScoresButton game="spelling" /> }}
      />
      <Stack.Screen name="scores/[game]" options={{ title: 'Scores' }} />
    </Stack>
  );
}
