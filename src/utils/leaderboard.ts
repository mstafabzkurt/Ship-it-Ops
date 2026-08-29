import type { AvatarCosmeticId, AvatarFrameCosmeticId } from '../config/cosmetics';
import { normalizeCompanyName } from '../config/company';
import type { Rank } from '../config/progression';
import {
  calculateRankingScore,
  calculateSuccessRate,
  type RankingOutcomeStats,
} from './ranking';

export interface LeaderboardProjectionInput {
  companyName: string;
  avatarId: AvatarCosmeticId;
  avatarFrameId: AvatarFrameCosmeticId;
  careerRank: Rank;
  correctAnswers: number;
  wrongAnswers: number;
  rankingOutcomeStats: RankingOutcomeStats;
}

export interface LeaderboardProjection {
  companyName: string;
  avatarId: AvatarCosmeticId;
  avatarFrameId: AvatarFrameCosmeticId;
  careerRank: string;
  rankingScore: number;
  successRate: number;
  successCount: number;
}

const normalizeCount = (value: number): number => (
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
);

export function buildLeaderboardProjection(
  input: LeaderboardProjectionInput,
): LeaderboardProjection {
  const successRate = calculateSuccessRate(
    normalizeCount(input.correctAnswers),
    normalizeCount(input.wrongAnswers),
  );

  return {
    companyName: normalizeCompanyName(input.companyName),
    avatarId: input.avatarId,
    avatarFrameId: input.avatarFrameId,
    careerRank: input.careerRank.name.trim().slice(0, 80),
    // These values always come from the canonical local ranking helpers.
    // A server-authoritative outcome ledger is a future anti-cheat hardening step.
    rankingScore: calculateRankingScore(input.rankingOutcomeStats),
    successRate: Number(Math.min(100, Math.max(0, successRate)).toFixed(2)),
    successCount: normalizeCount(input.rankingOutcomeStats.successCount),
  };
}
