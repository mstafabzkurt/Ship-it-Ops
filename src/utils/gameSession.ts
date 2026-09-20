import { calculateProgressionOutcome } from '../config/progression';
import {
  SESSION_QUESTION_COUNT,
  type DifficultyStar,
  type GameCategoryId,
} from '../config/gameCategories';
import {
  addCategoryLeaderboardScore,
  completeOperationSession,
  recordCategoryAttempt,
  type CategoryProgress,
  type OperationCheckpointId,
  type OperationSessionCompletion,
} from './categoryProgress';
import type { CategoryQuestionId } from './categoryQuestions';
import { clampBudget } from './budget';
import {
  recordRankingOutcome,
  type RankingOutcome,
  type RankingOutcomeStats,
} from './ranking';

export interface GameSessionResult {
  questionId: CategoryQuestionId;
  questionIndex: number;
  questionTitle: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  outcome: RankingOutcome;
  isCorrect: boolean;
  isRepeatCorrect: boolean;
  careerXpDelta: number;
  reputationDelta: number;
  budgetDelta: number;
  milestoneBudgetDelta: number;
  leaderboardDelta: number;
  uptimeBefore: number;
  uptimeAfter: number;
  resolvedAt: string;
}

export interface GameSessionTotals {
  answeredCount: number;
  correctCount: number;
  repeatCorrectCount: number;
  wrongCount: number;
  successCount: number;
  partialCount: number;
  failCount: number;
  timeoutCount: number;
  careerXpDelta: number;
  reputationDelta: number;
  budgetDelta: number;
  leaderboardDelta: number;
  finalUptimeStreak: number;
}

export interface GameSessionCommitInput {
  categoryId: GameCategoryId;
  star: DifficultyStar;
  checkpointId: OperationCheckpointId | null;
  initialUptimeStreak: number;
  results: readonly GameSessionResult[];
}

export interface GameSessionPermanentState {
  careerXp: number;
  reputation: number;
  budget: number;
  correctAnswers: number;
  wrongAnswers: number;
  completedSessions: number;
  rankingOutcomeStats: RankingOutcomeStats;
  categoryProgress: CategoryProgress;
  uptimeStreak: number;
}

export interface CompletedGameSessionPlan {
  permanentState: GameSessionPermanentState;
  completion: OperationSessionCompletion;
  totals: GameSessionTotals;
}

interface ProgressionStep {
  previousCareerXp: number;
  previousReputation: number;
  nextCareerXp: number;
  nextReputation: number;
}

export function deriveGameSessionTotals(
  results: readonly GameSessionResult[],
  initialUptimeStreak = 0,
): GameSessionTotals {
  const orderedResults = [...results].sort((left, right) => left.questionIndex - right.questionIndex);
  return orderedResults.reduce<GameSessionTotals>((totals, result) => ({
    answeredCount: totals.answeredCount + 1,
    correctCount: totals.correctCount + (result.isCorrect ? 1 : 0),
    repeatCorrectCount: totals.repeatCorrectCount + (result.isRepeatCorrect ? 1 : 0),
    wrongCount: totals.wrongCount + (result.isCorrect ? 0 : 1),
    successCount: totals.successCount + (result.outcome === 'success' ? 1 : 0),
    partialCount: totals.partialCount + (result.outcome === 'partial' ? 1 : 0),
    failCount: totals.failCount + (result.outcome === 'fail' ? 1 : 0),
    timeoutCount: totals.timeoutCount + (result.outcome === 'timeout' ? 1 : 0),
    careerXpDelta: totals.careerXpDelta + result.careerXpDelta,
    reputationDelta: totals.reputationDelta + result.reputationDelta,
    budgetDelta: totals.budgetDelta + result.budgetDelta + result.milestoneBudgetDelta,
    leaderboardDelta: totals.leaderboardDelta + result.leaderboardDelta,
    finalUptimeStreak: result.uptimeAfter,
  }), {
    answeredCount: 0,
    correctCount: 0,
    repeatCorrectCount: 0,
    wrongCount: 0,
    successCount: 0,
    partialCount: 0,
    failCount: 0,
    timeoutCount: 0,
    careerXpDelta: 0,
    reputationDelta: 0,
    budgetDelta: 0,
    leaderboardDelta: 0,
    finalUptimeStreak: initialUptimeStreak,
  });
}

export function isCompleteGameSession(results: readonly GameSessionResult[]): boolean {
  return results.length === SESSION_QUESTION_COUNT
    && new Set(results.map((result) => result.questionId)).size === SESSION_QUESTION_COUNT;
}

export function canUseRollbackOnResult(
  inventoryCount: number,
  result: Pick<GameSessionResult, 'outcome'> | null | undefined,
): boolean {
  return inventoryCount > 0 && Boolean(result) && result?.outcome !== 'success';
}

/** Reject presses from a result panel replaced by Next or invalidated by Rollback. */
export function isCurrentGameSessionResult(
  questionId: CategoryQuestionId | null,
  displayedResult: GameSessionResult | undefined,
  results: readonly GameSessionResult[],
): boolean {
  return Boolean(displayedResult)
    && displayedResult?.questionId === questionId
    && results.some((result) => result === displayedResult);
}

export function planCompletedGameSession({
  permanentState,
  session,
  getProgressionBudgetBonus = () => 0,
}: {
  permanentState: GameSessionPermanentState;
  session: GameSessionCommitInput;
  getProgressionBudgetBonus?: (step: ProgressionStep) => number;
}): CompletedGameSessionPlan | null {
  if (!isCompleteGameSession(session.results)) return null;

  const orderedResults = [...session.results].sort((left, right) => left.questionIndex - right.questionIndex);
  const totals = deriveGameSessionTotals(orderedResults, session.initialUptimeStreak);
  let careerXp = permanentState.careerXp;
  let reputation = permanentState.reputation;
  let budget = clampBudget(permanentState.budget);
  let rankingOutcomeStats = permanentState.rankingOutcomeStats;
  let categoryProgress = permanentState.categoryProgress;

  for (const result of orderedResults) {
    const previousCareerXp = careerXp;
    const previousReputation = reputation;
    const progression = calculateProgressionOutcome(
      previousCareerXp,
      previousReputation,
      result.careerXpDelta,
      result.reputationDelta,
    );
    careerXp = progression.careerXp;
    reputation = progression.reputation;
    budget += result.budgetDelta + result.milestoneBudgetDelta + getProgressionBudgetBonus({
      previousCareerXp,
      previousReputation,
      nextCareerXp: careerXp,
      nextReputation: reputation,
    });
    rankingOutcomeStats = recordRankingOutcome(rankingOutcomeStats, result.outcome);
    categoryProgress = recordCategoryAttempt(
      categoryProgress,
      session.categoryId,
      session.star,
      result.questionId,
      result.isCorrect,
      true,
    );
  }

  categoryProgress = addCategoryLeaderboardScore(
    categoryProgress,
    session.categoryId,
    session.star,
    totals.leaderboardDelta,
  );

  const completion = completeOperationSession(
    categoryProgress,
    session.categoryId,
    session.star,
    session.checkpointId,
    totals.reputationDelta,
  );

  return {
    totals,
    completion,
    permanentState: {
      careerXp,
      reputation,
      budget: clampBudget(budget),
      correctAnswers: permanentState.correctAnswers + totals.correctCount,
      wrongAnswers: permanentState.wrongAnswers + totals.wrongCount,
      completedSessions: permanentState.completedSessions + 1,
      rankingOutcomeStats,
      categoryProgress: completion.progress,
      uptimeStreak: totals.finalUptimeStreak,
    },
  };
}
