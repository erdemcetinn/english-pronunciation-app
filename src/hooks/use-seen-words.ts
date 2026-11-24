import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { SeenMap } from '@/lib/practice-session';
import { loadSeen, saveSeen } from '@/lib/seen-store';

/** Seen-item history for one list (a phoneme, or a game), reloaded whenever the screen gains focus. */
export function useSeenWords(listId: string) {
  const [seen, setSeen] = useState<SeenMap | null>(null);
  const latest = useRef<SeenMap>({});

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadSeen(listId).then((loaded) => {
        if (!isActive) return;
        latest.current = loaded;
        setSeen(loaded);
      });
      return () => {
        isActive = false;
      };
    }, [listId]),
  );

  const markSeen = useCallback(
    (word: string) => {
      const next = { ...latest.current, [word]: Date.now() };
      latest.current = next;
      setSeen(next);
      void saveSeen(listId, next);
    },
    [listId],
  );

  return { seen, markSeen };
}
