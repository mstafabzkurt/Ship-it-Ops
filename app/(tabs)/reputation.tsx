import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import AchievementCard from '../../src/components/reputation/AchievementCard';
import RankTierCard, { type RankTierVisual } from '../../src/components/reputation/RankTierCard';
import ReputationSummaryCard from '../../src/components/reputation/ReputationSummaryCard';
import { dashboardType, getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { RANKS, type Rank, useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';

const TIER_ORDER: Rank['tier'][] = ['junior', 'engineer', 'senior', 'lead', 'manager', 'director', 'cto'];

const TIER_CONFIG: Record<Rank['tier'], RankTierVisual> = {
  junior: { label: 'Junior Mühendis', emoji: '🌱', color: '#8A93A6', softColor: 'rgba(138,147,166,0.12)' },
  engineer: { label: 'Mühendis', emoji: '⚡', color: '#49D7C5', softColor: 'rgba(73,215,197,0.14)' },
  senior: { label: 'Kıdemli Mühendis', emoji: '🔵', color: '#60AFFF', softColor: 'rgba(96,175,255,0.13)' },
  lead: { label: 'Takım Lideri', emoji: '🟣', color: '#A996FF', softColor: 'rgba(139,124,246,0.18)' },
  manager: { label: 'Mühendislik Müdürü', emoji: '🟠', color: '#FFC857', softColor: 'rgba(255,200,87,0.15)' },
  director: { label: 'Direktör', emoji: '🔴', color: '#FF7185', softColor: 'rgba(255,113,133,0.16)' },
  cto: { label: 'CTO', emoji: '👑', color: '#FFD76F', softColor: 'rgba(255,215,111,0.16)' },
};

function groupRanksByTier() {
  return TIER_ORDER.map((tier) => ({ tier, ranks: RANKS.filter((rank) => rank.tier === tier) }));
}

export default function ReputationScreen() {
  const { width } = useWindowDimensions();
  const { careerXp, score, currentRank, nextRank, rankProgress, badges } = useReputation();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const rankGroups = useMemo(groupRanksByTier, []);
  const isTablet = width >= 680;
  const isDesktop = width >= 1040;
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const lockedCount = badges.length - earnedCount;

  return (
    <LinearGradient
      colors={[tokens.colors.canvasGlow, tokens.colors.canvas, tokens.colors.canvas]}
      locations={[0, 0.34, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.orbPrimary} />
      <View pointerEvents="none" style={styles.orbSecondary} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.container, isDesktop && styles.containerDesktop]}>
            <View style={styles.pageHeader}>
              <Text style={styles.eyebrow}>KARİYER İLERLEMESİ</Text>
              <Text style={styles.header}>Kariyer ve İtibar</Text>
            </View>

            <ReputationSummaryCard
              careerXp={careerXp}
              reputation={score}
              currentRank={currentRank}
              nextRank={nextRank}
              progress={rankProgress}
              accentColor={TIER_CONFIG[currentRank.tier].color}
              accentSoftColor={TIER_CONFIG[currentRank.tier].softColor}
              rankIcon={TIER_CONFIG[currentRank.tier].emoji}
            />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>KARİYER HARİTASI</Text>
                <Text style={styles.sectionTitle}>Rütbe Yolu</Text>
              </View>
            </View>

            <View style={styles.rankGrid}>
              {rankGroups.map(({ tier, ranks }) => (
                <View
                  key={tier}
                  style={[
                    styles.rankGridItem,
                    isTablet && styles.rankGridItemTablet,
                    isDesktop && styles.rankGridItemDesktop,
                  ]}
                >
                  <RankTierCard ranks={ranks} careerXp={careerXp} currentRank={currentRank} visual={TIER_CONFIG[tier]} />
                </View>
              ))}
            </View>

            <View style={[styles.sectionHeader, styles.achievementHeader]}>
              <View>
                <Text style={styles.sectionEyebrow}>KOLEKSİYON</Text>
                <Text style={styles.sectionTitle}>Rozetler ({earnedCount}/{badges.length})</Text>
              </View>
              <View style={styles.badgeSummaryRow}>
                <View style={[styles.summaryChip, styles.summaryChipEarned]}>
                  <Text style={styles.summaryChipIcon}>🏆</Text>
                  <Text style={[styles.summaryChipText, styles.summaryChipTextEarned]}>{earnedCount} kazanıldı</Text>
                </View>
                <View style={styles.summaryChip}>
                  <Text style={styles.summaryChipIcon}>🔒</Text>
                  <Text style={styles.summaryChipText}>{lockedCount} kilitli</Text>
                </View>
              </View>
            </View>

            <View style={styles.achievementGrid}>
              {badges.map((badge) => (
                <View
                  key={badge.id}
                  style={[
                    styles.achievementGridItem,
                    isTablet && styles.achievementGridItemTablet,
                    isDesktop && styles.achievementGridItemDesktop,
                  ]}
                >
                  <AchievementCard badge={badge} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function makeStyles(tokens: DashboardTokens) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    orbPrimary: {
      position: 'absolute', width: 300, height: 300, top: -170, right: -105,
      borderRadius: 150, backgroundColor: colors.primarySoft, opacity: 0.72,
    },
    orbSecondary: {
      position: 'absolute', width: 240, height: 240, top: 520, left: -180,
      borderRadius: 120, backgroundColor: colors.secondarySoft, opacity: 0.42,
    },
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: tokens.layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    containerDesktop: { paddingHorizontal: tokens.layout.pageGutterWide },
    pageHeader: { marginBottom: 18 },
    eyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 5 },
    header: { ...dashboardType.display, fontFamily: fonts.headingBold, color: colors.text },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16,
      marginTop: 34, marginBottom: 14,
    },
    sectionEyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 3 },
    sectionTitle: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text },
    rankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    rankGridItem: { width: '100%' },
    rankGridItemTablet: { width: '48%', flexGrow: 1 },
    rankGridItemDesktop: { width: '31%', flexGrow: 1 },
    achievementHeader: { alignItems: 'center' },
    badgeSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
    summaryChip: {
      minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11,
      borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
    },
    summaryChipEarned: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    summaryChipIcon: { fontSize: 14, lineHeight: 18 },
    summaryChipText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    summaryChipTextEarned: { color: colors.secondary },
    achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    achievementGridItem: { width: '100%' },
    achievementGridItemTablet: { width: '48%', flexGrow: 1 },
    achievementGridItemDesktop: { width: '31%', flexGrow: 1 },
  });
}
