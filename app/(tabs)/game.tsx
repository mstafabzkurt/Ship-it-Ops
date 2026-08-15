import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EVALUATION_REWARDS, TIMEOUT_REWARD, type EvaluationTier } from '../../src/config/gameRewards';
import { RECENT_QUESTION_HISTORY_LIMIT, SESSION_CRISIS_COUNT, type RankTier } from '../../src/config/progression';
import GameAbilityButton from '../../src/components/game/GameAbilityButton';
import GameActionButton from '../../src/components/game/GameActionButton';
import GameBackdrop from '../../src/components/game/GameBackdrop';
import GameResultPanel, { type GameResultTone } from '../../src/components/game/GameResultPanel';
import JokerUseOverlay, { type JokerUseActivation } from '../../src/components/game/JokerUseOverlay';
import UptimeMilestoneCard from '../../src/components/game/UptimeMilestoneCard';
import { dashboardType, getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { supabase } from '../../src/supabase';
import { fonts } from '../../src/theme/typography';
import { appendRecentQuestionId, selectNextQuestion } from '../../src/utils/questionSelection';

const TIMER_DURATION = 20;
const UPTIME_MILESTONE_REWARDS: Readonly<Record<number, number>> = {
  3: 150,
  5: 500,
  10: 2000,
  20: 4000,
};
const UPTIME_MILESTONES = [3, 5, 10, 20] as const;
const POSITIVE_FEEDBACK = ['Harika çözüm!', 'Krizi iyi yönettin.', 'Tebrikler, sistem kurtuldu!'];
const ENCOURAGING_FEEDBACK = ['Bir dahaki sefere.', 'Sistem çöktü ama öğreneceğimiz şeyler var.', 'Her kriz yeni bir deneyimdir.'];
function pickFeedback(phrases: string[]) {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/** Shape returned by Supabase. Reward and penalty values never come from this row. */
export interface GameIncident {
  id: number;
  rank_level: number;
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

interface AnimatedChoiceItemProps {
  choice: IncidentChoice;
  codeReviewEmphasis: Animated.Value;
  isCodeReviewActive: boolean;
  isRevertedChoice: boolean;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function AnimatedChoiceItem({
  choice,
  codeReviewEmphasis,
  isCodeReviewActive,
  isRevertedChoice,
  isSelected,
  isLocked,
  onPress,
  styles,
}: AnimatedChoiceItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const lineProgress = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isCodeReviewEliminated = isCodeReviewActive && (choice.tier === 'fatal' || choice.tier === 'wrong');
  const isCodeReviewSurvivor = isCodeReviewActive && !isCodeReviewEliminated;
  const isEliminated = isCodeReviewEliminated || isRevertedChoice;
  const isDisabled = isEliminated || isLocked;
  const survivorScale = codeReviewEmphasis.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });

  useEffect(() => {
    translateX.setValue(0);
    opacity.setValue(1);
    lineProgress.setValue(0);

    if (!isEliminated) return;

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(translateX, { toValue: -10, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -10, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0.4, duration: 300, useNativeDriver: true }),
      Animated.timing(lineProgress, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [isEliminated, lineProgress, opacity, translateX]);

  const lineWidth = lineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { scale: isCodeReviewSurvivor ? survivorScale : 1 }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={choice.label}
        accessibilityState={{ disabled: isDisabled, selected: isSelected }}
        disabled={isDisabled}
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.choiceBtn,
          isSelected && styles.choiceBtnSelected,
          isLocked && !isSelected && styles.choiceBtnLocked,
          hovered && !isDisabled && styles.choiceBtnHovered,
          focused && styles.choiceBtnFocused,
          pressed && !isDisabled && styles.choiceBtnPressed,
        ]}
      >
        {({ pressed }) => (
          <>
            <View style={styles.choiceTextContainer}>
              <Text style={styles.choiceLabel}>{choice.label}</Text>
              <Animated.View pointerEvents="none" style={[styles.eliminationLine, { width: lineWidth }]} />
            </View>
            <View style={[styles.choiceStateMark, (pressed || isSelected) && styles.choiceStateMarkActive]}>
              <Ionicons
                name={pressed || isSelected ? 'checkmark' : 'chevron-forward'}
                size={18}
                style={[styles.choiceStateIcon, (pressed || isSelected) && styles.choiceStateIconActive]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
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

function getNextUptimeMilestone(streak: number) {
  return UPTIME_MILESTONES.find((milestone) => milestone > streak) ?? null;
}

export default function GameScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    applyOutcome,
    addBudget,
    isLoaded,
    seenIds,
    setSeenIds,
    setCorrectAnswers,
    setWrongAnswers,
    currentRank,
    codeReview,
    consumeCodeReview,
    gitRevert,
    consumeGitRevert,
    serverScaleUp,
    consumeServerScaleUp,
    snapshotBackup,
    consumeSnapshotBackup,
    uptimeStreak,
    setUptimeStreak,
  } = useReputation();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { colors } = tokens;
  const isWide = width >= 900;

  const [incident, setIncident] = useState<GameIncident | null>(null);
  const [choices, setChoices] = useState<IncidentChoice[]>([]);
  const [activeChoice, setActiveChoice] = useState<IncidentChoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [feedbackPhrase, setFeedbackPhrase] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isCodeReviewActive, setIsCodeReviewActive] = useState(false);
  const [isScaleUpUsed, setIsScaleUpUsed] = useState(false);
  const [isReverted, setIsReverted] = useState(false);
  const [revertedChoiceId, setRevertedChoiceId] = useState<EvaluationTier | null>(null);
  const [lostStreak, setLostStreak] = useState(0);
  const [isOutcomePending, setIsOutcomePending] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [jokerOverlayQueue, setJokerOverlayQueue] = useState<JokerUseActivation[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerScale = useRef(new Animated.Value(1)).current;
  const timerColorProgress = useRef(new Animated.Value(0)).current;
  const gitRevertPulse = useRef(new Animated.Value(1)).current;
  const snapshotBackupPulse = useRef(new Animated.Value(1)).current;
  const snapshotRestoreFlash = useRef(new Animated.Value(0)).current;
  const snapshotStatusPulse = useRef(new Animated.Value(1)).current;
  const codeReviewEmphasis = useRef(new Animated.Value(0)).current;
  const questionTransition = useRef(new Animated.Value(1)).current;
  const resultTransition = useRef(new Animated.Value(0)).current;
  const incidentRef = useRef<GameIncident | null>(null);
  const incidentsRef = useRef<GameIncident[]>([]);
  const resolvingRef = useRef(false);
  const seenIdsRef = useRef(seenIds);
  const sessionQuestionIdsRef = useRef<number[]>([]);
  const uptimeStreakRef = useRef(uptimeStreak);
  const lostStreakRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const outcomePendingRef = useRef(false);
  const advancingRef = useRef(false);
  const jokerActivationSequenceRef = useRef(0);
  const lifelineUseLocksRef = useRef(new Set<string>());
  const careerTierRef = useRef<RankTier>(currentRank.tier);
  const contextActionsRef = useRef({ applyOutcome, addBudget, setSeenIds, setCorrectAnswers, setWrongAnswers, setUptimeStreak });

  useEffect(() => {
    seenIdsRef.current = seenIds;
  }, [seenIds]);

  useEffect(() => {
    uptimeStreakRef.current = uptimeStreak;
  }, [uptimeStreak]);

  useEffect(() => {
    contextActionsRef.current = { applyOutcome, addBudget, setSeenIds, setCorrectAnswers, setWrongAnswers, setUptimeStreak };
  }, [addBudget, applyOutcome, setCorrectAnswers, setSeenIds, setUptimeStreak, setWrongAnswers]);

  useEffect(() => {
    careerTierRef.current = currentRank.tier;
  }, [currentRank.tier]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    advancingRef.current = false;
  }, [incident?.id]);

  useEffect(() => {
    resultTransition.stopAnimation();
    if (!isAnswered) {
      resultTransition.setValue(0);
      return;
    }
    if (reduceMotion) {
      resultTransition.setValue(1);
      return;
    }
    resultTransition.setValue(0);
    const animation = Animated.timing(resultTransition, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [isAnswered, reduceMotion, resultTransition]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const resolveTimeout = useCallback(async () => {
    const currentIncident = incidentRef.current;
    if (resolvingRef.current || !currentIncident) return;
    resolvingRef.current = true;
    outcomePendingRef.current = true;
    setIsOutcomePending(true);
    setIsAnswered(true);
    setTimedOut(true);
    setFeedbackPhrase(pickFeedback(ENCOURAGING_FEEDBACK));
    seenIdsRef.current = appendRecentQuestionId(seenIdsRef.current, currentIncident.id, RECENT_QUESTION_HISTORY_LIMIT);
    contextActionsRef.current.setSeenIds(seenIdsRef.current);
    contextActionsRef.current.setWrongAnswers((value) => value + 1);
    const reward = TIMEOUT_REWARD;
    try {
      await contextActionsRef.current.applyOutcome(reward.careerXpDelta, reward.reputationDelta, reward.budgetDelta);
    } finally {
      outcomePendingRef.current = false;
      setIsOutcomePending(false);
    }
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

  const chooseIncident = useCallback((pool: GameIncident[], sessionQuestionIds: number[]) => {
    lifelineUseLocksRef.current.clear();
    codeReviewEmphasis.stopAnimation();
    codeReviewEmphasis.setValue(0);
    snapshotStatusPulse.stopAnimation();
    snapshotStatusPulse.setValue(1);
    setIsCodeReviewActive(false);
    setIsScaleUpUsed(false);
    setIsReverted(false);
    setRevertedChoiceId(null);
    lostStreakRef.current = 0;
    setLostStreak(0);
    const next = selectNextQuestion(
      pool,
      sessionQuestionIds,
      seenIdsRef.current,
      careerTierRef.current,
    );
    if (!next) {
      setIncident(null);
      setChoices([]);
      return;
    }
    sessionQuestionIdsRef.current = [...sessionQuestionIds, next.id];
    incidentRef.current = next;
    resolvingRef.current = false;
    setIncident(next);
    setChoices(shuffleChoices(next));
    setActiveChoice(null);
    setIsAnswered(false);
    setTimedOut(false);
    setFeedbackPhrase(null);
    startTimer();
  }, [codeReviewEmphasis, snapshotStatusPulse, startTimer]);

  const fetchIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('game_incidents')
        .select('id, rank_level, tag, title, optimal_text, acceptable_text, wrong_text, fatal_text')
        .order('id', { ascending: true });
      if (fetchError) throw fetchError;
      if (!data?.length) {
        setError('Kriz senaryosu bulunamadı.');
        return;
      }
      const loadedIncidents = data as GameIncident[];
      incidentsRef.current = loadedIncidents;
      sessionQuestionIdsRef.current = [];
      chooseIncident(loadedIncidents, []);
    } catch (fetchError: any) {
      setError(fetchError.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [chooseIncident]);

  useEffect(() => {
    if (!isLoaded) return;
    if (hasInitializedRef.current) return stopTimer;
    hasInitializedRef.current = true;
    void fetchIncidents();
    return stopTimer;
    // Initial Supabase load waits for migrated local progression, but remains
    // decoupled from changing context action references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const handleChoice = useCallback(async (choice: IncidentChoice) => {
    const currentIncident = incidentRef.current;
    if (resolvingRef.current || outcomePendingRef.current || !currentIncident) return;
    stopTimer();
    resolvingRef.current = true;
    outcomePendingRef.current = true;
    setIsOutcomePending(true);
    setIsAnswered(true);
    setActiveChoice(choice);
    seenIdsRef.current = appendRecentQuestionId(seenIdsRef.current, currentIncident.id, RECENT_QUESTION_HISTORY_LIMIT);
    contextActionsRef.current.setSeenIds(seenIdsRef.current);

    const reward = EVALUATION_REWARDS[choice.tier];
    setFeedbackPhrase(pickFeedback(reward.isPositive ? POSITIVE_FEEDBACK : ENCOURAGING_FEEDBACK));
    let milestoneBonus = 0;
    if (reward.isPositive) {
      contextActionsRef.current.setCorrectAnswers((value) => value + 1);
      const newStreak = uptimeStreakRef.current + 1;
      uptimeStreakRef.current = newStreak;
      contextActionsRef.current.setUptimeStreak(newStreak);
      milestoneBonus = UPTIME_MILESTONE_REWARDS[newStreak] ?? 0;
    } else {
      contextActionsRef.current.setWrongAnswers((value) => value + 1);
      const streakBeforeFailure = uptimeStreakRef.current;
      lostStreakRef.current = streakBeforeFailure;
      setLostStreak(streakBeforeFailure);
      if (streakBeforeFailure > 0) {
        uptimeStreakRef.current = 0;
        contextActionsRef.current.setUptimeStreak(0);
      }
    }
    const outcomeUpdate = contextActionsRef.current.applyOutcome(
      reward.careerXpDelta,
      reward.reputationDelta,
      reward.budgetDelta,
    );
    const milestoneUpdate = milestoneBonus > 0 ? contextActionsRef.current.addBudget(milestoneBonus) : null;
    try {
      await outcomeUpdate;
      if (milestoneUpdate) await milestoneUpdate;
    } finally {
      outcomePendingRef.current = false;
      setIsOutcomePending(false);
    }
  }, [stopTimer]);

  const handleNextScenario = useCallback(() => {
    if (outcomePendingRef.current || advancingRef.current) return;
    const currentIncident = incidentRef.current;
    if (!currentIncident) return;

    advancingRef.current = true;
    if (sessionQuestionIdsRef.current.length >= SESSION_CRISIS_COUNT) {
      stopTimer();
      incidentRef.current = null;
      setIncident(null);
      setChoices([]);
      return;
    }
    questionTransition.stopAnimation();
    questionTransition.setValue(reduceMotion ? 1 : 0);
    chooseIncident(incidentsRef.current, sessionQuestionIdsRef.current);

    if (!reduceMotion) {
      Animated.timing(questionTransition, {
        toValue: 1,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [chooseIncident, questionTransition, reduceMotion, stopTimer]);

  const handleRestart = useCallback(() => {
    stopTimer();
    sessionQuestionIdsRef.current = [];
    chooseIncident(incidentsRef.current, []);
  }, [chooseIncident, stopTimer]);

  const handleExit = useCallback(() => {
    stopTimer();
    router.replace('/(tabs)/');
  }, [router, stopTimer]);

  const queueJokerOverlay = useCallback((icon: string, name: string, countBefore: number) => {
    jokerActivationSequenceRef.current += 1;
    const activation: JokerUseActivation = {
      activationId: jokerActivationSequenceRef.current,
      icon,
      name,
      countBefore,
    };
    setJokerOverlayQueue((current) => [...current, activation]);
  }, []);

  const handleJokerOverlayFinished = useCallback((activationId: number) => {
    setJokerOverlayQueue((current) => (
      current[0]?.activationId === activationId
        ? current.slice(1)
        : current.filter((activation) => activation.activationId !== activationId)
    ));
  }, []);

  const handleCodeReview = useCallback(() => {
    if (isAnswered || isCodeReviewActive || codeReview <= 0 || lifelineUseLocksRef.current.has('codeReview')) return;
    lifelineUseLocksRef.current.add('codeReview');
    queueJokerOverlay('🔍', 'Code Review', codeReview);
    setIsCodeReviewActive(true);
    consumeCodeReview();
    if (!reduceMotion) {
      codeReviewEmphasis.stopAnimation();
      codeReviewEmphasis.setValue(0);
      Animated.sequence([
        Animated.timing(codeReviewEmphasis, { toValue: 1, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(codeReviewEmphasis, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [codeReview, codeReviewEmphasis, consumeCodeReview, isAnswered, isCodeReviewActive, queueJokerOverlay, reduceMotion]);

  const handleServerScaleUp = useCallback(() => {
    if (isAnswered || isScaleUpUsed || serverScaleUp <= 0 || lifelineUseLocksRef.current.has('serverScaleUp')) return;
    lifelineUseLocksRef.current.add('serverScaleUp');
    queueJokerOverlay('⚡', 'Scale Up', serverScaleUp);
    setIsScaleUpUsed(true);
    consumeServerScaleUp();
    setTimeLeft((value) => value + 15);
  }, [consumeServerScaleUp, isAnswered, isScaleUpUsed, queueJokerOverlay, serverScaleUp]);

  const failedChoiceSelected = activeChoice?.tier === 'fatal' || activeChoice?.tier === 'wrong';
  const canUseGitRevert = isAnswered && failedChoiceSelected && gitRevert > 0 && !isReverted;
  const canUseSnapshotBackup = isAnswered && failedChoiceSelected && lostStreak > 0 && snapshotBackup > 0;

  const handleGitRevert = useCallback(() => {
    if (!canUseGitRevert || !activeChoice || !resolvingRef.current || lifelineUseLocksRef.current.has('gitRevert')) return;
    lifelineUseLocksRef.current.add('gitRevert');
    queueJokerOverlay('↩️', 'Git Revert', gitRevert);
    consumeGitRevert();
    if (lostStreakRef.current > 0) {
      uptimeStreakRef.current = lostStreakRef.current;
      contextActionsRef.current.setUptimeStreak(lostStreakRef.current);
      lostStreakRef.current = 0;
      setLostStreak(0);
    }
    setIsReverted(true);
    setRevertedChoiceId(activeChoice.id);
    resolvingRef.current = false;
    setIsAnswered(false);
    startTimer();
    if (!reduceMotion) {
      questionTransition.stopAnimation();
      questionTransition.setValue(0.94);
      Animated.timing(questionTransition, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [activeChoice, canUseGitRevert, consumeGitRevert, gitRevert, queueJokerOverlay, questionTransition, reduceMotion, startTimer]);

  const handleSnapshotBackup = useCallback(() => {
    if (!canUseSnapshotBackup || lostStreakRef.current <= 0 || lifelineUseLocksRef.current.has('snapshotBackup')) return;
    lifelineUseLocksRef.current.add('snapshotBackup');
    queueJokerOverlay('📸', 'Snapshot', snapshotBackup);
    const restoredStreak = lostStreakRef.current;
    lostStreakRef.current = 0;
    uptimeStreakRef.current = restoredStreak;
    consumeSnapshotBackup();
    contextActionsRef.current.setUptimeStreak(restoredStreak);
    setLostStreak(0);
    snapshotRestoreFlash.setValue(0);
    Animated.sequence([
      Animated.timing(snapshotRestoreFlash, { toValue: 1, duration: 120, useNativeDriver: false }),
      Animated.timing(snapshotRestoreFlash, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
    if (!reduceMotion) {
      snapshotStatusPulse.stopAnimation();
      snapshotStatusPulse.setValue(1);
      Animated.sequence([
        Animated.timing(snapshotStatusPulse, { toValue: 1.035, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(snapshotStatusPulse, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [canUseSnapshotBackup, consumeSnapshotBackup, queueJokerOverlay, reduceMotion, snapshotBackup, snapshotRestoreFlash, snapshotStatusPulse]);

  useEffect(() => {
    gitRevertPulse.setValue(1);
    if (!canUseGitRevert) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(gitRevertPulse, { toValue: 1.14, duration: 450, useNativeDriver: true }),
        Animated.timing(gitRevertPulse, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
    );

    pulse.start();
    return () => {
      pulse.stop();
      gitRevertPulse.setValue(1);
    };
  }, [canUseGitRevert, gitRevertPulse]);

  useEffect(() => {
    snapshotBackupPulse.setValue(1);
    if (!canUseSnapshotBackup) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(snapshotBackupPulse, { toValue: 1.14, duration: 450, useNativeDriver: true }),
        Animated.timing(snapshotBackupPulse, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
    );

    pulse.start();
    return () => {
      pulse.stop();
      snapshotBackupPulse.setValue(1);
    };
  }, [canUseSnapshotBackup, snapshotBackupPulse]);

  useEffect(() => {
    timerScale.setValue(1);
    timerColorProgress.setValue(0);
    if (!isScaleUpUsed) return;

    if (reduceMotion) {
      timerColorProgress.setValue(1);
      const reducedAnimation = Animated.timing(timerColorProgress, {
        toValue: 0,
        duration: 360,
        useNativeDriver: false,
      });
      reducedAnimation.start();
      return () => reducedAnimation.stop();
    }

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(timerScale, { toValue: 1.5, duration: 120, useNativeDriver: true }),
        Animated.timing(timerColorProgress, { toValue: 1, duration: 120, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(timerScale, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(timerColorProgress, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [isScaleUpUsed, reduceMotion, timerColorProgress, timerScale]);

  if (isLoading) return <LoadingScreen styles={styles} color={colors.warning} />;
  if (error) return <ErrorScreen styles={styles} message={error} onRetry={fetchIncidents} />;
  if (!incident) return <CompleteScreen styles={styles} onRestart={handleRestart} onExit={handleExit} />;

  const selectedReward = activeChoice ? EVALUATION_REWARDS[activeChoice.tier] : null;
  const timeoutReward = TIMEOUT_REWARD;
  const feedbackReward = timedOut ? timeoutReward : selectedReward;
  const timerColor = timerColorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [timeLeft <= 5 ? colors.danger : colors.warning, colors.secondary],
  });
  const snapshotBackupColor = snapshotRestoreFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', colors.secondary],
  });
  const nextUptimeMilestone = getNextUptimeMilestone(uptimeStreak);
  const uptimeMilestoneReached = isAnswered
    && Boolean(feedbackReward?.isPositive)
    && (UPTIME_MILESTONE_REWARDS[uptimeStreak] ?? 0) > 0;
  const resultTone: GameResultTone | null = timedOut
    ? 'timeout'
    : activeChoice?.tier === 'optimal'
      ? 'success'
      : activeChoice?.tier === 'acceptable'
        ? 'partial'
        : activeChoice
          ? 'fail'
          : null;
  const questionTranslateY = questionTransition.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const resultTranslateY = resultTransition.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const lifelines = [
    { id: 'codeReview', name: 'Code Review', icon: '🔍', count: codeReview, enabled: !isAnswered && !isCodeReviewActive && codeReview > 0, onPress: handleCodeReview },
    { id: 'gitRevert', name: 'Git Revert', icon: '↩️', count: gitRevert, enabled: canUseGitRevert, onPress: handleGitRevert },
    { id: 'serverScaleUp', name: 'Scale Up', icon: '⚡', count: serverScaleUp, enabled: !isAnswered && !isScaleUpUsed && serverScaleUp > 0, onPress: handleServerScaleUp },
    { id: 'snapshotBackup', name: 'Snapshot', icon: '📸', count: snapshotBackup, enabled: canUseSnapshotBackup, onPress: handleSnapshotBackup },
  ] as const;

  return (
    <GameBackdrop>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.gameContainer}>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ana sayfaya dön"
                hitSlop={8}
                onPress={handleExit}
                style={({ pressed }) => [styles.exitBtn, pressed && styles.controlPressed]}
              >
                <Text style={styles.exitText}>×</Text>
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={styles.header}>Kriz Müdahalesi</Text>
                <Text style={styles.subheader}>Her karar Kariyer XP, bütçe ve itibarını etkiler.</Text>
              </View>
            </View>

            <View style={[styles.playArea, isWide && styles.playAreaWide]}>
              <View style={[styles.sideColumn, isWide && styles.sideColumnWide]}>
                <View style={styles.statusCard}>
                  <Animated.View style={{ transform: [{ scale: snapshotStatusPulse }] }}>
                    <UptimeMilestoneCard
                      currentUptime={uptimeStreak}
                      nextMilestone={nextUptimeMilestone}
                      milestoneReached={uptimeMilestoneReached}
                    />
                  </Animated.View>

                  {!isAnswered ? (
                    <View style={styles.timer}>
                      <Animated.Text
                        accessibilityLabel={`${timeLeft} saniye kaldı`}
                        style={[styles.timerText, { color: timerColor, transform: [{ scale: timerScale }] }]}
                      >
                        ⏱ {timeLeft}s
                      </Animated.Text>
                      <View
                        style={styles.timerTrack}
                        accessibilityRole="progressbar"
                        accessibilityValue={{ min: 0, max: isScaleUpUsed ? 35 : TIMER_DURATION, now: timeLeft }}
                      >
                        <View style={[styles.timerFill, { width: `${(timeLeft / TIMER_DURATION) * 100}%` }]} />
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.lifelineBar}>
                  {lifelines.map((lifeline) => (
                    <Animated.View
                      key={lifeline.id}
                      style={[
                        styles.abilityAnimationWrap,
                        lifeline.id === 'gitRevert'
                          ? { transform: [{ scale: gitRevertPulse }] }
                          : lifeline.id === 'snapshotBackup'
                            ? { backgroundColor: snapshotBackupColor, transform: [{ scale: snapshotBackupPulse }] }
                            : undefined,
                      ]}
                    >
                      <GameAbilityButton
                        name={lifeline.name}
                        icon={lifeline.icon}
                        count={lifeline.count}
                        enabled={lifeline.enabled}
                        onPress={lifeline.onPress}
                      />
                    </Animated.View>
                  ))}
                </View>
              </View>

              <Animated.View
                style={[
                  styles.mainColumn,
                  isWide && styles.mainColumnWide,
                  { opacity: questionTransition, transform: [{ translateY: questionTranslateY }] },
                ]}
              >
                <View style={styles.incidentCard}>
                  <LinearGradient
                    colors={[colors.warningSoft, colors.surface]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={styles.incidentGradient}
                  >
                    <Text style={styles.tag}>{incident.tag}</Text>
                    <Text style={styles.title}>{incident.title}</Text>
                  </LinearGradient>
                </View>

                <Text style={styles.sectionLabel}>{isAnswered ? 'Sonuç' : 'Müdahale Seçenekleri'}</Text>
                <View style={styles.choices}>
                  {isAnswered && feedbackReward && resultTone ? (
                    <Animated.View style={{ opacity: resultTransition, transform: [{ translateY: resultTranslateY }] }}>
                      <GameResultPanel
                        tone={resultTone}
                        feedback={timedOut ? 'Süre doldu! Kritik sonuç uygulandı.' : feedbackPhrase ?? feedbackReward.feedback}
                        explanation={feedbackReward.feedback}
                        careerXpDelta={feedbackReward.careerXpDelta}
                        reputationDelta={feedbackReward.reputationDelta}
                        budgetDelta={feedbackReward.budgetDelta}
                        bestAnswer={!feedbackReward.isPositive ? incident.optimal_text : undefined}
                        isProcessing={isOutcomePending}
                        onNext={handleNextScenario}
                        nextLabel={sessionQuestionIdsRef.current.length >= SESSION_CRISIS_COUNT ? 'Vardiyayı Tamamla' : 'Sonraki Soru'}
                      />
                    </Animated.View>
                  ) : choices.map((choice) => (
                    <AnimatedChoiceItem
                      key={choice.id}
                      choice={choice}
                      codeReviewEmphasis={codeReviewEmphasis}
                      isCodeReviewActive={isCodeReviewActive}
                      isRevertedChoice={choice.id === revertedChoiceId}
                      isSelected={activeChoice?.id === choice.id}
                      isLocked={isOutcomePending}
                      styles={styles}
                      onPress={() => void handleChoice(choice)}
                    />
                  ))}
                </View>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      {jokerOverlayQueue[0] ? (
        <JokerUseOverlay
          key={jokerOverlayQueue[0].activationId}
          activation={jokerOverlayQueue[0]}
          reduceMotion={reduceMotion}
          onFinished={handleJokerOverlayFinished}
        />
      ) : null}
    </GameBackdrop>
  );
}

function LoadingScreen({ styles, color }: { styles: ReturnType<typeof makeStyles>; color: string }) {
  return (
    <GameBackdrop>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={color} />
          <Text style={styles.loadingText}>Senaryolar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    </GameBackdrop>
  );
}

function ErrorScreen({ styles, message, onRetry }: { styles: ReturnType<typeof makeStyles>; message: string; onRetry: () => void }) {
  return (
    <GameBackdrop>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Hata: {message}</Text>
          <GameActionButton label="Tekrar Dene" onPress={() => void onRetry()} style={styles.stateAction} />
        </View>
      </SafeAreaView>
    </GameBackdrop>
  );
}

function CompleteScreen({ styles, onRestart, onExit }: { styles: ReturnType<typeof makeStyles>; onRestart: () => void; onExit: () => void }) {
  return (
    <GameBackdrop>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.completeContainer}>
          <View style={styles.completeCard}>
            <View style={styles.completeIconSlot}>
              <Ionicons
                name="trophy"
                size={34}
                style={styles.completeIcon}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            </View>
            <Text style={styles.completeTitle}>Vardiya Tamamlandı!</Text>
            <Text style={styles.completeMessage}>{SESSION_CRISIS_COUNT} krizden oluşan vardiyayı tamamladın. Yeni bir vardiyaya başlayabilirsin.</Text>
            <View style={styles.completeActions}>
              <GameActionButton label="Yeni Vardiya Başlat" onPress={onRestart} style={styles.completeAction} />
              <GameActionButton label="Ana Sayfaya Dön" onPress={onExit} variant="secondary" style={styles.completeAction} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </GameBackdrop>
  );
}

function makeStyles(tokens: DashboardTokens) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    content: { paddingBottom: tokens.layout.pageBottom },
    gameContainer: { width: '100%', maxWidth: tokens.layout.gameMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: 12 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 },
    loadingText: { ...dashboardType.body, fontFamily: fonts.body, color: colors.textMuted },
    errorText: { ...dashboardType.body, maxWidth: 520, fontFamily: fonts.bodySemiBold, color: colors.danger, textAlign: 'center' },
    stateAction: { minWidth: 180 },
    completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    completeCard: {
      width: '100%',
      maxWidth: 480,
      alignItems: 'center',
      padding: 28,
      gap: 12,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.secondary,
      ...shadow.raised,
    },
    completeIconSlot: {
      width: 66,
      height: 66,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.lg,
      backgroundColor: colors.secondarySoft,
      borderWidth: 1,
      borderColor: colors.secondary,
      ...shadow.card,
    },
    completeIcon: { color: colors.secondary },
    completeTitle: { ...dashboardType.display, fontFamily: fonts.headingBold, color: colors.text, textAlign: 'center' },
    completeMessage: { ...dashboardType.body, fontFamily: fonts.bodyMedium, color: colors.textMuted, textAlign: 'center', marginBottom: 8 },
    completeActions: { width: '100%', gap: 10, marginTop: 4 },
    completeAction: { width: '100%' },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
    exitBtn: {
      width: tokens.control.height,
      height: tokens.control.height,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      ...shadow.card,
    },
    controlPressed: tokens.motion.pressed,
    exitText: { fontFamily: fonts.headingMedium, color: colors.textMuted, fontSize: 28, lineHeight: 30 },
    headerCopy: { flex: 1, minWidth: 0 },
    header: { ...dashboardType.display, fontFamily: fonts.headingBold, color: colors.text },
    subheader: { ...dashboardType.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2 },
    playArea: { gap: 18 },
    playAreaWide: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 26 },
    sideColumn: {
      gap: 12,
      padding: 12,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      ...shadow.raised,
    },
    sideColumnWide: { width: 390, flexShrink: 0 },
    mainColumn: { minWidth: 0 },
    mainColumnWide: { flex: 1 },
    statusCard: {
      padding: 18,
      gap: 17,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timer: { gap: 11 },
    timerText: { alignSelf: 'flex-start', fontFamily: fonts.headingBold, fontSize: 29, lineHeight: 35 },
    timerTrack: { height: 13, padding: 2, borderRadius: radius.pill, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    timerFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.warning },
    lifelineBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'stretch',
      gap: 10,
      padding: 2,
    },
    abilityAnimationWrap: {
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: '46%',
      minWidth: 120,
      borderRadius: radius.lg,
    },
    incidentCard: {
      overflow: 'hidden',
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.warning,
      ...shadow.raised,
    },
    incidentGradient: { minHeight: 178, justifyContent: 'center', padding: 27 },
    tag: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.warning, marginBottom: 12 },
    title: { fontFamily: fonts.headingBold, fontSize: 28, lineHeight: 37, color: colors.text, maxWidth: 800 },
    sectionLabel: {
      ...dashboardType.eyebrow,
      fontFamily: fonts.bodySemiBold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginTop: 22,
      marginBottom: 12,
    },
    choices: { gap: 12 },
    choiceBtn: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      ...shadow.raised,
    },
    choiceBtnHovered: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.primary,
      transform: [{ translateY: -2 }],
    },
    choiceBtnFocused: { borderColor: colors.text, borderWidth: 2 },
    choiceBtnSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
    choiceBtnLocked: { opacity: 0.52 },
    choiceBtnPressed: {
      opacity: 1,
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      transform: [{ translateY: 2 }, { scale: 0.99 }],
    },
    choiceTextContainer: { position: 'relative', flex: 1, minWidth: 0 },
    choiceLabel: { fontFamily: fonts.monoMedium, fontSize: 16, lineHeight: 24, color: colors.text },
    eliminationLine: { position: 'absolute', left: 0, top: '50%', height: 2, backgroundColor: colors.danger, transform: [{ translateY: -1 }] },
    choiceStateMark: {
      width: 36,
      height: 36,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    choiceStateMarkActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    choiceStateIcon: { color: colors.textMuted },
    choiceStateIconActive: { color: colors.onAccent },
  });
}
