/**
 * "Shuffle bag": hands out every voice once in random order, then reshuffles.
 * The first voice of a new round never equals the last voice of the previous one.
 */
export function createVoiceBag(
  voiceIds: readonly string[],
  shuffle: (items: readonly string[]) => string[],
) {
  let queue: string[] = [];
  let last: string | null = null;

  const refill = () => {
    const round = shuffle(voiceIds);
    if (round.length > 1 && round[0] === last) {
      [round[0], round[1]] = [round[1], round[0]];
    }
    queue = round;
  };

  return {
    next(): string {
      if (queue.length === 0) refill();
      const [voice, ...rest] = queue;
      queue = rest;
      last = voice;
      return voice;
    },
  };
}
