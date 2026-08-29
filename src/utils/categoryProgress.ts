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
}

export type CategoryProgress = Record<GameCategoryId, Record<DifficultyStar, CategoryTierProgress>>;

const createTierProgress = (): CategoryTierProgress => ({
  attemptedQuestionIds: [],
  correctCount: 0,
  incorrectCount: 0,
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
      };
    }
  }
  return defaults;
}

export function getTierAttemptedCount(progress: CategoryProgress, categoryId: GameCategoryId, star: DifficultyStar): number {
  return Math.min(QUESTIONS_PER_TIER, progress[categoryId][star].attemptedQuestionIds.length);
}

export function isTierUnlocked(progress: CategoryProgress, categoryId: GameCategoryId, star: DifficultyStar): boolean {
  if (star === 1) return true;
  return getTierAttemptedCount(progress, categoryId, (star - 1) as DifficultyStar) >= QUESTIONS_PER_TIER;
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
