import { useRouter } from 'expo-router';

import { ScoreTile } from '@/components/score-tile';
import type { Attempt } from '@/lib/skill-score';
import { soundScore } from '@/lib/skill-score';
import type { Phoneme } from '@/types/phoneme';

export function PhonemeTile({ phoneme, attempts = [] }: { phoneme: Phoneme; attempts?: readonly Attempt[] }) {
  const router = useRouter();
  return (
    <ScoreTile
      title={phoneme.ipa}
      subtitle={phoneme.examples[0]}
      score={soundScore(attempts)}
      attemptCount={attempts.length}
      hasDot={phoneme.notInTurkish}
      onPress={() => router.push({ pathname: '/phoneme/[id]', params: { id: phoneme.id } })}
      accessibilityLabel={`Sound ${phoneme.ipa}, as in ${phoneme.examples[0]}`}
    />
  );
}
