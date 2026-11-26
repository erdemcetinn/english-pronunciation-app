import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchCatalog, loadProgress, type BookEntry } from '@/lib/books';
import { progressPercent, type ReaderPosition } from '@/lib/reader';

interface ListState {
  books: BookEntry[];
  progress: Record<string, ReaderPosition | null>;
  error: string | null;
  isLoading: boolean;
}

const INITIAL: ListState = { books: [], progress: {}, error: null, isLoading: true };

export default function BookListScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [state, setState] = useState<ListState>(INITIAL);

  // Reload on focus so progress is fresh after reading.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const books = await fetchCatalog();
          const saved = await Promise.all(books.map((b) => loadProgress(b.id)));
          const progress = Object.fromEntries(books.map((b, i) => [b.id, saved[i]]));
          if (isActive) setState({ books, progress, error: null, isLoading: false });
        } catch (error) {
          console.warn('Could not load books', error);
          if (isActive) setState({ ...INITIAL, isLoading: false, error: 'Could not load books. Check your connection.' });
        }
      })();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const open = (id: string, isRestart: boolean) =>
    router.push({ pathname: '/read/[id]', params: { id, restart: isRestart ? '1' : '0' } });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Read slowly, one word at a time. Each tap on Next adds a word; a finished sentence clears for the next one.
      </Text>
      {state.error && <Text style={[styles.message, { color: colors.warning }]}>{state.error}</Text>}
      {!state.isLoading && !state.error && state.books.length === 0 && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>No books yet.</Text>
      )}
      {state.books.map((book) => {
        const saved = state.progress[book.id];
        const percent = saved ? progressPercent(saved, book.sentenceCount) : 0;
        return (
          <View key={book.id} style={[styles.card, { backgroundColor: colors.tile }]}>
            <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>
            {book.author && <Text style={[styles.author, { color: colors.textSecondary }]}>{book.author}</Text>}
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {saved
                ? `${percent}% · sentence ${saved.sentence + 1} of ${book.sentenceCount.toLocaleString('en-US')}`
                : `${book.sentenceCount.toLocaleString('en-US')} sentences`}
            </Text>
            <View style={styles.buttons}>
              <Pressable
                onPress={() => open(book.id, false)}
                style={({ pressed }) => [styles.primary, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}>
                <Text style={styles.primaryText}>{saved ? 'Continue' : 'Start'}</Text>
              </Pressable>
              {saved && (
                <Pressable
                  onPress={() => open(book.id, true)}
                  style={({ pressed }) => [styles.secondary, { backgroundColor: pressed ? colors.tilePressed : colors.background }]}>
                  <Text style={[styles.secondaryText, { color: colors.text }]}>Start over</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, gap: Spacing.md },
  intro: { fontSize: 14 },
  message: { fontSize: 16, textAlign: 'center', marginTop: Spacing.lg },
  card: { borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs },
  title: { fontSize: 20, fontWeight: '700' },
  author: { fontSize: 15 },
  meta: { fontSize: 13 },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  primary: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  secondary: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
  secondaryText: { fontSize: 17, fontWeight: '600' },
});
