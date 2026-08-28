import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, LayoutAnimation, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AchievementCard from '../../src/components/reputation/AchievementCard';
import RankTierCard, { type RankTierVisual } from '../../src/components/reputation/RankTierCard';
import ReputationSummaryCard from '../../src/components/reputation/ReputationSummaryCard';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { RANKS, type Rank, useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';

const TIER_ORDER: Rank['tier'][] = ['junior', 'engineer', 'senior', 'lead', 'manager', 'director', 'cto'];

const TIER_CONFIG: Record<Rank['tier'], RankTierVisual> = {
  junior: { label: 'Junior', icon: 'leaf-outline', color: '#8A93A6', softColor: 'rgba(138,147,166,0.12)' },
  engineer: { label: 'Mühendis', icon: 'flash-outline', color: '#49D7C5', softColor: 'rgba(73,215,197,0.14)' },
  senior: { label: 'Kıdemli', icon: 'layers-outline', color: '#60AFFF', softColor: 'rgba(96,175,255,0.13)' },
  lead: { label: 'Takım Lideri', icon: 'git-network-outline', color: '#A996FF', softColor: 'rgba(139,124,246,0.18)' },
  manager: { label: 'Müdür', icon: 'people-outline', color: '#FFC857', softColor: 'rgba(255,200,87,0.15)' },
  director: { label: 'Direktör', icon: 'compass-outline', color: '#FF7185', softColor: 'rgba(255,113,133,0.16)' },
  cto: { label: 'CTO', icon: 'diamond-outline', color: '#FFD76F', softColor: 'rgba(255,215,111,0.16)' },
};

function groupRanksByTier() {
  return TIER_ORDER.map((tier) => ({ tier, ranks: RANKS.filter((rank) => rank.tier === tier) }));
}

export default function ReputationScreen() {
  const { width } = useWindowDimensions();
  const { careerXp, score, currentRank, nextRank, rankProgress, badges } = useReputation();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const rankGroups = useMemo(groupRanksByTier, []);
  const [expandedTier, setExpandedTier] = useState<Rank['tier'] | null>(currentRank.tier);
  const [reduceMotion, setReduceMotion] = useState(false);
  const isDesktop = width >= 1040;
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const lockedCount = badges.length - earnedCount;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    setExpandedTier(currentRank.tier);
  }, [currentRank.tier]);

  const handleToggleTier = useCallback((tier: Rank['tier']) => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(170, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
      );
    }
    setExpandedTier((openTier) => openTier === tier ? null : tier);
  }, [reduceMotion]);

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />

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
              rankIcon={TIER_CONFIG[currentRank.tier].icon}
            />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>KARİYER HARİTASI</Text>
                <Text style={styles.sectionTitle}>Rütbe Yolu</Text>
              </View>
              <View style={styles.sectionRule} />
            </View>

            <View style={styles.progressionMap}>
              <View style={styles.mapHeader}>
                <Text style={styles.mapHeaderLabel}>SEVİYE HATTI</Text>
                <Text style={styles.mapHeaderValue}>{careerXp.toLocaleString('tr-TR')} XP</Text>
              </View>
              <View style={styles.rankGrid}>
                {rankGroups.map(({ tier, ranks }) => (
                  <RankTierCard
                    key={tier}
                    ranks={ranks}
                    careerXp={careerXp}
                    currentRank={currentRank}
                    visual={TIER_CONFIG[tier]}
                    isExpanded={expandedTier === tier}
                    onToggle={() => handleToggleTier(tier)}
                  />
                ))}
              </View>
            </View>

            <View style={[styles.sectionHeader, styles.achievementHeader]}>
              <View>
                <Text style={styles.sectionEyebrow}>KOLEKSİYON</Text>
                <Text style={styles.sectionTitle}>Rozetler ({earnedCount}/{badges.length})</Text>
              </View>
              <View style={styles.badgeSummaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={tokens.colors.secondary} />
                  <Text style={[styles.summaryChipText, styles.summaryChipTextEarned]}>{earnedCount} kazanıldı</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="lock-closed-outline" size={15} color={tokens.colors.textMuted} />
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
    scrollContent: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: tokens.layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    containerDesktop: { paddingHorizontal: tokens.layout.pageGutterWide },
    pageHeader: { marginBottom: tokens.layout.isCompact ? 12 : 20 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 4 },
    header: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 16,
      marginTop: tokens.layout.isCompact ? 22 : 34, marginBottom: tokens.layout.isCompact ? 10 : 14,
    },
    sectionEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 2 },
    sectionTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    sectionRule: { flex: 1, height: 1, marginBottom: 5, backgroundColor: colors.dividerSubtle },
    progressionMap: { overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.14 },
    mapHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: tokens.layout.cardPaddingTight, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle, backgroundColor: colors.secondarySurfaceRaised },
    mapHeaderLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.75, color: colors.textMuted },
    mapHeaderValue: { fontFamily: fonts.monoBold, fontSize: 12, lineHeight: 17, color: colors.secondary },
    rankGrid: { paddingHorizontal: tokens.layout.isCompact ? 12 : 18 },
    achievementHeader: { alignItems: 'center' },
    badgeSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 14 },
    summaryItem: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6 },
    summaryChipText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    summaryChipTextEarned: { color: colors.secondary },
    achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 9 : 12 },
    achievementGridItem: { width: '100%' },
    achievementGridItemDesktop: { width: '48%', flexGrow: 1 },
  });
}
