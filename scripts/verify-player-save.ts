import {
  LEGACY_SAVE_CLAIM_KEY,
  PLAYER_SAVE_VERSION,
  buildLegacyPlayerSave,
  buildPlayerSaveSnapshot,
  canUseLegacySave,
  createAccountSaveCacheKey,
  createDefaultPlayerSave,
  normalizePlayerSaveForCurrentWeek,
  type LegacySaveClaim,
} from '../src/utils/playerSave';

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) throw new Error(`${label}: ${String(expected)} beklenirken ${String(actual)} alındı.`);
}

const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
assertEqual(createAccountSaveCacheKey(userA), `@shipit_account_save:${userA}`, 'Hesap cache anahtarı');
assertEqual(LEGACY_SAVE_CLAIM_KEY, '@shipit_legacy_save_claim_v1', 'Legacy claim anahtarı');

const claim: LegacySaveClaim = { userId: userA, migrationVersion: PLAYER_SAVE_VERSION, claimedAt: '2026-08-29T00:00:00.000Z' };
assertEqual(canUseLegacySave(null, userA), true, 'İlk hesap legacy save kullanabilir');
assertEqual(canUseLegacySave(claim, userA), true, 'Claim sahibi retry yapabilir');
assertEqual(canUseLegacySave(claim, userB), false, 'İkinci hesap legacy save kullanamaz');

const legacy = buildLegacyPlayerSave({
  '@shipit_score': '5000',
  '@shipit_career_xp': '5100',
  '@shipit_budget': '20000',
  '@shipit_company_name': '  Operasyon A  ',
  '@shipit_lifeline_inventory': JSON.stringify({ codeReview: 7, gitRevert: 2, serverScaleUp: 4, snapshotBackup: 1 }),
  '@shipit_cosmetic_inventory': JSON.stringify(['avatar_default', 'avatar_terminal', 'avatar_frame_default']),
  '@shipit_equipped_avatar': 'avatar_terminal',
  '@shipit_equipped_avatar_frame': 'avatar_frame_default',
  '@shipit_correct_answers': '12',
  '@shipit_wrong_answers': '3',
  '@shipit_ranking_outcome_stats': JSON.stringify({ successCount: 8, partialCount: 4, failCount: 2, timeoutCount: 1, legacyPositiveCount: 0 }),
  '@shipit_seen_ids': JSON.stringify([1, 2, 3]),
  '@shipit_inventory': JSON.stringify(['theme_terminal']),
  '@shipit_streak_days': JSON.stringify([true, false, false, false, false, false, false]),
  '@shipit_streak_last_date': '2026-08-24',
});
assertEqual(legacy.reputation, 5000, 'Legacy İtibar korunur');
assertEqual(legacy.careerXp, 5100, 'Legacy Kariyer XP korunur');
assertEqual(legacy.companyBudget, 20000, 'Legacy bütçe korunur');
assertEqual(legacy.companyName, 'Operasyon A', 'Şirket adı normalize edilir');
assertEqual(legacy.jokerInventory.codeReview, 7, 'Joker envanteri korunur');
assertEqual(legacy.equippedAvatarId, 'avatar_terminal', 'Avatar seçimi korunur');
assertEqual(legacy.rankingOutcomeStats.failCount, 2, 'Fail sayısı korunur');
assertEqual(legacy.rankingOutcomeStats.timeoutCount, 1, 'Timeout sayısı korunur');

const snapshot = buildPlayerSaveSnapshot({ ...createDefaultPlayerSave(), companyBudget: -20, careerXp: 12.8 });
assertEqual(snapshot.companyBudget, 0, 'Negatif bütçe normalize edilir');
assertEqual(snapshot.careerXp, 12, 'Kariyer XP tam sayıya normalize edilir');

const expiredStreak = normalizePlayerSaveForCurrentWeek(legacy, new Date('2026-09-02T12:00:00'));
assertEqual(expiredStreak.streakLastDate, null, 'Eski hafta streak tarihi temizlenir');
assertEqual(expiredStreak.streakDays.some(Boolean), false, 'Eski hafta streak günleri temizlenir');

console.log('Player save checks passed.');
