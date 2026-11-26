import { Stack } from 'expo-router';

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Test', headerLargeTitle: true }} />
      <Stack.Screen name="pairs" options={{ title: 'Word pairs' }} />
      <Stack.Screen name="vowel" options={{ title: 'Find the vowel' }} />
      <Stack.Screen name="letters-speed" options={{ title: 'Letter names: speed' }} />
      <Stack.Screen name="letters-sound" options={{ title: 'Letter names: sound' }} />
      <Stack.Screen name="spelling" options={{ title: 'Spelling' }} />
    </Stack>
  );
}
