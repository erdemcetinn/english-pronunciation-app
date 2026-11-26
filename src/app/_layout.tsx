import { NativeTabs } from 'expo-router/native-tabs';

import { loadSkillLogs } from '@/lib/skill-store';
import { loadVoiceMode } from '@/lib/voice-settings';

// Restore the saved voice choice and score history before any screen uses them.
void loadVoiceMode();
void loadSkillLogs();

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
