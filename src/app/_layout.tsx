import { NativeTabs } from 'expo-router/native-tabs';

import { loadVoiceMode } from '@/lib/voice-settings';

// Restore the saved voice choice before any screen plays audio.
void loadVoiceMode();

export default function RootLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(sounds)">
        <NativeTabs.Trigger.Label>Sounds</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="waveform" md="graphic_eq" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="read">
        <NativeTabs.Trigger.Label>Read</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="text.bubble" md="record_voice_over" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="test">
        <NativeTabs.Trigger.Label>Test</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="ear" md="hearing" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
