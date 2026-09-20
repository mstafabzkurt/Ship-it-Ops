import {
  DEFAULT_AVATAR_FRAME_ID,
  DEFAULT_AVATAR_ID,
  DEFAULT_OWNED_COSMETIC_IDS,
  normalizeCosmeticPlayerState,
  type AvatarCosmeticId,
  type AvatarFrameCosmeticId,
  type CosmeticId,
} from '../config/cosmetics';
import { DEFAULT_COMPANY_NAME, normalizeCompanyName } from '../config/company';
import { ACHIEVEMENTS, type AchievementId } from '../config/achievements';
import type { JokerInventory } from '../config/jokerEconomy';
import { RECENT_QUESTION_HISTORY_LIMIT } from '../config/progression';
import { appendRecentQuestionId } from './questionSelection';
import { calculateRankingScore, normalizeRankingOutcomeStats, type RankingOutcomeStats } from './ranking';
import {
  addCategoryLeaderboardScore,
  createDefaultCategoryProgress,
  hasStoredCategoryLeaderboardScore,
  normalizeCategoryProgress,
  type CategoryProgress,
} from './categoryProgress';
import { normalizeInterestAreas, type InterestAreaId } from './onboarding';
import { deriveAchievements } from './achievements';

export const PLAYER_SAVE_VERSION = 5;
const DEFAULT_PLAYER_BUDGET = 1_000;
export const LEGACY_SAVE_CLAIM_VERSION = 1;
export const PLAYER_SAVE_CACHE_PREFIX = '@shipit_account_save:';
export const LEGACY_SAVE_CLAIM_KEY = '@shipit_legacy_save_claim_v1';

export const LEGACY_PROGRESSION_KEYS = {
  reputation: '@shipit_score',
  careerXp: '@shipit_career_xp',
  companyBudget: '@shipit_budget',
  companyName: '@shipit_company_name',
  ownedItemIds: '@shipit_inventory',
  jokerInventory: '@shipit_lifeline_inventory',
  ownedCosmeticIds: '@shipit_cosmetic_inventory',
  equippedAvatarId: '@shipit_equipped_avatar',
  equippedAvatarFrameId: '@shipit_equipped_avatar_frame',
  streakDays: '@shipit_streak_days',
  streakLastDate: '@shipit_streak_last_date',
  recentQuestionIds: '@shipit_seen_ids',
  correctAnswers: '@shipit_correct_answers',
  wrongAnswers: '@shipit_wrong_answers',
  rankingOutcomeStats: '@shipit_ranking_outcome_stats',
} as const;

export interface PlayerSaveSnapshot {
  saveVersion: number;
  careerXp: number;
  reputation: number;
  companyBudget: number;
  companyName: string;
  correctAnswers: number;
  wrongAnswers: number;
  completedSessions: number;
  rankingOutcomeStats: RankingOutcomeStats;
  jokerInventory: JokerInventory;
  ownedItemIds: string[];
  ownedCosmeticIds: CosmeticId[];
  equippedAvatarId: AvatarCosmeticId;
  equippedAvatarFrameId: AvatarFrameCosmeticId;
  streakDays: boolean[];
  streakLastDate: string | null;
  recentQuestionIds: number[];
  categoryProgress: CategoryProgress;
  onboardingCompleted: boolean;
  tutorialCompleted: boolean;
  selectedInterestAreas: InterestAreaId[];
  claimedBadgeRewardIds: AchievementId[];
  unseenBadgeIds: AchievementId[];
}

export interface LegacySaveClaim {
  userId: string;
  migrationVersion: number;
  claimedAt: string;
}

export const createDefaultJokerInventory = (): JokerInventory => ({
  codeReview: 3,
  gitRevert: 3,
  serverScaleUp: 3,
  snapshotBackup: 3,
});

const normalizeNonNegativeInteger = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(2_147_483_647, Math.max(0, Math.trunc(parsed)));
};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
};

const normalizeStringIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => (
    typeof item === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(item)
  )))].slice(0, 256);
};

const ACHIEVEMENT_ID_SET = new Set<string>(ACHIEVEMENTS.map((achievement) => achievement.id));

const normalizeAchievementIds = (value: unknown): AchievementId[] => (
  normalizeStringIds(value).filter((id): id is AchievementId => ACHIEVEMENT_ID_SET.has(id))
);

export const normalizeJokerInventory = (value: unknown): JokerInventory => {
  const defaults = createDefaultJokerInventory();
  if (!value || typeof value !== 'object') return defaults;
  const stored = value as Partial<Record<keyof JokerInventory, unknown>>;
  return {
    codeReview: normalizeNonNegativeInteger(stored.codeReview, defaults.codeReview),
    gitRevert: normalizeNonNegativeInteger(stored.gitRevert, defaults.gitRevert),
    serverScaleUp: normalizeNonNegativeInteger(stored.serverScaleUp, defaults.serverScaleUp),
    snapshotBackup: normalizeNonNegativeInteger(stored.snapshotBackup, defaults.snapshotBackup),
  };
};

const normalizeStreakDays = (value: unknown): boolean[] => {
  if (!Array.isArray(value)) return [false, false, false, false, false, false, false];
  return Array.from({ length: 7 }, (_, index) => value[index] === true);
};

const normalizeDate = (value: unknown): string | null => (
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
);

const normalizeRecentQuestionIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<number[]>((history, id) => (
    Number.isInteger(id)
      ? appendRecentQuestionId(history, Number(id), RECENT_QUESTION_HISTORY_LIMIT)
      : history
  ), []);
};

export function createDefaultPlayerSave(): PlayerSaveSnapshot {
  return {
    saveVersion: PLAYER_SAVE_VERSION,
    careerXp: 0,
    reputation: 0,
    companyBudget: DEFAULT_PLAYER_BUDGET,
    companyName: DEFAULT_COMPANY_NAME,
    correctAnswers: 0,
    wrongAnswers: 0,
    completedSessions: 0,
    rankingOutcomeStats: normalizeRankingOutcomeStats(null),
    jokerInventory: createDefaultJokerInventory(),
    ownedItemIds: [],
    ownedCosmeticIds: [...DEFAULT_OWNED_COSMETIC_IDS],
    equippedAvatarId: DEFAULT_AVATAR_ID,
    equippedAvatarFrameId: DEFAULT_AVATAR_FRAME_ID,
    streakDays: [false, false, false, false, false, false, false],
    streakLastDate: null,
    recentQuestionIds: [],
    categoryProgress: createDefaultCategoryProgress(),
    onboardingCompleted: false,
    tutorialCompleted: false,
    selectedInterestAreas: [],
    claimedBadgeRewardIds: [],
    unseenBadgeIds: [],
  };
}

export function hasMeaningfulPlayerProgress(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const input = value as Partial<Record<keyof PlayerSaveSnapshot, unknown>>;
  const companyName = normalizeCompanyName(input.companyName);
  const categoryProgress = normalizeCategoryProgress(input.categoryProgress);
  const hasCategoryActivity = Object.values(categoryProgress).some((tiers) => (
    Object.values(tiers).some((tier) => (
      tier.attemptedQuestionIds.length > 0
      || tier.solvedCorrectQuestionIds.length > 0
      || tier.leaderboardScore > 0
      || tier.correctCount > 0
      || tier.incorrectCount > 0
      || Object.values(tier.operationCheckpoints).some((checkpoint) => checkpoint.attempted)
    ))
  ));
  const cosmeticState = normalizeCosmeticPlayerState(
    input.ownedCosmeticIds,
    input.equippedAvatarId,
    input.equippedAvatarFrameId,
  );
  const rankingStats = normalizeRankingOutcomeStats(input.rankingOutcomeStats);

  return companyName !== DEFAULT_COMPANY_NAME
    || normalizeNonNegativeInteger(input.careerXp) > 0
    || normalizeNonNegativeInteger(input.reputation) > 0
    || normalizeNonNegativeInteger(input.correctAnswers) > 0
    || normalizeNonNegativeInteger(input.wrongAnswers) > 0
    || normalizeNonNegativeInteger(input.completedSessions) > 0
    || normalizeNonNegativeInteger(input.companyBudget, DEFAULT_PLAYER_BUDGET) !== DEFAULT_PLAYER_BUDGET
    || Object.values(rankingStats).some((count) => count > 0)
    || normalizeStringIds(input.ownedItemIds).length > 0
    || cosmeticState.ownedCosmeticIds.length > DEFAULT_OWNED_COSMETIC_IDS.length
    || normalizeRecentQuestionIds(input.recentQuestionIds).length > 0
    || normalizeStreakDays(input.streakDays).some(Boolean)
    || hasCategoryActivity;
}

export function normalizePlayerSave(value: unknown): PlayerSaveSnapshot {
  const defaults = createDefaultPlayerSave();
  const input = value && typeof value === 'object'
    ? value as Partial<Record<keyof PlayerSaveSnapshot, unknown>>
    : {};
  const correctAnswers = normalizeNonNegativeInteger(input.correctAnswers);
  const careerXp = normalizeNonNegativeInteger(input.careerXp);
  const wrongAnswers = normalizeNonNegativeInteger(input.wrongAnswers);
  const storedVersion = Number(input.saveVersion);
  const completedSessions = Number.isFinite(storedVersion) && storedVersion >= 5
    ? normalizeNonNegativeInteger(input.completedSessions)
    : Math.floor((correctAnswers + wrongAnswers) / 10);
  const rankingOutcomeStats = normalizeRankingOutcomeStats(input.rankingOutcomeStats, correctAnswers);
  let categoryProgress = normalizeCategoryProgress(input.categoryProgress);
  // Saves created before repeat-aware scoring have no category leaderboard
  // totals. Preserve their historical all-time score once, then accumulate
  // every future completed-session delta in the existing JSON progress field.
  if (!hasStoredCategoryLeaderboardScore(input.categoryProgress)) {
    categoryProgress = addCategoryLeaderboardScore(
      categoryProgress,
      'web_programming',
      1,
      calculateRankingScore(rankingOutcomeStats),
    );
  }
  const cosmeticState = normalizeCosmeticPlayerState(
    input.ownedCosmeticIds,
    input.equippedAvatarId,
    input.equippedAvatarFrameId,
  );
  // Rows created before save v3 received false defaults when the columns were
  // added. Meaningful progress is a compatibility signal only for those rows;
  // otherwise a new player who postpones the tutorial by entering a game could
  // be mistaken for an established player after completing that first session.
  const predatesOnboardingSchema = !Number.isFinite(storedVersion) || storedVersion < 3;
  const predatesBadgeRewardSchema = !Number.isFinite(storedVersion) || storedVersion < 4;
  const legacyPlayer = predatesOnboardingSchema && hasMeaningfulPlayerProgress(input);
  // Existing v1-v3 players keep their historical economy unchanged. Badges
  // already earned from their persisted progression become claimed silently,
  // while badges earned after this migration receive the new reward once.
  const claimedBadgeRewardIds = predatesBadgeRewardSchema
    ? deriveAchievements({ careerXp, correctAnswers, wrongAnswers, categoryProgress })
      .filter((badge) => badge.earned)
      .map((badge) => badge.id)
    : normalizeAchievementIds(input.claimedBadgeRewardIds);
  const unseenBadgeIds = predatesBadgeRewardSchema
    ? []
    : normalizeAchievementIds(input.unseenBadgeIds)
      .filter((id) => claimedBadgeRewardIds.includes(id));

  return {
    saveVersion: PLAYER_SAVE_VERSION,
    careerXp,
    reputation: normalizeNonNegativeInteger(input.reputation),
    companyBudget: normalizeNonNegativeInteger(input.companyBudget, defaults.companyBudget),
    companyName: normalizeCompanyName(input.companyName),
    correctAnswers,
    wrongAnswers,
    completedSessions,
    rankingOutcomeStats,
    jokerInventory: normalizeJokerInventory(input.jokerInventory),
    ownedItemIds: normalizeStringIds(input.ownedItemIds),
    ownedCosmeticIds: cosmeticState.ownedCosmeticIds,
    equippedAvatarId: cosmeticState.equippedAvatarId,
    equippedAvatarFrameId: cosmeticState.equippedAvatarFrameId,
    streakDays: normalizeStreakDays(input.streakDays),
    streakLastDate: normalizeDate(input.streakLastDate),
    recentQuestionIds: normalizeRecentQuestionIds(input.recentQuestionIds),
    categoryProgress,
    onboardingCompleted: input.onboardingCompleted === true || legacyPlayer,
    tutorialCompleted: input.tutorialCompleted === true || legacyPlayer,
    selectedInterestAreas: normalizeInterestAreas(input.selectedInterestAreas),
    claimedBadgeRewardIds,
    unseenBadgeIds,
  };
}

export const buildPlayerSaveSnapshot = normalizePlayerSave;

export function normalizePlayerSaveForCurrentWeek(
  value: unknown,
  now = new Date(),
): PlayerSaveSnapshot {
  const save = normalizePlayerSave(value);
  if (!save.streakLastDate) return save;
  const lastClaim = new Date(`${save.streakLastDate}T00:00:00`);
  if (Number.isNaN(lastClaim.getTime())) {
    return { ...save, streakDays: [false, false, false, false, false, false, false], streakLastDate: null };
  }
  const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayIndex);
  startOfWeek.setHours(0, 0, 0, 0);
  return lastClaim >= startOfWeek
    ? save
    : { ...save, streakDays: [false, false, false, false, false, false, false], streakLastDate: null };
}

export function buildLegacyPlayerSave(stored: Record<string, string | null>): PlayerSaveSnapshot {
  const legacyReputation = stored[LEGACY_PROGRESSION_KEYS.reputation];
  const legacyCareerXp = stored[LEGACY_PROGRESSION_KEYS.careerXp] ?? legacyReputation;
  return normalizePlayerSave({
    reputation: legacyReputation,
    careerXp: legacyCareerXp,
    companyBudget: stored[LEGACY_PROGRESSION_KEYS.companyBudget],
    companyName: stored[LEGACY_PROGRESSION_KEYS.companyName],
    ownedItemIds: parseJson(stored[LEGACY_PROGRESSION_KEYS.ownedItemIds]),
    jokerInventory: parseJson(stored[LEGACY_PROGRESSION_KEYS.jokerInventory]),
    ownedCosmeticIds: parseJson(stored[LEGACY_PROGRESSION_KEYS.ownedCosmeticIds]),
    equippedAvatarId: stored[LEGACY_PROGRESSION_KEYS.equippedAvatarId],
    equippedAvatarFrameId: stored[LEGACY_PROGRESSION_KEYS.equippedAvatarFrameId],
    streakDays: parseJson(stored[LEGACY_PROGRESSION_KEYS.streakDays]),
    streakLastDate: stored[LEGACY_PROGRESSION_KEYS.streakLastDate],
    recentQuestionIds: parseJson(stored[LEGACY_PROGRESSION_KEYS.recentQuestionIds]),
    correctAnswers: stored[LEGACY_PROGRESSION_KEYS.correctAnswers],
    wrongAnswers: stored[LEGACY_PROGRESSION_KEYS.wrongAnswers],
    rankingOutcomeStats: parseJson(stored[LEGACY_PROGRESSION_KEYS.rankingOutcomeStats]),
  });
}

export function createAccountSaveCacheKey(userId: string): string {
  return `${PLAYER_SAVE_CACHE_PREFIX}${userId}`;
}

export type AuthenticatedSaveSource = 'cloud' | 'account_cache' | 'clean_default';

export interface AuthenticatedSaveSelection {
  save: PlayerSaveSnapshot;
  source: AuthenticatedSaveSource;
}

/**
 * Authenticated saves may come only from that user's cloud row or user-scoped
 * device cache. Generic/legacy device progress is deliberately not accepted by
 * this boundary and therefore cannot be attached to a newly-created account.
 */
export function selectAuthenticatedSaveSource(
  cloudSave: PlayerSaveSnapshot | null,
  accountCache: PlayerSaveSnapshot | null,
): AuthenticatedSaveSelection {
  if (cloudSave) return { save: cloudSave, source: 'cloud' };
  if (accountCache) return { save: accountCache, source: 'account_cache' };
  return { save: createDefaultPlayerSave(), source: 'clean_default' };
}

export function isAuthenticatedSaveVisible(
  activeUserId: string | null,
  hydratedUserId: string | null,
): boolean {
  return Boolean(activeUserId && hydratedUserId === activeUserId);
}

export function canPersistAccountSave(
  targetUserId: string,
  activeUserId: string | null,
  hydratedUserId: string | null,
): boolean {
  return targetUserId === activeUserId && targetUserId === hydratedUserId;
}

export function canPersistCloudSave(
  targetUserId: string,
  activeUserId: string | null,
  hydratedUserId: string | null,
  cloudBaselineReady: boolean,
): boolean {
  return cloudBaselineReady && canPersistAccountSave(targetUserId, activeUserId, hydratedUserId);
}

export function canUseLegacySave(claim: LegacySaveClaim | null, userId: string): boolean {
  return claim === null || claim.userId === userId;
}
