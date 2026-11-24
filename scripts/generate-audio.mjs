// Generates one mp3 per (voice, word) with Amazon Polly and uploads it to S3.
// Pronunciation is forced with SSML so the audio always matches the IPA shown in the app.
// Already uploaded files are skipped, so the script is safe to re-run.
//
// Usage:
//   node scripts/generate-audio.mjs --bucket <name> [--voices Joanna,Matthew] [--words read,live] [--overwrite] [--dry-run]
//   --overwrite regenerates the given --words even if they exist (after a pronunciation fix).
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { wordSsml } from './lib/polly-ssml.mjs';

const REGION = 'us-east-1';
const KEY_PREFIX = 'audio/v1';
const CONCURRENCY = 6;
const MAX_ATTEMPTS = 8; // SDK adaptive retry handles Polly throttling with backoff.
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

const root = (path) => new URL(`../${path}`, import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(root(path), 'utf8'));

const audioKey = (voice, word) => `${KEY_PREFIX}/${voice}/${word}.mp3`;

function parseOptions() {
  const { values } = parseArgs({
    options: {
      bucket: { type: 'string' },
      voices: { type: 'string' },
      words: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      overwrite: { type: 'boolean', default: false },
    },
  });
  if (!values.bucket) throw new Error('Missing --bucket (see `terraform output audio_bucket`)');
  if (values.overwrite && !values.words) throw new Error('--overwrite needs --words (never overwrite everything by accident)');
  const split = (list) => (list ? list.split(',').map((s) => s.trim()).filter(Boolean) : null);
  return { bucket: values.bucket, voices: split(values.voices), words: split(values.words), isDryRun: values['dry-run'], isOverwrite: values.overwrite };
}

async function listExistingKeys(s3, bucket, voice) {
  const keys = new Set();
  let token;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${KEY_PREFIX}/${voice}/`, ContinuationToken: token }),
    );
    for (const item of page.Contents ?? []) keys.add(item.Key);
    token = page.NextContinuationToken;
  } while (token);
  return keys;
}

async function synthesizeAndUpload({ polly, s3, bucket }, { voice, word, segments }) {
  const speech = await polly.send(
    new SynthesizeSpeechCommand({
      Engine: 'neural',
      VoiceId: voice,
      OutputFormat: 'mp3',
      TextType: 'ssml',
      Text: wordSsml(word, segments),
    }),
  );
  const body = await speech.AudioStream.transformToByteArray();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: audioKey(voice, word),
      Body: body,
      ContentType: 'audio/mpeg',
      CacheControl: CACHE_CONTROL,
    }),
  );
  return speech.RequestCharacters ?? 0;
}

async function runPool(jobs, worker) {
  let next = 0;
  let done = 0;
  const failures = [];
  const runOne = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      try {
        await worker(job);
      } catch (error) {
        failures.push({ job, error });
        console.error(`FAILED ${job.voice}/${job.word}: ${error.name}: ${error.message}`);
      }
      done += 1;
      if (done % 250 === 0 || done === jobs.length) console.log(`${done} / ${jobs.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, runOne));
  return failures;
}

async function main() {
  const options = parseOptions();
  const { ipa } = readJson('src/data/words.json');
  const allVoices = readJson('src/data/voices.json').map((v) => v.id);
  const voices = options.voices ?? allVoices;
  const words = options.words ?? Object.keys(ipa);

  const unknown = [...voices.filter((v) => !allVoices.includes(v)), ...words.filter((w) => !ipa[w])];
  if (unknown.length > 0) throw new Error(`Unknown voices/words: ${unknown.join(', ')}`);

  const s3 = new S3Client({ region: REGION });
  const polly = new PollyClient({ region: REGION, maxAttempts: MAX_ATTEMPTS, retryMode: 'adaptive' });

  const jobs = [];
  for (const voice of voices) {
    const existing = options.isOverwrite ? new Set() : await listExistingKeys(s3, options.bucket, voice);
    for (const word of words) {
      if (!existing.has(audioKey(voice, word))) jobs.push({ voice, word, segments: ipa[word] });
    }
  }

  const characters = jobs.reduce((sum, job) => sum + job.word.length, 0);
  console.log(`To generate: ${jobs.length} files, ~${characters} billed characters`);
  if (options.isDryRun || jobs.length === 0) return;

  let billed = 0;
  const failures = await runPool(jobs, async (job) => {
    const characters = await synthesizeAndUpload({ polly, s3, bucket: options.bucket }, job);
    billed += characters; // add after await, so parallel jobs don't overwrite each other
  });

  console.log(`Done. Billed characters: ${billed}. Failed: ${failures.length}`);
  if (failures.length > 0) {
    console.log('Re-run the same command to retry only the missing files.');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
