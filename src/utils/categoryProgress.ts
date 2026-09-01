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
  correctCount: number;
  incorrectCount: number;
  operationCheckpoints: OperationCheckpoints;
}

export type CategoryProgress = Record<GameCategoryId, Record<DifficultyStar, CategoryTierProgress>>;

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
        correctCount: Math.max(0, Math.trunc(Number(tier.correctCount) || 0)),
        incorrectCount: Math.max(0, Math.trunc(Number(tier.incorrectCount) || 0)),
        operationCheckpoints: normalizeOperationCheckpoints(tier.operationCheckpoints, star),
      };
    }
  }
  return defaults;
}

export function getTierAttemptedCount(progress: CategoryProgress, categoryId: GameCategoryId, star: DifficultyStar): number {
  return Math.min(QUESTIONS_PER_TIER, progress[categoryId][star].attemptedQuestionIds.length);
}

export function getCategoryAttemptedCount(progress: CategoryProgress, categoryId: GameCategoryId): number {
  return DIFFICULTY_STARS.reduce(
    (total, star) => total + getTierAttemptedCount(progress, categoryId, star),
    0,
  );
}

export function isTierUnlocked(progress: CategoryProgress, categoryId: GameCategoryId, star: DifficultyStar): boolean {
  if (star === 1) return true;
  return getPassedOperationCount(progress, categoryId, (star - 1) as DifficultyStar) === OPERATION_CHECKPOINT_IDS.length;
}

export function getOperationReputationTarget(star: DifficultyStar): number {
  return OPERATION_REPUTATION_TARGETS[star];
}

export function getPassedOperationCount(
  progress: CategoryProgress,
  categoryId: GameCategoryId,
  star: DifficultyStar,
): number {
  const checkpoints = progress[categoryId][star].operationCheckpoints;
  return OPERATION_CHECKPOINT_IDS.filter((checkpointId) => checkpoints[checkpointId].passed).length;
}

export function getCategoryPassedOperationCount(progress: CategoryProgress, categoryId: GameCategoryId): number {
  return DIFFICULTY_STARS.reduce(
    (total, star) => total + getPassedOperationCount(progress, categoryId, star),
    0,
  );
}

export function getTotalPassedOperationCount(progress: CategoryProgress): number {
  return GAME_CATEGORIES.reduce(
    (total, category) => total + getCategoryPassedOperationCount(progress, category.id),
    0,
  );
}

export function getCurrentOperationCheckpoint(
  progress: CategoryProgress,
  categoryId: GameCategoryId,
  star: DifficultyStar,
): OperationCheckpointId | null {
  const checkpoints = progress[categoryId][star].operationCheckpoints;
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
): CategoryProgress {
  const normalized = normalizeCategoryProgress(progress);
  const current = normalized[categoryId][star];
  const alreadyAttempted = current.attemptedQuestionIds.includes(questionId);
  return {
    ...normalized,
    [categoryId]: {
      ...normalized[categoryId],
      [star]: {
        attemptedQuestionIds: alreadyAttempted
          ? current.attemptedQuestionIds
          : [...current.attemptedQuestionIds, questionId],
        correctCount: current.correctCount + (correct ? 1 : 0),
        incorrectCount: current.incorrectCount + (correct ? 0 : 1),
        operationCheckpoints: current.operationCheckpoints,
      },
    },
  };
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
  attemptedQuestionIds: CategoryQuestionId[],
  random: () => number = Math.random,
): T | null {
  const sessionUnused = pool.filter((question) => !sessionQuestionIds.includes(question.id));
  if (sessionUnused.length === 0) return null;
  const unseen = sessionUnused.filter((question) => !attemptedQuestionIds.includes(question.id));
  const candidates = unseen.length > 0 ? unseen : sessionUnused;
  return candidates[Math.floor(Math.max(0, Math.min(0.999999, random())) * candidates.length)] ?? null;
}
