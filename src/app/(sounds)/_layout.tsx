import { Stack } from 'expo-router';

export default function SoundsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Sounds', headerLargeTitle: true }} />
      <Stack.Screen name="phoneme/[id]" options={{ title: '' }} />
      <Stack.Screen name="practice/[id]" options={{ title: 'Practice' }} />
    </Stack>
  );
}
