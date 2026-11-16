# English Pronunciation App

A mobile app for learning to **hear and produce every sound of American English**, built for adult learners who already know the language but still struggle with sounds that don't exist in their native language.

> 🚧 **Status: in active development.** Follow the commits to watch it grow.

## Why

Most language apps teach vocabulary and grammar. Very few teach the sound system itself, and almost none train your ear to tell apart words like *ship* and *sheep* when they are spoken fast, by different voices, inside a real sentence.

This app is built around what pronunciation research actually supports:

- **Intelligibility over accent.** The goal is to be clearly understood, not to sound native ([Derwing & Thomson, 2015](https://benjamins.com/online/ebop/publications/60375)).
- **Not all errors are equal.** Contrasts that change meaning in many words, such as /iː/ vs /ɪ/, matter more than rare ones (functional load, [Munro & Derwing, 2006](https://www.frontiersin.org/articles/10.3389/fcomm.2021.627378)).
- **Train the ear with many voices.** Hearing the same contrast from multiple speakers improves perception (High Variability Phonetic Training, [Uchihara, Karas & Thomson](https://www.cambridge.org/core/product/6ABB8C1F32D88D53EA8D05A4565E76F6/core-reader)).

## Features

### 🔤 Sound Map
Every sound of American English, grouped the way phoneticians classify them:

| Vowels | Consonants |
|---|---|
| Monophthongs (short and long) | Plosives · Affricates · Nasals |
| Diphthongs | Fricatives · Approximants |

Tap a sound to hear it, see its most common example words, and find the sounds it is most often confused with.

### 🗣️ Type & Listen
Type any word or sentence and hear it read aloud by a natural neural voice, with the IPA transcription shown under each word. Slow playback is available for difficult phrases.

### 🎧 Listening Test
The app plays a word and you choose between two options, such as *ship / sheep* or *funny / bunny*. Each round varies:
- **Speaker:** several different American voices
- **Speed:** normal and fast
- **Context:** the word alone, or reduced inside a natural sentence

Your score is tracked, and the pairs you confuse most come back more often.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, TypeScript, Expo Router |
| Text-to-speech | Amazon Polly (neural voices) |
| Phonetic transcription | CMU Pronouncing Dictionary (ARPAbet → IPA) |
| Backend | AWS API Gateway, AWS Lambda (Python), Amazon S3 audio cache |

The backend is fully serverless: it costs nothing when idle, and every generated audio clip is cached in S3 so the same sentence is never synthesized twice.

## Roadmap

- [x] Project setup (Expo, TypeScript)
- [ ] Sound data: all phonemes, example words, common confusions
- [ ] Sound Map screens
- [ ] Serverless text-to-speech API (API Gateway + Lambda + Polly + S3)
- [ ] Type & Listen
- [ ] Listening Test with multi-voice audio
- [ ] Progress tracking

## Run Locally

```bash
npm install
npx expo start
```

Scan the QR code with the iPhone Camera (or the Expo Go app on Android) to open the app.

## License

MIT
