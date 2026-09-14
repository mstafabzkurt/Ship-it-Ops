import {
  DIFFICULTY_STARS,
  GAME_CATEGORIES,
  QUESTIONS_PER_TIER,
  type DifficultyStar,
  type GameCategoryId,
} from '../config/gameCategories';
import type { CategoryQuestionId } from './categoryQuestions';

export interface CategoryTierProgress {
  attemptedQuestionIds: CategoryQuestionId[];
  solvedCorrectQuestionIds: CategoryQuestionId[];
  leaderboardScore: number;
  correctCount: number;
  incorrectCount: number;
  operationCheckpoints: OperationCheckpoints;
}

export type CategoryProgress = Record<GameCategoryId, Record<DifficultyStar, CategoryTierProgress>>;

export type CategoryProgressReadInput = Partial<Record<
  GameCategoryId,
  Partial<Record<DifficultyStar, Partial<CategoryTierProgress>>>
>>;

export type OperationCheckpointId = 1 | 2;

export interface OperationCheckpointProgress {
  bestReputation: number;
  passed: boolean;
  /** Distinguishes a real zero/negative result from an untouched legacy checkpoint. */
  attempted: boolean;
  completedAt?: string;
}

export type OperationCheckpoints = Record<OperationCheckpointId, OperationCheckpointProgress>;

export interface OperationSessionCompletion {
  progress: CategoryProgress;
  checkpointId: OperationCheckpointId | null;
  target: number;
  netReputation: number;
  passed: boolean;
  passedCount: number;
  newlyUnlockedTier: DifficultyStar | null;
  masteryCompleted: boolean;
}

export const OPERATION_CHECKPOINT_IDS = [1, 2] as const satisfies readonly OperationCheckpointId[];

export const OPERATION_REPUTATION_TARGETS: Readonly<Record<DifficultyStar, number>> = {
  1: 40,
  2: 50,
  3: 60,
};

const createOperationCheckpoint = (): OperationCheckpointProgress => ({
  bestReputation: 0,
  passed: false,
  attempted: false,
});

const createOperationCheckpoints = (): OperationCheckpoints => ({
  1: createOperationCheckpoint(),
  2: createOperationCheckpoint(),
});

const createTierProgress = (): CategoryTierProgress => ({
  attemptedQuestionIds: [],
  solvedCorrectQuestionIds: [],
  leaderboardScore: 0,
  correctCount: 0,
  incorrectCount: 0,
  operationCheckpoints: createOperationCheckpoints(),
});

export function createDefaultCategoryProgress(): CategoryProgress {
  return Object.fromEntries(GAME_CATEGORIES.map((category) => [
    category.id,
    Object.fromEntries(DIFFICULTY_STARS.map((star) => [star, createTierProgress()])),
  ])) as CategoryProgress;
}

function normalizeIds(value: unknown): CategoryQuestionId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((id): CategoryQuestionId[] => {
    if (typeof id === 'number' && Number.isInteger(id) && id > 0) return [id];
    if (typeof id === 'string') {
      const normalized = id.trim();
      if (/^[a-zA-Z0-9_-]{1,128}$/.test(normalized)) return [normalized];
    }
    return [];
  }))].slice(0, 500);
}

function normalizeLeaderboardScore(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.trunc(parsed)));
}

function normalizeOperationCheckpoint(value: unknown, target: number): OperationCheckpointProgress {
  if (!value || typeof value !== 'object') return createOperationCheckpoint();
  const input = value as Record<string, unknown>;
  const parsedBest = Number(input.bestReputation);
  const hasStoredBest = Object.prototype.hasOwnProperty.call(input, 'bestReputation') && Number.isFinite(parsedBest);
  const hasAttemptedFlag = typeof input.attempted === 'boolean';
  const attempted = input.passed === true || input.attempted === true || (!hasAttemptedFlag && hasStoredBest);
  const passed = input.passed === true || (attempted && parsedBest >= target);
  const bestReputation = hasStoredBest
    ? Math.trunc(parsedBest)
    : passed
      ? target
      : 0;
  const completedAt = typeof input.completedAt === 'string' && !Number.isNaN(Date.parse(input.completedAt))
    ? input.completedAt
    : undefined;

  return {
    bestReputation,
    passed,
    attempted,
    ...(passed && completedAt ? { completedAt } : {}),
  };
}

function normalizeOperationCheckpoints(value: unknown, star: DifficultyStar): OperationCheckpoints {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const target = OPERATION_REPUTATION_TARGETS[star];
  return {
    1: normalizeOperationCheckpoint(input['1'], target),
    2: normalizeOperationCheckpoint(input['2'], target),
  };
}

export function normalizeCategoryProgress(value: unknown): CategoryProgress {
  const defaults = createDefaultCategoryProgress();
  if (!value || typeof value !== 'object') return defaults;
  const input = value as Record<string, unknown>;

  for (const category of GAME_CATEGORIES) {
    const categoryValue = input[category.id];
    if (!categoryValue || typeof categoryValue !== 'object') continue;
    for (const star of DIFFICULTY_STARS) {
      const tierValue = (categoryValue as Record<string, unknown>)[String(star)];
      if (!tierValue || typeof tierValue !== 'object') continue;
      const tier = tierValue as Record<string, unknown>;
      const attemptedQuestionIds = normalizeIds(tier.attemptedQuestionIds);
      defaults[category.id][star] = {
        attemptedQuestionIds,
        solvedCorrectQuestionIds: normalizeIds(tier.solvedCorrectQuestionIds),
        leaderboardScore: normalizeLeaderboardScore(tier.leaderboardScore),
        correctCount: Math.max(0, Math.trunc(Number(tier.correctCount) || 0)),
        incorrectCount: Math.max(0, Math.trunc(Number(tier.incorrectCount) || 0)),
        operationCheckpoints: normalizeOperationCheckpoints(tier.operationCheckpoints, star),
      };
    }
  }
  return defaults;
}

/** Returns a normalized copy for reads without mutating partial or legacy save data. */
export function getCategoryTierProgress(
  progress: CategoryProgressReadInput | null | undefined,
  categoryId: GameCategoryId,
  star: DifficultyStar,
): CategoryTierProgress {
  const tier = progress?.[categoryId]?.[star];
  if (!tier || typeof tier !== 'object') return createTierProgress();
  return {
    attemptedQuestionIds: normalizeIds(tier.attemptedQuestionIds),
    solvedCorrectQuestionIds: normalizeIds(tier.solvedCorrectQuestionIds),
    leaderboardScore: normalizeLeaderboardScore(tier.leaderboardScore),
    correctCount: Math.max(0, Math.trunc(Number(tier.correctCount) || 0)),
    incorrectCount: Math.max(0, Math.trunc(Number(tier.incorrectCount) || 0)),
    operationCheckpoints: normalizeOperationCheckpoints(tier.operationCheckpoints, star),
  };
}

export function getTierAttemptedCount(progress: CategoryProgressReadInput, categoryId: GameCategoryId, star: DifficultyStar): number {
  return Math.min(QUESTIONS_PER_TIER, getCategoryTierProgress(progress, categoryId, star).attemptedQuestionIds.length);
}

export function getCategoryAttemptedCount(progress: CategoryProgressReadInput, categoryId: GameCategoryId): number {
  return DIFFICULTY_STARS.reduce(
    (total, star) => total + getTierAttemptedCount(progress, categoryId, star),
    0,
  );
}

export function isTierUnlocked(progress: CategoryProgressReadInput, categoryId: GameCategoryId, star: DifficultyStar): boolean {
  if (star === 1) return true;
  return getPassedOperationCount(progress, categoryId, (star - 1) as DifficultyStar) === OPERATION_CHECKPOINT_IDS.length;
}

export function getOperationReputationTarget(star: DifficultyStar): number {
  return OPERATION_REPUTATION_TARGETS[star];
}

export function getPassedOperationCount(
  progress: CategoryProgressReadInput,
  categoryId: GameCategoryId,
  star: DifficultyStar,
): number {
  const checkpoints = getCategoryTierProgress(progress, categoryId, star).operationCheckpoints;
  return OPERATION_CHECKPOINT_IDS.filter((checkpointId) => checkpoints[checkpointId].passed).length;
}

export function getCategoryPassedOperationCount(progress: CategoryProgressReadInput, categoryId: GameCategoryId): number {
  return DIFFICULTY_STARS.reduce(
    (total, star) => total + getPassedOperationCount(progress, categoryId, star),
    0,
  );
}

export function getTotalPassedOperationCount(progress: CategoryProgressReadInput): number {
  return GAME_CATEGORIES.reduce(
    (total, category) => total + getCategoryPassedOperationCount(progress, category.id),
    0,
  );
}

export function getCurrentOperationCheckpoint(
  progress: CategoryProgressReadInput,
  categoryId: GameCategoryId,
  star: DifficultyStar,
): OperationCheckpointId | null {
  const checkpoints = getCategoryTierProgress(progress, categoryId, star).operationCheckpoints;
  return OPERATION_CHECKPOINT_IDS.find((checkpointId) => !checkpoints[checkpointId].passed) ?? null;
}

/** Text keeps the raw value while this visual ratio deliberately clamps below zero and above target. */
export function getOperationReputationProgress(netReputation: number, target: number): number {
  if (!Number.isFinite(netReputation) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, Math.min(1, netReputation / target));
}

export function formatSignedReputation(value: number): string {
  const normalized = Math.trunc(Number.isFinite(value) ? value : 0);
  return normalized > 0 ? `+${normalized}` : String(normalized);
}

export function completeOperationSession(
  progress: CategoryProgress,
  categoryId: GameCategoryId,
  star: DifficultyStar,
  checkpointId: OperationCheckpointId | null,
  netReputation: number,
  completedAt = new Date().toISOString(),
): OperationSessionCompletion {
  const normalized = normalizeCategoryProgress(progress);
  const target = getOperationReputationTarget(star);
  const normalizedNet = Math.trunc(Number.isFinite(netReputation) ? netReputation : 0);
  const wasNextTierUnlocked = star < 3
    ? isTierUnlocked(normalized, categoryId, (star + 1) as DifficultyStar)
    : false;

  if (checkpointId !== null) {
    const current = normalized[categoryId][star].operationCheckpoints[checkpointId];
    const bestReputation = current.attempted
      ? Math.max(current.bestReputation, normalizedNet)
      : normalizedNet;
    const passed = current.passed || bestReputation >= target;
    normalized[categoryId][star].operationCheckpoints[checkpointId] = {
      bestReputation,
      passed,
      attempted: true,
      ...(passed ? { completedAt: current.completedAt ?? completedAt } : {}),
    };
  }

  const passedCount = getPassedOperationCount(normalized, categoryId, star);
  const nextTierUnlocked = star < 3
    ? isTierUnlocked(normalized, categoryId, (star + 1) as DifficultyStar)
    : false;

  return {
    progress: normalized,
    checkpointId,
    target,
    netReputation: normalizedNet,
    passed: normalizedNet >= target,
    passedCount,
    newlyUnlockedTier: star < 3 && !wasNextTierUnlocked && nextTierUnlocked
      ? (star + 1) as DifficultyStar
      : null,
    masteryCompleted: star === 3 && passedCount === OPERATION_CHECKPOINT_IDS.length,
  };
}

export function recordCategoryAttempt(
  progress: CategoryProgress,
  categoryId: GameCategoryId,
  star: DifficultyStar,
  questionId: CategoryQuestionId,
  correct: boolean,
  completedSession = false,
): CategoryProgress {
  const normalized = normalizeCategoryProgress(progress);
  const current = normalized[categoryId][star];
  const alreadyAttempted = current.attemptedQuestionIds.includes(questionId);
  const alreadySolved = current.solvedCorrectQuestionIds.includes(questionId);
  return {
    ...normalized,
    [categoryId]: {
      ...normalized[categoryId],
      [star]: {
        attemptedQuestionIds: alreadyAttempted
          ? current.attemptedQuestionIds
          : [...current.attemptedQuestionIds, questionId],
        solvedCorrectQuestionIds: completedSession && correct && !alreadySolved
          ? [...current.solvedCorrectQuestionIds, questionId]
          : current.solvedCorrectQuestionIds,
        leaderboardScore: current.leaderboardScore,
        correctCount: current.correctCount + (correct ? 1 : 0),
        incorrectCount: current.incorrectCount + (correct ? 0 : 1),
        operationCheckpoints: current.operationCheckpoints,
      },
    },
  };
}

export function addCategoryLeaderboardScore(
  progress: CategoryProgress,
  categoryId: GameCategoryId,
  star: DifficultyStar,
  scoreDelta: number,
): CategoryProgress {
  const normalized = normalizeCategoryProgress(progress);
  const current = normalized[categoryId][star];
  const safeDelta = Math.max(0, Math.trunc(Number.isFinite(scoreDelta) ? scoreDelta : 0));
  return {
    ...normalized,
    [categoryId]: {
      ...normalized[categoryId],
      [star]: {
        ...current,
        leaderboardScore: Math.min(Number.MAX_SAFE_INTEGER, current.leaderboardScore + safeDelta),
      },
    },
  };
}

export function getTotalCategoryLeaderboardScore(progress: CategoryProgressReadInput): number {
  const total = GAME_CATEGORIES.reduce((categoryTotal, category) => (
    categoryTotal + DIFFICULTY_STARS.reduce((tierTotal, star) => (
      tierTotal + getCategoryTierProgress(progress, category.id, star).leaderboardScore
    ), 0)
  ), 0);
  return Math.min(Number.MAX_SAFE_INTEGER, total);
}

export function hasStoredCategoryLeaderboardScore(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const stored = value as Record<string, unknown>;
  return GAME_CATEGORIES.some((category) => {
    const categoryValue = stored[category.id];
    if (!categoryValue || typeof categoryValue !== 'object') return false;
    return DIFFICULTY_STARS.some((star) => {
      const tierValue = (categoryValue as Record<string, unknown>)[String(star)];
      return Boolean(
        tierValue
        && typeof tierValue === 'object'
        && Object.prototype.hasOwnProperty.call(tierValue, 'leaderboardScore'),
      );
    });
  });
}

/** Keeps the question visible as attempted while removing a reverted answer result. */
export function revertCategoryAttemptOutcome(
  progress: CategoryProgress,
  categoryId: GameCategoryId,
  star: DifficultyStar,
  correct: boolean,
): CategoryProgress {
  const normalized = normalizeCategoryProgress(progress);
  const current = normalized[categoryId][star];
  return {
    ...normalized,
    [categoryId]: {
      ...normalized[categoryId],
      [star]: {
        ...current,
        correctCount: Math.max(0, current.correctCount - (correct ? 1 : 0)),
        incorrectCount: Math.max(0, current.incorrectCount - (correct ? 0 : 1)),
      },
    },
  };
}

export function selectCategoryQuestion<T extends { id: CategoryQuestionId }>(
  pool: T[],
  sessionQuestionIds: CategoryQuestionId[],
  solvedCorrectQuestionIds: CategoryQuestionId[],
  random: () => number = Math.random,
): T | null {
  const sessionUnused = pool.filter((question) => !sessionQuestionIds.includes(question.id));
  if (sessionUnused.length === 0) return null;
  const notSolvedCorrectly = sessionUnused.filter((question) => !solvedCorrectQuestionIds.includes(question.id));
  const candidates = notSolvedCorrectly.length > 0 ? notSolvedCorrectly : sessionUnused;
  return candidates[Math.floor(Math.max(0, Math.min(0.999999, random())) * candidates.length)] ?? null;
}
