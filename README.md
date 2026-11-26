# English Pronunciation App

**Learn the sounds of American English, train your ear to tell them apart, and say them clearly.**

Most learners stall at the same point: they know the words, but they can't hear the difference between *ship* and *sheep*, and they can't produce sounds their native language doesn't have. Because people tend to say what they hear, fixing the ear also fixes the mouth. That's why this app trains **sounds** rather than vocabulary. Understanding fast speech gets easier, and speaking becomes clearer.

<p>
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-Expo%20SDK%2058-1f6f78">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-1f6f78">
  <img alt="Amazon Polly" src="https://img.shields.io/badge/Amazon%20Polly-10%20neural%20voices-c2622f">
  <img alt="AWS" src="https://img.shields.io/badge/S3%20%2B%20CloudFront-Terraform-7a4b9c">
  <img alt="Tests" src="https://img.shields.io/badge/tests-39%20passing-1f6f78">
</p>

> 🚧 In active development. Sound map, practice and three listening games and a spelling game work today. Type & Listen is next.

---

## What the app does

**1. Learn every sound.** A sound map of all 41 sounds of American English, grouped the way phoneticians group them: vowels, diphthongs, plosives, fricatives and the rest. Sounds that don't exist in Turkish are marked, so you know where to start. Tap a sound to see example words with their IPA and the sounds it's most often confused with.

**2. Practice with a growing word list.** "Practice this sound" gives you 20 words at a time from a pool of up to 150 words per sound. About 70% of each set is new and 30% is review, so you're never stuck repeating the same list. Hide the word or the IPA and guess from sound alone.

**3. Train your ear with games.**
- **Word pairs:** hear a word, pick it: *ship* or *sheep*? *three* or *tree*? *van* or *fan*? 463 minimal pairs built around the contrasts learners mix up most.
- **Find the vowel:** hear a word, see its IPA with the vowel missing (/ʃ _ p/), and choose between the sound and its two closest look-alikes.
- **Letter names:** A says /eɪ/, E says /i/, I says /aɪ/, a classic trap for Turkish speakers when spelling names or emails. *Speed* mode plays a letter and times how fast you tap it, with a vowel set (A E I, + O U) and a wider set (B C D F G J M N P R S U V Y).
- **Spelling:** a word is dictated letter by letter, the way names and emails are spelled on the phone. You see one blank per letter and pick letters from a small bank of reusable tiles (with look-alike decoys like E/I or G/J). The next letter plays as soon as you pick the current one.

**4. Hear many voices, not just one.** Every word is recorded by 10 natural American voices. In the games, voices rotate so you never hear the same speaker twice in a row. Hearing many different voices is one of the best-supported ways to train the ear ([HVPT research](https://www.cambridge.org/core/product/6ABB8C1F32D88D53EA8D05A4565E76F6/core-reader)). You can also choose one voice, a random voice, or your phone's built-in voice.

## How it works

```
CMU Pronouncing Dictionary + 10k most frequent English words
        │
        ▼  build script: ARPAbet → IPA, stress marks, word pools, minimal pairs
        │
  words.json (3,000+ words with IPA) · minimal-pairs.json (463 pairs)
        │
        ▼  generator: Amazon Polly, SSML <phoneme> forces the exact IPA shown in the app
        │
  ~30,000 mp3 clips  →  private S3 bucket  →  CloudFront
        │
        ▼
  App downloads each clip once, caches it on the phone, prefetches the next words
```

## Engineering highlights

**What you see is what you hear.** Many English words have more than one pronunciation (*read*, *live*, *record*). Every clip is generated with an SSML `<phoneme>` tag built from the IPA the app shows, so the audio can't contradict the transcription.

**Pre-generated audio, near-zero running cost.** All clips are synthesized once (about $3 of Polly), stored in a private S3 bucket and served through CloudFront. There's no server in the request path, and repeat plays come straight from the phone's cache.

**Data pipeline, not hand-typed lists.** Word pools, IPA and minimal pairs are generated from the CMU dictionary and a frequency list. Pairs are found automatically by bucketing pronunciations, so every pair differs in exactly one sound with the same stress pattern.

**Small, tested logic.** Session building (70/30 new vs. review), the shuffle-bag voice rotation, stress detection and the ARPAbet-to-IPA converter are pure functions covered by unit tests.

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo SDK 58, TypeScript, Expo Router (native tabs) |
| Audio | expo-audio, expo-file-system (local cache), expo-speech (fallback) |
| Speech synthesis | Amazon Polly, 10 neural en-US voices, SSML phoneme tags |
| Delivery | Amazon S3 (private), Amazon CloudFront (origin access control) |
| Infrastructure | Terraform |
| Pronunciation data | CMU Pronouncing Dictionary, ARPAbet → IPA |
| Storage on device | AsyncStorage (seen words, voice preference) |
| Tests | Node test runner |

## Roadmap

- [x] Sound map with example words and IPA
- [x] Practice mode with rotating word sets
- [x] 10-voice audio on S3 + CloudFront
- [x] Listening games: Word pairs, Find the vowel, Letter names, Spelling
- [ ] Type & Listen: type any sentence, hear it, see the IPA (Lambda + Polly)
- [ ] Listening in context: fast speech and words inside sentences
- [ ] Progress tracking: the contrasts you miss most come back more often
- [ ] TestFlight release

## Run locally

```bash
npm install
cp .env.example .env    # set EXPO_PUBLIC_AUDIO_BASE_URL (or leave it out to use the device voice)
npx expo start
```

Scan the QR code with your iPhone camera to open the app in Expo Go.

<details>
<summary>Rebuild data and audio</summary>

```bash
npm run build:words         # needs data/raw/cmudict.dict and the frequency list (see script header)
npm run verify:phonemes
npm test
cd infra && terraform apply # S3 + CloudFront
npm run generate:audio -- --bucket <bucket name>
```
</details>

## License

MIT
