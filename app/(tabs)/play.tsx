import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { getTierAttemptedCount, isTierUnlocked } from '../../src/utils/categoryProgress';
import { isValidCategoryQuestion, type CategoryQuestionRow } from '../../src/utils/categoryQuestions';

type Availability = Record<GameCategoryId, Record<DifficultyStar, number>>;

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
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [availability, setAvailability] = useState<Availability>(() => createEmptyAvailability());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>OPERASYON EĞİTİM MERKEZİ</Text>
              <Text style={styles.title}>Oyun</Text>
              <Text style={styles.description}>Bir kategori ve zorluk seç. Her oturum 10 sorudan oluşur; bir yıldızdaki 20 benzersiz soruyu denemek sonraki yıldızı açar.</Text>
            </View>

            {loading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={tokens.colors.secondary} />
                <Text style={styles.stateText}>Kategori içeriği kontrol ediliyor…</Text>
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
              {GAME_CATEGORIES.map((category) => (
                <View key={category.id} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name={category.icon} size={24} color={tokens.colors.secondary} />
                    </View>
                    <View style={styles.categoryCopy}>
                      <Text style={styles.categoryTitle}>{category.name}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    </View>
                  </View>

                  <View style={styles.tierList}>
                    {DIFFICULTY_STARS.map((star) => {
                      const attempted = getTierAttemptedCount(categoryProgress, category.id, star);
                      const unlocked = isTierUnlocked(categoryProgress, category.id, star);
                      const completeContent = availability[category.id][star] === QUESTIONS_PER_TIER;
                      const enabled = unlocked && completeContent && !loading;
                      const status = !completeContent
                        ? `İçerik bekleniyor · ${availability[category.id][star]}/${QUESTIONS_PER_TIER}`
                        : unlocked
                          ? `İlerleme ${attempted}/${QUESTIONS_PER_TIER} · İçerik ${QUESTIONS_PER_TIER}/${QUESTIONS_PER_TIER}`
                          : `İlerleme kilitli · İçerik ${QUESTIONS_PER_TIER}/${QUESTIONS_PER_TIER} · Önce ${star - 1} yıldızı tamamla`;
                      return (
                        <Pressable
                          key={star}
                          accessibilityRole="button"
                          accessibilityLabel={`${category.name}, ${star} yıldız ${DIFFICULTY_LABELS[star]}, ${status}`}
                          accessibilityState={{ disabled: !enabled }}
                          disabled={!enabled}
                          onPress={() => startSession(category.id, star)}
                          style={({ pressed }) => [styles.tierRow, !enabled && styles.tierRowDisabled, pressed && styles.pressed]}
                        >
                          <View style={styles.starGroup}>
                            {DIFFICULTY_STARS.map((value) => (
                              <Ionicons key={value} name={value <= star ? 'star' : 'star-outline'} size={15} color={value <= star ? tokens.colors.warning : tokens.colors.textMuted} />
                            ))}
                          </View>
                          <View style={styles.tierCopy}>
                            <Text style={styles.tierTitle}>{DIFFICULTY_LABELS[star]}</Text>
                            <Text style={styles.tierStatus}>{status}</Text>
                          </View>
                          <Ionicons name={enabled ? 'play-circle' : 'lock-closed'} size={22} color={enabled ? tokens.colors.secondary : tokens.colors.textMuted} />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    safeArea: { flex: 1 },
    content: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: tokens.layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop, gap: tokens.layout.sectionGap },
    header: { gap: 5, paddingBottom: 4 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary },
    title: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    description: { ...tokens.type.body, maxWidth: 720, fontFamily: fonts.body, color: colors.textMuted },
    stateCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface },
    stateText: { ...tokens.type.bodySmall, fontFamily: fonts.bodyMedium, color: colors.textMuted },
    errorCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.warning, backgroundColor: colors.warningSoft },
    errorText: { ...tokens.type.bodySmall, flex: 1, minWidth: 190, fontFamily: fonts.bodyMedium, color: colors.text },
    retryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: radius.sm, backgroundColor: colors.warning },
    retryText: { fontFamily: fonts.bodySemiBold, color: colors.onAccent },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 12 : 18 },
    categoryCard: { flexGrow: 1, flexBasis: tokens.layout.isCompact ? '100%' : 350, minWidth: 0, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadow.card },
    categoryHeader: { flexDirection: 'row', gap: 12, padding: tokens.layout.isCompact ? 14 : 18, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    categoryIcon: { width: 46, height: 46, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySoft },
    categoryCopy: { flex: 1, minWidth: 0 },
    categoryTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    categoryDescription: { ...tokens.type.bodySmall, marginTop: 2, fontFamily: fonts.body, color: colors.textMuted },
    tierList: { padding: tokens.layout.isCompact ? 8 : 10, gap: 6 },
    tierRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised },
    tierRowDisabled: { opacity: 0.58 },
    starGroup: { width: 56, flexDirection: 'row', gap: 2 },
    tierCopy: { flex: 1, minWidth: 0 },
    tierTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19, color: colors.text },
    tierStatus: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    pressed: { opacity: 0.78 },
  });
}
