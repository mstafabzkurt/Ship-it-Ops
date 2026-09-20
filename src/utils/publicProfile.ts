import {
  DEFAULT_AVATAR_FRAME_ID,
  DEFAULT_AVATAR_ID,
  isCosmeticId,
  type AvatarCosmeticId,
  type AvatarFrameCosmeticId,
} from '../config/cosmetics';
import { getRankForCareerXp } from '../config/progression';
import { ACHIEVEMENTS, type AchievementId } from '../config/achievements';

export const PUBLIC_PROFILE_RESULT_LIMIT = 10;
export const PUBLIC_PROFILE_MIN_QUERY_LENGTH = 2;
export const PUBLIC_PROFILE_SELECT = 'user_id, company_name, avatar_id, avatar_frame_id, career_rank, career_xp, reputation, success_rate, completed_sessions, selected_badge_ids, updated_at';

export interface PublicProfile {
  userId: string;
  companyName: string;
  avatarId: AvatarCosmeticId;
  avatarFrameId: AvatarFrameCosmeticId;
  careerRank: string;
  careerXp: number;
  reputation: number;
  successRate: number;
  completedSessions: number;
  selectedBadgeIds: AchievementId[];
  updatedAt: string;
}

export interface PublicProfileDatabaseRow {
  user_id?: unknown;
  company_name?: unknown;
  avatar_id?: unknown;
  avatar_frame_id?: unknown;
  career_rank?: unknown;
  career_xp?: unknown;
  reputation?: unknown;
  success_rate?: unknown;
  completed_sessions?: unknown;
  selected_badge_ids?: unknown;
  updated_at?: unknown;
}

const PUBLIC_BADGE_IDS = new Set<string>(ACHIEVEMENTS.map((badge) => badge.id));

function nonNegativeInteger(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
}

function normalizeSuccessRate(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Number(Math.min(100, Math.max(0, numeric)).toFixed(2));
}

function normalizeSelectedBadges(value: unknown): AchievementId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is AchievementId => (
    typeof id === 'string' && PUBLIC_BADGE_IDS.has(id)
  )))].slice(0, 3);
}

export function normalizePublicProfileQuery(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length >= PUBLIC_PROFILE_MIN_QUERY_LENGTH ? trimmed.slice(0, 32) : null;
}

export function normalizePublicProfileResultLimit(value: number): number {
  if (!Number.isFinite(value)) return PUBLIC_PROFILE_RESULT_LIMIT;
  return Math.min(PUBLIC_PROFILE_RESULT_LIMIT, Math.max(1, Math.trunc(value)));
}

/** Maps only the explicit public allowlist; extra/private row properties are ignored. */
export function serializePublicProfile(row: PublicProfileDatabaseRow): PublicProfile | null {
  const userId = typeof row.user_id === 'string' ? row.user_id : '';
  if (!userId) return null;

  const careerXp = nonNegativeInteger(row.career_xp);
  const companyName = typeof row.company_name === 'string' && row.company_name.trim()
    ? row.company_name.trim().slice(0, 48)
    : 'Şirket profili';
  const avatarId = isCosmeticId(row.avatar_id)
    && row.avatar_id.startsWith('avatar_')
    ? row.avatar_id as AvatarCosmeticId
    : DEFAULT_AVATAR_ID;
  const avatarFrameId = isCosmeticId(row.avatar_frame_id)
    && (row.avatar_frame_id.startsWith('avatar_frame_') || row.avatar_frame_id.startsWith('frame_'))
    ? row.avatar_frame_id as AvatarFrameCosmeticId
    : DEFAULT_AVATAR_FRAME_ID;
  const storedRank = typeof row.career_rank === 'string' ? row.career_rank.trim() : '';

  return {
    userId,
    companyName,
    avatarId,
    avatarFrameId,
    careerRank: storedRank.slice(0, 80) || getRankForCareerXp(careerXp).current.name,
    careerXp,
    reputation: nonNegativeInteger(row.reputation),
    successRate: normalizeSuccessRate(row.success_rate),
    completedSessions: nonNegativeInteger(row.completed_sessions),
    selectedBadgeIds: normalizeSelectedBadges(row.selected_badge_ids),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
  };
}
