import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import type { Theme } from '../../src/theme/themes';
import { supabase } from '../../src/supabase';
import { fonts, fontSizes } from '../../src/theme/typography';

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

  useEffect(() => { fetchIncidents(); }, []);

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
    setIncident(available[Math.floor(Math.random() * available.length)]);
  }, []);

  const handleChoice = async (choice: IncidentChoice) => {
    if (isResolving) return;
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
    setIsResolving(false);
    setActiveChoice(null);
    if (incident) pickRandomIncident(incidents, [...seenIds, incident.id]);
  };

  const handleExit = () => { router.replace('/(tabs)/'); };

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.incidentCard}>
          <LinearGradient colors={[colors.alertBg, colors.bgBase + 'F2']} style={styles.incidentGradient}>
            <Text style={styles.tag}>{incident.tag}</Text>
            <Text style={styles.title}>{incident.title}</Text>
            <Text style={styles.description}>{incident.description}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionLabel}>Müdahale Seçenekleri</Text>
        <View style={styles.choices}>
          {activeChoice ? (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{activeChoice.feedback}</Text>
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
    incidentCard: {
      marginHorizontal: 20, borderRadius: geometry.borderRadiusLg, borderWidth: geometry.borderWidth,
      borderColor: colors.alertBorder, overflow: 'hidden', ...effects.glowAlert,
    },
    incidentGradient: { padding: 18 },
    tag: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.accentAlert, marginBottom: 10 },
    title: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes['2xl'], lineHeight: 23, color: colors.textPrimary, marginBottom: 8 },
    description: { fontFamily: fonts.body, fontSize: fontSizes.md, lineHeight: 19, color: colors.textMuted },
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
    feedbackContainer: {
      backgroundColor: colors.panel, borderWidth: geometry.borderWidth, borderColor: colors.border,
      borderRadius: geometry.borderRadius, padding: 18, ...effects.cardShadow,
    },
    feedbackText: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.textPrimary, lineHeight: 24, marginBottom: 16 },
    deltasContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    deltaPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: geometry.borderRadiusSm },
    deltaText: { fontFamily: fonts.monoBold, fontSize: fontSizes.md },
    nextBtn: {
      backgroundColor: colors.accentAlert, paddingVertical: 14,
      borderRadius: geometry.borderRadius, alignItems: 'center', ...effects.glowAlert,
    },
    nextBtnText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: '#0A0800' },
  });
}
