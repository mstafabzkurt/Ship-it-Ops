import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import QuestionDetailSurface from '../../src/components/questions/QuestionDetailSurface';
import QuestionShareSheet from '../../src/components/social/QuestionShareSheet';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import {
  fetchArchivedQuestion,
  getQuestionFavoriteState,
  markQuestionShareOpened,
  setQuestionFavorite,
} from '../../src/services/questionSocial';
import { useAuth } from '../../src/state/AuthContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import type { ArchivedQuestion } from '../../src/utils/questionSocial';

type LoadStatus = 'loading' | 'ready' | 'missing' | 'error';

export default function QuestionDetailScreen() {
  const params = useLocalSearchParams<{ questionId?: string | string[]; shareId?: string | string[]; source?: string | string[]; userId?: string | string[] }>();
  const questionId = firstParam(params.questionId);
  const shareId = firstParam(params.shareId);
  const source = firstParam(params.source);
  const messageUserId = firstParam(params.userId);
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [question, setQuestion] = useState<ArchivedQuestion | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [actionError, setActionError] = useState('');
  const requestIdRef = useRef(0);
  const favoriteLockRef = useRef(false);

  const loadQuestion = useCallback(() => {
    const requestId = ++requestIdRef.current;
    if (!questionId || !user?.id) {
      setQuestion(null);
      setFavorite(false);
      setFavoriteLoading(false);
      setStatus('missing');
      return;
    }
    setQuestion(null);
    setFavorite(false);
    setFavoriteLoading(true);
    setStatus('loading');
    void fetchArchivedQuestion(questionId)
      .then((loadedQuestion) => {
        if (requestId !== requestIdRef.current) return;
        setQuestion(loadedQuestion);
        setStatus(loadedQuestion ? 'ready' : 'missing');
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setQuestion(null);
        setStatus('error');
      });
    // Favorite state is optional; it must not hold back the read-only question.
    void getQuestionFavoriteState(user.id, questionId)
      .then((isFavorite) => {
        if (requestId === requestIdRef.current) setFavorite(isFavorite);
      })
      .catch(() => undefined)
      .finally(() => {
        if (requestId === requestIdRef.current) setFavoriteLoading(false);
      });
  }, [questionId, user?.id]);

  useEffect(() => {
    loadQuestion();
    if (shareId) void markQuestionShareOpened(shareId).catch(() => undefined);
    return () => { requestIdRef.current += 1; };
  }, [loadQuestion, shareId]);

  const handleToggleFavorite = useCallback(async () => {
    if (!question || !user?.id || favoriteLoading || favoriteLockRef.current) return;
    favoriteLockRef.current = true;
    setFavoritePending(true);
    setActionError('');
    const previous = favorite;
    setFavorite(!previous);
    try {
      const persisted = await setQuestionFavorite(user.id, question.id, !previous);
      setFavorite(persisted);
    } catch {
      setFavorite(previous);
      setActionError('Favori durumu güncellenemedi. Tekrar deneyebilirsin.');
    } finally {
      favoriteLockRef.current = false;
      setFavoritePending(false);
    }
  }, [favorite, favoriteLoading, question, user?.id]);

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Soru listesine dön" hitSlop={8} onPress={() => {
            if (router.canGoBack()) router.back();
            else if (source === 'message' && messageUserId) router.replace({ pathname: '/messages/[userId]', params: { userId: messageUserId } });
            else router.replace(source === 'shared' ? '/shared-questions' : '/favorite-questions');
          }} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={22} color={tokens.colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>SALT OKUNUR ARŞİV</Text>
            <Text accessibilityRole="header" style={styles.title}>Soru Detayı</Text>
          </View>
        </View>

        {status === 'ready' && question ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
              {actionError ? <Text accessibilityLiveRegion="polite" style={styles.actionError}>{actionError}</Text> : null}
              <QuestionDetailSurface
                colors={tokens.colors}
                favorite={favorite}
                favoritePending={favoritePending || favoriteLoading}
                onShare={() => setShareVisible(true)}
                onToggleFavorite={() => void handleToggleFavorite()}
                question={question}
                styles={styles}
              />
            </View>
          </ScrollView>
        ) : (
          <DetailState status={status} onRetry={loadQuestion} styles={styles} tokens={tokens} />
        )}
      </SafeAreaView>
      <QuestionShareSheet questionId={question?.id} visible={shareVisible && Boolean(question)} allowInboxDelivery onClose={() => setShareVisible(false)} />
    </View>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function DetailState({ status, onRetry, styles, tokens }: {
  status: LoadStatus;
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (status === 'loading') return <View style={styles.stateBox}><ActivityIndicator color={tokens.colors.secondary} /><Text style={styles.stateTitle}>Soru yükleniyor</Text></View>;
  const missing = status === 'missing';
  return <View style={styles.stateBox}><Ionicons name={missing ? 'help-outline' : 'cloud-offline-outline'} size={32} color={missing ? tokens.colors.textMuted : tokens.colors.warning} /><Text style={styles.stateTitle}>{missing ? 'Soru bulunamadı' : 'Soru yüklenemedi'}</Text>{!missing ? <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>Tekrar Dene</Text></Pressable> : null}</View>;
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1 },
    header: { width: '100%', maxWidth: 760, alignSelf: 'center', minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop, paddingBottom: 8 },
    backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { ...tokens.type.eyebrow, color: colors.secondary, fontFamily: fonts.bodySemiBold },
    title: { ...tokens.type.title, color: colors.text, fontFamily: fonts.headingBold },
    scrollContent: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: 10 },
    actionError: { marginBottom: 10, color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
    detailHeader: { padding: tokens.layout.cardPadding, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, borderLeftWidth: 3, borderLeftColor: colors.primary, ...shadow.card },
    detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    detailMeta: { minHeight: 25, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, color: colors.secondary, backgroundColor: colors.secondarySoft, fontFamily: fonts.monoSemiBold, fontSize: 10, lineHeight: 15 },
    detailQuestion: { color: colors.text, fontFamily: fonts.headingBold, fontSize: tokens.layout.isCompact ? 18 : 22, lineHeight: tokens.layout.isCompact ? 25 : 30 },
    detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    detailActionButton: { flexGrow: 1, minWidth: 150, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 13, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    detailActionSelected: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    detailActionText: { color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17 },
    detailActionSelectedText: { color: colors.warning },
    answerSection: { marginTop: 24 },
    answerSectionTitle: { ...tokens.type.title, color: colors.text, fontFamily: fonts.headingBold },
    spoilerNote: { marginTop: 4, color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
    answerList: { gap: 9, marginTop: 12 },
    answerRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    answerIndex: { width: 32, height: 32, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
    answerIndexText: { color: colors.textMuted, fontFamily: fonts.monoBold, fontSize: 12 },
    answerText: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 21 },
    stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    stateTitle: { marginTop: 11, color: colors.text, fontFamily: fonts.headingBold, fontSize: 18, lineHeight: 24, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13 },
    disabled: { opacity: 0.48 },
    pressed: { opacity: 0.72, backgroundColor: colors.surfacePressed },
  });
}
