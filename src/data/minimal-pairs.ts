import type { MinimalPair } from '@/lib/listening-game';
import rawPairs from './minimal-pairs.json';

export const MINIMAL_PAIRS: readonly MinimalPair[] = rawPairs as MinimalPair[];
