import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { EvaluationTier } from '../../src/config/gameRewards';
import { getCategoryChoiceOutcome, getCategoryReward } from '../../src/config/categoryRewards';
import {
  DIFFICULTY_LABELS,
  QUESTIONS_PER_TIER,
  SESSION_QUESTION_COUNT,
  getGameCategory,
  isGameCategoryId,
  parseDifficultyStar,
  type DifficultyStar,
  type GameCategoryId,
} from '../../src/config/gameCategories';
import GameAbilityButton from '../../src/components/game/GameAbilityButton';
import GameActionButton from '../../src/components/game/GameActionButton';
import GameBackdrop from '../../src/components/game/GameBackdrop';
import GameResultPanel, { type GameResultTone } from '../../src/components/game/GameResultPanel';
import JokerUseOverlay, { type JokerUseActivation } from '../../src/components/game/JokerUseOverlay';
import UptimeMilestoneCard from '../../src/components/game/UptimeMilestoneCard';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { supabase } from '../../src/supabase';
import { fonts } from '../../src/theme/typography';
import { selectCategoryQuestion } from '../../src/utils/categoryProgress';
import { isValidCategoryQuestion, type CategoryQuestionId, type CategoryQuestionRow } from '../../src/utils/categoryQuestions';

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
  id: CategoryQuestionId;
  rank_level: number | null;
  category_id: GameCategoryId;
  difficulty_star: DifficultyStar;
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
  index: number;
  codeReviewEmphasis: Animated.Value;
  isCodeReviewActive: boolean;
  isCodeReviewEliminated: boolean;
  isRevertedChoice: boolean;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function AnimatedChoiceItem({
  choice,
  index,
  codeReviewEmphasis,
  isCodeReviewActive,
  isCodeReviewEliminated,
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
            <View style={[styles.choiceIndex, (pressed || isSelected) && styles.choiceIndexActive]}>
              <Text style={[styles.choiceIndexText, (pressed || isSelected) && styles.choiceIndexTextActive]}>
                {String.fromCharCode(65 + index)}
              </Text>
            </View>
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
  const params = useLocalSearchParams<{ category?: string; star?: string }>();
  const categoryId = isGameCategoryId(params.category) ? params.category : null;
  const difficultyStar = parseDifficultyStar(params.star);
  const category = categoryId ? getGameCategory(categoryId) : null;
  const { width } = useWindowDimensions();
  const {
    applyOutcome,
    addBudget,
    isLoaded,
    setCorrectAnswers,
    setWrongAnswers,
    recordRankingOutcome,
    categoryProgress,
    recordCategoryQuestionAnswer,
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
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { colors } = tokens;
  const isWide = width >= 900;

  const [incident, setIncident] = useState<GameIncident | null>(null);
  const [choices, setChoices] = useState<IncidentChoice[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<IncidentChoice | null>(null);
  const [activeChoice, setActiveChoice] = useState<IncidentChoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [feedbackPhrase, setFeedbackPhrase] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isCodeReviewActive, setIsCodeReviewActive] = useState(false);
  const [codeReviewEliminatedIds, setCodeReviewEliminatedIds] = useState<EvaluationTier[]>([]);
  const [isScaleUpUsed, setIsScaleUpUsed] = useState(false);
  const [isReverted, setIsReverted] = useState(false);
  const [revertedChoiceId, setRevertedChoiceId] = useState<EvaluationTier | null>(null);
  const [lostStreak, setLostStreak] = useState(0);
  const [isOutcomePending, setIsOutcomePending] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [jokerOverlayQueue, setJokerOverlayQueue] = useState<JokerUseActivation[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(TIMER_DURATION);
  const timerScale = useRef(new Animated.Value(1)).current;
  const timerColorProgress = useRef(new Animated.Value(0)).current;
  const gitRevertPulse = useRef(new Animated.Value(1)).current;
  const snapshotBackupPulse = useRef(new Animated.Value(1)).current;
  const snapshotRestoreFlash = useRef(new Animated.Value(0)).current;
  const snapshotStatusPulse = useRef(new Animated.Value(1)).current;
  const codeReviewEmphasis = useRef(new Animated.Value(0)).current;
  const questionTransition = useRef(new Animated.Value(1)).current;
  const resultTransition = useRef(new Animated.Value(0)).current;
  const confirmationTransition = useRef(new Animated.Value(0)).current;
  const incidentRef = useRef<GameIncident | null>(null);
  const incidentsRef = useRef<GameIncident[]>([]);
  const resolvingRef = useRef(false);
  const selectedChoiceRef = useRef<IncidentChoice | null>(null);
  const sessionQuestionIdsRef = useRef<CategoryQuestionId[]>([]);
  const uptimeStreakRef = useRef(uptimeStreak);
  const lostStreakRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const outcomePendingRef = useRef(false);
  const advancingRef = useRef(false);
  const jokerActivationSequenceRef = useRef(0);
  const lifelineUseLocksRef = useRef(new Set<string>());
  const attemptedQuestionIdsRef = useRef<CategoryQuestionId[]>(
    categoryId && difficultyStar ? categoryProgress[categoryId][difficultyStar].attemptedQuestionIds : [],
  );
  const contextActionsRef = useRef({ applyOutcome, addBudget, setCorrectAnswers, setWrongAnswers, recordRankingOutcome, setUptimeStreak, recordCategoryQuestionAnswer });

  useEffect(() => {
    uptimeStreakRef.current = uptimeStreak;
  }, [uptimeStreak]);

  useEffect(() => {
    if (!categoryId || !difficultyStar) return;
    attemptedQuestionIdsRef.current = categoryProgress[categoryId][difficultyStar].attemptedQuestionIds;
  }, [categoryId, categoryProgress, difficultyStar]);

  useEffect(() => {
    contextActionsRef.current = { applyOutcome, addBudget, setCorrectAnswers, setWrongAnswers, recordRankingOutcome, setUptimeStreak, recordCategoryQuestionAnswer };
  }, [addBudget, applyOutcome, recordCategoryQuestionAnswer, recordRankingOutcome, setCorrectAnswers, setUptimeStreak, setWrongAnswers]);

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

  const hasSelectedChoice = selectedChoice !== null;

  useEffect(() => {
    confirmationTransition.stopAnimation();
    if (!hasSelectedChoice || isAnswered) {
      confirmationTransition.setValue(0);
      return;
    }
    if (reduceMotion) {
      confirmationTransition.setValue(1);
      return;
    }
    confirmationTransition.setValue(0);
    const animation = Animated.timing(confirmationTransition, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [confirmationTransition, hasSelectedChoice, isAnswered, reduceMotion]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const resolveTimeout = useCallback(async () => {
    const currentIncident = incidentRef.current;
    if (resolvingRef.current || !currentIncident) return;
    resolvingRef.current = true;
    selectedChoiceRef.current = null;
    setSelectedChoice(null);
    outcomePendingRef.current = true;
    setIsOutcomePending(true);
    setIsAnswered(true);
    setTimedOut(true);
    setFeedbackPhrase(pickFeedback(ENCOURAGING_FEEDBACK));
    if (!categoryId || !difficultyStar) return;
    if (!attemptedQuestionIdsRef.current.includes(currentIncident.id)) attemptedQuestionIdsRef.current = [...attemptedQuestionIdsRef.current, currentIncident.id];
    contextActionsRef.current.recordCategoryQuestionAnswer(categoryId, difficultyStar, currentIncident.id, false);
    contextActionsRef.current.setWrongAnswers((value) => value + 1);
    contextActionsRef.current.recordRankingOutcome('timeout');
    const reward = getCategoryReward(difficultyStar, 'timeout');
    try {
      await contextActionsRef.current.applyOutcome(reward.careerXpDelta, reward.reputationDelta, reward.budgetDelta);
    } finally {
      outcomePendingRef.current = false;
      setIsOutcomePending(false);
    }
  }, [categoryId, difficultyStar]);

  const startTimer = useCallback(() => {
    stopTimer();
    timeLeftRef.current = TIMER_DURATION;
    setTimeLeft(TIMER_DURATION);
    timerRef.current = setInterval(() => {
      const nextTime = Math.max(0, timeLeftRef.current - 1);
      timeLeftRef.current = nextTime;
      setTimeLeft(nextTime);
      if (nextTime === 0) {
        stopTimer();
        void resolveTimeout();
      }
    }, 1000);
  }, [resolveTimeout, stopTimer]);

  const chooseIncident = useCallback((pool: GameIncident[], sessionQuestionIds: CategoryQuestionId[]) => {
    lifelineUseLocksRef.current.clear();
    codeReviewEmphasis.stopAnimation();
    codeReviewEmphasis.setValue(0);
    snapshotStatusPulse.stopAnimation();
    snapshotStatusPulse.setValue(1);
    setIsCodeReviewActive(false);
    setCodeReviewEliminatedIds([]);
    setIsScaleUpUsed(false);
    setIsReverted(false);
    setRevertedChoiceId(null);
    lostStreakRef.current = 0;
    setLostStreak(0);
    const next = selectCategoryQuestion(
      pool,
      sessionQuestionIds,
      attemptedQuestionIdsRef.current,
    );
    if (!next) {
      setIncident(null);
      setChoices([]);
      return;
    }
    sessionQuestionIdsRef.current = [...sessionQuestionIds, next.id];
    incidentRef.current = next;
    resolvingRef.current = false;
    selectedChoiceRef.current = null;
    setIncident(next);
    setChoices(shuffleChoices(next));
    setSelectedChoice(null);
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
      if (!categoryId || !difficultyStar) {
        setError('Geçerli bir kategori ve yıldız seçmelisin.');
        return;
      }
      const { data, error: fetchError } = await supabase
        .from('game_incidents')
        .select('id, rank_level, category_id, difficulty_star, tag, title, optimal_text, acceptable_text, wrong_text, fatal_text')
        .eq('category_id', categoryId)
        .eq('difficulty_star', difficultyStar)
        .order('id', { ascending: true });
      if (fetchError) throw fetchError;
      const loadedIncidents = (data as CategoryQuestionRow[] | null ?? [])
        .filter((row) => isValidCategoryQuestion(row, categoryId, difficultyStar)) as GameIncident[];
      if (loadedIncidents.length !== QUESTIONS_PER_TIER) {
        setError(`Bu seviye henüz hazır değil (${loadedIncidents.length}/${QUESTIONS_PER_TIER} geçerli soru).`);
        return;
      }
      incidentsRef.current = loadedIncidents;
      sessionQuestionIdsRef.current = [];
      chooseIncident(loadedIncidents, []);
    } catch (fetchError: any) {
      setError(fetchError.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, chooseIncident, difficultyStar]);

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
    selectedChoiceRef.current = null;
    setSelectedChoice(null);
    outcomePendingRef.current = true;
    setIsOutcomePending(true);
    setIsAnswered(true);
    setActiveChoice(choice);
    if (!categoryId || !difficultyStar) return;
    const choiceOutcome = getCategoryChoiceOutcome(choice.tier);
    const isCorrect = choiceOutcome === 'success';
    if (!attemptedQuestionIdsRef.current.includes(currentIncident.id)) attemptedQuestionIdsRef.current = [...attemptedQuestionIdsRef.current, currentIncident.id];
    contextActionsRef.current.recordCategoryQuestionAnswer(categoryId, difficultyStar, currentIncident.id, isCorrect);
    const reward = getCategoryReward(difficultyStar, choiceOutcome);
    contextActionsRef.current.recordRankingOutcome(choiceOutcome);
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
  }, [categoryId, difficultyStar, stopTimer]);

  const handleSelectChoice = useCallback((choice: IncidentChoice) => {
    if (isAnswered || resolvingRef.current || outcomePendingRef.current) return;
    selectedChoiceRef.current = choice;
    setSelectedChoice(choice);
  }, [isAnswered]);

  const handleConfirmChoice = useCallback(() => {
    const choice = selectedChoiceRef.current;
    if (!choice || isAnswered || timeLeft <= 0 || resolvingRef.current || outcomePendingRef.current) return;
    void handleChoice(choice);
  }, [handleChoice, isAnswered, timeLeft]);

  const handleNextScenario = useCallback(() => {
    if (outcomePendingRef.current || advancingRef.current) return;
    const currentIncident = incidentRef.current;
    if (!currentIncident) return;

    advancingRef.current = true;
    if (sessionQuestionIdsRef.current.length >= SESSION_QUESTION_COUNT) {
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
    router.replace('/(tabs)/play');
  }, [router, stopTimer]);

  const queueJokerOverlay = useCallback((icon: JokerUseActivation['icon'], name: string, countBefore: number) => {
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
    const wrongChoices = choices.filter((choice) => choice.tier !== 'optimal');
    const shuffledWrongChoices = [...wrongChoices].sort(() => Math.random() - 0.5);
    const eliminatedIds = shuffledWrongChoices.slice(0, 2).map((choice) => choice.id);
    const currentSelection = selectedChoiceRef.current;
    if (currentSelection && eliminatedIds.includes(currentSelection.id)) {
      selectedChoiceRef.current = null;
      setSelectedChoice(null);
    }
    queueJokerOverlay('scan-outline', 'Code Review', codeReview);
    setIsCodeReviewActive(true);
    setCodeReviewEliminatedIds(eliminatedIds);
    consumeCodeReview();
    if (!reduceMotion) {
      codeReviewEmphasis.stopAnimation();
      codeReviewEmphasis.setValue(0);
      Animated.sequence([
        Animated.timing(codeReviewEmphasis, { toValue: 1, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(codeReviewEmphasis, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [choices, codeReview, codeReviewEmphasis, consumeCodeReview, isAnswered, isCodeReviewActive, queueJokerOverlay, reduceMotion]);

  const handleServerScaleUp = useCallback(() => {
    if (isAnswered || isScaleUpUsed || serverScaleUp <= 0 || lifelineUseLocksRef.current.has('serverScaleUp')) return;
    lifelineUseLocksRef.current.add('serverScaleUp');
    queueJokerOverlay('flash', 'Scale Up', serverScaleUp);
    setIsScaleUpUsed(true);
    consumeServerScaleUp();
    const extendedTime = timeLeftRef.current + 15;
    timeLeftRef.current = extendedTime;
    setTimeLeft(extendedTime);
  }, [consumeServerScaleUp, isAnswered, isScaleUpUsed, queueJokerOverlay, serverScaleUp]);

  const failedChoiceSelected = Boolean(activeChoice && activeChoice.tier !== 'optimal');
  const canUseGitRevert = isAnswered && failedChoiceSelected && gitRevert > 0 && !isReverted;
  const canUseSnapshotBackup = isAnswered && failedChoiceSelected && lostStreak > 0 && snapshotBackup > 0;

  const handleGitRevert = useCallback(() => {
    if (!canUseGitRevert || !activeChoice || !resolvingRef.current || lifelineUseLocksRef.current.has('gitRevert')) return;
    lifelineUseLocksRef.current.add('gitRevert');
    queueJokerOverlay('arrow-undo', 'Git Revert', gitRevert);
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
    queueJokerOverlay('camera-outline', 'Snapshot', snapshotBackup);
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

    // This scale shares an Animated.View with the JS-driven restore color.
    // Keep both on the JS driver so Expo Go never promotes half of the style graph to native.
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(snapshotBackupPulse, { toValue: 1.14, duration: 450, useNativeDriver: false }),
        Animated.timing(snapshotBackupPulse, { toValue: 1, duration: 450, useNativeDriver: false }),
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

    // Scale and color are rendered by the same Animated.Text. A single driver avoids
    // React Native's "moved to native" error while preserving the combined feedback.
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(timerScale, { toValue: 1.5, duration: 120, useNativeDriver: false }),
        Animated.timing(timerColorProgress, { toValue: 1, duration: 120, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(timerScale, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(timerColorProgress, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [isScaleUpUsed, reduceMotion, timerColorProgress, timerScale]);

  if (isLoading) return <LoadingScreen styles={styles} color={colors.warning} />;
  if (error) return <ErrorScreen styles={styles} message={error} onRetry={fetchIncidents} />;
  if (!incident && category && difficultyStar) return (
    <CompleteScreen
      styles={styles}
      onRestart={handleRestart}
      onExit={handleExit}
      categoryName={category.name}
      star={difficultyStar}
      attemptedCount={Math.min(QUESTIONS_PER_TIER, attemptedQuestionIdsRef.current.length)}
    />
  );

  if (!incident || !category || !difficultyStar) return <ErrorScreen styles={styles} message="Geçerli bir oyun seçimi bulunamadı." onRetry={() => router.replace('/(tabs)/play')} />;
  const selectedReward = activeChoice ? getCategoryReward(difficultyStar, getCategoryChoiceOutcome(activeChoice.tier)) : null;
  const timeoutReward = getCategoryReward(difficultyStar, 'timeout');
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
    : activeChoice && getCategoryChoiceOutcome(activeChoice.tier) === 'success'
      ? 'success'
      : activeChoice
        ? 'fail'
        : null;
  const questionTranslateY = questionTransition.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const resultTranslateY = resultTransition.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const confirmationTranslateY = confirmationTransition.interpolate({ inputRange: [0, 1], outputRange: [5, 0] });
  const lifelines = [
    { id: 'codeReview', name: 'Code Review', icon: 'scan-outline' as const, count: codeReview, enabled: !isAnswered && !isCodeReviewActive && codeReview > 0, onPress: handleCodeReview },
    { id: 'gitRevert', name: 'Git Revert', icon: 'arrow-undo' as const, count: gitRevert, enabled: canUseGitRevert, onPress: handleGitRevert },
    { id: 'serverScaleUp', name: 'Scale Up', icon: 'flash' as const, count: serverScaleUp, enabled: !isAnswered && !isScaleUpUsed && serverScaleUp > 0, onPress: handleServerScaleUp },
    { id: 'snapshotBackup', name: 'Snapshot', icon: 'camera-outline' as const, count: snapshotBackup, enabled: canUseSnapshotBackup, onPress: handleSnapshotBackup },
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
                <Text style={styles.header}>{category.name}</Text>
                <Text style={styles.subheader}>
                  {difficultyStar} yıldız · {DIFFICULTY_LABELS[difficultyStar]} · Soru {Math.min(sessionQuestionIdsRef.current.length, SESSION_QUESTION_COUNT)}/{SESSION_QUESTION_COUNT} · Seviye {Math.min(QUESTIONS_PER_TIER, attemptedQuestionIdsRef.current.length)}/{QUESTIONS_PER_TIER}
                </Text>
              </View>
              <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.headerSignal}
              >
                <View style={styles.headerSignalDot} />
                <View style={styles.headerSignalLine} />
              </View>
            </View>

            <View style={[styles.playArea, isWide && styles.playAreaWide]}>
              <View style={[styles.sideColumn, isWide && styles.sideColumnWide]}>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.consoleRail}
                >
                  <View style={styles.consoleNode} />
                  <View style={styles.consoleLine} />
                  <View style={styles.consoleNode} />
                </View>
                <View style={styles.statusCard}>
                  <Animated.View style={[styles.uptimeWrap, { transform: [{ scale: snapshotStatusPulse }] }]}>
                    <UptimeMilestoneCard
                      currentUptime={uptimeStreak}
                      nextMilestone={nextUptimeMilestone}
                      milestoneReached={uptimeMilestoneReached}
                    />
                  </Animated.View>

                  {!isAnswered ? (
                    <View style={styles.timer}>
                      <View style={styles.timerReadout}>
                        <Ionicons
                          name="timer-outline"
                          size={tokens.layout.isCompact ? 17 : 20}
                          color={timeLeft <= 5 ? colors.danger : colors.warning}
                          accessibilityElementsHidden
                          importantForAccessibility="no-hide-descendants"
                        />
                        <Animated.Text
                          accessibilityLabel={`${timeLeft} saniye kaldı`}
                          style={[styles.timerText, { color: timerColor, transform: [{ scale: timerScale }] }]}
                        >
                          {timeLeft}s
                        </Animated.Text>
                      </View>
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
                  <View style={styles.incidentRail} pointerEvents="none">
                    <View style={styles.incidentNode} />
                    <View style={styles.incidentLine} />
                    <View style={styles.incidentNode} />
                  </View>
                  <View style={styles.incidentGradient}>
                    <Text style={styles.tag}>{incident.tag}</Text>
                    <Text style={styles.title}>{incident.title}</Text>
                  </View>
                </View>

                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionLabel}>{isAnswered ? 'Sonuç' : 'Müdahale Seçenekleri'}</Text>
                  <View style={styles.sectionLine} />
                </View>
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
                        rewardLabel={`${difficultyStar} YILDIZ ÖDÜLÜ`}
                        bestAnswer={!feedbackReward.isPositive ? incident.optimal_text : undefined}
                        isProcessing={isOutcomePending}
                        onNext={handleNextScenario}
                        nextLabel={sessionQuestionIdsRef.current.length >= SESSION_QUESTION_COUNT ? 'Oturumu Tamamla' : 'Sonraki Soru'}
                      />
                    </Animated.View>
                  ) : (
                    <>
                      {choices.map((choice, index) => (
                        <AnimatedChoiceItem
                          key={choice.id}
                          choice={choice}
                          index={index}
                          codeReviewEmphasis={codeReviewEmphasis}
                          isCodeReviewActive={isCodeReviewActive}
                          isCodeReviewEliminated={codeReviewEliminatedIds.includes(choice.id)}
                          isRevertedChoice={choice.id === revertedChoiceId}
                          isSelected={selectedChoice?.id === choice.id}
                          isLocked={isOutcomePending}
                          styles={styles}
                          onPress={() => handleSelectChoice(choice)}
                        />
                      ))}
                      {hasSelectedChoice ? (
                        <Animated.View
                          style={[
                            styles.confirmationArea,
                            { opacity: confirmationTransition, transform: [{ translateY: confirmationTranslateY }] },
                          ]}
                        >
                          <GameActionButton
                            label="Müdahaleyi Uygula"
                            onPress={handleConfirmChoice}
                            disabled={isOutcomePending}
                            busy={isOutcomePending}
                            style={styles.confirmationAction}
                          />
                        </Animated.View>
                      ) : null}
                    </>
                  )}
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

function CompleteScreen({
  styles,
  onRestart,
  onExit,
  categoryName,
  star,
  attemptedCount,
}: {
  styles: ReturnType<typeof makeStyles>;
  onRestart: () => void;
  onExit: () => void;
  categoryName: string;
  star: DifficultyStar;
  attemptedCount: number;
}) {
  const tierCompleted = attemptedCount >= QUESTIONS_PER_TIER;
  const nextTierUnlocked = tierCompleted && star < 3;
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
            <Text style={styles.completeTitle}>Oturum Tamamlandı!</Text>
            <Text style={styles.completeMessage}>{categoryName} · {star} yıldız oturumundaki {SESSION_QUESTION_COUNT} soruyu tamamladın. Seviye ilerlemen {attemptedCount}/{QUESTIONS_PER_TIER}.</Text>
            {tierCompleted ? (
              <View style={styles.unlockNotice}>
                <Ionicons name={nextTierUnlocked ? 'lock-open-outline' : 'checkmark-circle-outline'} size={20} style={styles.completeIcon} />
                <Text style={styles.unlockNoticeText}>{nextTierUnlocked ? `${star + 1} yıldız seviyesi açıldı.` : 'Bu kategorideki tüm yıldız seviyelerini tamamladın.'}</Text>
              </View>
            ) : null}
            <View style={styles.completeActions}>
              <GameActionButton label="Aynı Seviyeyi Tekrarla" onPress={onRestart} style={styles.completeAction} />
              <GameActionButton label="Oyun Merkezine Dön" onPress={onExit} variant="secondary" style={styles.completeAction} />
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
    loadingText: { ...tokens.type.body, fontFamily: fonts.body, color: colors.textMuted },
    errorText: { ...tokens.type.body, maxWidth: 520, fontFamily: fonts.bodySemiBold, color: colors.danger, textAlign: 'center' },
    stateAction: { minWidth: 180 },
    completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    completeCard: {
      width: '100%',
      maxWidth: 480,
      alignItems: 'center',
      padding: tokens.layout.isCompact ? 18 : 28,
      gap: tokens.layout.isCompact ? 10 : 12,
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
    completeTitle: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text, textAlign: 'center' },
    completeMessage: { ...tokens.type.body, fontFamily: fonts.bodyMedium, color: colors.textMuted, textAlign: 'center', marginBottom: tokens.layout.isCompact ? 4 : 8 },
    unlockNotice: { width: '100%', minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: radius.sm, backgroundColor: colors.secondarySoft, borderWidth: 1, borderColor: colors.secondary },
    unlockNoticeText: { ...tokens.type.bodySmall, flexShrink: 1, fontFamily: fonts.bodySemiBold, color: colors.text, textAlign: 'center' },
    completeActions: { width: '100%', gap: 10, marginTop: 4 },
    completeAction: { width: '100%' },
    headerRow: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.layout.isCompact ? 10 : 14,
      marginBottom: tokens.layout.isCompact ? 10 : 20,
      paddingBottom: tokens.layout.isCompact ? 9 : 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
    },
    exitBtn: {
      width: tokens.control.height,
      height: tokens.control.height,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.secondarySurfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
    },
    controlPressed: tokens.motion.pressed,
    exitText: { fontFamily: fonts.headingMedium, color: colors.textMuted, fontSize: 28, lineHeight: 30 },
    headerCopy: { flex: 1, minWidth: 0 },
    header: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    subheader: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 1 },
    headerSignal: { width: tokens.layout.isCompact ? 34 : 70, flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerSignalDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.secondary },
    headerSignalLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
    playArea: { gap: tokens.layout.isCompact ? 10 : 18 },
    playAreaWide: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 26 },
    sideColumn: {
      overflow: 'hidden',
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.raised,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.32,
    },
    sideColumnWide: { width: 390, flexShrink: 0 },
    consoleRail: {
      height: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
      backgroundColor: colors.floatingSurfaceRaised,
    },
    consoleNode: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.secondary,
      opacity: 0.72,
    },
    consoleLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
    mainColumn: { minWidth: 0 },
    mainColumnWide: { flex: 1 },
    statusCard: {
      flexDirection: tokens.layout.isCompact ? 'row' : 'column',
      alignItems: tokens.layout.isCompact ? 'center' : 'stretch',
      padding: tokens.layout.isCompact ? 12 : 16,
      gap: tokens.layout.isCompact ? 12 : 14,
      backgroundColor: 'transparent',
    },
    uptimeWrap: { flex: tokens.layout.isCompact ? 1 : undefined, minWidth: 0 },
    timer: {
      minWidth: tokens.layout.isCompact ? 66 : undefined,
      gap: 6,
      paddingLeft: tokens.layout.isCompact ? 12 : 0,
      paddingTop: tokens.layout.isCompact ? 0 : 12,
      borderLeftWidth: tokens.layout.isCompact ? 1 : 0,
      borderTopWidth: tokens.layout.isCompact ? 0 : 1,
      borderColor: colors.dividerSubtle,
    },
    timerReadout: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    timerText: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 19 : 27, lineHeight: tokens.layout.isCompact ? 24 : 32 },
    timerTrack: { height: tokens.layout.isCompact ? 4 : 5, borderRadius: radius.pill, backgroundColor: colors.dividerSubtle, overflow: 'hidden' },
    timerFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.warning },
    lifelineBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'stretch',
      padding: 4,
      backgroundColor: colors.secondarySurfaceRaised,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    abilityAnimationWrap: {
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: tokens.layout.isCompact ? '25%' : '50%',
      minWidth: 0,
      borderRadius: radius.sm,
    },
    incidentCard: {
      overflow: 'hidden',
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.22,
    },
    incidentRail: {
      height: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.secondarySurfaceRaised,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
    },
    incidentNode: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.warning },
    incidentLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
    incidentGradient: { minHeight: tokens.layout.isCompact ? 116 : 164, justifyContent: 'center', padding: tokens.layout.isCompact ? 16 : 24 },
    tag: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.warning, marginBottom: tokens.layout.isCompact ? 7 : 12 },
    title: { ...tokens.type.question, fontFamily: fonts.headingBold, color: colors.text, maxWidth: 800 },
    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: tokens.layout.isCompact ? 13 : 20,
      marginBottom: tokens.layout.isCompact ? 7 : 10,
    },
    sectionLabel: {
      ...tokens.type.eyebrow,
      fontFamily: fonts.bodySemiBold,
      color: colors.textMuted,
      textTransform: 'uppercase',
    },
    sectionLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
    choices: { gap: tokens.layout.isCompact ? 9 : 12 },
    choiceBtn: {
      minHeight: tokens.layout.isCompact ? 60 : 72,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tokens.layout.isCompact ? 10 : 14,
      paddingVertical: tokens.layout.isCompact ? 12 : 18,
      paddingHorizontal: tokens.layout.isCompact ? 14 : 20,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.16,
    },
    choiceBtnHovered: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderStrong,
    },
    choiceBtnFocused: { borderColor: colors.text, borderWidth: 2 },
    choiceBtnSelected: { backgroundColor: colors.surfaceRaised, borderColor: colors.primary, borderLeftWidth: 3 },
    choiceBtnLocked: { opacity: 0.52 },
    choiceBtnPressed: {
      opacity: 1,
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.primary,
      transform: [{ scale: 0.99 }],
    },
    choiceIndex: {
      width: tokens.layout.isCompact ? 30 : 34,
      height: tokens.layout.isCompact ? 30 : 34,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.secondarySurfaceRaised,
      borderWidth: 1,
      borderColor: colors.dividerSubtle,
    },
    choiceIndexActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    choiceIndexText: { fontFamily: fonts.monoBold, fontSize: 12, lineHeight: 16, color: colors.textMuted },
    choiceIndexTextActive: { color: colors.onAccent },
    choiceTextContainer: { position: 'relative', flex: 1, minWidth: 0 },
    choiceLabel: { fontFamily: fonts.monoMedium, fontSize: tokens.layout.isCompact ? 15 : 16, lineHeight: tokens.layout.isCompact ? 22 : 24, color: colors.text },
    eliminationLine: { position: 'absolute', left: 0, top: '50%', height: 2, backgroundColor: colors.danger, transform: [{ translateY: -1 }] },
    choiceStateMark: {
      width: tokens.layout.isCompact ? 32 : 36,
      height: tokens.layout.isCompact ? 32 : 36,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: 'transparent',
    },
    choiceStateMarkActive: { backgroundColor: colors.primary },
    choiceStateIcon: { color: colors.textMuted },
    choiceStateIconActive: { color: colors.onAccent },
    confirmationArea: {
      marginTop: tokens.layout.isCompact ? 3 : 6,
      paddingTop: tokens.layout.isCompact ? 8 : 10,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    confirmationAction: { width: '100%' },
  });
}
