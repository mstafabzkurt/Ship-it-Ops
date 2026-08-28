import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CosmeticPreview from '../../src/components/cosmetics/CosmeticPreview';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { calculateSuccessRate, createLocalRankingProfile } from '../../src/utils/ranking';

export default function RankingScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const {
    companyName,
    currentRank,
    correctAnswers,
    wrongAnswers,
    rankingScore,
    rankingOutcomeStats,
    equippedAvatarId,
    equippedAvatarFrameId,
    equippedAvatar,
    equippedAvatarFrame,
  } = useReputation();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const isDesktop = width >= 1040;
  const localProfile = useMemo(() => createLocalRankingProfile({
    companyName,
    avatarId: equippedAvatarId,
    avatarFrameId: equippedAvatarFrameId,
    careerRank: currentRank,
    rankingScore,
    successRate: calculateSuccessRate(correctAnswers, wrongAnswers),
    successCount: rankingOutcomeStats.successCount,
  }), [
    companyName,
    correctAnswers,
    currentRank,
    equippedAvatarFrameId,
    equippedAvatarId,
    rankingOutcomeStats.successCount,
    rankingScore,
    wrongAnswers,
  ]);

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, isDesktop && styles.containerDesktop]}>
            <View style={styles.pageHeader}>
              <Text style={styles.eyebrow}>OPERASYON SIRALAMASI</Text>
              <Text style={styles.title}>Sıralama</Text>
              <Text style={styles.description}>
                Global ve şirket sıralamaları, çevrimiçi oyuncu kimliği kullanıma açıldığında burada yer alacak.
              </Text>
            </View>

            <View style={styles.localPanel}>
              <View style={styles.localIdentity}>
                <CosmeticPreview
                  avatar={equippedAvatar}
                  frame={equippedAvatarFrame}
                  size={tokens.layout.isCompact ? 76 : 88}
                  accessibilityLabel={`${localProfile.companyName} sıralama kimliği`}
                />
                <View style={styles.localIdentityCopy}>
                  <Text style={styles.localEyebrow}>SENİN SIRALAMA PUANIN</Text>
                  <Text style={styles.companyName}>{localProfile.companyName}</Text>
                  <View style={styles.rankLine}>
                    <View style={styles.rankNode} />
                    <Text style={styles.rankName}>{localProfile.careerRank.name}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.localMetrics}>
                <View style={[styles.localMetric, styles.scoreMetric]}>
                  <Text style={styles.metricLabel}>SIRALAMA PUANI</Text>
                  <Text style={styles.scoreValue}>{localProfile.rankingScore.toLocaleString('tr-TR')}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.localMetric}>
                  <Text style={styles.metricLabel}>BAŞARI ORANI</Text>
                  <Text style={styles.metricValue}>%{localProfile.successRate.toFixed(2)}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.localMetric}>
                  <Text style={styles.metricLabel}>BAŞARILI KRİZ</Text>
                  <Text style={styles.metricValue}>{localProfile.successCount.toLocaleString('tr-TR')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.board}>
              <View style={styles.boardHeader}>
                <View style={styles.boardTitleGroup}>
                  <View style={styles.statusDot} />
                  <Text style={styles.boardTitle}>LİDERLİK TABLOSU</Text>
                </View>
                <Text style={styles.boardStatus}>BEKLEMEDE</Text>
              </View>

              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.columnGuide}
              >
                <Text style={[styles.columnLabel, styles.positionColumn]}>#</Text>
                <Text style={[styles.columnLabel, styles.operatorColumn]}>OPERATÖR</Text>
                <Text style={[styles.columnLabel, styles.rankColumn]}>RÜTBE</Text>
                <Text style={[styles.columnLabel, styles.scoreColumn]}>PUAN</Text>
              </View>

              <View style={styles.emptyState}>
                <View style={styles.instrumentRail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <View style={styles.railNode} />
                  <View style={styles.railLine} />
                  <View style={styles.iconHousing}>
                    <Ionicons name="podium-outline" size={34} color={tokens.colors.secondary} />
                  </View>
                  <View style={styles.railLine} />
                  <View style={styles.railNode} />
                </View>

                <Text style={styles.emptyTitle}>Sıralama alanı hazırlanıyor</Text>
                <Text style={styles.emptyDescription}>
                  Hesap ve çevrimiçi kimlik desteği eklendiğinde gerçek oyuncu ve şirket konumları burada görüntülenecek.
                </Text>

                <View style={styles.readinessLine}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={16}
                    color={tokens.colors.textMuted}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                  <Text style={styles.readinessText}>Çevrimiçi kimlik desteği bekleniyor</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(tokens: DashboardTokens) {
  const { colors, radius, shadow } = tokens;

  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: tokens.layout.pageBottom },
    container: {
      width: '100%',
      maxWidth: tokens.layout.contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: tokens.layout.pageGutter,
      paddingTop: tokens.layout.pageTop,
    },
    containerDesktop: { paddingHorizontal: tokens.layout.pageGutterWide },
    pageHeader: { maxWidth: 720, marginBottom: tokens.layout.isCompact ? 18 : 28 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 4 },
    title: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    description: {
      ...tokens.type.bodySmall,
      maxWidth: 650,
      marginTop: tokens.layout.isCompact ? 6 : 8,
      fontFamily: fonts.body,
      color: colors.textMuted,
    },
    localPanel: {
      width: '100%',
      maxWidth: 860,
      alignSelf: 'center',
      marginBottom: tokens.layout.isCompact ? 14 : 20,
      padding: tokens.layout.isCompact ? 13 : 17,
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    localIdentity: { flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 10 : 14 },
    localIdentityCopy: { flex: 1, minWidth: 0 },
    localEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 3 },
    companyName: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    rankLine: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
    rankNode: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
    rankName: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 16, color: colors.primary, textTransform: 'uppercase' },
    localMetrics: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: tokens.layout.isCompact ? 11 : 14,
      paddingTop: tokens.layout.isCompact ? 10 : 13,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    localMetric: { flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: tokens.layout.isNarrow ? 7 : 12 },
    scoreMetric: { flex: tokens.layout.isNarrow ? 1.15 : 1.35, paddingLeft: 0 },
    metricDivider: { width: 1, backgroundColor: colors.dividerSubtle },
    metricLabel: { fontFamily: fonts.bodySemiBold, fontSize: tokens.layout.isNarrow ? 8 : 9, lineHeight: 12, letterSpacing: 0.45, color: colors.textMuted },
    scoreValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 21 : 25, lineHeight: tokens.layout.isCompact ? 27 : 31, color: colors.warning, marginTop: 1 },
    metricValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 16 : 19, lineHeight: tokens.layout.isCompact ? 22 : 25, color: colors.text, marginTop: 2 },
    board: {
      width: '100%',
      maxWidth: 860,
      alignSelf: 'center',
      overflow: 'hidden',
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.16,
    },
    boardHeader: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: tokens.layout.cardPaddingTight,
      backgroundColor: colors.secondarySurfaceRaised,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
    },
    boardTitleGroup: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted, opacity: 0.65 },
    boardTitle: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.75, color: colors.text },
    boardStatus: { flexShrink: 0, fontFamily: fonts.monoSemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textMuted },
    columnGuide: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.layout.cardPaddingTight,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
    },
    columnLabel: { fontFamily: fonts.monoMedium, fontSize: tokens.layout.isNarrow ? 9 : 10, lineHeight: 14, color: colors.textMuted },
    positionColumn: { width: tokens.layout.isNarrow ? 22 : 28 },
    operatorColumn: { flex: 1, minWidth: 0 },
    rankColumn: { width: tokens.layout.isNarrow ? 58 : 76, textAlign: 'right' },
    scoreColumn: { width: tokens.layout.isNarrow ? 48 : 64, textAlign: 'right' },
    emptyState: {
      minHeight: tokens.layout.isCompact ? 248 : 310,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.layout.isCompact ? 20 : 40,
      paddingVertical: tokens.layout.isCompact ? 28 : 42,
    },
    instrumentRail: { width: '100%', maxWidth: 360, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    railNode: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.secondary, opacity: 0.7 },
    railLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
    iconHousing: {
      width: 58,
      height: 58,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.secondarySurfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    emptyTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text, textAlign: 'center' },
    emptyDescription: {
      ...tokens.type.bodySmall,
      maxWidth: 520,
      marginTop: 7,
      fontFamily: fonts.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    readinessLine: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: tokens.layout.isCompact ? 18 : 22,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    readinessText: { flexShrink: 1, fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted, textAlign: 'center' },
  });
}
