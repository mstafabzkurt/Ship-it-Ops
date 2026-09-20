import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../supabase';
import {
  LEGACY_PROGRESSION_KEYS,
  LEGACY_SAVE_CLAIM_KEY,
  LEGACY_SAVE_CLAIM_VERSION,
  PLAYER_SAVE_VERSION,
  buildLegacyPlayerSave,
  canUseLegacySave,
  createAccountSaveCacheKey,
  normalizePlayerSave,
  type LegacySaveClaim,
  type PlayerSaveSnapshot,
} from '../utils/playerSave';

interface PlayerSaveDatabaseRow {
  user_id: string;
  save_version: number;
  career_xp: number | string;
  reputation: number | string;
  company_budget: number | string;
  company_name: string;
  correct_answers: number | string;
  wrong_answers: number | string;
  completed_sessions: number | string;
  ranking_success_count: number | string;
  ranking_partial_count: number | string;
  ranking_fail_count: number | string;
  ranking_timeout_count: number | string;
  ranking_legacy_positive_count: number | string;
  joker_inventory: unknown;
  owned_item_ids: unknown;
  owned_cosmetic_ids: unknown;
  equipped_avatar_id: string;
  equipped_avatar_frame_id: string;
  streak_days: unknown;
  streak_last_date: string | null;
  recent_question_ids: unknown;
  category_progress: unknown;
  onboarding_completed: boolean;
  tutorial_completed: boolean;
  selected_interest_areas: unknown;
  claimed_badge_reward_ids: unknown;
  unseen_badge_ids: unknown;
}

export type PlayerSaveErrorKind = 'schema_missing' | 'unauthorized' | 'unavailable';

export class PlayerSaveServiceError extends Error {
  constructor(public readonly kind: PlayerSaveErrorKind, message: string) {
    super(message);
    this.name = 'PlayerSaveServiceError';
  }
}

const normalizeServiceError = (error: unknown): PlayerSaveServiceError => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '42P01' || code === 'PGRST205') {
    return new PlayerSaveServiceError(
      'schema_missing',
      'Bulut kayıt tablosu henüz etkin değil. Supabase migration çalıştırıldıktan sonra tekrar dene.',
    );
  }
  if (code === '42501' || code === 'PGRST301') {
    return new PlayerSaveServiceError('unauthorized', 'Bulut kayıt oturumu doğrulanamadı.');
  }
  return new PlayerSaveServiceError(
    'unavailable',
    'Bulut kayda şu anda ulaşılamıyor. Bu cihazdaki hesap yedeğin korunuyor.',
  );
};

const mapDatabaseRow = (row: PlayerSaveDatabaseRow): PlayerSaveSnapshot => {
  if (Number(row.save_version) > PLAYER_SAVE_VERSION) {
    throw new PlayerSaveServiceError(
      'unavailable',
      'Bu bulut kayıt daha yeni bir uygulama sürümüyle oluşturulmuş. Uygulamayı güncelleyip tekrar dene.',
    );
  }
  return normalizePlayerSave({
    saveVersion: row.save_version,
    careerXp: row.career_xp,
    reputation: row.reputation,
    companyBudget: row.company_budget,
    companyName: row.company_name,
    correctAnswers: row.correct_answers,
    wrongAnswers: row.wrong_answers,
    completedSessions: row.completed_sessions,
    rankingOutcomeStats: {
      successCount: Number(row.ranking_success_count),
      partialCount: Number(row.ranking_partial_count),
      failCount: Number(row.ranking_fail_count),
      timeoutCount: Number(row.ranking_timeout_count),
      legacyPositiveCount: Number(row.ranking_legacy_positive_count),
    },
    jokerInventory: row.joker_inventory,
    ownedItemIds: row.owned_item_ids,
    ownedCosmeticIds: row.owned_cosmetic_ids,
    equippedAvatarId: row.equipped_avatar_id,
    equippedAvatarFrameId: row.equipped_avatar_frame_id,
    streakDays: row.streak_days,
    streakLastDate: row.streak_last_date,
    recentQuestionIds: row.recent_question_ids,
    categoryProgress: row.category_progress,
    onboardingCompleted: row.onboarding_completed,
    tutorialCompleted: row.tutorial_completed,
    selectedInterestAreas: row.selected_interest_areas,
    claimedBadgeRewardIds: row.claimed_badge_reward_ids,
    unseenBadgeIds: row.unseen_badge_ids,
  });
};

const toDatabaseRow = (userId: string, save: PlayerSaveSnapshot) => ({
  user_id: userId,
  save_version: PLAYER_SAVE_VERSION,
  career_xp: save.careerXp,
  reputation: save.reputation,
  company_budget: save.companyBudget,
  company_name: save.companyName,
  correct_answers: save.correctAnswers,
  wrong_answers: save.wrongAnswers,
  completed_sessions: save.completedSessions,
  ranking_success_count: save.rankingOutcomeStats.successCount,
  ranking_partial_count: save.rankingOutcomeStats.partialCount,
  ranking_fail_count: save.rankingOutcomeStats.failCount,
  ranking_timeout_count: save.rankingOutcomeStats.timeoutCount,
  ranking_legacy_positive_count: save.rankingOutcomeStats.legacyPositiveCount,
  joker_inventory: save.jokerInventory,
  owned_item_ids: save.ownedItemIds,
  owned_cosmetic_ids: save.ownedCosmeticIds,
  equipped_avatar_id: save.equippedAvatarId,
  equipped_avatar_frame_id: save.equippedAvatarFrameId,
  streak_days: save.streakDays,
  streak_last_date: save.streakLastDate,
  recent_question_ids: save.recentQuestionIds,
  category_progress: save.categoryProgress,
  onboarding_completed: save.onboardingCompleted,
  tutorial_completed: save.tutorialCompleted,
  selected_interest_areas: save.selectedInterestAreas,
  claimed_badge_reward_ids: save.claimedBadgeRewardIds,
  unseen_badge_ids: save.unseenBadgeIds,
});

export async function fetchMyPlayerSave(userId: string): Promise<PlayerSaveSnapshot | null> {
  const { data, error } = await supabase
    .from('player_saves')
    .select('user_id, save_version, career_xp, reputation, company_budget, company_name, correct_answers, wrong_answers, completed_sessions, ranking_success_count, ranking_partial_count, ranking_fail_count, ranking_timeout_count, ranking_legacy_positive_count, joker_inventory, owned_item_ids, owned_cosmetic_ids, equipped_avatar_id, equipped_avatar_frame_id, streak_days, streak_last_date, recent_question_ids, category_progress, onboarding_completed, tutorial_completed, selected_interest_areas, claimed_badge_reward_ids, unseen_badge_ids')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw normalizeServiceError(error);
  return data ? mapDatabaseRow(data as PlayerSaveDatabaseRow) : null;
}

export async function createMyPlayerSave(userId: string, value: PlayerSaveSnapshot): Promise<void> {
  const save = normalizePlayerSave(value);
  const { error } = await supabase.from('player_saves').insert(toDatabaseRow(userId, save));
  if (error) throw normalizeServiceError(error);
}

export async function upsertMyPlayerSave(userId: string, value: PlayerSaveSnapshot): Promise<void> {
  const save = normalizePlayerSave(value);
  const { error } = await supabase
    .from('player_saves')
    .upsert(toDatabaseRow(userId, save), { onConflict: 'user_id' });
  if (error) throw normalizeServiceError(error);
}

export async function loadAccountSaveCache(userId: string): Promise<PlayerSaveSnapshot | null> {
  const stored = await AsyncStorage.getItem(createAccountSaveCacheKey(userId));
  if (!stored) return null;
  try {
    return normalizePlayerSave(JSON.parse(stored));
  } catch (_) {
    return null;
  }
}

export async function writeAccountSaveCache(userId: string, value: PlayerSaveSnapshot): Promise<void> {
  await AsyncStorage.setItem(
    createAccountSaveCacheKey(userId),
    JSON.stringify(normalizePlayerSave(value)),
  );
}

export async function loadLegacySaveClaim(): Promise<LegacySaveClaim | null> {
  const stored = await AsyncStorage.getItem(LEGACY_SAVE_CLAIM_KEY);
  if (!stored) return null;
  try {
    const value = JSON.parse(stored) as Partial<LegacySaveClaim>;
    if (typeof value.userId !== 'string' || value.migrationVersion !== LEGACY_SAVE_CLAIM_VERSION) return null;
    return {
      userId: value.userId,
      migrationVersion: LEGACY_SAVE_CLAIM_VERSION,
      claimedAt: typeof value.claimedAt === 'string' ? value.claimedAt : '',
    };
  } catch (_) {
    return null;
  }
}

export async function claimAndLoadLegacySave(userId: string): Promise<PlayerSaveSnapshot | null> {
  const existingClaim = await loadLegacySaveClaim();
  if (!canUseLegacySave(existingClaim, userId)) return null;
  if (existingClaim) return readLegacyPlayerSave();

  const save = await readLegacyPlayerSave();
  const claim: LegacySaveClaim = {
    userId,
    migrationVersion: LEGACY_SAVE_CLAIM_VERSION,
    claimedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(LEGACY_SAVE_CLAIM_KEY, JSON.stringify(claim));
  return save;
}

async function readLegacyPlayerSave(): Promise<PlayerSaveSnapshot> {
  const keys = Object.values(LEGACY_PROGRESSION_KEYS);
  const rows = await AsyncStorage.multiGet(keys);
  return buildLegacyPlayerSave(Object.fromEntries(rows));
}

export const getPlayerSaveErrorMessage = (error: unknown): string => (
  error instanceof PlayerSaveServiceError
    ? error.message
    : 'Bulut kayıt işlemi tamamlanamadı. Cihaz yedeğin korunuyor.'
);
