import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { SeenMap } from '@/lib/practice-session';
import { loadSeen, saveSeen } from '@/lib/seen-store';

/** Seen-word history for one phoneme, reloaded whenever the screen gains focus. */
export function useSeenWords(phonemeId: string) {
  const [seen, setSeen] = useState<SeenMap | null>(null);
  const latest = useRef<SeenMap>({});

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadSeen(phonemeId).then((loaded) => {
        if (!isActive) return;
        latest.current = loaded;
        setSeen(loaded);
      });
      return () => {
        isActive = false;
      };
    }, [phonemeId]),
  );

  const markSeen = useCallback(
    (word: string) => {
      const next = { ...latest.current, [word]: Date.now() };
      latest.current = next;
      setSeen(next);
      void saveSeen(phonemeId, next);
    },
    [phonemeId],
  );

  return { seen, markSeen };
}
