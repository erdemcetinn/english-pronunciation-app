import { Stack } from 'expo-router';

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Test', headerLargeTitle: true }} />
      <Stack.Screen name="pairs" options={{ title: 'Word pairs' }} />
      <Stack.Screen name="vowel" options={{ title: 'Find the vowel' }} />
    </Stack>
  );
}
