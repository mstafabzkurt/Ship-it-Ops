import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import AchievementCard from '../../src/components/reputation/AchievementCard';
import RankTierCard, { type RankTierVisual } from '../../src/components/reputation/RankTierCard';
import ReputationSummaryCard from '../../src/components/reputation/ReputationSummaryCard';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { ACHIEVEMENT_GROUPS } from '../../src/config/achievements';
import type { AchievementId } from '../../src/config/achievements';
import { RANKS, type Rank, useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { trackEvent } from '../../src/utils/telemetry';

const TIER_ORDER: Rank['tier'][] = ['junior', 'engineer', 'senior', 'lead', 'manager', 'director', 'cto'];
type ReputationTabId = 'career' | 'badges';

const REPUTATION_TABS: { id: ReputationTabId; label: string }[] = [
  { id: 'career', label: 'Kariyer' },
  { id: 'badges', label: 'Rozetler' },
];

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

function ReputationTabButton({
  id,
  label,
  selected,
  hasNotification,
  onPress,
  styles,
}: {
  id: ReputationTabId;
  label: string;
  selected: boolean;
  hasNotification: boolean;
  onPress: (tab: ReputationTabId) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={`${label} görünümü${hasNotification ? ', yeni rozet var' : ''}`}
      accessibilityState={{ selected }}
      onPress={() => onPress(id)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.tab,
        selected && styles.tabSelected,
        hovered && !selected && styles.tabHovered,
        focused && styles.tabFocused,
        pressed && styles.tabPressed,
      ]}
    >
      <View style={styles.tabLabelRow}>
        <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
        {hasNotification ? (
          <View
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.notificationDot}
          />
        ) : null}
      </View>
      <View style={[styles.tabIndicator, selected && styles.tabIndicatorSelected]} />
    </Pressable>
  );
}

export default function ReputationScreen() {
  const { width } = useWindowDimensions();
  const {
    careerXp,
    score,
    currentRank,
    nextRank,
    rankProgress,
    badges,
    unseenBadgeIds,
    markBadgesSeen,
  } = useReputation();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const rankGroups = useMemo(groupRanksByTier, []);
  const [activeTab, setActiveTab] = useState<ReputationTabId>('career');
  const activeTabRef = useRef<ReputationTabId>('career');
  const [expandedTier, setExpandedTier] = useState<Rank['tier'] | null>(currentRank.tier);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [newlyViewedBadgeIds, setNewlyViewedBadgeIds] = useState<AchievementId[]>([]);
  const isDesktop = width >= 1040;
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const newlyViewedBadgeIdSet = useMemo(() => new Set(newlyViewedBadgeIds), [newlyViewedBadgeIds]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useFocusEffect(useCallback(() => {
    setIsScreenFocused(true);
    void trackEvent(activeTabRef.current === 'career' ? 'career_opened' : 'badges_opened');
    return () => {
      setIsScreenFocused(false);
      setNewlyViewedBadgeIds([]);
    };
  }, []));

  useEffect(() => {
    if (!isScreenFocused || activeTab !== 'badges' || unseenBadgeIds.length === 0) return;
    setNewlyViewedBadgeIds((current) => [...new Set([...current, ...unseenBadgeIds])]);
    markBadgesSeen();
  }, [activeTab, isScreenFocused, markBadgesSeen, unseenBadgeIds]);

  const handleTabChange = useCallback((tab: ReputationTabId) => {
    if (activeTabRef.current === tab) return;
    activeTabRef.current = tab;
    setActiveTab(tab);
    void trackEvent(tab === 'career' ? 'career_opened' : 'badges_opened');
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
              <Text style={styles.header}>Kariyer</Text>
            </View>

            <View accessibilityRole="tablist" style={styles.tabs}>
              {REPUTATION_TABS.map((tab) => (
                <ReputationTabButton
                  key={tab.id}
                  id={tab.id}
                  label={tab.label}
                  selected={activeTab === tab.id}
                  hasNotification={tab.id === 'badges' && unseenBadgeIds.length > 0}
                  onPress={handleTabChange}
                  styles={styles}
                />
              ))}
            </View>

            {activeTab === 'career' ? (
              <View style={styles.tabContent}>
                <ReputationSummaryCard
                  careerXp={careerXp}
                  reputation={score}
                  currentRank={currentRank}
                  nextRank={nextRank}
                  progress={rankProgress}
                  accentColor={TIER_CONFIG[currentRank.tier].color}
                  accentSoftColor={TIER_CONFIG[currentRank.tier].softColor}
                  rankIcon={TIER_CONFIG[currentRank.tier].icon}
                  reduceMotion={reduceMotion}
                  active={isScreenFocused && activeTab === 'career'}
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
              </View>
            ) : (
              <View style={styles.tabContent}>
                <View style={styles.badgeHeader}>
                  <View style={styles.badgeHeaderCopy}>
                    <Text style={styles.sectionEyebrow}>ROZET KASASI</Text>
                    <Text style={styles.sectionTitle}>Rozetler</Text>
                    <Text style={styles.badgeSubtitle}>Kariyer ilerlemen boyunca açtığın başarı kayıtları.</Text>
                  </View>
                  <View style={styles.badgeSummary}>
                    <Ionicons name="ribbon-outline" size={16} color={tokens.colors.secondary} />
                    <Text style={styles.badgeSummaryText}>Kazanılan {earnedCount}/{badges.length}</Text>
                  </View>
                </View>

                {badges.length > 0 ? (
                  <View style={styles.achievementGroups}>
                    {ACHIEVEMENT_GROUPS.map((group) => {
                      const groupBadges = badges.filter((badge) => badge.group === group.id);
                      const groupEarnedCount = groupBadges.filter((badge) => badge.earned).length;
                      if (groupBadges.length === 0) return null;

                      return (
                        <View key={group.id} style={styles.achievementGroup}>
                          <View style={styles.groupHeader}>
                            <View style={styles.groupHeaderCopy}>
                              <Text style={styles.groupEyebrow}>{group.eyebrow}</Text>
                              <Text style={styles.groupTitle}>{group.label}</Text>
                            </View>
                            <View style={styles.groupRule} />
                            <Text style={styles.groupCount}>{groupEarnedCount}/{groupBadges.length}</Text>
                          </View>
                          <View style={styles.achievementGrid}>
                            {groupBadges.map((badge) => (
                              <View
                                key={badge.id}
                                style={[
                                  styles.achievementGridItem,
                                  isDesktop && styles.achievementGridItemDesktop,
                                ]}
                              >
                                <AchievementCard
                                  badge={badge}
                                  reduceMotion={reduceMotion}
                                  active={isScreenFocused}
                                  isNew={newlyViewedBadgeIdSet.has(badge.id)}
                                />
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="ribbon-outline" size={22} color={tokens.colors.textMuted} />
                    <Text style={styles.emptyStateText}>Henüz rozet bulunamadı.</Text>
                  </View>
                )}
              </View>
            )}
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
    tabs: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.14,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.layout.isCompact ? 6 : 10,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    tabSelected: { backgroundColor: colors.floatingSurfaceRaised },
    tabHovered: { backgroundColor: colors.floatingSurfaceRaised },
    tabFocused: { borderColor: colors.text },
    tabPressed: { backgroundColor: colors.secondarySurfaceRaised, transform: [{ scale: 0.985 }] },
    tabLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    tabLabel: { fontFamily: fonts.bodySemiBold, fontSize: tokens.layout.isCompact ? 12 : 13, lineHeight: tokens.layout.isCompact ? 16 : 18, color: colors.textMuted, textAlign: 'center' },
    tabLabelSelected: { color: colors.text },
    notificationDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger, shadowColor: colors.danger, shadowOpacity: 0.35, shadowRadius: 5, elevation: 4 },
    tabIndicator: { position: 'absolute', bottom: 1, width: tokens.layout.isCompact ? 30 : 34, height: 2, borderRadius: 1, backgroundColor: 'transparent' },
    tabIndicatorSelected: { backgroundColor: colors.primary },
    tabContent: { marginTop: tokens.layout.isCompact ? 12 : 18 },
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
    badgeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: tokens.layout.isCompact ? 12 : 16 },
    badgeHeaderCopy: { flex: 1, minWidth: tokens.layout.isCompact ? '100%' : 260 },
    badgeSubtitle: { ...tokens.type.bodySmall, maxWidth: 520, marginTop: 4, fontFamily: fonts.body, color: colors.textMuted },
    badgeSummary: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderRadius: radius.pill, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderSubtle },
    badgeSummaryText: { fontFamily: fonts.monoSemiBold, fontSize: 12, lineHeight: 17, color: colors.secondary },
    achievementGroups: { gap: tokens.layout.isCompact ? 22 : 30 },
    achievementGroup: { gap: tokens.layout.isCompact ? 9 : 12 },
    groupHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    groupHeaderCopy: { flexShrink: 0 },
    groupEyebrow: { ...tokens.type.eyebrow, marginBottom: 1, fontFamily: fonts.bodySemiBold, color: colors.textMuted },
    groupTitle: { fontFamily: fonts.headingBold, fontSize: tokens.layout.isCompact ? 17 : 19, lineHeight: tokens.layout.isCompact ? 22 : 25, color: colors.text },
    groupRule: { flex: 1, height: 1, marginBottom: 5, backgroundColor: colors.dividerSubtle },
    groupCount: { marginBottom: 1, fontFamily: fonts.monoSemiBold, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 9 : 12 },
    achievementGridItem: { width: '100%' },
    achievementGridItemDesktop: { width: '49%' },
    emptyState: { minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    emptyStateText: { ...tokens.type.body, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  });
}
