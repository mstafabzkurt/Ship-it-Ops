import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import QuestionArchiveRow from '../src/components/questions/QuestionArchiveRow';
import { getDashboardTokens } from '../src/components/dashboard/dashboardTokens';
import { fetchSharedQuestionSenderProfiles, listReceivedQuestionShares, markQuestionShareOpened } from '../src/services/questionSocial';
import { useAuth } from '../src/state/AuthContext';
import { useTheme } from '../src/state/ThemeContext';
import { fonts } from '../src/theme/typography';
import type { SharedQuestionEntry } from '../src/utils/questionSocial';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function SharedQuestionsScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [entries, setEntries] = useState<SharedQuestionEntry[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [sendersLoaded, setSendersLoaded] = useState(false);
  const requestIdRef = useRef(0);
  const entriesOwnerRef = useRef<string | null>(null);

  const loadShares = useCallback(() => {
    const requestId = ++requestIdRef.current;
    if (!user?.id) {
      entriesOwnerRef.current = null;
      setEntries([]);
      setSendersLoaded(false);
      setStatus('error');
      return;
    }
    if (entriesOwnerRef.current !== user.id) {
      entriesOwnerRef.current = user.id;
      setEntries([]);
    }
    setSendersLoaded(false);
    setStatus('loading');
    void listReceivedQuestionShares(user.id)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setEntries(result);
        setStatus('ready');
        void fetchSharedQuestionSenderProfiles(result)
          .then((profiles) => {
            if (requestId !== requestIdRef.current) return;
            setEntries((current) => current.map((entry) => ({
              ...entry,
              sender: profiles.get(entry.share.senderId) ?? null,
            })));
          })
          .catch(() => undefined)
          .finally(() => {
            if (requestId === requestIdRef.current) setSendersLoaded(true);
          });
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setSendersLoaded(true);
        setStatus('error');
      });
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    loadShares();
    return () => { requestIdRef.current += 1; };
  }, [loadShares]));

  const handleOpen = useCallback((entry: SharedQuestionEntry) => {
    if (entry.source === 'legacy' && !entry.share.openedAt) {
      setEntries((current) => current.map((item) => item.share.id === entry.share.id
        ? { ...item, share: { ...item.share, openedAt: new Date().toISOString() } }
        : item));
      void markQuestionShareOpened(entry.share.id).catch(() => undefined);
    }
    router.push({
      pathname: '/question-detail/[questionId]',
      params: { questionId: entry.question.id, source: 'shared', ...(entry.source === 'legacy' ? { shareId: entry.share.id } : {}) },
    });
  }, []);

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
              <Text style={styles.eyebrow}>SORU GELEN KUTUSU</Text>
              <Text accessibilityRole="header" style={styles.title}>Paylaşılan Sorular</Text>
            </View>
          </View>
          {status === 'error' && entries.length > 0 ? <Text accessibilityLiveRegion="polite" style={styles.loadError}>Paylaşımlar yenilenemedi. Tekrar deneyebilirsin.</Text> : null}
          <FlatList
            data={entries}
            keyExtractor={(entry) => `${entry.source}:${entry.share.id}`}
            contentContainerStyle={[styles.listContent, entries.length === 0 && styles.listContentEmpty]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => 'answerOptions' in item.question ? (
              <QuestionArchiveRow
                contextLabel={formatSharedDate(item.share.createdAt)}
                question={item.question}
                sender={item.sender}
                senderUnavailable={sendersLoaded && !item.sender}
                unread={item.source === 'legacy' && !item.share.openedAt}
                onOpen={() => handleOpen(item)}
              />
            ) : (
              <Pressable accessibilityRole="button" accessibilityLabel={`${item.question.title}. Soru detayını aç.`} onPress={() => handleOpen(item)} style={({ pressed }) => [styles.previewRow, item.source === 'legacy' && !item.share.openedAt && styles.previewUnread, pressed && styles.pressed]}>
                <Text style={styles.previewSender}>{item.sender?.companyName ?? (sendersLoaded ? 'Şirket profili kullanılamıyor' : 'Paylaşılan soru')}</Text>
                <Text style={styles.previewTitle}>{item.question.title}</Text>
                <Text style={styles.previewMeta}>{item.source === 'legacy' && !item.share.openedAt ? 'YENİ · ' : ''}Paylaşılan soru · {formatSharedDate(item.share.createdAt)}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<InboxState status={status} onRetry={loadShares} styles={styles} tokens={tokens} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function formatSharedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Paylaşılan soru' : date.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

function InboxState({ status, onRetry, styles, tokens }: {
  status: LoadStatus;
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (status === 'loading') return <View style={styles.stateBox}><ActivityIndicator color={tokens.colors.secondary} /><Text style={styles.stateTitle}>Paylaşımlar yükleniyor</Text></View>;
  if (status === 'error') return <View style={styles.stateBox}><Ionicons name="cloud-offline-outline" size={30} color={tokens.colors.warning} /><Text style={styles.stateTitle}>Paylaşımlar yüklenemedi</Text><Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>Tekrar Dene</Text></Pressable></View>;
  return <View style={styles.stateBox}><Ionicons name="paper-plane-outline" size={30} color={tokens.colors.textMuted} /><Text style={styles.stateTitle}>Henüz paylaşılan soru yok.</Text><Text style={styles.stateText}>Paylaşılan Sorular'a gönderilen sorular burada görünür.</Text></View>;
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
    previewRow: { minHeight: 88, padding: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurface },
    previewUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.secondarySurfaceRaised },
    previewSender: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 12 },
    previewTitle: { marginTop: 8, color: colors.text, fontFamily: fonts.headingMedium, fontSize: 15 },
    previewMeta: { marginTop: 6, color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10 },
    loadError: { marginBottom: 10, color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
    stateBox: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24 },
    stateTitle: { marginTop: 11, color: colors.text, fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 23, textAlign: 'center' },
    stateText: { maxWidth: 390, marginTop: 5, color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13 },
    pressed: { opacity: 0.72 },
  });
}
