import { MAX_COMPANY_NAME_LENGTH } from '../src/config/company';
import { buildLeaderboardProjection } from '../src/utils/leaderboard';
import {
  calculateRankingScore,
  recordRankingOutcome,
  type RankingOutcomeStats,
} from '../src/utils/ranking';

const rank = { id: 'engineer-i', name: 'Mühendis I', threshold: 800, tier: 'engineer' } as const;

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: ${String(expected)} beklenirken ${String(actual)} alındı.`);
  }
}

function createProjection(stats: RankingOutcomeStats, correctAnswers = 0, wrongAnswers = 0) {
  return buildLeaderboardProjection({
    companyName: '  Test Operasyon  ',
    avatarId: 'avatar_default',
    avatarFrameId: 'avatar_frame_default',
    careerRank: rank,
    correctAnswers,
    wrongAnswers,
    rankingScore: calculateRankingScore(stats),
    rankingOutcomeStats: stats,
  });
}

const tenSuccess = createProjection({ successCount: 10, partialCount: 0, failCount: 0, timeoutCount: 0, legacyPositiveCount: 0 });
assertEqual(tenSuccess.rankingScore, 1000, '10 Success puanı');

const mixed = createProjection({ successCount: 5, partialCount: 5, failCount: 0, timeoutCount: 0, legacyPositiveCount: 0 });
assertEqual(mixed.rankingScore, 750, '5 Success + 5 Partial puanı');

const emptyStats: RankingOutcomeStats = { successCount: 0, partialCount: 0, failCount: 0, timeoutCount: 0, legacyPositiveCount: 0 };
const afterFail = recordRankingOutcome(emptyStats, 'fail');
const afterTimeout = recordRankingOutcome(afterFail, 'timeout');
assertEqual(calculateRankingScore(afterTimeout), 0, 'Fail/Timeout puanı');
assertEqual(afterTimeout.failCount, 1, 'Fail telemetrisi');
assertEqual(afterTimeout.timeoutCount, 1, 'Timeout telemetrisi');

const profileRate = createProjection(emptyStats, 5, 5);
assertEqual(profileRate.successRate, 50, 'Profile uyumlu başarı oranı');
assertEqual(tenSuccess.companyName, 'Test Operasyon', 'Şirket adı trim');

const longCompany = buildLeaderboardProjection({
  companyName: 'A'.repeat(MAX_COMPANY_NAME_LENGTH + 20),
  avatarId: 'avatar_default',
  avatarFrameId: 'avatar_frame_default',
  careerRank: rank,
  correctAnswers: 0,
  wrongAnswers: 0,
  rankingScore: 0,
  rankingOutcomeStats: emptyStats,
});
assertEqual(longCompany.companyName.length, MAX_COMPANY_NAME_LENGTH, 'Şirket adı üst sınırı');

console.log('Leaderboard projection checks passed.');
