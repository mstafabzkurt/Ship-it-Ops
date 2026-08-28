import type { AvatarCosmeticId, AvatarFrameCosmeticId } from '../config/cosmetics';
import type { Rank } from '../config/progression';

export type RankingOutcome = 'success' | 'partial' | 'fail' | 'timeout';

export const RANKING_SCORE_BY_OUTCOME: Readonly<Record<RankingOutcome, number>> = {
  success: 100,
  partial: 50,
  fail: 0,
  timeout: 0,
};

export interface RankingOutcomeStats {
  successCount: number;
  partialCount: number;
  /**
   * Positive outcomes recorded before success/partial were stored separately.
   * Each receives the guaranteed minimum positive-outcome value of 50 points.
   */
  legacyPositiveCount: number;
}

export interface LocalRankingProfile {
  companyName: string;
  avatarId: AvatarCosmeticId;
  avatarFrameId: AvatarFrameCosmeticId;
  careerRank: Rank;
  rankingScore: number;
  successRate: number;
  successCount: number;
}

const normalizeCount = (value: unknown): number => (
  Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0
);

export function normalizeRankingOutcomeStats(
  value: unknown,
  legacyPositiveFallback = 0,
): RankingOutcomeStats {
  if (!value || typeof value !== 'object') {
    return {
      successCount: 0,
      partialCount: 0,
      legacyPositiveCount: normalizeCount(legacyPositiveFallback),
    };
  }

  const stored = value as Partial<Record<keyof RankingOutcomeStats, unknown>>;
  return {
    successCount: normalizeCount(stored.successCount),
    partialCount: normalizeCount(stored.partialCount),
    legacyPositiveCount: normalizeCount(stored.legacyPositiveCount),
  };
}

export function recordRankingOutcome(
  stats: RankingOutcomeStats,
  outcome: RankingOutcome,
): RankingOutcomeStats {
  if (outcome === 'success') {
    return { ...stats, successCount: stats.successCount + 1 };
  }
  if (outcome === 'partial') {
    return { ...stats, partialCount: stats.partialCount + 1 };
  }
  return stats;
}

export function calculateRankingScore(stats: RankingOutcomeStats): number {
  return (
    stats.successCount * RANKING_SCORE_BY_OUTCOME.success
    + stats.partialCount * RANKING_SCORE_BY_OUTCOME.partial
    + stats.legacyPositiveCount * RANKING_SCORE_BY_OUTCOME.partial
  );
}

/** Matches Profile: positive answers divided by all resolved answers. */
export function calculateSuccessRate(correctAnswers: number, wrongAnswers: number): number {
  const totalAnswers = correctAnswers + wrongAnswers;
  if (totalAnswers <= 0) return 0;
  return (correctAnswers / totalAnswers) * 100;
}

export function createLocalRankingProfile(input: LocalRankingProfile): LocalRankingProfile {
  return input;
}
