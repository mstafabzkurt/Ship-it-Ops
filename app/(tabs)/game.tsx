import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { getOperationImpact } from '../../src/config/operationImpact';
import GameAbilityButton from '../../src/components/game/GameAbilityButton';
import GameActionButton from '../../src/components/game/GameActionButton';
import GameBackdrop from '../../src/components/game/GameBackdrop';
import GameResultPanel, { type GameResultTone } from '../../src/components/game/GameResultPanel';
import JokerUseOverlay, { type JokerUseActivation } from '../../src/components/game/JokerUseOverlay';
import UptimeMilestoneCard from '../../src/components/game/UptimeMilestoneCard';
import ProgressSweep from '../../src/components/ProgressSweep';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useReputation, type OutcomeRollbackSnapshot } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { supabase } from '../../src/supabase';
import { fonts } from '../../src/theme/typography';
import {
  formatSignedReputation,
  getCurrentOperationCheckpoint,
  getOperationReputationProgress,
  getOperationReputationTarget,
  selectCategoryQuestion,
  type OperationCheckpointId,
  type OperationSessionCompletion,
} from '../../src/utils/categoryProgress';
import { isValidCategoryQuestion, type CategoryQuestionId, type CategoryQuestionRow } from '../../src/utils/categoryQuestions';
import type { RankingOutcome } from '../../src/utils/ranking';
import {
  deriveSessionReputation,
  removeSessionResult,
  upsertSessionResult,
} from '../../src/utils/sessionReputation';
import { trackEvent } from '../../src/utils/telemetry';

const TIMER_DURATION = 20;
const UPTIME_MILESTONE_REWARDS: Readonly<Record<number, number>> = {
  3: 150,
  5: 500,
  10: 2000,
  20: 4000,
};
const UPTIME_MILESTONES = [3, 5, 10, 20] as const;

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

interface SessionReviewEntry {
  questionId: CategoryQuestionId;
  questionIndex: number;
  questionTitle: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  outcome: GameResultTone;
}

interface SessionResolvedResult extends SessionReviewEntry {
  reputationDelta: number;
  rankingOutcome: RankingOutcome;
  isCorrect: boolean;
  previousUptimeStreak: number;
  outcomeRollbackSnapshot: OutcomeRollbackSnapshot;
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
  reduceMotion: boolean;
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
  reduceMotion,
  onPress,
  styles,
}: AnimatedChoiceItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const lineProgress = useRef(new Animated.Value(0)).current;
  const selectionProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const selectionScale = useRef(new Animated.Value(1)).current;
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

  useEffect(() => {
    selectionProgress.stopAnimation();
    selectionScale.stopAnimation();

    if (reduceMotion) {
      selectionProgress.setValue(isSelected ? 1 : 0);
      selectionScale.setValue(1);
      return;
    }

    if (isSelected) {
      selectionProgress.setValue(0);
      selectionScale.setValue(0.985);
      const animation = Animated.parallel([
        Animated.timing(selectionProgress, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(selectionScale, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      animation.start();
      return () => animation.stop();
    }

    selectionScale.setValue(1);
    const animation = Animated.timing(selectionProgress, {
      toValue: 0,
      duration: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [isSelected, reduceMotion, selectionProgress, selectionScale]);

  const lineWidth = lineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateX },
          { scale: selectionScale },
          { scale: isCodeReviewSurvivor ? survivorScale : 1 },
        ],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Seçenek ${String.fromCharCode(65 + index)}: ${choice.label}`}
        accessibilityHint={isSelected ? 'Seçili cevap' : 'Seçmek için dokun'}
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
            <Animated.View
              pointerEvents="none"
              style={[styles.choiceSelectionWash, { opacity: selectionProgress }]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.choiceSelectionRail, { opacity: selectionProgress }]}
            />
            <View style={[styles.choiceIndex, (pressed || isSelected) && styles.choiceIndexActive]}>
              <Text style={[styles.choiceIndexText, (pressed || isSelected) && styles.choiceIndexTextActive]}>
                {String.fromCharCode(65 + index)}
              </Text>
            </View>
            <View style={styles.choiceTextContainer}>
              <Text style={styles.choiceLabel}>{choice.label}</Text>
              <Animated.View pointerEvents="none" style={[styles.eliminationLine, { width: lineWidth }]} />
            </View>
            <View style={[
              styles.choiceStateMark,
              (pressed || isSelected) && styles.choiceStateMarkActive,
              isSelected && styles.choiceStateMarkSelected,
            ]}>
              {isSelected ? (
                <Text style={styles.choiceSelectedText}>Seçili</Text>
              ) : (
                <Ionicons
                  name={pressed ? 'checkmark' : 'chevron-forward'}
                  size={18}
                  style={[styles.choiceStateIcon, pressed && styles.choiceStateIconActive]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              )}
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

function getOperationTargetCopy(star: DifficultyStar): string {
  if (star === 1) return 'Orta için operasyon hedefi';
  if (star === 2) return 'Zor için operasyon hedefi';
  return 'Ustalık rozeti için operasyon hedefi';
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
    revertRankingOutcome,
    categoryProgress,
    recordCategoryQuestionAnswer,
    revertCategoryQuestionAnswer,
    completeCategoryOperationSession,
    getOutcomeRollbackSnapshot,
    restoreOutcomeRollbackSnapshot,
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
  const [sessionResults, setSessionResults] = useState<SessionResolvedResult[]>([]);

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
  const confirmationTransition = useRef(new Animated.Value(0)).current;
  const incidentRef = useRef<GameIncident | null>(null);
  const incidentsRef = useRef<GameIncident[]>([]);
  const resolvingRef = useRef(false);
  const selectedChoiceRef = useRef<IncidentChoice | null>(null);
  const sessionQuestionIdsRef = useRef<CategoryQuestionId[]>([]);
  const sessionResultsRef = useRef<SessionResolvedResult[]>([]);
  const sessionCorrectCountRef = useRef(0);
  const sessionCheckpointRef = useRef<OperationCheckpointId | null>(
    categoryId && difficultyStar ? getCurrentOperationCheckpoint(categoryProgress, categoryId, difficultyStar) : null,
  );
  const sessionCompletionRef = useRef<OperationSessionCompletion | null>(null);
  const sessionStartAttemptedCountRef = useRef(
    categoryId && difficultyStar ? categoryProgress[categoryId][difficultyStar].attemptedQuestionIds.length : 0,
  );
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
  const contextActionsRef = useRef({ applyOutcome, addBudget, setCorrectAnswers, setWrongAnswers, recordRankingOutcome, revertRankingOutcome, setUptimeStreak, recordCategoryQuestionAnswer, revertCategoryQuestionAnswer, completeCategoryOperationSession, getOutcomeRollbackSnapshot, restoreOutcomeRollbackSnapshot });

  useEffect(() => {
    uptimeStreakRef.current = uptimeStreak;
  }, [uptimeStreak]);

  useEffect(() => {
    if (!categoryId || !difficultyStar) return;
    attemptedQuestionIdsRef.current = categoryProgress[categoryId][difficultyStar].attemptedQuestionIds;
  }, [categoryId, categoryProgress, difficultyStar]);

  useEffect(() => {
    contextActionsRef.current = { applyOutcome, addBudget, setCorrectAnswers, setWrongAnswers, recordRankingOutcome, revertRankingOutcome, setUptimeStreak, recordCategoryQuestionAnswer, revertCategoryQuestionAnswer, completeCategoryOperationSession, getOutcomeRollbackSnapshot, restoreOutcomeRollbackSnapshot };
  }, [addBudget, applyOutcome, completeCategoryOperationSession, getOutcomeRollbackSnapshot, recordCategoryQuestionAnswer, recordRankingOutcome, restoreOutcomeRollbackSnapshot, revertCategoryQuestionAnswer, revertRankingOutcome, setCorrectAnswers, setUptimeStreak, setWrongAnswers]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    advancingRef.current = false;
  }, [incident?.id]);

  useEffect(() => {
    sessionResultsRef.current = [];
    sessionCompletionRef.current = null;
    setSessionResults([]);
  }, [categoryId, difficultyStar]);

  const hasSelectedChoice = selectedChoice !== null;
  const sessionReputation = deriveSessionReputation(sessionResults);

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

  const recordResolvedSessionResult = useCallback((result: SessionResolvedResult) => {
    const next = upsertSessionResult(sessionResultsRef.current, result);
    sessionResultsRef.current = next;
    setSessionResults(next);
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
    if (!categoryId || !difficultyStar) return;
    const outcomeRollbackSnapshot = contextActionsRef.current.getOutcomeRollbackSnapshot();
    const previousUptimeStreak = uptimeStreakRef.current;
    if (!attemptedQuestionIdsRef.current.includes(currentIncident.id)) attemptedQuestionIdsRef.current = [...attemptedQuestionIdsRef.current, currentIncident.id];
    contextActionsRef.current.recordCategoryQuestionAnswer(categoryId, difficultyStar, currentIncident.id, false);
    contextActionsRef.current.setWrongAnswers((value) => value + 1);
    contextActionsRef.current.recordRankingOutcome('timeout');
    const reward = getCategoryReward(difficultyStar, 'timeout');
    try {
      await contextActionsRef.current.applyOutcome(reward.careerXpDelta, reward.reputationDelta, reward.budgetDelta);
      recordResolvedSessionResult({
        questionId: currentIncident.id,
        questionIndex: sessionQuestionIdsRef.current.length,
        questionTitle: currentIncident.title,
        selectedAnswer: null,
        correctAnswer: currentIncident.optimal_text,
        outcome: 'timeout',
        reputationDelta: reward.reputationDelta,
        rankingOutcome: 'timeout',
        isCorrect: false,
        previousUptimeStreak,
        outcomeRollbackSnapshot,
      });
      void trackEvent('question_answered', {
        category_id: categoryId,
        difficulty_star: difficultyStar,
        question_id: currentIncident.id,
        result: 'timeout',
        reputation_delta: reward.reputationDelta,
        career_xp_delta: reward.careerXpDelta,
        budget_delta: reward.budgetDelta,
        remaining_time: 0,
      });
    } finally {
      outcomePendingRef.current = false;
      setIsOutcomePending(false);
    }
  }, [categoryId, difficultyStar, recordResolvedSessionResult]);

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
    startTimer();
  }, [codeReviewEmphasis, snapshotStatusPulse, startTimer]);

  const fetchIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!categoryId || !difficultyStar) {
        setError('Geçerli bir alan ve kademe seçmelisin.');
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
        setError(`Bu kademe henüz hazır değil (${loadedIncidents.length}/${QUESTIONS_PER_TIER} geçerli soru).`);
        return;
      }
      incidentsRef.current = loadedIncidents;
      sessionQuestionIdsRef.current = [];
      sessionResultsRef.current = [];
      sessionCorrectCountRef.current = 0;
      sessionCompletionRef.current = null;
      const checkpointId = getCurrentOperationCheckpoint(categoryProgress, categoryId, difficultyStar);
      sessionCheckpointRef.current = checkpointId;
      setSessionResults([]);
      sessionStartAttemptedCountRef.current = attemptedQuestionIdsRef.current.length;
      void trackEvent('session_started', {
        category_id: categoryId,
        difficulty_star: difficultyStar,
        checkpoint_index: checkpointId,
        checkpoint_target: getOperationReputationTarget(difficultyStar),
      });
      chooseIncident(loadedIncidents, []);
    } catch (fetchError: any) {
      setError(fetchError.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, categoryProgress, chooseIncident, difficultyStar]);

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
    const outcomeRollbackSnapshot = contextActionsRef.current.getOutcomeRollbackSnapshot();
    const previousUptimeStreak = uptimeStreakRef.current;
    if (!attemptedQuestionIdsRef.current.includes(currentIncident.id)) attemptedQuestionIdsRef.current = [...attemptedQuestionIdsRef.current, currentIncident.id];
    contextActionsRef.current.recordCategoryQuestionAnswer(categoryId, difficultyStar, currentIncident.id, isCorrect);
    const reward = getCategoryReward(difficultyStar, choiceOutcome);
    contextActionsRef.current.recordRankingOutcome(choiceOutcome);
    let milestoneBonus = 0;
    if (reward.isPositive) {
      sessionCorrectCountRef.current += 1;
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
      recordResolvedSessionResult({
        questionId: currentIncident.id,
        questionIndex: sessionQuestionIdsRef.current.length,
        questionTitle: currentIncident.title,
        selectedAnswer: choice.label,
        correctAnswer: currentIncident.optimal_text,
        outcome: isCorrect ? 'success' : 'fail',
        reputationDelta: reward.reputationDelta,
        rankingOutcome: choiceOutcome,
        isCorrect,
        previousUptimeStreak,
        outcomeRollbackSnapshot,
      });
      void trackEvent('question_answered', {
        category_id: categoryId,
        difficulty_star: difficultyStar,
        question_id: currentIncident.id,
        result: choiceOutcome,
        reputation_delta: reward.reputationDelta,
        career_xp_delta: reward.careerXpDelta,
        budget_delta: reward.budgetDelta + milestoneBonus,
        remaining_time: timeLeftRef.current,
      });
    } finally {
      outcomePendingRef.current = false;
      setIsOutcomePending(false);
    }
  }, [categoryId, difficultyStar, recordResolvedSessionResult, stopTimer]);

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
      if (categoryId && difficultyStar) {
        const finalResults = sessionResultsRef.current;
        const finalSessionReputation = deriveSessionReputation(finalResults);
        const checkpointId = sessionCheckpointRef.current;
        const completion = contextActionsRef.current.completeCategoryOperationSession(
          categoryId,
          difficultyStar,
          checkpointId,
          finalSessionReputation,
        );
        sessionCompletionRef.current = completion;
        const checkpointTarget = getOperationReputationTarget(difficultyStar);
        void trackEvent('session_completed', {
          category_id: categoryId,
          difficulty_star: difficultyStar,
          checkpoint_index: checkpointId,
          checkpoint_target: checkpointTarget,
          session_question_count: finalResults.length,
          session_correct_count: finalResults.filter((result) => result.outcome === 'success').length,
          session_wrong_count: finalResults.filter((result) => result.outcome === 'fail').length,
          session_timeout_count: finalResults.filter((result) => result.outcome === 'timeout').length,
          session_reputation: finalSessionReputation,
          checkpoint_passed: checkpointId !== null && completion.passed,
        });
        if (checkpointId !== null) {
          void trackEvent(completion.passed ? 'checkpoint_passed' : 'checkpoint_failed', {
            category_id: categoryId,
            difficulty_star: difficultyStar,
            checkpoint_index: checkpointId,
            checkpoint_target: checkpointTarget,
            session_reputation: finalSessionReputation,
          });
        }
        if (completion.newlyUnlockedTier) {
          void trackEvent('tier_unlocked', {
            category_id: categoryId,
            unlocked_difficulty_star: completion.newlyUnlockedTier,
          });
        }
      }
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
  }, [categoryId, chooseIncident, difficultyStar, questionTransition, reduceMotion, stopTimer]);

  const handleRestart = useCallback(() => {
    stopTimer();
    sessionQuestionIdsRef.current = [];
    sessionResultsRef.current = [];
    sessionCorrectCountRef.current = 0;
    sessionCompletionRef.current = null;
    const checkpointId = categoryId && difficultyStar
      ? getCurrentOperationCheckpoint(categoryProgress, categoryId, difficultyStar)
      : null;
    sessionCheckpointRef.current = checkpointId;
    setSessionResults([]);
    sessionStartAttemptedCountRef.current = attemptedQuestionIdsRef.current.length;
    if (categoryId && difficultyStar) {
      void trackEvent('session_started', {
        category_id: categoryId,
        difficulty_star: difficultyStar,
        checkpoint_index: checkpointId,
        checkpoint_target: getOperationReputationTarget(difficultyStar),
      });
    }
    chooseIncident(incidentsRef.current, []);
  }, [categoryId, categoryProgress, chooseIncident, difficultyStar, stopTimer]);

  const handleExit = useCallback(() => {
    stopTimer();
    sessionResultsRef.current = [];
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
    if (categoryId && difficultyStar) {
      void trackEvent('joker_used', {
        joker_type: 'codeReview',
        category_id: categoryId,
        difficulty_star: difficultyStar,
        question_id: incidentRef.current?.id,
      });
    }
    if (!reduceMotion) {
      codeReviewEmphasis.stopAnimation();
      codeReviewEmphasis.setValue(0);
      Animated.sequence([
        Animated.timing(codeReviewEmphasis, { toValue: 1, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(codeReviewEmphasis, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [categoryId, choices, codeReview, codeReviewEmphasis, consumeCodeReview, difficultyStar, isAnswered, isCodeReviewActive, queueJokerOverlay, reduceMotion]);

  const handleServerScaleUp = useCallback(() => {
    if (isAnswered || isScaleUpUsed || serverScaleUp <= 0 || lifelineUseLocksRef.current.has('serverScaleUp')) return;
    lifelineUseLocksRef.current.add('serverScaleUp');
    queueJokerOverlay('flash', 'Scale Up', serverScaleUp);
    setIsScaleUpUsed(true);
    consumeServerScaleUp();
    if (categoryId && difficultyStar) {
      void trackEvent('joker_used', {
        joker_type: 'serverScaleUp',
        category_id: categoryId,
        difficulty_star: difficultyStar,
        question_id: incidentRef.current?.id,
      });
    }
    const extendedTime = timeLeftRef.current + 15;
    timeLeftRef.current = extendedTime;
    setTimeLeft(extendedTime);
  }, [categoryId, consumeServerScaleUp, difficultyStar, isAnswered, isScaleUpUsed, queueJokerOverlay, serverScaleUp]);

  const failedChoiceSelected = Boolean(activeChoice && activeChoice.tier !== 'optimal');
  const currentResolvedResult = incident
    ? sessionResults.find((result) => result.questionId === incident.id)
    : undefined;
  const canUseGitRevert = isAnswered && !isOutcomePending && Boolean(currentResolvedResult) && gitRevert > 0 && !isReverted;
  const canUseSnapshotBackup = isAnswered && failedChoiceSelected && lostStreak > 0 && snapshotBackup > 0;

  const handleGitRevert = useCallback(() => {
    const currentIncident = incidentRef.current;
    if (!canUseGitRevert || !currentIncident || !currentResolvedResult || !categoryId || !difficultyStar || !resolvingRef.current || lifelineUseLocksRef.current.has('gitRevert')) return;
    lifelineUseLocksRef.current.add('gitRevert');
    queueJokerOverlay('arrow-undo', 'Git Revert', gitRevert);
    consumeGitRevert();
    void trackEvent('joker_used', {
      joker_type: 'gitRevert',
      category_id: categoryId,
      difficulty_star: difficultyStar,
      question_id: currentIncident.id,
    });
    contextActionsRef.current.restoreOutcomeRollbackSnapshot(currentResolvedResult.outcomeRollbackSnapshot);
    contextActionsRef.current.revertCategoryQuestionAnswer(categoryId, difficultyStar, currentResolvedResult.isCorrect);
    contextActionsRef.current.revertRankingOutcome(currentResolvedResult.rankingOutcome);
    if (currentResolvedResult.isCorrect) {
      sessionCorrectCountRef.current = Math.max(0, sessionCorrectCountRef.current - 1);
      contextActionsRef.current.setCorrectAnswers((value) => Math.max(0, value - 1));
    } else {
      contextActionsRef.current.setWrongAnswers((value) => Math.max(0, value - 1));
    }
    uptimeStreakRef.current = currentResolvedResult.previousUptimeStreak;
    contextActionsRef.current.setUptimeStreak(currentResolvedResult.previousUptimeStreak);
    lostStreakRef.current = 0;
    setLostStreak(0);
    const nextSessionResults = removeSessionResult(sessionResultsRef.current, currentIncident.id);
    sessionResultsRef.current = nextSessionResults;
    setSessionResults(nextSessionResults);
    setIsReverted(true);
    setRevertedChoiceId(activeChoice?.id ?? null);
    setActiveChoice(null);
    setTimedOut(false);
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
  }, [activeChoice?.id, canUseGitRevert, categoryId, consumeGitRevert, currentResolvedResult, difficultyStar, gitRevert, queueJokerOverlay, questionTransition, reduceMotion, startTimer]);

  const handleSnapshotBackup = useCallback(() => {
    if (!canUseSnapshotBackup || lostStreakRef.current <= 0 || lifelineUseLocksRef.current.has('snapshotBackup')) return;
    lifelineUseLocksRef.current.add('snapshotBackup');
    queueJokerOverlay('camera-outline', 'Snapshot', snapshotBackup);
    const restoredStreak = lostStreakRef.current;
    lostStreakRef.current = 0;
    uptimeStreakRef.current = restoredStreak;
    consumeSnapshotBackup();
    if (categoryId && difficultyStar) {
      void trackEvent('joker_used', {
        joker_type: 'snapshotBackup',
        category_id: categoryId,
        difficulty_star: difficultyStar,
        question_id: incidentRef.current?.id,
      });
    }
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
  }, [canUseSnapshotBackup, categoryId, consumeSnapshotBackup, difficultyStar, queueJokerOverlay, reduceMotion, snapshotBackup, snapshotRestoreFlash, snapshotStatusPulse]);

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
      tokens={tokens}
      reduceMotion={reduceMotion}
      onRestart={handleRestart}
      onExit={handleExit}
      categoryName={category.name}
      operationTitle={category.operation.title}
      star={difficultyStar}
      difficultyLabel={DIFFICULTY_LABELS[difficultyStar]}
      answeredCount={Math.min(sessionQuestionIdsRef.current.length, SESSION_QUESTION_COUNT)}
      correctCount={sessionCorrectCountRef.current}
      attemptedCount={Math.min(QUESTIONS_PER_TIER, attemptedQuestionIdsRef.current.length)}
      progressGained={Math.max(0, attemptedQuestionIdsRef.current.length - sessionStartAttemptedCountRef.current)}
      operationCompletion={sessionCompletionRef.current}
      reviewEntries={[...sessionResultsRef.current].sort((left, right) => left.questionIndex - right.questionIndex)}
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
  const operationTarget = getOperationReputationTarget(difficultyStar);
  const operationProgress = getOperationReputationProgress(sessionReputation, operationTarget);
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
                accessibilityLabel="Oyun merkezine dön"
                hitSlop={8}
                onPress={handleExit}
                style={({ pressed }) => [styles.exitBtn, pressed && styles.controlPressed]}
              >
                <Text style={styles.exitText}>×</Text>
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={styles.headerEyebrow}>SORU OTURUMU</Text>
                <Text style={styles.header}>{category.name} · {DIFFICULTY_LABELS[difficultyStar]}</Text>
                <View style={styles.sessionMetrics}>
                  <Text style={styles.sessionMetric}>Soru <Text style={styles.sessionMetricValue}>{Math.min(sessionQuestionIdsRef.current.length, SESSION_QUESTION_COUNT)}/{SESSION_QUESTION_COUNT}</Text></Text>
                  <View style={styles.sessionMetricDivider} />
                  <Text style={styles.sessionMetric}>Kademe <Text style={styles.sessionMetricValue}>{Math.min(QUESTIONS_PER_TIER, attemptedQuestionIdsRef.current.length)}/{QUESTIONS_PER_TIER}</Text></Text>
                </View>
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

            <View style={styles.qualificationBar}>
              <View style={styles.qualificationTopline}>
                <View style={styles.qualificationCopy}>
                  <Text style={styles.qualificationEyebrow}>KADEME YETERLİLİĞİ</Text>
                  <Text style={styles.qualificationTarget}>{getOperationTargetCopy(difficultyStar)}: +{operationTarget} İtibar</Text>
                </View>
                <View style={styles.qualificationReadout}>
                  <Text style={styles.qualificationValue}>{formatSignedReputation(sessionReputation)} / +{operationTarget} İtibar</Text>
                </View>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`${getOperationTargetCopy(difficultyStar)}, ${formatSignedReputation(sessionReputation)} / +${operationTarget} İtibar`}
                accessibilityValue={{ min: 0, max: operationTarget, now: Math.max(0, Math.min(operationTarget, sessionReputation)) }}
                style={styles.qualificationTrack}
              >
                <View style={[styles.qualificationFill, { width: `${operationProgress * 100}%` }]} />
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
                      reduceMotion={reduceMotion}
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
                  <View style={styles.deskStrip}>
                    <Text style={styles.deskEyebrow}>OPERASYON HATTI</Text>
                    <Text style={styles.deskIdentity}>
                      <Text style={styles.deskTitle}>{category.operation.title}</Text>
                      {' · '}{category.operation.activeSubtitle}
                    </Text>
                  </View>
                  <View style={styles.incidentGradient}>
                    <Text style={styles.tag}>TEKNİK KARAR</Text>
                    <Text style={styles.title}>{incident.title}</Text>
                  </View>
                </View>

                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionLabel}>{isAnswered ? 'Soru Sonucu' : 'Cevap Seçenekleri'}</Text>
                  <View style={styles.sectionLine} />
                </View>
                <View style={styles.choices}>
                  {isAnswered && feedbackReward && resultTone ? (
                    <GameResultPanel
                      tone={resultTone}
                      careerXpDelta={feedbackReward.careerXpDelta}
                      reputationDelta={feedbackReward.reputationDelta}
                      budgetDelta={feedbackReward.budgetDelta}
                      impactText={getOperationImpact({
                        categoryId: category.id,
                        tag: incident.tag,
                        title: incident.title,
                        resultStatus: resultTone,
                      })}
                      rewardLabel={`${DIFFICULTY_LABELS[difficultyStar].toLocaleUpperCase('tr-TR')} KADEME ETKİSİ`}
                      bestAnswer={!feedbackReward.isPositive ? incident.optimal_text : undefined}
                      isProcessing={isOutcomePending}
                      onNext={handleNextScenario}
                      nextLabel={sessionQuestionIdsRef.current.length >= SESSION_QUESTION_COUNT ? 'Oturumu Tamamla' : 'Sonraki Soru'}
                      reduceMotion={reduceMotion}
                    />
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
                          reduceMotion={reduceMotion}
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
                            label="Cevabı Onayla"
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
          <Text style={styles.loadingText}>Sorular yükleniyor...</Text>
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
  tokens,
  reduceMotion,
  onRestart,
  onExit,
  categoryName,
  operationTitle,
  star,
  difficultyLabel,
  answeredCount,
  correctCount,
  attemptedCount,
  progressGained,
  operationCompletion,
  reviewEntries,
}: {
  styles: ReturnType<typeof makeStyles>;
  tokens: DashboardTokens;
  reduceMotion: boolean;
  onRestart: () => void;
  onExit: () => void;
  categoryName: string;
  operationTitle: string;
  star: DifficultyStar;
  difficultyLabel: string;
  answeredCount: number;
  correctCount: number;
  attemptedCount: number;
  progressGained: number;
  operationCompletion: OperationSessionCompletion | null;
  reviewEntries: SessionReviewEntry[];
}) {
  const [reviewVisible, setReviewVisible] = useState(false);
  const nextTierLabel = star < 3 ? DIFFICULTY_LABELS[(star + 1) as DifficultyStar] : null;
  const target = operationCompletion?.target ?? getOperationReputationTarget(star);
  const netReputation = operationCompletion?.netReputation ?? 0;
  const targetPassed = operationCompletion?.passed ?? false;
  const passedCount = operationCompletion?.passedCount ?? 0;
  const checkpointWasActive = Boolean(operationCompletion && operationCompletion.checkpointId !== null);
  const qualificationStatus = checkpointWasActive
    ? targetPassed
      ? `Operasyon hedefi geçildi: ${formatSignedReputation(netReputation)} / +${target} İtibar`
      : `Operasyon hedefi kaçtı: ${formatSignedReputation(netReputation)} / +${target} İtibar`
    : `Tekrar oturumu: ${formatSignedReputation(netReputation)} / +${target} İtibar`;
  const qualificationProgress = getOperationReputationProgress(netReputation, target);
  const unlockStatus = operationCompletion?.newlyUnlockedTier
    ? `${DIFFICULTY_LABELS[operationCompletion.newlyUnlockedTier]} kilidi açıldı.`
    : star < 3
      ? `${nextTierLabel} kilidi: ${passedCount}/2 operasyon geçti`
      : operationCompletion?.masteryCompleted
        ? 'Ustalık yeterliliği tamamlandı.'
        : `Ustalık: ${passedCount}/2 operasyon geçti`;
  const retryHint = checkpointWasActive && !targetPassed
    ? `${nextTierLabel ?? 'Ustalık rozeti'} için bu operasyonu tekrar güçlendir.`
    : null;
  return (
    <GameBackdrop>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.completeContainer}>
          <View style={styles.completeCard}>
            <View style={styles.completeRail} pointerEvents="none" />
            <Text style={styles.completeEyebrow}>SESSION COMPLETE</Text>
            <View style={styles.completeIconSlot}>
              <Ionicons
                name="trophy"
                size={34}
                style={styles.completeIcon}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            </View>
            <Text style={styles.completeEyebrow}>{categoryName} · {difficultyLabel}</Text>
            <Text style={styles.completeTitle}>Oturum Tamamlandı</Text>
            <Text style={styles.completeMessage}>{operationTitle} oturumu tamamlandı.</Text>
            <View style={styles.completeMetrics}>
              <View style={styles.completeMetric}>
                <Text style={styles.completeMetricLabel}>YANITLANAN</Text>
                <Text style={styles.completeMetricValue}>{answeredCount}/{SESSION_QUESTION_COUNT}</Text>
              </View>
              <View style={styles.completeMetric}>
                <Text style={styles.completeMetricLabel}>DOĞRU</Text>
                <Text style={styles.completeMetricValue}>{correctCount}</Text>
              </View>
              <View style={styles.completeMetric}>
                <Text style={styles.completeMetricLabel}>KADEME</Text>
                <Text style={styles.completeMetricValue}>{attemptedCount}/{QUESTIONS_PER_TIER}</Text>
                <Text style={styles.completeMetricHint}>+{progressGained} ilerleme</Text>
              </View>
            </View>
            <ProgressSweep
              value={attemptedCount / QUESTIONS_PER_TIER}
              reduceMotion={reduceMotion}
              accessibilityLabel={`${categoryName}, ${difficultyLabel}, kademe ilerlemesi ${attemptedCount}/${QUESTIONS_PER_TIER}`}
              trackStyle={styles.completeProgressTrack}
              fillStyle={styles.completeProgressFill}
              sweepColor={tokens.colors.text}
              markers={[0.5]}
            />
            <View style={[styles.qualificationResult, targetPassed ? styles.qualificationResultPassed : styles.qualificationResultFailed]}>
              <View style={styles.qualificationResultHeader}>
                <Ionicons
                  name={targetPassed ? 'checkmark-circle-outline' : 'refresh-circle-outline'}
                  size={20}
                  color={targetPassed ? tokens.colors.secondary : tokens.colors.warning}
                />
                <View style={styles.qualificationResultCopy}>
                  <Text style={styles.qualificationResultEyebrow}>KADEME YETERLİLİĞİ</Text>
                  <Text style={styles.qualificationResultTitle}>{qualificationStatus}</Text>
                </View>
              </View>
              <View style={styles.qualificationResultTrack}>
                <View style={[styles.qualificationResultFill, { width: `${qualificationProgress * 100}%` }]} />
              </View>
              <Text style={styles.qualificationResultStatus}>{unlockStatus}</Text>
              {retryHint ? <Text style={styles.qualificationResultHint}>{retryHint}</Text> : null}
            </View>
            {operationCompletion?.newlyUnlockedTier || (checkpointWasActive && targetPassed && operationCompletion?.masteryCompleted) ? (
              <View style={styles.unlockNotice}>
                <Ionicons name={operationCompletion.newlyUnlockedTier ? 'lock-open-outline' : 'ribbon-outline'} size={20} style={styles.completeIcon} />
                <Text style={styles.unlockNoticeText}>{unlockStatus}</Text>
              </View>
            ) : null}
            <View style={styles.completeActions}>
              <GameActionButton label="Oyun Merkezine Dön" onPress={onExit} style={styles.completeAction} />
              <GameActionButton label="Cevapları İncele" onPress={() => setReviewVisible(true)} variant="secondary" style={styles.completeAction} />
              <GameActionButton label="Yeni Oturum Başlat" onPress={onRestart} variant="secondary" style={styles.completeAction} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <SessionReviewModal
        visible={reviewVisible}
        entries={reviewEntries}
        categoryName={categoryName}
        difficultyLabel={difficultyLabel}
        styles={styles}
        tokens={tokens}
        reduceMotion={reduceMotion}
        onClose={() => setReviewVisible(false)}
      />
    </GameBackdrop>
  );
}

function SessionReviewModal({
  visible,
  entries,
  categoryName,
  difficultyLabel,
  styles,
  tokens,
  reduceMotion,
  onClose,
}: {
  visible: boolean;
  entries: SessionReviewEntry[];
  categoryName: string;
  difficultyLabel: string;
  styles: ReturnType<typeof makeStyles>;
  tokens: DashboardTokens;
  reduceMotion: boolean;
  onClose: () => void;
}) {
  const [closeFocused, setCloseFocused] = useState(false);

  return (
    <Modal
      animationType={reduceMotion ? 'none' : 'fade'}
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.reviewScrim}>
        <SafeAreaView style={styles.reviewSafeArea} edges={['top', 'bottom']}>
          <View
            accessibilityLabel="Oturum cevap incelemesi"
            accessibilityViewIsModal
            style={styles.reviewPanel}
          >
            <View style={styles.reviewHeader}>
              <View style={styles.reviewHeaderCopy}>
                <Text accessibilityRole="header" style={styles.reviewTitle}>Cevapları İncele</Text>
                <Text style={styles.reviewContext}>{categoryName} · {difficultyLabel} · {entries.length} soru</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cevap incelemesini kapat"
                hitSlop={6}
                onPress={onClose}
                onFocus={() => setCloseFocused(true)}
                onBlur={() => setCloseFocused(false)}
                style={({ pressed }) => [
                  styles.reviewClose,
                  closeFocused && styles.reviewCloseFocused,
                  pressed && styles.controlPressed,
                ]}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={tokens.colors.text}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.reviewList}
              showsVerticalScrollIndicator={false}
            >
              {entries.map((entry) => (
                <SessionReviewItem key={entry.questionId} entry={entry} styles={styles} tokens={tokens} />
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function SessionReviewItem({
  entry,
  styles,
  tokens,
}: {
  entry: SessionReviewEntry;
  styles: ReturnType<typeof makeStyles>;
  tokens: DashboardTokens;
}) {
  const isCorrect = entry.outcome === 'success';
  const isPartial = entry.outcome === 'partial';
  const isTimeout = entry.outcome === 'timeout';
  const statusLabel = isCorrect ? 'Doğru' : isPartial ? 'Kısmi Doğru' : isTimeout ? 'Süre Doldu' : 'Yanlış';
  const statusColor = isCorrect
    ? tokens.colors.secondary
    : isPartial
      ? tokens.colors.warning
      : tokens.colors.danger;
  const statusBackground = isCorrect
    ? tokens.colors.secondarySoft
    : isPartial
      ? tokens.colors.warningSoft
      : tokens.colors.dangerSoft;

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewItemHeader}>
        <Text style={styles.reviewQuestionNumber}>Soru {entry.questionIndex}</Text>
        <View style={[styles.reviewStatus, { backgroundColor: statusBackground, borderColor: statusColor }]}>
          <Text style={[styles.reviewStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.reviewQuestionTitle}>{entry.questionTitle}</Text>

      {isCorrect ? (
        <View style={styles.reviewAnswerBlock}>
          <Text style={styles.reviewAnswerLabel}>CEVABIN</Text>
          <Text style={styles.reviewAnswerText}>{entry.selectedAnswer ?? entry.correctAnswer}</Text>
        </View>
      ) : (
        <View style={styles.reviewComparison}>
          <View style={styles.reviewAnswerBlock}>
            <Text style={styles.reviewAnswerLabel}>SENİN CEVABIN</Text>
            <Text style={styles.reviewAnswerText}>{entry.selectedAnswer ?? 'Cevap onaylanmadı'}</Text>
          </View>
          <View style={[styles.reviewAnswerBlock, styles.reviewCorrectAnswerBlock]}>
            <Text style={[styles.reviewAnswerLabel, styles.reviewCorrectAnswerLabel]}>DOĞRU CEVAP</Text>
            <Text style={styles.reviewAnswerText}>{entry.correctAnswer}</Text>
          </View>
        </View>
      )}
    </View>
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
    completeContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    completeCard: {
      width: '100%',
      maxWidth: 480,
      alignItems: 'center',
      padding: tokens.layout.isCompact ? 18 : 28,
      gap: tokens.layout.isCompact ? 10 : 12,
      borderRadius: radius.xl,
      backgroundColor: colors.floatingSurface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      ...shadow.raised,
    },
    completeIconSlot: {
      width: 66,
      height: 66,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 33,
      backgroundColor: colors.warningSoft,
      borderWidth: 1,
      borderColor: colors.warning,
      ...shadow.card,
    },
    completeRail: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: colors.warning, opacity: 0.6 },
    completeIcon: { color: colors.warning },
    completeEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.monoMedium, color: colors.warning, textAlign: 'center' },
    completeProgressTrack: { width: '100%', height: 7, borderRadius: 3, backgroundColor: colors.borderSubtle, overflow: 'hidden' },
    completeProgressFill: { borderRadius: 3, backgroundColor: colors.warning },
    completeTitle: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text, textAlign: 'center' },
    completeMessage: { ...tokens.type.body, fontFamily: fonts.bodyMedium, color: colors.textMuted, textAlign: 'center', marginBottom: tokens.layout.isCompact ? 4 : 8 },
    completeMetrics: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurfaceRaised,
    },
    completeMetric: {
      flex: 1,
      flexBasis: tokens.layout.isCompact ? 92 : 120,
      minWidth: 0,
      minHeight: tokens.layout.isCompact ? 72 : 82,
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.layout.isCompact ? 8 : 10,
      borderLeftWidth: 1,
      borderLeftColor: colors.dividerSubtle,
    },
    completeMetricLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55, color: colors.textMuted },
    completeMetricValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 18 : 21, lineHeight: tokens.layout.isCompact ? 23 : 27, color: colors.text, marginTop: 2 },
    completeMetricHint: { fontFamily: fonts.bodyMedium, fontSize: 10, lineHeight: 14, color: colors.secondary, marginTop: 1 },
    qualificationResult: { width: '100%', gap: 8, padding: tokens.layout.isCompact ? 11 : 14, borderRadius: radius.md, borderWidth: 1, backgroundColor: colors.secondarySurfaceRaised },
    qualificationResultPassed: { borderColor: colors.secondary },
    qualificationResultFailed: { borderColor: colors.warning },
    qualificationResultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
    qualificationResultCopy: { flex: 1, minWidth: 0, gap: 2 },
    qualificationResultEyebrow: { fontFamily: fonts.monoSemiBold, fontSize: 9, lineHeight: 13, letterSpacing: 0.55, color: colors.textMuted },
    qualificationResultTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.text },
    qualificationResultTrack: { width: '100%', height: 6, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.borderSubtle },
    qualificationResultFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.secondary },
    qualificationResultStatus: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.text },
    qualificationResultHint: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    unlockNotice: { width: '100%', minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: radius.sm, backgroundColor: colors.secondarySoft, borderWidth: 1, borderColor: colors.secondary },
    unlockNoticeText: { ...tokens.type.bodySmall, flexShrink: 1, fontFamily: fonts.bodySemiBold, color: colors.text, textAlign: 'center' },
    completeActions: { width: '100%', gap: 10, marginTop: 4 },
    completeAction: { width: '100%' },
    reviewScrim: { flex: 1, backgroundColor: 'rgba(5, 6, 18, 0.82)', padding: tokens.layout.isCompact ? 10 : 24 },
    reviewSafeArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    reviewPanel: {
      width: '100%',
      maxWidth: 760,
      maxHeight: '92%',
      overflow: 'hidden',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.floatingSurface,
      ...shadow.raised,
      shadowColor: colors.shadowNeutral,
    },
    reviewHeader: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: tokens.layout.isCompact ? 14 : 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
      backgroundColor: colors.floatingSurfaceRaised,
    },
    reviewHeaderCopy: { flex: 1, minWidth: 0 },
    reviewTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    reviewContext: { ...tokens.type.bodySmall, fontFamily: fonts.bodyMedium, color: colors.textMuted, marginTop: 2 },
    reviewClose: {
      width: 48,
      height: 48,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.secondarySurfaceRaised,
    },
    reviewCloseFocused: { borderWidth: 2, borderColor: colors.text },
    reviewList: { gap: 10, padding: tokens.layout.isCompact ? 12 : 18, paddingBottom: tokens.layout.isCompact ? 20 : 28 },
    reviewItem: {
      gap: 10,
      padding: tokens.layout.isCompact ? 12 : 16,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    reviewItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    reviewQuestionNumber: { fontFamily: fonts.monoBold, fontSize: 12, lineHeight: 16, color: colors.textMuted },
    reviewStatus: { minHeight: 26, justifyContent: 'center', paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1 },
    reviewStatusText: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15 },
    reviewQuestionTitle: { ...tokens.type.body, fontFamily: fonts.headingMedium, color: colors.text },
    reviewComparison: { gap: 8 },
    reviewAnswerBlock: { gap: 4, padding: 10, borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised },
    reviewCorrectAnswerBlock: { borderLeftWidth: 2, borderLeftColor: colors.secondary },
    reviewAnswerLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55, color: colors.textMuted },
    reviewCorrectAnswerLabel: { color: colors.secondary },
    reviewAnswerText: { ...tokens.type.bodySmall, fontFamily: fonts.bodyMedium, color: colors.text },
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
    headerEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 2 },
    header: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    sessionMetrics: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 4 },
    sessionMetric: { ...tokens.type.bodySmall, fontFamily: fonts.bodyMedium, color: colors.textMuted },
    sessionMetricValue: { fontFamily: fonts.monoBold, color: colors.text },
    sessionMetricDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.borderStrong },
    headerSignal: { width: tokens.layout.isCompact ? 34 : 70, flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerSignalDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.secondary },
    headerSignalLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
    qualificationBar: {
      gap: 7,
      marginBottom: tokens.layout.isCompact ? 10 : 16,
      paddingHorizontal: tokens.layout.isCompact ? 11 : 14,
      paddingVertical: tokens.layout.isCompact ? 9 : 11,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurfaceRaised,
    },
    qualificationTopline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qualificationCopy: { flex: 1, minWidth: 0, gap: 1 },
    qualificationEyebrow: { fontFamily: fonts.monoSemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.55, color: colors.secondary },
    qualificationTarget: { fontFamily: fonts.bodyMedium, fontSize: tokens.layout.isCompact ? 11 : 12, lineHeight: tokens.layout.isCompact ? 15 : 17, color: colors.textMuted },
    qualificationReadout: { flexShrink: 0, alignItems: 'flex-end' },
    qualificationValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 12 : 14, lineHeight: tokens.layout.isCompact ? 16 : 18, color: colors.text },
    qualificationTrack: { height: tokens.layout.isCompact ? 5 : 6, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.dividerSubtle },
    qualificationFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.secondary },
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
    deskStrip: {
      gap: 2,
      paddingVertical: tokens.layout.isCompact ? 8 : 10,
      paddingHorizontal: tokens.layout.isCompact ? 12 : 16,
      backgroundColor: colors.secondarySurfaceRaised,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
    },
    deskEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.monoMedium, color: colors.secondary },
    deskIdentity: { ...tokens.type.bodySmall, flexShrink: 1, fontFamily: fonts.bodyMedium, color: colors.textMuted },
    deskTitle: { fontFamily: fonts.headingBold, color: colors.text },
    incidentGradient: { minHeight: tokens.layout.isCompact ? 104 : 142, justifyContent: 'center', padding: tokens.layout.isCompact ? 14 : 22 },
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
    choiceBtnSelected: { backgroundColor: colors.surfaceRaised, borderColor: colors.primary },
    choiceSelectionWash: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
    },
    choiceSelectionRail: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 3,
      borderTopLeftRadius: radius.sm,
      borderBottomLeftRadius: radius.sm,
      backgroundColor: colors.primary,
    },
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
    choiceStateMarkSelected: { width: 56, paddingHorizontal: 8 },
    choiceStateIcon: { color: colors.textMuted },
    choiceStateIconActive: { color: colors.onAccent },
    choiceSelectedText: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 14, color: colors.onAccent },
    confirmationArea: {
      marginTop: tokens.layout.isCompact ? 3 : 6,
      paddingTop: tokens.layout.isCompact ? 8 : 10,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    confirmationAction: { width: '100%' },
  });
}
