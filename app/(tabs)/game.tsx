import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EVALUATION_REWARDS, type EvaluationTier } from '../../src/config/gameRewards';
import GradientBackground from '../../src/components/GradientBackground';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { supabase } from '../../src/supabase';
import type { Theme } from '../../src/theme/themes';
import { fonts, fontSizes } from '../../src/theme/typography';

const TIMER_DURATION = 20;
const POSITIVE_FEEDBACK = ['Harika çözüm!', 'Krizi iyi yönettin.', 'Tebrikler, sistem kurtuldu!'];
const ENCOURAGING_FEEDBACK = ['Bir dahaki sefere.', 'Sistem çöktü ama öğreneceğimiz şeyler var.', 'Her kriz yeni bir deneyimdir.'];
const RANK_LEVEL_BY_TIER = {
  junior: 1,
  engineer: 2,
  senior: 3,
  lead: 4,
  manager: 5,
  director: 6,
  cto: 7,
} as const;

function pickFeedback(phrases: string[]) {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/** Shape returned by Supabase. Reward and penalty values never come from this row. */
export interface GameIncident {
  id: number;
  tag: string;
  /** The complete question text shown in the incident card. */
  title: string;
  optimal_text: string;
  acceptable_text: string;
  wrong_text: string;
  fatal_text: string;
}

interface IncidentChoice {
  id: EvaluationTier;
  tier: EvaluationTier;
  label: string;
}

function shuffleChoices(incident: GameIncident): IncidentChoice[] {
  const choices: IncidentChoice[] = (['optimal', 'acceptable', 'wrong', 'fatal'] as const).map((tier) => ({
    id: tier,
    tier,
    label: incident[`${tier}_text`],
  }));

  // Fisher-Yates: every tier has an equal chance of appearing in every position.
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [choices[index], choices[randomIndex]] = [choices[randomIndex], choices[index]];
  }
  return choices;
}

function formatDelta(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('tr-TR')}`;
}

export default function GameScreen() {
  const router = useRouter();
  const { applyOutcome, seenIds, setSeenIds, clearSeenIds, setCorrectAnswers, setWrongAnswers, currentRank } = useReputation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const [incident, setIncident] = useState<GameIncident | null>(null);
  const [choices, setChoices] = useState<IncidentChoice[]>([]);
  const [activeChoice, setActiveChoice] = useState<IncidentChoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [feedbackPhrase, setFeedbackPhrase] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incidentRef = useRef<GameIncident | null>(null);
  const incidentsRef = useRef<GameIncident[]>([]);
  const resolvingRef = useRef(false);
  const seenIdsRef = useRef(seenIds);
  const hasInitializedRef = useRef(false);
  const rankLevelRef = useRef(RANK_LEVEL_BY_TIER[currentRank.tier]);
  const contextActionsRef = useRef({ applyOutcome, setSeenIds, clearSeenIds, setCorrectAnswers, setWrongAnswers });

  useEffect(() => {
    seenIdsRef.current = seenIds;
  }, [seenIds]);

  useEffect(() => {
    contextActionsRef.current = { applyOutcome, setSeenIds, clearSeenIds, setCorrectAnswers, setWrongAnswers };
  }, [applyOutcome, clearSeenIds, setCorrectAnswers, setSeenIds, setWrongAnswers]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const resolveTimeout = useCallback(async () => {
    const currentIncident = incidentRef.current;
    if (resolvingRef.current || !currentIncident) return;
    resolvingRef.current = true;
    setIsAnswered(true);
    setTimedOut(true);
    setFeedbackPhrase(pickFeedback(ENCOURAGING_FEEDBACK));
    if (!seenIdsRef.current.includes(currentIncident.id)) {
      seenIdsRef.current = [...seenIdsRef.current, currentIncident.id];
      contextActionsRef.current.setSeenIds(seenIdsRef.current);
    }
    contextActionsRef.current.setWrongAnswers((value) => value + 1);
    const reward = EVALUATION_REWARDS.fatal;
    await contextActionsRef.current.applyOutcome(reward.reputationDelta, reward.budgetDelta);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(TIMER_DURATION);
    timerRef.current = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          stopTimer();
          void resolveTimeout();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }, [resolveTimeout, stopTimer]);

  const chooseIncident = useCallback((pool: GameIncident[], usedIds: number[]) => {
    const available = pool.filter((item) => !usedIds.includes(item.id));
    if (!available.length) {
      setIncident(null);
      setChoices([]);
      return;
    }
    const next = available[Math.floor(Math.random() * available.length)];
    incidentRef.current = next;
    resolvingRef.current = false;
    setIncident(next);
    setChoices(shuffleChoices(next));
    setActiveChoice(null);
    setIsAnswered(false);
    setTimedOut(false);
    setFeedbackPhrase(null);
    startTimer();
  }, [startTimer]);

  const fetchIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('game_incidents')
        .select('id, tag, title, optimal_text, acceptable_text, wrong_text, fatal_text')
        .eq('rank_level', rankLevelRef.current)
        .order('id', { ascending: true });
      if (fetchError) throw fetchError;
      if (!data?.length) {
        setError('Kriz senaryosu bulunamadı.');
        return;
      }
      const loadedIncidents = data as GameIncident[];
      incidentsRef.current = loadedIncidents;
      chooseIncident(loadedIncidents, seenIdsRef.current);
    } catch (fetchError: any) {
      setError(fetchError.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [chooseIncident]);

  useEffect(() => {
    if (hasInitializedRef.current) return stopTimer;
    hasInitializedRef.current = true;
    void fetchIncidents();
    return stopTimer;
    // Initial Supabase load must not be coupled to changing context action references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChoice = useCallback(async (choice: IncidentChoice) => {
    const currentIncident = incidentRef.current;
    if (resolvingRef.current || !currentIncident) return;
    stopTimer();
    resolvingRef.current = true;
    setIsAnswered(true);
    setActiveChoice(choice);
    if (!seenIdsRef.current.includes(currentIncident.id)) {
      seenIdsRef.current = [...seenIdsRef.current, currentIncident.id];
      contextActionsRef.current.setSeenIds(seenIdsRef.current);
    }

    const reward = EVALUATION_REWARDS[choice.tier];
    setFeedbackPhrase(pickFeedback(reward.isPositive ? POSITIVE_FEEDBACK : ENCOURAGING_FEEDBACK));
    if (reward.isPositive) contextActionsRef.current.setCorrectAnswers((value) => value + 1);
    else contextActionsRef.current.setWrongAnswers((value) => value + 1);
    await contextActionsRef.current.applyOutcome(reward.reputationDelta, reward.budgetDelta);
  }, [stopTimer]);

  const handleNextScenario = useCallback(() => {
    const currentIncident = incidentRef.current;
    if (currentIncident) chooseIncident(incidentsRef.current, seenIdsRef.current);
  }, [chooseIncident]);

  const handleRestart = useCallback(async () => {
    stopTimer();
    seenIdsRef.current = [];
    await contextActionsRef.current.clearSeenIds();
    chooseIncident(incidentsRef.current, []);
  }, [chooseIncident, stopTimer]);

  const handleExit = useCallback(() => {
    stopTimer();
    router.replace('/(tabs)/');
  }, [router, stopTimer]);

  if (isLoading) return <LoadingScreen styles={styles} color={colors.accentAlert} />;
  if (error) return <ErrorScreen styles={styles} message={error} onRetry={fetchIncidents} />;
  if (!incident) return <CompleteScreen styles={styles} onRestart={handleRestart} onExit={handleExit} />;

  const selectedReward = activeChoice ? EVALUATION_REWARDS[activeChoice.tier] : null;
  const timeoutReward = EVALUATION_REWARDS.fatal;
  const feedbackReward = timedOut ? timeoutReward : selectedReward;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable style={styles.exitBtn} onPress={handleExit}><Text style={styles.exitText}>×</Text></Pressable>
            <View><Text style={styles.header}>Kriz Müdahalesi</Text><Text style={styles.subheader}>Her karar bütçe ve itibarını etkiler.</Text></View>
          </View>

          {!isAnswered && <View style={styles.timer}><Text style={[styles.timerText, { color: timeLeft <= 5 ? colors.accentDanger : colors.accentAlert }]}>⏱ {timeLeft}s</Text><View style={styles.timerTrack}><View style={[styles.timerFill, { width: `${(timeLeft / TIMER_DURATION) * 100}%` }]} /></View></View>}

          <View style={styles.incidentCard}><LinearGradient colors={[colors.alertBg, colors.bgBase]} style={styles.incidentGradient}><Text style={styles.tag}>{incident.tag}</Text><Text style={styles.title}>{incident.title}</Text></LinearGradient></View>

          <Text style={styles.sectionLabel}>{isAnswered ? 'Sonuç' : 'Müdahale Seçenekleri'}</Text>
          <View style={styles.choices}>
            {isAnswered && feedbackReward ? (
              <View style={[styles.feedback, { borderColor: feedbackReward.isPositive ? colors.positiveBorder : colors.dangerBorder, backgroundColor: feedbackReward.isPositive ? colors.positiveBg : colors.dangerBg }]}>
                <Text style={[styles.feedbackText, { color: feedbackReward.isPositive ? colors.accentPositive : colors.accentDanger }]}>{timedOut ? 'Süre doldu! Kritik sonuç uygulandı.' : feedbackPhrase}</Text>
                <View style={styles.deltas}><Text style={[styles.delta, { color: feedbackReward.isPositive ? colors.accentPositive : colors.accentDanger }]}>İtibar: {formatDelta(feedbackReward.reputationDelta)}</Text><Text style={[styles.delta, { color: feedbackReward.isPositive ? colors.accentPositive : colors.accentDanger }]}>Bütçe: {formatDelta(feedbackReward.budgetDelta)}</Text></View>
                {!feedbackReward.isPositive && <View style={styles.correctAnswer}><Text style={styles.correctAnswerLabel}>En iyi cevap</Text><Text style={styles.correctAnswerText}>{incident.optimal_text}</Text></View>}
                <Pressable style={styles.nextBtn} onPress={handleNextScenario}><Text style={styles.nextText}>Sonraki Soru</Text></Pressable>
              </View>
            ) : choices.map((choice) => <Pressable key={choice.id} style={styles.choiceBtn} onPress={() => void handleChoice(choice)}><Text style={styles.choiceLabel}>{choice.label}</Text></Pressable>)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function LoadingScreen({ styles, color }: { styles: ReturnType<typeof makeStyles>; color: string }) { return <SafeAreaView style={styles.safeArea}><View style={styles.center}><ActivityIndicator size="large" color={color} /><Text style={styles.loadingText}>Senaryolar yükleniyor...</Text></View></SafeAreaView>; }
function ErrorScreen({ styles, message, onRetry }: { styles: ReturnType<typeof makeStyles>; message: string; onRetry: () => void }) { return <SafeAreaView style={styles.safeArea}><View style={styles.center}><Text style={styles.errorText}>Hata: {message}</Text><Pressable style={styles.nextBtn} onPress={() => void onRetry()}><Text style={styles.nextText}>Tekrar Dene</Text></Pressable></View></SafeAreaView>; }
function CompleteScreen({ styles, onRestart, onExit }: { styles: ReturnType<typeof makeStyles>; onRestart: () => void; onExit: () => void }) {
  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.completeContainer}>
          <View style={styles.completeCard}>
            <Text style={styles.completeIcon}>🏆</Text>
            <Text style={styles.completeTitle}>Tebrikler!</Text>
            <Text style={styles.completeMessage}>Bu seviyedeki tüm kriz senaryolarını tamamladın.</Text>
            <Pressable style={styles.restartBtn} onPress={() => void onRestart()}><Text style={styles.restartText}>Baştan Başla</Text></Pressable>
            <Pressable style={styles.dashboardBtn} onPress={onExit}><Text style={styles.dashboardText}>Dashboard'a Dön</Text></Pressable>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' }, content: { paddingBottom: 32 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 }, loadingText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: fontSizes.md }, errorText: { fontFamily: fonts.bodySemiBold, color: colors.accentDanger, fontSize: fontSizes.md, textAlign: 'center' },
    completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }, completeCard: { width: '100%', maxWidth: 460, alignItems: 'center', backgroundColor: colors.panel, borderWidth: geometry.borderWidth, borderColor: colors.alertBorder, borderRadius: geometry.borderRadiusLg, paddingVertical: 32, paddingHorizontal: 24, gap: 14, ...effects.glowAlert }, completeIcon: { fontSize: 48 }, completeTitle: { fontFamily: fonts.headingBold, fontSize: fontSizes['3xl'], color: colors.textPrimary, textAlign: 'center' }, completeMessage: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.lg, lineHeight: 24, color: colors.textMuted, textAlign: 'center', marginBottom: 8 }, restartBtn: { width: '100%', backgroundColor: colors.accentAlert, borderRadius: geometry.borderRadius, paddingVertical: 14, alignItems: 'center', ...effects.glowAlert }, restartText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: '#0A0800' }, dashboardBtn: { width: '100%', backgroundColor: colors.panelAlt, borderWidth: geometry.borderWidth, borderColor: colors.border, borderRadius: geometry.borderRadius, paddingVertical: 14, alignItems: 'center' }, dashboardText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.textPrimary },
    headerRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 12, marginBottom: 14, gap: 12 }, exitBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderWidth: geometry.borderWidth, borderColor: colors.border }, exitText: { color: colors.textMuted, fontSize: 24 }, header: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes['3xl'], color: colors.textPrimary }, subheader: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.textMuted, marginTop: 4 },
    timer: { marginHorizontal: 20, marginBottom: 14, gap: 8 }, timerText: { fontFamily: fonts.monoBold, fontSize: fontSizes.lg }, timerTrack: { height: 5, borderRadius: 3, backgroundColor: colors.panelAlt, overflow: 'hidden' }, timerFill: { height: '100%', backgroundColor: colors.accentAlert },
    incidentCard: { marginHorizontal: 20, borderRadius: geometry.borderRadiusLg, overflow: 'hidden', borderWidth: geometry.borderWidth, borderColor: colors.alertBorder }, incidentGradient: { padding: 18 }, tag: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.accentAlert, marginBottom: 10 }, title: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes['2xl'], lineHeight: 27, color: colors.textPrimary },
    sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.base, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 20, marginTop: 22, marginBottom: 10 }, choices: { marginHorizontal: 20, gap: 10 }, choiceBtn: { backgroundColor: colors.panel, borderWidth: geometry.borderWidth, borderColor: colors.border, borderRadius: geometry.borderRadius, paddingVertical: 14, paddingHorizontal: 16, ...effects.cardShadow }, choiceLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.textPrimary, lineHeight: 19 },
    feedback: { borderWidth: geometry.borderWidth, borderRadius: geometry.borderRadius, padding: 18, gap: 14 }, feedbackText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, lineHeight: 24 }, deltas: { flexDirection: 'row', gap: 12 }, delta: { fontFamily: fonts.monoBold, fontSize: fontSizes.sm }, correctAnswer: { borderWidth: geometry.borderWidth, borderColor: colors.positiveBorder, backgroundColor: colors.panel, borderRadius: geometry.borderRadiusSm, padding: 12, gap: 4 }, correctAnswerLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs, color: colors.accentPositive, textTransform: 'uppercase', letterSpacing: 0.5 }, correctAnswerText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.textPrimary, lineHeight: 20 }, nextBtn: { backgroundColor: colors.accentAlert, borderRadius: geometry.borderRadius, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center', alignSelf: 'flex-start' }, nextText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: '#0A0800' },
  });
}
