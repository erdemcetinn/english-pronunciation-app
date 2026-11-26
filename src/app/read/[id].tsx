import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCatalogEntry, loadBook, loadProgress, resumePosition, saveProgress, type Book } from '@/lib/books';
import {
  isFinished,
  nextPosition,
  previousPosition,
  progressPercent,
  START,
  wordsOf,
  type ReaderPosition,
} from '@/lib/reader';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; book: Book };

export default function ReaderScreen() {
  const { id, restart } = useLocalSearchParams<{ id: string; restart?: string }>();
  const colors = useTheme();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [pos, setPos] = useState<ReaderPosition>(START);

  const book = load.status === 'ready' ? load.book : null;
  const sentenceWords = useMemo(() => book?.sentences.map(wordsOf) ?? [], [book]);
  const lengths = useMemo(() => sentenceWords.map((w) => w.length), [sentenceWords]);

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const entry = await getCatalogEntry(id);
        if (!entry) throw new Error('Book not found.');
        const loaded = await loadBook(entry);
        const saved = restart === '1' ? null : await loadProgress(id);
        if (!isActive) return;
        setPos(resumePosition(saved, loaded.sentences.map((s) => wordsOf(s).length)));
        setLoad({ status: 'ready', book: loaded });
      } catch (error) {
        console.warn(`Could not open book ${id}`, error);
        if (isActive) setLoad({ status: 'error', message: 'Could not open this book. Check your connection.' });
      }
    })();
    return () => {
      isActive = false;
    };
  }, [id, restart]);

  const move = (next: ReaderPosition) => {
    setPos(next);
    if (book) saveProgress(book.id, next);
  };

  if (!book) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: load.status === 'error' ? colors.warning : colors.textSecondary }}>
          {load.status === 'error' ? load.message : 'Loading…'}
        </Text>
      </View>
    );
  }

  const shownText = sentenceWords[pos.sentence].slice(0, pos.shown).join(' ');
  const isDone = isFinished(pos, lengths);
  const goNext = () => move(nextPosition(pos, lengths));

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: book.title }} />
      <Text style={[styles.progress, { color: colors.textSecondary }]}>
        {progressPercent(pos, lengths.length)}% · sentence {pos.sentence + 1} of {lengths.length.toLocaleString('en-US')}
      </Text>

      {/* Tapping the text works like Next, so you can read with one thumb. */}
      <Pressable onPress={goNext} style={styles.textArea} accessibilityLabel="Next word">
        <Text style={[styles.text, { color: colors.text }]}>{shownText}</Text>
      </Pressable>

      {isDone && <Text style={[styles.done, { color: colors.textSecondary }]}>The end.</Text>}

      <View style={styles.buttons}>
        <Pressable
          onPress={() => move(previousPosition(pos, lengths))}
          accessibilityLabel="Previous word"
          style={({ pressed }) => [styles.back, { backgroundColor: pressed ? colors.tilePressed : colors.tile }]}>
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </Pressable>
        <Pressable
          onPress={goNext}
          disabled={isDone}
          accessibilityLabel="Next word"
          style={({ pressed }) => [
            styles.next,
            { backgroundColor: colors.accent, opacity: isDone ? 0.4 : pressed ? 0.8 : 1 },
          ]}>
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  container: { flexGrow: 1, padding: Spacing.lg, gap: Spacing.lg },
  progress: { fontSize: 13, textAlign: 'center' },
  textArea: { flexGrow: 1, minHeight: 260, justifyContent: 'center' },
  text: { fontSize: 30, lineHeight: 42, fontWeight: '500' },
  done: { textAlign: 'center', fontSize: 16 },
  buttons: { flexDirection: 'row', gap: Spacing.sm },
  back: { flex: 1, paddingVertical: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
  backText: { fontSize: 18, fontWeight: '600' },
  next: { flex: 2, paddingVertical: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
});
