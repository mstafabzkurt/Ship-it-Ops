import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProgressSweep from '../../src/components/ProgressSweep';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_STARS,
  GAME_CATEGORIES,
  QUESTIONS_PER_TIER,
  type DifficultyStar,
  type GameCategoryId,
} from '../../src/config/gameCategories';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { supabase } from '../../src/supabase';
import { fonts } from '../../src/theme/typography';
import {
  getOperationReputationTarget,
  getPassedOperationCount,
  getTierAttemptedCount,
  isTierUnlocked,
} from '../../src/utils/categoryProgress';
import { isValidCategoryQuestion, type CategoryQuestionRow } from '../../src/utils/categoryQuestions';

type Availability = Record<GameCategoryId, Record<DifficultyStar, number>>;

const CATEGORY_PROGRESS_TOTAL = QUESTIONS_PER_TIER * DIFFICULTY_STARS.length;
const HUB_PROGRESS_TOTAL = CATEGORY_PROGRESS_TOTAL * GAME_CATEGORIES.length;

const createEmptyAvailability = (): Availability => Object.fromEntries(GAME_CATEGORIES.map((category) => [
  category.id,
  Object.fromEntries(DIFFICULTY_STARS.map((star) => [star, 0])),
])) as Availability;

export default function PlayHubScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { categoryProgress } = useReputation();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens, width), [tokens, width]);
  const [availability, setAvailability] = useState<Availability>(() => createEmptyAvailability());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  useFocusEffect(useCallback(() => {
    setIsScreenFocused(true);
    return () => setIsScreenFocused(false);
  }, []));

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from('game_incidents')
      .select('id, rank_level, category_id, difficulty_star, tag, title, optimal_text, acceptable_text, wrong_text, fatal_text')
      .not('category_id', 'is', null)
      .not('difficulty_star', 'is', null);
    if (queryError) {
      setError('Kategori içeriği okunamadı. Phase 7 migration uygulandıktan sonra tekrar dene.');
      setAvailability(createEmptyAvailability());
      setLoading(false);
      return;
    }
    const next = createEmptyAvailability();
    for (const category of GAME_CATEGORIES) {
      for (const star of DIFFICULTY_STARS) {
        next[category.id][star] = (data as CategoryQuestionRow[] | null ?? [])
          .filter((row) => isValidCategoryQuestion(row, category.id, star)).length;
      }
    }
    setAvailability(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const startSession = (categoryId: GameCategoryId, star: DifficultyStar) => {
    router.push(`/(tabs)/game?category=${categoryId}&star=${star}`);
  };

  const hubProgress = GAME_CATEGORIES.reduce((categoryTotal, category) => (
    categoryTotal + DIFFICULTY_STARS.reduce((tierTotal, star) => (
      tierTotal + getTierAttemptedCount(categoryProgress, category.id, star)
    ), 0)
  ), 0);
  const unlockedTierCount = GAME_CATEGORIES.reduce((categoryTotal, category) => (
    categoryTotal + DIFFICULTY_STARS.filter((star) => isTierUnlocked(categoryProgress, category.id, star)).length
  ), 0);

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.gridLineVertical} />
      <View pointerEvents="none" style={styles.gridLineHorizontal} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <View style={styles.eyebrowChip}>
                  <View style={styles.liveDot} />
                  <Text style={styles.eyebrow}>AREA SELECTION</Text>
                </View>
                <Text accessibilityRole="header" style={styles.title}>Oyun Merkezi</Text>
                <Text style={styles.description}>Disiplin seç, 10 soruluk operasyonlarda itibar hedefini geç ve yıldız kademelerini aç.</Text>
              </View>
              <View style={styles.hubStatus}>
                <View style={styles.hubMetric}>
                  <Text style={styles.hubMetricLabel}>KAYITLI İLERLEME</Text>
                  <Text style={styles.hubMetricValue}>{hubProgress}/{HUB_PROGRESS_TOTAL}</Text>
                </View>
                <View style={styles.hubStatusDivider} />
                <View style={styles.hubMetric}>
                  <Text style={styles.hubMetricLabel}>AÇIK KADEME</Text>
                  <Text style={styles.hubMetricValue}>{unlockedTierCount}/{GAME_CATEGORIES.length * DIFFICULTY_STARS.length}</Text>
                </View>
              </View>
            </View>

            {loading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={tokens.colors.secondary} />
                <Text style={styles.stateText}>Soru havuzları kontrol ediliyor…</Text>
              </View>
            ) : null}

            {error ? (
              <View accessibilityRole="alert" style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={21} color={tokens.colors.warning} />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable accessibilityRole="button" onPress={() => void loadAvailability()} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                  <Text style={styles.retryText}>Yenile</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.categoryGrid}>
              {GAME_CATEGORIES.map((category, categoryIndex) => {
                const tiers = DIFFICULTY_STARS.map((star) => {
                  const attempted = getTierAttemptedCount(categoryProgress, category.id, star);
                  const passedOperations = getPassedOperationCount(categoryProgress, category.id, star);
                  const unlocked = isTierUnlocked(categoryProgress, category.id, star);
                  const contentCount = availability[category.id][star];
                  const completeContent = contentCount === QUESTIONS_PER_TIER;
                  return {
                    star,
                    attempted,
                    passedOperations,
                    target: getOperationReputationTarget(star),
                    unlocked,
                    completeContent,
                    playable: unlocked && completeContent && !loading,
                  };
                });
                const totalAttempted = tiers.reduce((total, tier) => total + tier.attempted, 0);
                const openTier = [...tiers].reverse().find((tier) => tier.unlocked) ?? tiers[0];
                const firstIncompletePlayable = tiers.find((tier) => tier.playable && tier.attempted < QUESTIONS_PER_TIER);
                const fallbackPlayable = [...tiers].reverse().find((tier) => tier.playable);
                const primaryTier = firstIncompletePlayable ?? fallbackPlayable;
                const nextLockedTier = tiers.find((tier) => !tier.unlocked);
                const prerequisiteTier = nextLockedTier ? tiers[nextLockedTier.star - 2] : null;
                const nextGoal = nextLockedTier && prerequisiteTier
                  ? `${DIFFICULTY_LABELS[nextLockedTier.star]} kilidi: ${prerequisiteTier.passedOperations}/2 operasyon geçti`
                  : 'Tüm kademeler açık';
                const hasIncompleteContent = tiers.some((tier) => tier.unlocked && !tier.completeContent);

                return (
                  <View key={category.id} style={styles.categoryCard}>
                    <View style={styles.cardRail} />
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryHeaderTopline}>
                        <Text style={styles.categoryCode}>AREA {String(categoryIndex + 1).padStart(2, '0')}</Text>
                        <View style={styles.categoryCapacityPill}>
                          <Text style={styles.categoryCapacity}>{CATEGORY_PROGRESS_TOTAL} SORU</Text>
                        </View>
                      </View>
                      <View style={styles.categoryIdentity}>
                        <View style={styles.categoryIcon}>
                          <Ionicons name={category.icon} size={tokens.layout.isCompact ? 20 : 22} color={tokens.colors.secondary} />
                        </View>
                        <View style={styles.categoryCopy}>
                          <Text accessibilityRole="header" style={styles.categoryTitle}>{category.name}</Text>
                          <Text style={styles.categoryDescription}>{category.description}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.progressSection}>
                      <Text style={styles.progressInline}>Kayıtlı ilerleme <Text style={styles.progressInlineStrong}>{totalAttempted}/{CATEGORY_PROGRESS_TOTAL} soru</Text></Text>
                      <ProgressSweep
                        value={totalAttempted / CATEGORY_PROGRESS_TOTAL}
                        reduceMotion={reduceMotion}
                        active={isScreenFocused}
                        accessibilityLabel={`${category.name} alan ilerlemesi`}
                        trackStyle={styles.progressTrack}
                        fillStyle={styles.progressFill}
                        sweepColor={tokens.colors.text}
                        markers={[1 / 3, 2 / 3]}
                      />
                      <Text style={styles.summaryInline}>Açık: <Text style={styles.summaryStrong}>{DIFFICULTY_LABELS[openTier.star]}</Text> · Hedef: <Text style={styles.summaryStrong}>{nextGoal}</Text></Text>
                    </View>

                    <View style={styles.tierSection}>
                      <Text style={styles.sectionLabel}>YILDIZ KADEMELERİ</Text>
                      <View style={styles.tierStrip}>
                        {tiers.map((tier) => {
                          const prerequisite = tier.star > 1 ? tiers[tier.star - 2] : null;
                          const status = loading
                            ? (tokens.layout.isCompact ? 'Kontrol ediliyor' : 'İçerik kontrol ediliyor')
                            : !tier.completeContent
                              ? 'İçerik eksik'
                              : tier.unlocked
                                ? tokens.layout.isCompact
                                  ? `Açık\n${tier.attempted}/${QUESTIONS_PER_TIER} soru · ${tier.passedOperations}/2 yeterlilik\nHedef +${tier.target} İtibar`
                                  : `${DIFFICULTY_LABELS[tier.star]} açık\nKademe ${tier.attempted}/${QUESTIONS_PER_TIER} soru\n${tier.star === 3 ? 'Ustalık hedefi' : 'Her operasyon'}: +${tier.target} İtibar · ${tier.passedOperations}/2 geçti`
                                : tokens.layout.isCompact
                                  ? `${DIFFICULTY_LABELS[(tier.star - 1) as DifficultyStar]} gerekli\n${prerequisite?.passedOperations ?? 0}/2 geçti · +${prerequisite?.target ?? tier.target} İtibar`
                                  : `${DIFFICULTY_LABELS[(tier.star - 1) as DifficultyStar]} operasyonları gerekli\n${prerequisite?.passedOperations ?? 0}/2 operasyon geçti\nHer operasyon: +${prerequisite?.target ?? tier.target} İtibar`;
                          const isPrimary = primaryTier?.star === tier.star;
                          return (
                            <View
                              key={tier.star}
                              accessible
                              accessibilityLabel={`${tier.star} yıldız, ${DIFFICULTY_LABELS[tier.star]}, ${status}${isPrimary ? ', sıradaki oturum' : ''}`}
                              style={[
                                styles.tierCell,
                                isPrimary && styles.tierCellPrimary,
                                !tier.unlocked && styles.tierCellLocked,
                                !tier.completeContent && !loading && styles.tierCellIncomplete,
                              ]}
                            >
                              <View style={styles.tierTopline}>
                                <Text style={[styles.starLabel, !tier.unlocked && styles.tierTextMuted]}>{'★'.repeat(tier.star)}</Text>
                                {tier.passedOperations >= 2 ? <Ionicons name="checkmark-circle" size={14} color={tokens.colors.warning} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
                                {isPrimary ? (
                                  <Text style={styles.nextBadge}>SIRADAKİ</Text>
                                ) : !tier.unlocked ? (
                                  <Ionicons name="lock-closed" size={tokens.layout.isCompact ? 11 : 12} color={tokens.colors.textMuted} />
                                ) : null}
                              </View>
                              <Text style={[styles.tierTitle, !tier.unlocked && styles.tierTextMuted]}>{DIFFICULTY_LABELS[tier.star]}</Text>
                              <Text style={styles.tierStatus}>{status}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.actionSection}>
                      {!primaryTier && !loading && hasIncompleteContent ? (
                        <View style={styles.availabilityNote}>
                          <Ionicons name="construct-outline" size={16} color={tokens.colors.warning} />
                          <Text style={styles.availabilityText}>Bu kademe henüz soru havuzuna hazır değil.</Text>
                        </View>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={primaryTier ? `${category.name}, ${DIFFICULTY_LABELS[primaryTier.star]} kademesinde oturuma başla` : `${category.name}, hazır değil`}
                        accessibilityHint={primaryTier ? '10 soruluk oyun oturumunu açar' : undefined}
                        accessibilityState={{ disabled: !primaryTier }}
                        disabled={!primaryTier}
                        onPress={() => primaryTier && startSession(category.id, primaryTier.star)}
                        style={({ pressed }) => [styles.primaryButton, !primaryTier && styles.primaryButtonDisabled, pressed && styles.pressed]}
                      >
                        <View style={styles.buttonCopy}>
                          <Text style={[styles.buttonTitle, !primaryTier && styles.buttonTitleDisabled]}>{primaryTier ? 'Oturuma Başla' : 'Hazır Değil'}</Text>
                          <Text style={[styles.buttonMeta, !primaryTier && styles.buttonMetaDisabled]}>
                            {loading ? 'Soru havuzu kontrol ediliyor' : primaryTier ? `${DIFFICULTY_LABELS[primaryTier.star]} · 10 soru` : 'Uygun soru havuzu bulunamadı'}
                          </Text>
                          </View>
                        <View style={[styles.buttonIcon, !primaryTier && styles.buttonIconDisabled]}>
                          <Ionicons name={primaryTier ? 'arrow-forward' : 'lock-closed'} size={19} color={primaryTier ? tokens.colors.onAccent : tokens.colors.textMuted} />
                        </View>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>, width: number) {
  const { colors, radius, shadow } = tokens;
  const categoryWidth = width >= 1120 ? '32.2%' : width >= 680 ? '48%' : '100%';
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    safeArea: { flex: 1 },
    content: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: tokens.layout.isCompact ? tokens.layout.pageGutter : tokens.layout.pageGutterWide, paddingTop: tokens.layout.pageTop, gap: tokens.layout.isCompact ? 10 : 14 },
    gridLineVertical: { position: 'absolute', top: 0, bottom: 0, right: '11%', width: 1, backgroundColor: colors.dividerSubtle, opacity: 0.32 },
    gridLineHorizontal: { position: 'absolute', top: 150, left: 0, right: 0, height: 1, backgroundColor: colors.dividerSubtle, opacity: 0.3 },
    header: { flexDirection: tokens.layout.isCompact ? 'column' : 'row', alignItems: tokens.layout.isCompact ? 'stretch' : 'flex-end', justifyContent: 'space-between', gap: tokens.layout.isCompact ? 10 : 28, padding: tokens.layout.isCompact ? 12 : 20, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.lg, backgroundColor: colors.secondarySurface },
    headerCopy: { flex: 1, minWidth: 0, gap: 5 },
    eyebrowChip: { minHeight: 24, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.secondarySoft },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.monoMedium, color: colors.secondary },
    title: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    description: { ...tokens.type.body, maxWidth: 620, fontFamily: fonts.body, color: colors.textMuted },
    hubStatus: { minWidth: tokens.layout.isCompact ? 0 : 260, flexDirection: 'row', alignItems: 'stretch', padding: tokens.layout.isCompact ? 10 : 12, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.md, backgroundColor: colors.secondarySurfaceRaised },
    hubMetric: { flex: 1, gap: 2 },
    hubMetricLabel: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.55, color: colors.textMuted },
    hubMetricValue: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 23, color: colors.text },
    hubStatusDivider: { width: 1, marginHorizontal: 12, backgroundColor: colors.dividerSubtle },
    stateCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface },
    stateText: { ...tokens.type.bodySmall, fontFamily: fonts.bodyMedium, color: colors.textMuted },
    errorCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.warning, backgroundColor: colors.warningSoft },
    errorText: { ...tokens.type.bodySmall, flex: 1, minWidth: 190, fontFamily: fonts.bodyMedium, color: colors.text },
    retryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: radius.sm, backgroundColor: colors.warning },
    retryText: { fontFamily: fonts.bodySemiBold, color: colors.onAccent },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', justifyContent: 'center', gap: tokens.layout.isCompact ? 10 : 18 },
    categoryCard: { width: categoryWidth, minWidth: 0, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadow.card },
    cardRail: { height: 3, backgroundColor: colors.secondary, opacity: 0.72 },
    categoryHeader: { gap: tokens.layout.isCompact ? 6 : 10, padding: tokens.layout.isCompact ? 10 : 16, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    categoryHeaderTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    categoryCode: { fontFamily: fonts.monoSemiBold, fontSize: 9, lineHeight: 13, letterSpacing: 0.65, color: colors.secondary },
    categoryCapacityPill: { minHeight: tokens.layout.isCompact ? 20 : 24, justifyContent: 'center', paddingHorizontal: tokens.layout.isCompact ? 7 : 9, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.pill, backgroundColor: colors.secondarySurfaceRaised },
    categoryCapacity: { fontFamily: fonts.monoSemiBold, fontSize: tokens.layout.isCompact ? 9 : 10, lineHeight: 13, letterSpacing: 0.35, color: colors.textMuted },
    categoryIdentity: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.layout.isCompact ? 9 : 11 },
    categoryIcon: { width: tokens.layout.isCompact ? 38 : 42, height: tokens.layout.isCompact ? 38 : 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.secondarySoft },
    categoryCopy: { flex: 1, minWidth: 0 },
    categoryTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    categoryDescription: { marginTop: tokens.layout.isCompact ? 1 : 2, fontFamily: fonts.body, fontSize: tokens.layout.isCompact ? 12 : 13, lineHeight: tokens.layout.isCompact ? 16 : 18, color: colors.textMuted },
    progressSection: { gap: tokens.layout.isCompact ? 7 : 9, paddingHorizontal: tokens.layout.isCompact ? 12 : 16, paddingVertical: tokens.layout.isCompact ? 10 : 13, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle, backgroundColor: colors.floatingSurface },
    progressInline: { fontFamily: fonts.bodyMedium, fontSize: tokens.layout.isCompact ? 11 : 12, lineHeight: tokens.layout.isCompact ? 15 : 17, color: colors.textMuted },
    progressInlineStrong: { fontFamily: fonts.bodySemiBold, color: colors.text },
    progressTrack: { height: 7, overflow: 'hidden', borderRadius: 3, backgroundColor: colors.borderSubtle },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.warning },
    summaryInline: { fontFamily: fonts.body, fontSize: tokens.layout.isCompact ? 11 : 12, lineHeight: tokens.layout.isCompact ? 15 : 17, color: colors.textMuted },
    summaryStrong: { fontFamily: fonts.bodySemiBold, color: colors.text },
    tierSection: { gap: tokens.layout.isCompact ? 5 : 7, padding: tokens.layout.isCompact ? 8 : 12 },
    sectionLabel: { paddingHorizontal: 3, fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.55, color: colors.textMuted },
    tierStrip: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
    tierCell: { flex: 1, minWidth: 0, minHeight: tokens.layout.isCompact ? 88 : 108, paddingHorizontal: tokens.layout.isCompact ? 7 : 9, paddingVertical: tokens.layout.isCompact ? 6 : 9, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised },
    tierCellPrimary: { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
    tierCellLocked: { opacity: 0.56, backgroundColor: colors.secondarySurface },
    tierCellIncomplete: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
    tierTopline: { minHeight: tokens.layout.isCompact ? 15 : 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
    starLabel: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: tokens.layout.isNarrow ? 10 : 11, lineHeight: 15, color: colors.warning },
    tierTextMuted: { color: colors.textMuted },
    tierTitle: { marginTop: tokens.layout.isCompact ? 1 : 2, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: tokens.layout.isCompact ? 17 : 18, color: colors.text },
    tierStatus: { marginTop: tokens.layout.isCompact ? 2 : 3, fontFamily: fonts.body, fontSize: tokens.layout.isCompact ? 10 : 9, lineHeight: 13, color: colors.textMuted },
    nextBadge: { alignSelf: 'flex-start', paddingHorizontal: tokens.layout.isCompact ? 5 : 6, paddingVertical: 2, overflow: 'hidden', borderRadius: radius.pill, fontFamily: fonts.monoSemiBold, fontSize: tokens.layout.isCompact ? 9 : 8, lineHeight: 11, letterSpacing: 0.35, color: colors.secondary, backgroundColor: colors.secondarySoft },
    actionSection: { marginTop: 'auto', gap: tokens.layout.isCompact ? 6 : 8, padding: tokens.layout.isCompact ? 8 : 12, paddingTop: tokens.layout.isCompact ? 0 : 2 },
    availabilityNote: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4 },
    availabilityText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    primaryButton: { minHeight: tokens.layout.isCompact ? 48 : 52, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 8 : 10, paddingHorizontal: tokens.layout.isCompact ? 12 : 14, borderRadius: radius.md, backgroundColor: colors.primary },
    primaryButtonDisabled: { borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised, opacity: 0.58 },
    buttonCopy: { flex: 1, minWidth: 0 },
    buttonTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 18, color: colors.onAccent },
    buttonTitleDisabled: { color: colors.textMuted },
    buttonMeta: { marginTop: 1, fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 12, letterSpacing: 0.35, color: colors.onAccent },
    buttonMetaDisabled: { color: colors.textMuted },
    buttonIcon: { width: tokens.layout.isCompact ? 30 : 32, height: tokens.layout.isCompact ? 30 : 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surfaceHighlight },
    buttonIconDisabled: { backgroundColor: colors.borderSubtle },
    pressed: tokens.motion.pressed,
  });
}
