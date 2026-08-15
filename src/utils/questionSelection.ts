import type { RankTier } from '../config/progression';

export type QuestionDifficulty = 'junior' | 'mid' | 'senior';

export interface RankedQuestion {
  id: number;
  rank_level?: number | null;
}

const DIFFICULTY_WEIGHTS: Record<'junior' | 'engineer' | 'seniorPlus', Record<QuestionDifficulty, number>> = {
  junior: { junior: 7, mid: 3, senior: 1 },
  engineer: { junior: 3, mid: 5, senior: 2 },
  seniorPlus: { junior: 1, mid: 4, senior: 6 },
};

export function getQuestionDifficulty(rankLevel?: number | null): QuestionDifficulty {
  if (typeof rankLevel !== 'number' || !Number.isFinite(rankLevel)) return 'mid';
  if (rankLevel <= 2) return 'junior';
  if (rankLevel <= 4) return 'mid';
  return 'senior';
}

function getCareerWeightGroup(tier: RankTier): keyof typeof DIFFICULTY_WEIGHTS {
  if (tier === 'junior') return 'junior';
  if (tier === 'engineer') return 'engineer';
  return 'seniorPlus';
}

export function appendRecentQuestionId(history: number[], id: number, limit: number): number[] {
  const withoutDuplicate = history.filter((questionId) => questionId !== id);
  return [...withoutDuplicate, id].slice(-Math.max(1, limit));
}

/**
 * Selects from unused session questions first, then avoids recent history when
 * alternatives exist. Reuse is allowed only when the filtered pool is empty.
 */
export function selectNextQuestion<T extends RankedQuestion>(
  pool: T[],
  sessionQuestionIds: number[],
  recentQuestionIds: number[],
  careerTier: RankTier,
  random: () => number = Math.random,
): T | null {
  if (pool.length === 0) return null;

  const sessionUnused = pool.filter((question) => !sessionQuestionIds.includes(question.id));
  let candidates = sessionUnused.length > 0 ? sessionUnused : pool;
  const notRecent = candidates.filter((question) => !recentQuestionIds.includes(question.id));
  if (notRecent.length > 0) candidates = notRecent;

  const weights = DIFFICULTY_WEIGHTS[getCareerWeightGroup(careerTier)];
  const weightedCandidates = candidates.map((question) => ({
    question,
    weight: weights[getQuestionDifficulty(question.rank_level)],
  }));
  const totalWeight = weightedCandidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let cursor = Math.max(0, Math.min(0.999999999, random())) * totalWeight;

  for (const candidate of weightedCandidates) {
    cursor -= candidate.weight;
    if (cursor < 0) return candidate.question;
  }
  return weightedCandidates[weightedCandidates.length - 1]?.question ?? null;
}
