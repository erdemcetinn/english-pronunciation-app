import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { ToggleChip } from '@/components/toggle-chip';
import { setVoiceMode, useVoiceMode, voiceModeLabel, VOICES, type VoiceMode } from '@/lib/voice-settings';

const MODES: readonly { label: string; mode: VoiceMode }[] = [
  { label: 'Device voice', mode: { kind: 'device' } },
  { label: 'Random American voice', mode: { kind: 'random' } },
  ...VOICES.map((v) => ({ label: `${v.id} (${v.gender})`, mode: { kind: 'voice', voiceId: v.id } as const })),
];

function openPicker(): void {
  const labels = MODES.map((m) => m.label);
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title: 'Who reads the words?', options: [...labels, 'Cancel'], cancelButtonIndex: labels.length },
      (index) => {
        if (index < MODES.length) setVoiceMode(MODES[index].mode);
      },
    );
    return;
  }
  Alert.alert('Who reads the words?', undefined, [
    ...MODES.slice(0, 2).map((m) => ({ text: m.label, onPress: () => setVoiceMode(m.mode) })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

/** Chip showing the current voice; tap to choose device, random or a specific Polly voice. */
export function VoiceChip() {
  const mode = useVoiceMode();
  return (
    <ToggleChip label={`Voice: ${voiceModeLabel(mode)}`} isOn={mode.kind !== 'device'} onToggle={openPicker} />
  );
}
