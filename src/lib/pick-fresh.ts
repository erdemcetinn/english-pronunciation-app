/** Item -> timestamp (ms) when it was last shown. */
type SeenTimes = Readonly<Record<string, number>>;

/** When everything was seen, choose among this oldest share of items. */
const OLDEST_SHARE = 0.2;

/**
 * Picks an item the player hasn't seen yet; if all were seen,
 * picks one of the least recently seen. Random among equals.
 */
export function pickFresh(items: readonly string[], seen: SeenTimes, random: () => number): string | null {
  if (items.length === 0) return null;
  const unseen = items.filter((item) => !(item in seen));
  const pool =
    unseen.length > 0
      ? unseen
      : [...items].sort((a, b) => seen[a] - seen[b]).slice(0, Math.max(1, Math.floor(items.length * OLDEST_SHARE)));
  return pool[Math.floor(random() * pool.length)];
}
