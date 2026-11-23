export type PhonemeGroup =
  | 'monophthong'
  | 'diphthong'
  | 'plosive'
  | 'affricate'
  | 'nasal'
  | 'fricative'
  | 'approximant';

/** CMU stress digit requirement for vowels: 'stressed' = 1|2, 'unstressed' = 0. */
export type StressRequirement = 'stressed' | 'unstressed';

export interface Phoneme {
  /** Stable id, also used in confusedWith. */
  id: string;
  /** American English IPA symbol shown in the UI. */
  ipa: string;
  /** CMU Pronouncing Dictionary (ARPAbet) symbol, without stress digit. */
  arpabet: string;
  /** Only for vowels whose IPA depends on stress (ʌ vs ə, ɝ vs ɚ). */
  stress?: StressRequirement;
  group: PhonemeGroup;
  /** Monophthongs: 'short' | 'long'. Consonants: 'voiced' | 'voiceless'. */
  subgroup?: 'short' | 'long' | 'voiced' | 'voiceless';
  /** Example words; each must contain this phoneme in CMU dict. */
  examples: readonly string[];
  /** Ids of phonemes learners commonly mix up with this one. */
  confusedWith: readonly string[];
  /** True when Turkish has no close equivalent (needs extra practice). */
  notInTurkish: boolean;
}
