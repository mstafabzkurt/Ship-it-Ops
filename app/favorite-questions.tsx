import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import QuestionArchiveRow from '../src/components/questions/QuestionArchiveRow';
import QuestionShareSheet from '../src/components/social/QuestionShareSheet';
import { getDashboardTokens } from '../src/components/dashboard/dashboardTokens';
import { listFavoriteQuestions, setQuestionFavorite } from '../src/services/questionSocial';
import { useAuth } from '../src/state/AuthContext';
import { useTheme } from '../src/state/ThemeContext';
import { fonts } from '../src/theme/typography';
import type { FavoriteQuestionEntry } from '../src/utils/questionSocial';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function FavoriteQuestionsScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [entries, setEntries] = useState<FavoriteQuestionEntry[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [shareQuestionId, setShareQuestionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const requestIdRef = useRef(0);
  const entriesOwnerRef = useRef<string | null>(null);

  const loadFavorites = useCallback(() => {
    const requestId = ++requestIdRef.current;
    if (!user?.id) {
      entriesOwnerRef.current = null;
      setEntries([]);
      setStatus('error');
      return;
    }
    if (entriesOwnerRef.current !== user.id) {
      entriesOwnerRef.current = user.id;
      setEntries([]);
    }
    setStatus('loading');
    setActionError('');
    void listFavoriteQuestions(user.id)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setEntries(result);
        setStatus('ready');
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setStatus('error');
      });
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    loadFavorites();
    return () => { requestIdRef.current += 1; };
  }, [loadFavorites]));

  const handleRemove = useCallback(async (entry: FavoriteQuestionEntry) => {
    if (!user?.id) return;
    setEntries((current) => current.filter((item) => item.favorite.questionId !== entry.favorite.questionId));
    setActionError('');
    try {
      await setQuestionFavorite(user.id, entry.favorite.questionId, false);
    } catch {
      setEntries((current) => [entry, ...current]);
      setActionError('Soru favorilerden çıkarılamadı. Tekrar deneyebilirsin.');
    }
  }, [user?.id]);

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Profile dön" hitSlop={8} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={22} color={tokens.colors.text} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>SORU ARŞİVİ</Text>
              <Text accessibilityRole="header" style={styles.title}>Favori Sorular</Text>
            </View>
          </View>

          {actionError ? <Text accessibilityLiveRegion="polite" style={styles.actionError}>{actionError}</Text> : null}
          {status === 'error' && entries.length > 0 ? <Text accessibilityLiveRegion="polite" style={styles.actionError}>Favoriler yenilenemedi. Tekrar deneyebilirsin.</Text> : null}
          <FlatList
            data={entries}
            keyExtractor={(entry) => entry.favorite.questionId}
            contentContainerStyle={[styles.listContent, entries.length === 0 && styles.listContentEmpty]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <QuestionArchiveRow
                contextLabel={formatSavedDate(item.favorite.createdAt)}
                question={item.question}
                onOpen={() => router.push({ pathname: '/question-detail/[questionId]', params: { questionId: item.question.id, source: 'favorite' } })}
                onRemove={() => void handleRemove(item)}
                onShare={() => setShareQuestionId(item.question.id)}
              />
            )}
            ListEmptyComponent={<ArchiveState status={status} onRetry={loadFavorites} styles={styles} tokens={tokens} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
      <QuestionShareSheet questionId={shareQuestionId} visible={Boolean(shareQuestionId)} onClose={() => setShareQuestionId(null)} />
    </View>
  );
}

function formatSavedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Favorilere kaydedildi' : `${date.toLocaleDateString('tr-TR')} tarihinde kaydedildi`;
}

function ArchiveState({ status, onRetry, styles, tokens }: {
  status: LoadStatus;
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (status === 'loading') return <View style={styles.stateBox}><ActivityIndicator color={tokens.colors.secondary} /><Text style={styles.stateTitle}>Favoriler yükleniyor</Text></View>;
  if (status === 'error') return <View style={styles.stateBox}><Ionicons name="cloud-offline-outline" size={30} color={tokens.colors.warning} /><Text style={styles.stateTitle}>Favoriler yüklenemedi</Text><Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>Tekrar Dene</Text></Pressable></View>;
  return <View style={styles.stateBox}><Ionicons name="star-outline" size={30} color={tokens.colors.textMuted} /><Text style={styles.stateTitle}>Henüz favori sorun yok.</Text><Text style={styles.stateText}>Oyun sırasında yıldız simgesini kullanarak soruları buraya ekleyebilirsin.</Text></View>;
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1 },
    container: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
    backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { ...tokens.type.eyebrow, color: colors.secondary, fontFamily: fonts.bodySemiBold },
    title: { ...tokens.type.display, color: colors.text, fontFamily: fonts.headingBold },
    listContent: { paddingBottom: tokens.layout.pageBottom },
    listContentEmpty: { flexGrow: 1 },
    separator: { height: 10 },
    actionError: { marginBottom: 10, color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
    stateBox: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24 },
    stateTitle: { marginTop: 11, color: colors.text, fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 23, textAlign: 'center' },
    stateText: { maxWidth: 390, marginTop: 5, color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13 },
    pressed: { opacity: 0.72 },
  });
}
