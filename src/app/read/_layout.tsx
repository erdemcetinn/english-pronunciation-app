import { Stack } from 'expo-router';

export default function ReadLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Read', headerLargeTitle: true }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
