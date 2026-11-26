import { useCallback, useEffect, useRef, useState } from 'react';

const START_DELAY_MS = 400;
const DEFAULT_STEP_MS = 1100; // letter names are short clips; this leaves a clear gap between them

/**
 * Plays items one after another on a fixed beat and reports which one is playing.
 * Timers are cleared on stop, on a new sequence and on unmount.
 */
export function usePlaySequence(play: (item: string) => void, stepMs: number = DEFAULT_STEP_MS) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlayingIndex(null);
  }, []);

  const start = useCallback(
    (items: readonly string[]) => {
      stop();
      timers.current = [
        ...items.map((item, index) =>
          setTimeout(() => {
            setPlayingIndex(index);
            play(item);
          }, START_DELAY_MS + index * stepMs),
        ),
        setTimeout(() => setPlayingIndex(null), START_DELAY_MS + items.length * stepMs),
      ];
    },
    [play, stop, stepMs],
  );

  useEffect(() => stop, [stop]);

  return { playingIndex, start, stop };
}
