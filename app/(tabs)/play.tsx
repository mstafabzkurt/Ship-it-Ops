import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AssetIcon from '../../src/components/AssetIcon';
import ProgressSweep from '../../src/components/ProgressSweep';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_STARS,
  GAME_CATEGORIES,
  QUESTIONS_PER_TIER,
  buildGameSessionRoute,
  type DifficultyStar,
  type GameCategoryId,
} from '../../src/config/gameCategories';
import { UI_ICON_ASSETS } from '../../src/config/iconAssets';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { supabase } from '../../src/supabase';
import { fonts } from '../../src/theme/typography';
import {
  getOperationReputationTarget,
  getCategoryAttemptedCount,
  getCategoryPassedOperationCount,
  getPassedOperationCount,
  getTierAttemptedCount,
  isTierUnlocked,
} from '../../src/utils/categoryProgress';
import {
  hasEnoughCategoryQuestions,
  type CategoryQuestionRow,
} from '../../src/utils/categoryQuestions';
import { trackEvent } from '../../src/utils/telemetry';
import { trackAnalyticsEvent } from '../../src/lib/analytics';

type Availability = Record<GameCategoryId, Record<DifficultyStar, number>>;
type AvailabilityQuestionRow = Pick<CategoryQuestionRow, 'id' | 'category_id' | 'difficulty_star'>;
type LockedTierFeedback = {
  categoryId: GameCategoryId;
  star: DifficultyStar;
  message: string;
  passedCount: number;
  targetReputation: number;
};

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
  const [lockedTierFeedback, setLockedTierFeedback] = useState<LockedTierFeedback | null>(null);
  const [hoveredActionId, setHoveredActionId] = useState<GameCategoryId | null>(null);
  const [focusedActionId, setFocusedActionId] = useState<GameCategoryId | null>(null);
  const [repeatInfoVisible, setRepeatInfoVisible] = useState(false);
  const [repeatInfoControlFocused, setRepeatInfoControlFocused] = useState(false);
  const [search, setSearch] = useState('');
  const [progressFilter, setProgressFilter] = useState<'all' | 'started' | 'completed'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<GameCategoryId | null>(null);
  const [focusedBrowseControl, setFocusedBrowseControl] = useState<string | null>(null);
  const isMobile = width < 680;
  const visibleCategories = GAME_CATEGORIES.filter((category) => {
    const matchesName = category.name.toLocaleLowerCase('tr-TR').includes(search.trim().toLocaleLowerCase('tr-TR'));
    const completed = getCategoryPassedOperationCount(categoryProgress, category.id) === DIFFICULTY_STARS.length * 2;
    const started = getCategoryAttemptedCount(categoryProgress, category.id) > 0
      || getCategoryPassedOperationCount(categoryProgress, category.id) > 0;
    return matchesName && (progressFilter === 'all' || (progressFilter === 'completed' ? completed : started && !completed));
  });

  useEffect(() => {
    if (!isMobile || !isScreenFocused) setSelectedCategoryId(null);
  }, [isMobile, isScreenFocused]);

  useFocusEffect(useCallback(() => {
    setIsScreenFocused(true);
    return () => setIsScreenFocused(false);
  }, []));

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!lockedTierFeedback) return undefined;
    const timer = setTimeout(() => setLockedTierFeedback(null), 4500);
    return () => clearTimeout(timer);
  }, [lockedTierFeedback]);

  const closeRepeatInfo = useCallback(() => {
    setRepeatInfoVisible(false);
    setRepeatInfoControlFocused(false);
  }, []);

  useEffect(() => {
    if (!repeatInfoVisible || Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRepeatInfo();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeRepeatInfo, repeatInfoVisible]);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from('game_incidents')
      .select('id, category_id, difficulty_star')
      .not('category_id', 'is', null)
      .not('difficulty_star', 'is', null);
    if (queryError) {
      console.warn('[game_incidents] availability fetch failed', {
        code: queryError.code || 'unknown',
        message: queryError.message.slice(0, 240),
      });
      setError('Kategori içeriği okunamadı. Phase 7 migration uygulandıktan sonra tekrar dene.');
      setAvailability(createEmptyAvailability());
      setLoading(false);
      return;
    }
    const availabilityRows = data as AvailabilityQuestionRow[] | null ?? [];
    console.info('[game_incidents] availability fetch completed', {
      fetched_question_count: availabilityRows.length,
    });
    const next = createEmptyAvailability();
    for (const category of GAME_CATEGORIES) {
      for (const star of DIFFICULTY_STARS) {
        next[category.id][star] = availabilityRows.filter((row) => (
          row.category_id === category.id && row.difficulty_star === star
        )).length;
      }
    }
    setAvailability(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const startSession = (categoryId: GameCategoryId, star: DifficultyStar) => {
    setLockedTierFeedback(null);
    void trackAnalyticsEvent('category_selected', { category_id: categoryId });
    void trackAnalyticsEvent('tier_selected', { category_id: categoryId, difficulty_star: star });
    router.push(buildGameSessionRoute(categoryId, star));
  };

  const showLockedTierFeedback = useCallback((
    categoryId: GameCategoryId,
    star: DifficultyStar,
    passedCount: number,
  ) => {
    const prerequisiteStar = (star - 1) as DifficultyStar;
    const targetReputation = getOperationReputationTarget(prerequisiteStar);
    const prerequisiteLabel = DIFFICULTY_LABELS[prerequisiteStar];
    setLockedTierFeedback({
      categoryId,
      star,
      passedCount,
      targetReputation,
      message: `${DIFFICULTY_LABELS[star]} henüz açılmadı. ${prerequisiteLabel} operasyonlarında yeterli itibar kazanmalısın.`,
    });
    void trackEvent('locked_tier_tapped', {
      category_id: categoryId,
      difficulty_star: star,
      operation_passed_count: passedCount,
      operation_required_count: 2,
      target_reputation: targetReputation,
    });
  }, []);

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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                {!isMobile && <View style={styles.eyebrowChip}>
                  <View style={styles.liveDot} />
                  <Text style={styles.eyebrow}>AREA SELECTION</Text>
                </View>}
                <View style={styles.titleRow}>
                  <Text accessibilityRole="header" style={styles.title}>Oyun Merkezi</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tekrar soru ödülleri hakkında bilgi"
                    accessibilityHint="Tekrar sorularda ödüllerin neden azaltıldığını açıklar"
                    accessibilityState={{ expanded: repeatInfoVisible }}
                    hitSlop={6}
                    onFocus={() => setRepeatInfoControlFocused(true)}
                    onBlur={() => setRepeatInfoControlFocused(false)}
                    onPress={() => setRepeatInfoVisible(true)}
                    style={({ pressed }) => [
                      styles.infoButton,
                      repeatInfoControlFocused && styles.controlFocused,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AssetIcon
                      source={UI_ICON_ASSETS.info}
                      fallbackName="information-outline"
                      fallbackColor={tokens.colors.secondary}
                      size={22}
                    />
                  </Pressable>
                </View>
                <Text style={styles.description}>{isMobile ? 'Dersini seç, operasyona hazırlan.' : 'Disiplin seç, 10 soruluk operasyonlarda itibar hedefini geç ve yıldız kademelerini aç.'}</Text>
              </View>
              {!isMobile && <View style={styles.hubStatus}>
                <View style={styles.hubMetric}>
                  <Text style={styles.hubMetricLabel}>KAYITLI İLERLEME</Text>
                  <Text style={styles.hubMetricValue}>{hubProgress}/{HUB_PROGRESS_TOTAL}</Text>
                </View>
                <View style={styles.hubStatusDivider} />
                <View style={styles.hubMetric}>
                  <Text style={styles.hubMetricLabel}>AÇIK KADEME</Text>
                  <Text style={styles.hubMetricValue}>{unlockedTierCount}/{GAME_CATEGORIES.length * DIFFICULTY_STARS.length}</Text>
                </View>
              </View>}
            </View>

            <View style={styles.browseControls}>
              <Text style={styles.browseLabel}>Ders ara</Text>
              <View style={[styles.searchField, focusedBrowseControl === 'search' && styles.controlFocused]}>
                <Ionicons name="search-outline" size={20} color={tokens.colors.textMuted} />
                <TextInput
                  accessibilityLabel="Ders ara"
                  placeholder="Ders ara"
                  placeholderTextColor={tokens.colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setFocusedBrowseControl('search')}
                  onBlur={() => setFocusedBrowseControl(null)}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  style={styles.searchInput}
                />
                {search.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Aramayı temizle" onPress={() => setSearch('')} style={styles.clearSearch}>
                  <Ionicons name="close" size={20} color={tokens.colors.text} />
                </Pressable>}
              </View>
              <View style={styles.filterRow}>
                {([{ id: 'all', label: 'Tümü' }, { id: 'started', label: 'Devam Eden' }, { id: 'completed', label: 'Tamamlanan' }] as const).map((filter) => (
                  <Pressable
                    key={filter.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: progressFilter === filter.id }}
                    aria-pressed={progressFilter === filter.id}
                    onPress={() => setProgressFilter(filter.id)}
                    onFocus={() => setFocusedBrowseControl(filter.id)}
                    onBlur={() => setFocusedBrowseControl(null)}
                    style={({ pressed }) => [styles.filterChip, progressFilter === filter.id && styles.filterChipSelected, focusedBrowseControl === filter.id && styles.controlFocused, pressed && styles.browsePressed]}
                  >
                    <Text style={[styles.filterText, progressFilter === filter.id && styles.filterTextSelected]}>{filter.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text accessibilityLiveRegion="polite" style={styles.resultCount}>{visibleCategories.length}/{GAME_CATEGORIES.length} ders{progressFilter === 'completed' ? ' · 6/6 operasyon tamamlandı' : ''}</Text>
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
              {visibleCategories.map((category) => {
                const tiers = DIFFICULTY_STARS.map((star) => {
                  const attempted = getTierAttemptedCount(categoryProgress, category.id, star);
                  const passedOperations = getPassedOperationCount(categoryProgress, category.id, star);
                  const unlocked = isTierUnlocked(categoryProgress, category.id, star);
                  const contentCount = availability[category.id][star];
                  const completeContent = hasEnoughCategoryQuestions(contentCount);
                  return {
                    star,
                    attempted,
                    passedOperations,
                    unlocked,
                    completeContent,
                    playable: unlocked && completeContent && !loading,
                  };
                });
                const totalAttempted = tiers.reduce((total, tier) => total + tier.attempted, 0);
                const firstIncompletePlayable = tiers.find((tier) => tier.playable && tier.attempted < QUESTIONS_PER_TIER);
                const fallbackPlayable = [...tiers].reverse().find((tier) => tier.playable);
                const primaryTier = firstIncompletePlayable ?? fallbackPlayable;
                const hasIncompleteContent = tiers.some((tier) => tier.unlocked && !tier.completeContent);
                const completed = tiers.every((tier) => tier.passedOperations >= 2);
                const compactStatus = loading ? 'Kontrol ediliyor' : !primaryTier && hasIncompleteContent ? 'Hazır Değil' : completed ? 'Tamamlandı' : totalAttempted > 0 ? 'Devam ediyor' : null;

                return (
                  <React.Fragment key={category.id}>
                    {isMobile && <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${category.name}, ${totalAttempted}/${CATEGORY_PROGRESS_TOTAL} soru${compactStatus ? `, ${compactStatus}` : ''}`}
                      accessibilityHint="Ders detaylarını ve oturum kademesini açar"
                      accessibilityState={{ expanded: selectedCategoryId === category.id }}
                      aria-expanded={selectedCategoryId === category.id}
                      onPress={() => { setLockedTierFeedback(null); setSelectedCategoryId(category.id); }}
                      onFocus={() => setFocusedBrowseControl(category.id)}
                      onBlur={() => setFocusedBrowseControl(null)}
                      style={({ pressed }) => [styles.compactCard, selectedCategoryId === category.id && styles.compactCardSelected, focusedBrowseControl === category.id && styles.controlFocused, pressed && styles.browsePressed, pressed && !reduceMotion && styles.compactCardPressed]}
                    >
                      <View style={styles.compactTopline}>
                        <Ionicons name={category.icon} size={23} color={tokens.colors.secondary} />
                        <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
                      </View>
                      <Text style={styles.compactTitle}>{category.name}</Text>
                      <View style={styles.compactProgress}>
                        <View style={styles.compactTrack}><View style={[styles.progressFill, { width: `${totalAttempted / CATEGORY_PROGRESS_TOTAL * 100}%` }]} /></View>
                        <Text style={styles.compactCount}>{totalAttempted}/{CATEGORY_PROGRESS_TOTAL}</Text>
                      </View>
                      {compactStatus && <Text style={styles.compactStatus}>{compactStatus}</Text>}
                    </Pressable>}
                    {(!isMobile || selectedCategoryId === category.id) && <CategoryDetailSurface mobile={isMobile} reduceMotion={reduceMotion} styles={styles} onClose={() => setSelectedCategoryId(null)}>
                  <View style={[styles.categoryCard, isMobile && styles.detailCard]}>
                    <View style={styles.cardRail} />
                    <View style={styles.categoryHeader}>
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
                      <Text style={styles.progressInline}>{totalAttempted}/{CATEGORY_PROGRESS_TOTAL} soru</Text>
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
                    </View>

                    <View style={styles.tierSection}>
                      <Text style={styles.sectionLabel}>YILDIZ KADEMELERİ</Text>
                      <View style={styles.tierStrip}>
                        {tiers.map((tier) => {
                          const unlockTarget = tier.star > 1
                            ? getOperationReputationTarget((tier.star - 1) as DifficultyStar)
                            : null;
                          const status = loading
                            ? 'Kontrol ediliyor'
                            : !tier.unlocked
                              ? `+${unlockTarget} itibar`
                              : !tier.completeContent
                                ? 'İçerik eksik'
                                : 'Açık';
                          const isPrimary = primaryTier?.star === tier.star;
                          const tierCellStyles = [
                            styles.tierCell,
                            isPrimary && styles.tierCellPrimary,
                            !tier.unlocked && styles.tierCellLocked,
                            !tier.completeContent && !loading && styles.tierCellIncomplete,
                          ];
                          const tierContent = (
                            <>
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
                              {isMobile && <Text style={styles.tierProgress}>{tier.attempted}/{QUESTIONS_PER_TIER} soru · {tier.passedOperations}/2 operasyon</Text>}
                            </>
                          );
                          if (!tier.unlocked && !loading) {
                            const prerequisite = tiers[tier.star - 2];
                            return (
                              <Pressable
                                key={tier.star}
                                accessibilityRole="button"
                                accessibilityLabel={`${category.name}, ${DIFFICULTY_LABELS[tier.star]} kilitli, ${status}`}
                                accessibilityHint="Kilit açma koşulunu gösterir"
                                onPress={() => showLockedTierFeedback(category.id, tier.star, prerequisite?.passedOperations ?? 0)}
                                style={({ pressed }) => [tierCellStyles, pressed && styles.pressed]}
                              >
                                {tierContent}
                              </Pressable>
                            );
                          }
                          return (
                            <View
                              key={tier.star}
                              accessible
                              accessibilityLabel={`${tier.star} yıldız, ${DIFFICULTY_LABELS[tier.star]}, ${status}${isPrimary ? ', sıradaki oturum' : ''}`}
                              style={tierCellStyles}
                            >
                              {tierContent}
                            </View>
                          );
                        })}
                      </View>
                      {lockedTierFeedback?.categoryId === category.id ? (
                        <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.lockedTierFeedback}>
                          <Ionicons name="lock-closed-outline" size={17} color={tokens.colors.warning} />
                          <View style={styles.lockedTierFeedbackCopy}>
                            <Text style={styles.lockedTierFeedbackText}>{lockedTierFeedback.message}</Text>
                            <Text style={styles.lockedTierFeedbackTarget}>Hedef: 2/2 operasyon · +{lockedTierFeedback.targetReputation} itibar</Text>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.actionSection}>
                      {isMobile && <Text style={styles.detailHint}>Her kademede 2 operasyonu geç. Kolay operasyonlarında +{getOperationReputationTarget(1)}, Orta operasyonlarında +{getOperationReputationTarget(2)} itibar kazanarak sonraki kademeyi aç.</Text>}
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
                        onPress={() => { if (primaryTier) { setSelectedCategoryId(null); startSession(category.id, primaryTier.star); } }}
                        onHoverIn={() => setHoveredActionId(category.id)}
                        onHoverOut={() => setHoveredActionId(null)}
                        onFocus={() => setFocusedActionId(category.id)}
                        onBlur={() => setFocusedActionId(null)}
                        style={({ pressed }) => [
                          styles.primaryButton,
                          theme.id === 'daylight' && hoveredActionId === category.id && primaryTier && styles.primaryButtonHovered,
                          theme.id === 'daylight' && focusedActionId === category.id && primaryTier && styles.primaryButtonFocused,
                          !primaryTier && styles.primaryButtonDisabled,
                          theme.id === 'daylight' && pressed && primaryTier && styles.primaryButtonPressed,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.buttonCopy}>
                          <Text style={[styles.buttonTitle, !primaryTier && styles.buttonTitleDisabled]}>{primaryTier ? 'Oturuma Başla' : 'Hazır Değil'}</Text>
                          <Text style={[styles.buttonMeta, !primaryTier && styles.buttonMetaDisabled]}>
                            {loading ? 'Soru havuzu kontrol ediliyor' : primaryTier ? `${DIFFICULTY_LABELS[primaryTier.star]} · 10 soru` : 'Uygun soru havuzu bulunamadı'}
                          </Text>
                          </View>
                        <View style={[styles.buttonIcon, !primaryTier && styles.buttonIconDisabled]}>
                          <Ionicons
                            name={primaryTier ? 'arrow-forward' : 'lock-closed'}
                            size={19}
                            color={primaryTier ? tokens.colors.actionSubSurfaceForeground : tokens.colors.textMuted}
                          />
                        </View>
                      </Pressable>
                    </View>
                  </View>
                    </CategoryDetailSurface>}
                  </React.Fragment>
                );
              })}
            </View>
            {visibleCategories.length === 0 && <View style={styles.emptyState}>
              <Text style={styles.categoryTitle}>Ders bulunamadı</Text>
              <Text style={styles.description}>Aramanı veya ilerleme filtresini değiştir.</Text>
              <Pressable accessibilityRole="button" onPress={() => { setSearch(''); setProgressFilter('all'); }} style={styles.filterChip}>
                <Text style={styles.filterText}>Tüm dersleri göster</Text>
              </Pressable>
            </View>}
          </View>
        </ScrollView>
      </SafeAreaView>
      <RepeatQuestionRewardsModal
        visible={repeatInfoVisible}
        reduceMotion={reduceMotion}
        focused={repeatInfoControlFocused}
        styles={styles}
        tokens={tokens}
        onFocus={() => setRepeatInfoControlFocused(true)}
        onBlur={() => setRepeatInfoControlFocused(false)}
        onClose={closeRepeatInfo}
      />
    </View>
  );
}

function CategoryDetailSurface({ mobile, reduceMotion, styles, onClose, children }: {
  mobile: boolean;
  reduceMotion: boolean;
  styles: ReturnType<typeof makeStyles>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (!mobile || reduceMotion) { opacity.setValue(1); return; }
    const animation = Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [mobile, opacity, reduceMotion]);

  if (!mobile) return <>{children}</>;
  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.detailScrim}>
        <Pressable accessibilityRole="button" accessibilityLabel="Ders detayını kapat" onPress={onClose} style={StyleSheet.absoluteFill} />
        <SafeAreaView pointerEvents="box-none" style={styles.detailSafeArea}>
          <Animated.View accessibilityViewIsModal style={[styles.detailPanel, { opacity }]}>
            <View style={styles.detailTopbar}>
              <Text style={styles.browseLabel}>DERS DETAYI</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Derslere dön" onPress={onClose} style={({ pressed }) => [styles.detailClose, pressed && styles.browsePressed]}>
                <Text style={styles.filterText}>Kapat</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>{children}</ScrollView>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function RepeatQuestionRewardsModal({
  visible,
  reduceMotion,
  focused,
  styles,
  tokens,
  onFocus,
  onBlur,
  onClose,
}: {
  visible: boolean;
  reduceMotion: boolean;
  focused: boolean;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
  onFocus: () => void;
  onBlur: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.infoScrim}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tekrar soru ödülleri bilgisini kapat"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView pointerEvents="box-none" style={styles.infoSafeArea}>
          <View accessibilityViewIsModal style={styles.infoModal}>
            <View style={styles.infoModalHeader}>
              <View style={styles.infoModalIcon}>
                <AssetIcon
                  source={UI_ICON_ASSETS.info}
                  fallbackName="information-outline"
                  fallbackColor={tokens.colors.secondary}
                  size={24}
                />
              </View>
              <Text accessibilityRole="header" style={styles.infoModalTitle}>Tekrar soru ödülleri</Text>
            </View>
            <View style={styles.infoModalCopy}>
              <Text style={styles.infoModalText}>Daha önce doğru çözdüğün sorular tekrar geldiğinde oynanabilir kalır, ancak Kariyer XP, İtibar ve Şirket Bütçesi ödülleri azaltılır. Böylece ezber yerine yeni sorularda ilerlemek daha değerli olur.</Text>
              <Text style={styles.infoModalText}>Yıldız kademesi hedefleri de bu azaltılmış İtibar değerleriyle hesaplanır.</Text>
              <Text style={styles.infoModalText}>Sıralama puanı da tekrar doğru cevaplarda azaltılır.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tekrar soru ödülleri bilgisini kapat"
              onFocus={onFocus}
              onBlur={onBlur}
              onPress={onClose}
              style={({ pressed }) => [
                styles.infoModalAction,
                focused && styles.controlFocused,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.infoModalActionText}>Anladım</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>, width: number) {
  const { colors, radius, shadow } = tokens;
  const categoryWidth = width >= 1120 ? '32.2%' : width >= 680 ? '48%' : '100%';
  const isCalmLightTheme = tokens.effects.decorativeOpacity === 0;
  const isMobile = width < 680;
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
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    infoButton: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.pill, backgroundColor: colors.secondarySurfaceRaised },
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
    browseControls: { gap: 8 },
    browseLabel: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    searchField: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 12, paddingRight: 4, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, backgroundColor: colors.surface },
    searchInput: { flex: 1, minWidth: 0, minHeight: 46, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: colors.text },
    clearSearch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.sm, backgroundColor: colors.secondarySurface },
    filterChipSelected: { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
    filterText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 18, color: colors.text },
    filterTextSelected: { color: colors.secondary },
    resultCount: { fontFamily: fonts.monoMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    browsePressed: { backgroundColor: colors.surfacePressed },
    compactCard: { width: width < 340 ? '100%' : '48%', flexGrow: 0, minWidth: 0, minHeight: 152, gap: 9, padding: 12, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.md, backgroundColor: colors.surface },
    compactCardSelected: { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
    compactCardPressed: { transform: [{ scale: 0.98 }] },
    compactTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    compactTitle: { fontFamily: fonts.headingBold, fontSize: 15, lineHeight: 20, color: colors.text, minHeight: 40 },
    compactProgress: { marginTop: 'auto', gap: 6 },
    compactTrack: { height: 4, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.progressTrack },
    compactCount: { fontFamily: fonts.monoMedium, fontSize: 12, lineHeight: 16, color: colors.text },
    compactStatus: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: colors.textMuted },
    detailScrim: { flex: 1, backgroundColor: colors.overlayScrim },
    detailSafeArea: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 10, paddingTop: 12 },
    detailPanel: { maxHeight: '95%', overflow: 'hidden', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadow.raised },
    detailTopbar: { minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    detailClose: { minHeight: 44, minWidth: 64, justifyContent: 'center', alignItems: 'center', borderRadius: radius.sm },
    detailContent: { paddingBottom: 12 },
    detailCard: { width: '100%', borderWidth: 0, borderRadius: 0, shadowOpacity: 0, elevation: 0 },
    detailHint: { paddingHorizontal: 4, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.textMuted },
    tierProgress: { marginTop: 5, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.text },
    emptyState: { alignItems: 'flex-start', gap: 12, paddingVertical: 20 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', justifyContent: isMobile ? 'space-between' : 'center', gap: isMobile ? 10 : 18 },
    categoryCard: { width: categoryWidth, minWidth: 0, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadow.card },
    cardRail: { height: 3, backgroundColor: colors.secondary, opacity: 0.72 },
    categoryHeader: { padding: tokens.layout.isCompact ? 10 : 16, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    categoryIdentity: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.layout.isCompact ? 9 : 11 },
    categoryIcon: { width: tokens.layout.isCompact ? 38 : 42, height: tokens.layout.isCompact ? 38 : 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.secondarySoft },
    categoryCopy: { flex: 1, minWidth: 0 },
    categoryTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    categoryDescription: { marginTop: tokens.layout.isCompact ? 1 : 2, fontFamily: fonts.body, fontSize: tokens.layout.isCompact ? 12 : 13, lineHeight: tokens.layout.isCompact ? 16 : 18, color: colors.textMuted },
    progressSection: { gap: tokens.layout.isCompact ? 7 : 9, paddingHorizontal: tokens.layout.isCompact ? 12 : 16, paddingVertical: tokens.layout.isCompact ? 10 : 13, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle, backgroundColor: colors.floatingSurface },
    progressInline: { fontFamily: fonts.bodySemiBold, fontSize: tokens.layout.isCompact ? 11 : 12, lineHeight: tokens.layout.isCompact ? 15 : 17, color: colors.text },
    progressTrack: { height: 7, overflow: 'hidden', borderRadius: 3, backgroundColor: colors.borderSubtle },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.warning },
    tierSection: { gap: tokens.layout.isCompact ? 5 : 7, padding: tokens.layout.isCompact ? 8 : 12 },
    sectionLabel: { paddingHorizontal: 3, fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.55, color: colors.textMuted },
    tierStrip: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
    tierCell: { flex: 1, minWidth: 0, minHeight: tokens.layout.isCompact ? 68 : 76, paddingHorizontal: tokens.layout.isCompact ? 7 : 9, paddingVertical: tokens.layout.isCompact ? 7 : 9, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised },
    tierCellPrimary: { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
    tierCellLocked: { opacity: isMobile ? 1 : 0.56, backgroundColor: colors.secondarySurface },
    tierCellIncomplete: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
    tierTopline: { minHeight: tokens.layout.isCompact ? 15 : 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
    starLabel: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: tokens.layout.isNarrow ? 10 : 11, lineHeight: 15, color: colors.warning },
    tierTextMuted: { color: colors.textMuted },
    tierTitle: { marginTop: tokens.layout.isCompact ? 1 : 2, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: tokens.layout.isCompact ? 17 : 18, color: colors.text },
    tierStatus: { marginTop: tokens.layout.isCompact ? 2 : 3, fontFamily: fonts.body, fontSize: isMobile ? 12 : 9, lineHeight: isMobile ? 17 : 13, color: colors.textMuted },
    lockedTierFeedback: { minHeight: 48, flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 9, borderWidth: 1, borderColor: colors.warning, borderRadius: radius.sm, backgroundColor: colors.warningSoft },
    lockedTierFeedbackCopy: { flex: 1, minWidth: 0, gap: 2 },
    lockedTierFeedbackText: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: colors.text },
    lockedTierFeedbackTarget: { fontFamily: fonts.monoSemiBold, fontSize: 9, lineHeight: 13, color: colors.textMuted },
    nextBadge: { alignSelf: 'flex-start', flexShrink: 0, paddingHorizontal: tokens.layout.isCompact ? 5 : 6, paddingVertical: 2, overflow: 'hidden', borderRadius: radius.pill, fontFamily: fonts.monoSemiBold, fontSize: tokens.layout.isCompact ? 9 : 8, lineHeight: 11, letterSpacing: 0.35, color: colors.secondary, backgroundColor: colors.secondarySoft },
    actionSection: { marginTop: 'auto', gap: tokens.layout.isCompact ? 6 : 8, padding: tokens.layout.isCompact ? 8 : 12, paddingTop: tokens.layout.isCompact ? 0 : 2 },
    availabilityNote: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4 },
    availabilityText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    primaryButton: { minHeight: tokens.layout.isCompact ? 48 : 52, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 8 : 10, paddingHorizontal: tokens.layout.isCompact ? 12 : 14, borderRadius: radius.md, backgroundColor: isCalmLightTheme ? colors.action : colors.primary },
    primaryButtonHovered: { backgroundColor: colors.actionHover },
    primaryButtonFocused: { borderWidth: 2, borderColor: colors.actionFocus },
    primaryButtonPressed: { backgroundColor: colors.actionPressed },
    primaryButtonDisabled: { borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised, opacity: 0.58 },
    buttonCopy: { flex: 1, minWidth: 0 },
    buttonTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 18, color: colors.onAccent },
    buttonTitleDisabled: { color: colors.textMuted },
    buttonMeta: { marginTop: 1, fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 12, letterSpacing: 0.35, color: colors.onAccent },
    buttonMetaDisabled: { color: colors.textMuted },
    buttonIcon: { width: tokens.layout.isCompact ? 30 : 32, height: tokens.layout.isCompact ? 30 : 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.actionSubSurface },
    buttonIconDisabled: { backgroundColor: colors.borderSubtle },
    infoScrim: { flex: 1, justifyContent: 'center', backgroundColor: colors.overlayScrim },
    infoSafeArea: { width: '100%', paddingHorizontal: tokens.layout.isCompact ? 12 : 24, paddingVertical: 20 },
    infoModal: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18, padding: tokens.layout.isCompact ? 18 : 24, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, backgroundColor: colors.floatingSurface, ...shadow.raised },
    infoModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoModalIcon: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, backgroundColor: colors.secondarySoft },
    infoModalTitle: { ...tokens.type.title, flex: 1, fontFamily: fonts.headingBold, color: colors.text },
    infoModalCopy: { gap: 12 },
    infoModalText: { ...tokens.type.body, fontFamily: fonts.body, color: colors.textMuted },
    infoModalAction: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.md, backgroundColor: isCalmLightTheme ? colors.action : colors.primary },
    infoModalActionText: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19, color: colors.onAccent },
    controlFocused: { borderWidth: 2, borderColor: colors.actionFocus },
    pressed: tokens.motion.pressed,
  });
}
