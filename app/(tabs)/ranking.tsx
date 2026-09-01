import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import LeaderboardRow from '../../src/components/ranking/LeaderboardRow';
import {
  fetchGlobalLeaderboard,
  fetchMyLeaderboardProfile,
  getLeaderboardErrorMessage,
  type LeaderboardEntry,
} from '../../src/services/leaderboard';
import { useAuth } from '../../src/state/AuthContext';
import { useLeaderboard } from '../../src/state/LeaderboardContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { trackEvent } from '../../src/utils/telemetry';

type LoadState = 'loading' | 'ready' | 'error';

export default function RankingScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { syncStatus, syncError, lastSyncedAt, retrySync } = useLeaderboard();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const compact = width < 760;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  useFocusEffect(useCallback(() => {
    void trackEvent('leaderboard_opened');
  }, []));

  const loadLeaderboard = useCallback(async (initial = false) => {
    if (!user?.id) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (initial) setLoadState('loading');
    else setRefreshing(true);
    setLoadError(null);

    try {
      const [globalRows, currentRow] = await Promise.all([
        fetchGlobalLeaderboard(),
        fetchMyLeaderboardProfile(user.id),
      ]);
      if (requestIdRef.current !== requestId) return;
      setEntries(globalRows);
      setMyEntry(currentRow);
      setLoadState('ready');
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setLoadError(getLeaderboardErrorMessage(error));
      setLoadState('error');
    } finally {
      if (requestIdRef.current === requestId) setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadLeaderboard(true);
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadLeaderboard]);

  useEffect(() => {
    if (lastSyncedAt === null) return;
    void loadLeaderboard(false);
  }, [lastSyncedAt, loadLeaderboard]);

  const handleRefresh = useCallback(() => {
    retrySync();
    void loadLeaderboard(false);
  }, [loadLeaderboard, retrySync]);

  const topEntries = useMemo(() => entries.slice(0, 10), [entries]);
  const currentUserIndex = user?.id
    ? entries.findIndex((entry) => entry.userId === user.id)
    : -1;
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
  const currentUserEntry = currentUserIndex >= 0 ? entries[currentUserIndex] : myEntry;
  const isCurrentUserInTopTen = currentUserRank !== null && currentUserRank <= 10;
  const pinnedCurrentUser = loadState === 'ready' && user?.id && currentUserEntry && !isCurrentUserInTopTen
    ? currentUserEntry
    : null;
  const pinnedCurrentUserRank = currentUserRank !== null && currentUserRank > 10
    ? currentUserRank
    : null;
  const statusLabel = refreshing
    ? 'YENİLENİYOR'
    : loadState === 'error'
      ? 'BAĞLANTI HATASI'
      : syncStatus === 'waiting' || syncStatus === 'syncing'
        ? 'SENKRONİZE EDİLİYOR'
      : topEntries.length > 0
        ? `CANLI / ${topEntries.length} KAYIT`
        : 'HAZIR';

  const renderItem = useCallback(({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <LeaderboardRow
      entry={item}
      position={index + 1}
      isCurrentUser={item.userId === user?.id}
      compact={compact}
      isLast={index === topEntries.length - 1}
    />
  ), [compact, topEntries.length, user?.id]);

  return (
    <View style={styles.background}>
      <View style={styles.topRule} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          accessibilityLabel="Global Ship It Ops sıralaması"
          data={loadState === 'ready' ? topEntries : []}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={(
            <>
              <View style={styles.pageHeader}>
                <Text style={styles.eyebrow}>GLOBAL SIRALAMA</Text>
                <Text accessibilityRole="header" style={styles.title}>Sıralama</Text>
                <Text style={styles.description}>
                  Kullanıcılar; Sıralama Puanı, Başarı Oranı ve başarılı soru sayısına göre sıralanır.
                </Text>
              </View>

              {syncError && loadState !== 'error' ? (
                <View accessibilityLiveRegion="polite" style={styles.syncNotice}>
                  <Ionicons
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    name="cloud-offline-outline"
                    size={20}
                    color={tokens.colors.warning}
                  />
                  <View style={styles.syncNoticeCopy}>
                    <Text style={styles.syncNoticeTitle}>Bulut projeksiyonu bekliyor</Text>
                    <Text style={styles.syncNoticeText}>{syncError}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sıralama senkronizasyonunu tekrar dene"
                    onPress={retrySync}
                    style={({ pressed }) => [styles.inlineRetry, pressed && styles.pressed]}
                  >
                    <Text style={styles.inlineRetryText}>Tekrar Dene</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.boardHeader}>
                <View style={styles.boardTitleGroup}>
                  <View style={[
                    styles.statusDot,
                    syncStatus === 'synced' && loadState === 'ready' && styles.statusDotLive,
                  ]} />
                  <View style={styles.boardTitleCopy}>
                    <Text style={styles.boardTitle}>TOP 10</Text>
                    <Text style={styles.boardStatus}>{statusLabel}</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Global sıralamayı yenile"
                  accessibilityState={{ busy: refreshing }}
                  disabled={refreshing}
                  onPress={handleRefresh}
                  style={({ pressed }) => [
                    styles.refreshButton,
                    pressed && !refreshing && styles.pressed,
                    refreshing && styles.refreshDisabled,
                  ]}
                >
                  {refreshing ? (
                    <ActivityIndicator accessibilityElementsHidden size="small" color={tokens.colors.secondary} />
                  ) : (
                    <Ionicons
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      name="refresh-outline"
                      size={18}
                      color={tokens.colors.secondary}
                    />
                  )}
                  <Text style={styles.refreshText}>Yenile</Text>
                </Pressable>
              </View>

              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.columnGuide}>
                {compact ? (
                  <>
                    <Text style={[styles.columnLabel, styles.mobilePositionColumn]}>#</Text>
                    <Text style={[styles.columnLabel, styles.mobileOperatorColumn]}>OPERATÖR / PERFORMANS</Text>
                    <Text style={[styles.columnLabel, styles.mobileScoreColumn]}>PUAN</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.columnLabel, styles.positionColumn]}>#</Text>
                    <Text style={[styles.columnLabel, styles.operatorColumn]}>OPERATÖR</Text>
                    <Text style={[styles.columnLabel, styles.rankColumn]}>KARİYER RÜTBESİ</Text>
                    <Text style={[styles.columnLabel, styles.successColumn]}>BAŞARI</Text>
                    <Text style={[styles.columnLabel, styles.countColumn]}>BAŞARILI SORU</Text>
                    <Text style={[styles.columnLabel, styles.scoreColumn]}>PUAN</Text>
                  </>
                )}
              </View>
            </>
          )}
          ListEmptyComponent={(
            loadState === 'loading'
              ? <LeaderboardSkeleton styles={styles} />
              : loadState === 'error'
                ? (
                  <LeaderboardMessage
                    icon="cloud-offline-outline"
                    title="Sıralama yüklenemedi"
                    description={loadError || 'Global sıralamaya ulaşılamıyor.'}
                    actionLabel="Tekrar Dene"
                    onAction={handleRefresh}
                    styles={styles}
                    tokens={tokens}
                  />
                )
                : (
                  <LeaderboardMessage
                    icon="podium-outline"
                    title="Sıralama henüz boş"
                    description="Henüz yayınlanmış bir sıralama profili yok. Yerel ilerlemen senkronize olduğunda liste burada oluşacak."
                    styles={styles}
                    tokens={tokens}
                  />
                )
          )}
          ListFooterComponent={pinnedCurrentUser ? (
            <View style={styles.pinnedSection}>
              <View style={styles.pinnedHeading}>
                <View style={styles.pinnedTitleGroup}>
                  <Ionicons
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    name="locate-outline"
                    size={18}
                    color={tokens.colors.secondary}
                  />
                  <Text style={styles.pinnedEyebrow}>SENİN SIRAN</Text>
                </View>
                <Text style={styles.pinnedStatus}>SABİTLENMİŞ</Text>
              </View>
              <Text style={styles.pinnedDescription}>
                {pinnedCurrentUserRank === null
                  ? 'Top 50 dışında. Kesin global konum tahmin edilmez.'
                  : 'İlk 10 dışındaki güncel global konumun.'}
              </Text>
              <LeaderboardRow
                entry={pinnedCurrentUser}
                position={pinnedCurrentUserRank}
                isCurrentUser
                compact={compact}
                isLast
                standalone
                positionFallbackLabel="Top 50 dışında"
              />
            </View>
          ) : null}
        />
      </SafeAreaView>
    </View>
  );
}

function LeaderboardSkeleton({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Sıralama yükleniyor" style={styles.skeletonWrap}>
      {[0, 1, 2, 3, 4].map((item) => (
        <View key={item} style={[styles.skeletonRow, item === 4 && styles.messageEnd]}>
          <View style={styles.skeletonPosition} />
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonCopy}>
            <View style={styles.skeletonName} />
            <View style={styles.skeletonMeta} />
          </View>
          <View style={styles.skeletonScore} />
        </View>
      ))}
    </View>
  );
}

interface LeaderboardMessageProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: DashboardTokens;
}

function LeaderboardMessage({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  styles,
  tokens,
}: LeaderboardMessageProps) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.messageState}>
      <View style={styles.messageIcon}>
        <Ionicons
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          name={icon}
          size={28}
          color={tokens.colors.secondary}
        />
      </View>
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageDescription}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Ionicons
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            name="refresh-outline"
            size={18}
            color={tokens.colors.secondary}
          />
          <Text style={styles.retryText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(tokens: DashboardTokens) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5, pointerEvents: 'none' },
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    list: { flex: 1 },
    listContent: {
      flexGrow: 1,
      width: '100%',
      maxWidth: tokens.layout.contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: tokens.layout.isCompact ? tokens.layout.pageGutter : tokens.layout.pageGutterWide,
      paddingTop: tokens.layout.pageTop,
      paddingBottom: tokens.layout.pageBottom,
    },
    pageHeader: { maxWidth: 720, marginBottom: tokens.layout.isCompact ? 18 : 26 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 4 },
    title: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    description: { ...tokens.type.bodySmall, maxWidth: 650, marginTop: 7, fontFamily: fonts.body, color: colors.textMuted },
    syncNotice: {
      width: '100%',
      flexDirection: tokens.layout.isCompact ? 'column' : 'row',
      alignItems: tokens.layout.isCompact ? 'flex-start' : 'center',
      gap: 10,
      marginBottom: 14,
      padding: 12,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.warning,
      backgroundColor: colors.warningSoft,
    },
    syncNoticeCopy: { flex: 1, minWidth: 0 },
    syncNoticeTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.text },
    syncNoticeText: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.textMuted },
    inlineRetry: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.sm },
    inlineRetryText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.warning },
    boardHeader: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: tokens.layout.cardPaddingTight,
      borderTopLeftRadius: radius.md,
      borderTopRightRadius: radius.md,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.secondarySurfaceRaised,
    },
    boardTitleGroup: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
    boardTitleCopy: { minWidth: 0 },
    statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textMuted },
    statusDotLive: { backgroundColor: colors.secondary },
    boardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.75, color: colors.text },
    boardStatus: { marginTop: 1, fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 12, letterSpacing: 0.5, color: colors.textMuted },
    refreshButton: {
      minWidth: 96,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 12,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.secondarySurface,
    },
    refreshDisabled: { opacity: 0.55 },
    refreshText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.secondary },
    pressed: { opacity: 0.72 },
    columnGuide: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.layout.isCompact ? 10 : tokens.layout.cardPaddingTight,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.dividerSubtle,
      backgroundColor: colors.secondarySurface,
    },
    columnLabel: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.4, color: colors.textMuted },
    mobilePositionColumn: { width: 30 },
    mobileOperatorColumn: { flex: 1, minWidth: 0, marginLeft: 56 },
    mobileScoreColumn: { width: 58, textAlign: 'right' },
    positionColumn: { width: 100 },
    operatorColumn: { flex: 1, minWidth: 0 },
    rankColumn: { width: 162, textAlign: 'right' },
    successColumn: { width: 94, textAlign: 'right' },
    countColumn: { width: 84, textAlign: 'right' },
    scoreColumn: { width: 102, textAlign: 'right' },
    skeletonWrap: { width: '100%' },
    skeletonRow: {
      minHeight: 78,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: tokens.layout.cardPaddingTight,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.dividerSubtle,
      backgroundColor: colors.secondarySurface,
    },
    skeletonPosition: { width: 24, height: 10, borderRadius: 4, backgroundColor: colors.dividerSubtle },
    skeletonAvatar: { width: 46, height: 46, borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised },
    skeletonCopy: { flex: 1, gap: 7 },
    skeletonName: { width: '54%', maxWidth: 240, height: 11, borderRadius: 4, backgroundColor: colors.borderSubtle },
    skeletonMeta: { width: '36%', maxWidth: 160, height: 8, borderRadius: 4, backgroundColor: colors.dividerSubtle },
    skeletonScore: { width: 58, height: 14, borderRadius: 4, backgroundColor: colors.borderSubtle },
    messageState: {
      minHeight: tokens.layout.isCompact ? 230 : 280,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.layout.isCompact ? 20 : 40,
      paddingVertical: 32,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.dividerSubtle,
      borderBottomLeftRadius: radius.md,
      borderBottomRightRadius: radius.md,
      backgroundColor: colors.secondarySurface,
    },
    messageEnd: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
    messageIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised },
    messageTitle: { ...tokens.type.title, marginTop: 14, fontFamily: fonts.headingBold, color: colors.text, textAlign: 'center' },
    messageDescription: { ...tokens.type.bodySmall, maxWidth: 520, marginTop: 7, fontFamily: fonts.body, color: colors.textMuted, textAlign: 'center' },
    retryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, paddingHorizontal: 16, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
    retryText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.secondary },
    pinnedSection: {
      marginTop: tokens.layout.isCompact ? 18 : 24,
      paddingTop: tokens.layout.isCompact ? 14 : 18,
      borderTopWidth: 1,
      borderTopColor: colors.borderStrong,
    },
    pinnedHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    pinnedTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pinnedEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary },
    pinnedStatus: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.55, color: colors.textMuted },
    pinnedDescription: { ...tokens.type.bodySmall, maxWidth: 620, marginTop: 4, marginBottom: 10, fontFamily: fonts.body, color: colors.textMuted },
  });
}
