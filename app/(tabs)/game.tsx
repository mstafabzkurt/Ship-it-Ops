import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import type { Theme } from '../../src/theme/themes';
import { supabase } from '../../src/supabase';
import { fonts, fontSizes } from '../../src/theme/typography';
import GradientBackground from '../../src/components/GradientBackground';

const TIMER_DURATION = 20; // seconds per question

export interface IncidentChoice {
  id: string;
  label: string;
  scoreDelta: number;
  budgetDelta: number;
  outcome: 'success' | 'partial' | 'fail';
  feedback: string;
}

export interface GameIncident {
  id: number;
  tag: string;
  title: string;
  description: string;
  durationSeconds: number;
  failureScoreDelta: number;
  failureBudgetDelta: number;
  choices: IncidentChoice[];
}

export default function GameScreen() {
  const router = useRouter();
  const { applyOutcome, seenIds, setSeenIds, setCorrectAnswers, setWrongAnswers } = useReputation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const [incidents, setIncidents] = useState<GameIncident[]>([]);
  const [incident, setIncident] = useState<GameIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChoice, setActiveChoice] = useState<IncidentChoice | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // ── Timer state ────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isResolvingRef = useRef(false);

  // Animated values for danger pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── Timer color logic ──────────────────────────────────────────────────────
  const timerColor =
    timeLeft <= 5
      ? colors.accentDanger
      : timeLeft <= 10
        ? colors.accentAlert
        : colors.accentPositive;

  const timerBarWidth = `${(timeLeft / TIMER_DURATION) * 100}%`;

  // ── Start pulse animation when <= 5 seconds ────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 5 && !isResolving) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => { pulseLoop.current?.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft <= 5, isResolving]);

  // ── Start/stop timer ───────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIMER_DURATION);
    setTimedOut(false);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          if (!isResolvingRef.current) {
            handleTimerExpiry();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => () => { stopTimer(); }, [stopTimer]);

  // ── Timer expiry — records as wrong answer ─────────────────────────────────
  const handleTimerExpiry = useCallback(async () => {
    if (isResolvingRef.current) return;
    isResolvingRef.current = true;
    setIsResolving(true);
    setTimedOut(true);
    setSeenIds((prev) => {
      const currentIncident = incidentRef.current;
      if (currentIncident && !prev.includes(currentIncident.id)) return [...prev, currentIncident.id];
      return prev;
    });
    setWrongAnswers(prev => prev + 1);
    if (incidentRef.current) {
      await applyOutcome(
        incidentRef.current.failureScoreDelta ?? -30,
        incidentRef.current.failureBudgetDelta ?? -500,
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a ref to the current incident so timer callback can access it
  const incidentRef = useRef<GameIncident | null>(null);
  useEffect(() => { incidentRef.current = incident; }, [incident]);

  useEffect(() => { fetchIncidents(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('game_incidents')
        .select('*')
        .eq('rank_level', 1);
      if (fetchError) throw fetchError;
      if (data && data.length > 0) {
        setIncidents(data);
        pickRandomIncident(data, seenIds);
      } else {
        setError('Kriz senaryosu bulunamadı.');
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const pickRandomIncident = useCallback((pool: GameIncident[], currentSeenIds: number[] = []) => {
    const available = pool.filter(i => !currentSeenIds.includes(i.id));
    if (available.length === 0) { setIncident(null); return; }
    const chosen = available[Math.floor(Math.random() * available.length)];
    setIncident(chosen);
    incidentRef.current = chosen;
    isResolvingRef.current = false;
    setIsResolving(false);
    setActiveChoice(null);
    setTimedOut(false);
    // Start fresh timer for new question
    startTimer();
  }, [startTimer]);

  const handleChoice = async (choice: IncidentChoice) => {
    if (isResolving) return;
    stopTimer();
    isResolvingRef.current = true;
    setIsResolving(true);
    setActiveChoice(choice);
    setSeenIds((prev) => {
      if (incident && !prev.includes(incident.id)) return [...prev, incident.id];
      return prev;
    });
    if (choice.outcome === 'success') setCorrectAnswers((prev) => prev + 1);
    else setWrongAnswers((prev) => prev + 1);
    await applyOutcome(choice.scoreDelta, choice.budgetDelta);
  };

  const handleNextScenario = () => {
    isResolvingRef.current = false;
    setIsResolving(false);
    setActiveChoice(null);
    setTimedOut(false);
    if (incident) pickRandomIncident(incidents, [...seenIds, incident.id]);
  };

  const handleExit = () => {
    stopTimer();
    router.replace('/(tabs)/');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accentAlert} />
          <Text style={styles.loadingText}>Senaryolar Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Hata: {error}</Text>
          <Pressable style={styles.retryBtn} onPress={fetchIncidents}>
            <Text style={styles.retryBtnText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.header}>Tebrikler!</Text>
          <Text style={styles.loadingText}>Şu an için başka kriz senaryosu kalmadı.</Text>
          <Pressable style={[styles.retryBtn, { marginTop: 24 }]} onPress={handleExit}>
            <Text style={styles.retryBtnText}>Dashboard'a Dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Header row ── */}
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [styles.exitBtn, pressed && styles.exitBtnPressed]}
            onPress={handleExit}
            accessibilityLabel="Çıkış"
            accessibilityRole="button"
          >
            <Text style={styles.exitIcon}>✕</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.header}>Kriz Müdahalesi</Text>
            <Text style={styles.subheader}>Her karar bütçe ve itibarını etkiler.</Text>
          </View>
        </View>

        {/* ── Timer (only shown while answering) ── */}
        {!isResolving && (
          <View style={styles.timerContainer}>
            {/* Text + glow on danger zone */}
            <View style={styles.timerRow}>
              <Animated.Text
                style={[
                  styles.timerLabel,
                  { color: timerColor },
                  timeLeft <= 5 && {
                    transform: [{ scale: pulseAnim }],
                    textShadowColor: colors.accentDanger,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 10,
                  },
                ]}
              >
                ⏱ {timeLeft}s
              </Animated.Text>
              <Text style={[styles.timerHint, { color: timerColor }]}>
                {timeLeft <= 5
                  ? '⚠️ Son Süre!'
                  : timeLeft <= 10
                    ? 'Dikkat!'
                    : 'Süre dolmadan yanıtla'}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={[styles.timerBarTrack, { borderColor: timerColor + '44' }]}>
              <Animated.View
                style={[
                  styles.timerBarFill,
                  {
                    width: timerBarWidth as any,
                    backgroundColor: timerColor,
                    shadowColor: timerColor,
                    shadowOpacity: timeLeft <= 5 ? 0.8 : 0.3,
                    shadowRadius: timeLeft <= 5 ? 8 : 4,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: timeLeft <= 5 ? 6 : 2,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* ── Incident card ── */}
        <View style={styles.incidentCard}>
          <LinearGradient colors={[colors.alertBg, colors.bgBase + 'F2']} style={styles.incidentGradient}>
            <Text style={styles.tag}>{incident.tag}</Text>
            <Text style={styles.title}>{incident.title}</Text>
            <Text style={styles.description}>{incident.description}</Text>
          </LinearGradient>
        </View>

        {/* ── Choices / feedback ── */}
        <Text style={styles.sectionLabel}>
          {isResolving ? 'Sonuç' : 'Müdahale Seçenekleri'}
        </Text>
        <View style={styles.choices}>
          {isResolving ? (
            <View style={styles.feedbackContainer}>
              {/* Timeout state */}
              {timedOut && (
                <View style={[styles.timeoutBanner, { borderColor: colors.dangerBorder, backgroundColor: colors.dangerBg }]}>
                  <Text style={[styles.timeoutText, { color: colors.accentDanger }]}>
                    ⏰ Süre doldu! Yanlış cevap olarak kaydedildi.
                  </Text>
                </View>
              )}

              {/* Choice feedback (if user picked one) */}
              {activeChoice && (
                <Text style={styles.feedbackText}>{activeChoice.feedback}</Text>
              )}

              {/* Timeout penalty details */}
              {timedOut && incident && (
                <View style={styles.deltasContainer}>
                  <View style={[styles.deltaPill, { backgroundColor: colors.dangerBg }]}>
                    <Text style={[styles.deltaText, { color: colors.accentDanger }]}>
                      İtibar: {incident.failureScoreDelta ?? -30}
                    </Text>
                  </View>
                  <View style={[styles.deltaPill, { backgroundColor: colors.dangerBg }]}>
                    <Text style={[styles.deltaText, { color: colors.accentDanger }]}>
                      Bütçe: {incident.failureBudgetDelta ?? -500}
                    </Text>
                  </View>
                </View>
              )}

              {/* Choice outcome deltas */}
              {activeChoice && (
                <View style={styles.deltasContainer}>
                  <View style={[styles.deltaPill, { backgroundColor: activeChoice.scoreDelta >= 0 ? colors.positiveBg : colors.dangerBg }]}>
                    <Text style={[styles.deltaText, { color: activeChoice.scoreDelta >= 0 ? colors.accentPositive : colors.accentDanger }]}>
                      İtibar: {activeChoice.scoreDelta >= 0 ? '+' : ''}{activeChoice.scoreDelta}
                    </Text>
                  </View>
                  <View style={[styles.deltaPill, { backgroundColor: activeChoice.budgetDelta >= 0 ? colors.positiveBg : colors.dangerBg }]}>
                    <Text style={[styles.deltaText, { color: activeChoice.budgetDelta >= 0 ? colors.accentPositive : colors.accentDanger }]}>
                      Bütçe: {activeChoice.budgetDelta >= 0 ? '+' : ''}{activeChoice.budgetDelta}
                    </Text>
                  </View>
                </View>
              )}

              <Pressable style={styles.nextBtn} onPress={handleNextScenario}>
                <Text style={styles.nextBtnText}>Sonraki Senaryo</Text>
              </Pressable>
            </View>
          ) : (
            incident.choices.map((choice) => (
              <Pressable
                key={choice.id}
                style={({ pressed }) => [styles.choiceBtn, pressed && styles.choiceBtnPressed]}
                onPress={() => handleChoice(choice)}
              >
                <Text style={styles.choiceLabel}>{choice.label}</Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bgBase },
    scroll: { flex: 1 },
    content: { paddingBottom: 32 },
    centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    loadingText: { marginTop: 16, fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.textMuted },
    errorText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.accentDanger, marginBottom: 16, textAlign: 'center' },
    retryBtn: {
      backgroundColor: colors.panel, paddingVertical: 12, paddingHorizontal: 24,
      borderRadius: geometry.borderRadius, borderWidth: geometry.borderWidth, borderColor: colors.border,
    },
    retryBtnText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.textPrimary },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 20, marginTop: 12, marginBottom: 14, gap: 12 },
    exitBtn: {
      width: 36, height: 36, borderRadius: geometry.borderRadius,
      backgroundColor: colors.panel, borderWidth: geometry.borderWidth, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center', marginTop: 2,
    },
    exitBtnPressed: { backgroundColor: colors.panelAlt },
    exitIcon: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.textMuted, lineHeight: 18 },
    headerText: { flex: 1 },
    header: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes['3xl'], color: colors.textPrimary },
    subheader: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.textMuted, marginTop: 4 },

    // ── Timer ──────────────────────────────────────────────────────────────
    timerContainer: {
      marginHorizontal: 20, marginBottom: 14,
      backgroundColor: colors.panel, borderWidth: geometry.borderWidth,
      borderColor: colors.border, borderRadius: geometry.borderRadius,
      padding: 12, gap: 8,
      ...effects.cardShadow,
    },
    timerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    timerLabel: {
      fontFamily: fonts.monoBold,
      fontSize: fontSizes['2xl'],
      letterSpacing: 0.5,
    },
    timerHint: {
      fontFamily: fonts.bodyMedium,
      fontSize: fontSizes.xs,
      letterSpacing: 0.3,
    },
    timerBarTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.panelAlt,
      overflow: 'hidden',
      borderWidth: 0,
    },
    timerBarFill: {
      height: '100%',
      borderRadius: 3,
    },

    // ── Incident ──────────────────────────────────────────────────────────
    incidentCard: {
      marginHorizontal: 20, borderRadius: geometry.borderRadiusLg, borderWidth: geometry.borderWidth,
      borderColor: colors.alertBorder, overflow: 'hidden', ...effects.glowAlert,
    },
    incidentGradient: { padding: 18 },
    tag: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.accentAlert, marginBottom: 10 },
    title: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes['2xl'], lineHeight: 23, color: colors.textPrimary, marginBottom: 8 },
    description: { fontFamily: fonts.body, fontSize: fontSizes.md, lineHeight: 19, color: colors.textMuted },

    // ── Choices ───────────────────────────────────────────────────────────
    sectionLabel: {
      fontFamily: fonts.bodySemiBold, fontSize: fontSizes.base, color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 20, marginTop: 22, marginBottom: 10,
    },
    choices: { marginHorizontal: 20, gap: 10 },
    choiceBtn: {
      backgroundColor: colors.panel, borderWidth: geometry.borderWidth, borderColor: colors.border,
      borderRadius: geometry.borderRadius, paddingVertical: 14, paddingHorizontal: 16, ...effects.cardShadow,
    },
    choiceBtnPressed: { backgroundColor: colors.panelAlt },
    choiceLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.textPrimary, lineHeight: 19 },

    // ── Feedback ──────────────────────────────────────────────────────────
    feedbackContainer: {
      backgroundColor: colors.panel, borderWidth: geometry.borderWidth, borderColor: colors.border,
      borderRadius: geometry.borderRadius, padding: 18, gap: 12, ...effects.cardShadow,
    },
    timeoutBanner: {
      borderWidth: geometry.borderWidth,
      borderRadius: geometry.borderRadiusSm,
      paddingVertical: 10, paddingHorizontal: 14,
    },
    timeoutText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md },
    feedbackText: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.textPrimary, lineHeight: 24 },
    deltasContainer: { flexDirection: 'row', gap: 12 },
    deltaPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: geometry.borderRadiusSm },
    deltaText: { fontFamily: fonts.monoBold, fontSize: fontSizes.md },
    nextBtn: {
      backgroundColor: colors.accentAlert, paddingVertical: 14,
      borderRadius: geometry.borderRadius, alignItems: 'center', ...effects.glowAlert,
    },
    nextBtnText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: '#0A0800' },
  });
}
