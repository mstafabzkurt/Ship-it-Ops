import { normalizeCompanyName } from '../config/company';
import { RANKS } from '../config/progression';
import { supabase } from '../supabase';
import type { LeaderboardProjection } from '../utils/leaderboard';

export const GLOBAL_LEADERBOARD_LIMIT = 50;

export type LeaderboardPeriod = 'all_time' | 'weekly' | 'monthly';

export interface LeaderboardScoreEventInput {
  userId: string;
  scoreDelta: number;
  categoryId: string;
  difficultyStar: number;
  sessionId: string;
}

export interface LeaderboardEntry {
  userId: string;
  companyName: string;
  avatarId: string;
  avatarFrameId: string;
  careerRank: string;
  rankingScore: number;
  successRate: number;
  successCount: number;
  updatedAt: string;
}

interface LeaderboardDatabaseRow {
  user_id: string;
  company_name: string;
  avatar_id: string;
  avatar_frame_id: string;
  career_rank: string;
  ranking_score: number | string;
  success_rate: number | string;
  success_count: number | string;
  updated_at: string;
}

export type LeaderboardErrorKind = 'schema_missing' | 'unauthorized' | 'unavailable';

export class LeaderboardServiceError extends Error {
  constructor(
    public readonly kind: LeaderboardErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'LeaderboardServiceError';
  }
}

const normalizeNumber = (value: unknown, maximum = Number.MAX_SAFE_INTEGER): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(maximum, Math.max(0, parsed));
};

const normalizeServiceError = (error: unknown): LeaderboardServiceError => {
  const code = typeof error === 'object' && error && 'code' in error
    ? String(error.code)
    : '';

  if (code === '42P01' || code === '42883' || code === 'PGRST202' || code === 'PGRST205') {
    return new LeaderboardServiceError(
      'schema_missing',
      'Global sıralama henüz etkinleştirilmedi. Supabase kurulumunu tamamlayıp tekrar deneyin.',
    );
  }
  if (code === '42501' || code === 'PGRST301') {
    return new LeaderboardServiceError(
      'unauthorized',
      'Sıralama oturumu doğrulanamadı. Yeniden giriş yapıp tekrar deneyin.',
    );
  }
  return new LeaderboardServiceError(
    'unavailable',
    'Global sıralamaya şu anda ulaşılamıyor. Yerel ilerlemen güvende; tekrar deneyebilirsin.',
  );
};

const mapLeaderboardRow = (row: LeaderboardDatabaseRow): LeaderboardEntry => ({
  userId: row.user_id,
  companyName: normalizeCompanyName(row.company_name),
  avatarId: row.avatar_id,
  avatarFrameId: row.avatar_frame_id,
  careerRank: row.career_rank?.trim().slice(0, 80) || RANKS[0].name,
  rankingScore: Math.trunc(normalizeNumber(row.ranking_score)),
  successRate: normalizeNumber(row.success_rate, 100),
  successCount: Math.trunc(normalizeNumber(row.success_count)),
  updatedAt: row.updated_at,
});

export async function upsertMyLeaderboardProfile(
  authenticatedUserId: string,
  projection: LeaderboardProjection,
): Promise<void> {
  if (!authenticatedUserId) {
    throw new LeaderboardServiceError('unauthorized', 'Sıralama için oturum gerekli.');
  }

  const { error } = await supabase
    .from('leaderboard_profiles')
    .upsert({
      user_id: authenticatedUserId,
      company_name: projection.companyName,
      avatar_id: projection.avatarId,
      avatar_frame_id: projection.avatarFrameId,
      career_rank: projection.careerRank,
      ranking_score: projection.rankingScore,
      success_rate: projection.successRate,
      success_count: projection.successCount,
    }, { onConflict: 'user_id' });

  if (error) throw normalizeServiceError(error);
}

export async function fetchGlobalLeaderboard(
  limit = GLOBAL_LEADERBOARD_LIMIT,
): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.min(GLOBAL_LEADERBOARD_LIMIT, Math.max(1, Math.trunc(limit)));
  const { data, error } = await supabase
    .from('leaderboard_profiles')
    .select('user_id, company_name, avatar_id, avatar_frame_id, career_rank, ranking_score, success_rate, success_count, updated_at')
    .order('ranking_score', { ascending: false })
    .order('success_rate', { ascending: false })
    .order('success_count', { ascending: false })
    .order('updated_at', { ascending: true })
    .order('user_id', { ascending: true })
    .limit(safeLimit);

  if (error) throw normalizeServiceError(error);
  return ((data ?? []) as LeaderboardDatabaseRow[]).map(mapLeaderboardRow);
}

export async function fetchLeaderboard(
  period: LeaderboardPeriod,
  limit = GLOBAL_LEADERBOARD_LIMIT,
): Promise<LeaderboardEntry[]> {
  if (period === 'all_time') return fetchGlobalLeaderboard(limit);
  const safeLimit = Math.min(GLOBAL_LEADERBOARD_LIMIT, Math.max(1, Math.trunc(limit)));
  const { data, error } = await supabase.rpc('get_period_leaderboard', {
    p_period: period,
    p_limit: safeLimit,
  });

  if (error) throw normalizeServiceError(error);
  return ((data ?? []) as LeaderboardDatabaseRow[]).map(mapLeaderboardRow);
}

export function createLeaderboardSessionId(now = Date.now(), random = Math.random()): string {
  const timePart = Math.max(0, Math.trunc(now)).toString(36);
  const randomPart = Math.floor(Math.max(0, Math.min(0.9999999999999999, random)) * Number.MAX_SAFE_INTEGER)
    .toString(36)
    .padStart(10, '0');
  return `session_${timePart}_${randomPart}`;
}

export async function writeLeaderboardScoreEvent(input: LeaderboardScoreEventInput): Promise<void> {
  const scoreDelta = Math.trunc(input.scoreDelta);
  if (scoreDelta <= 0) return;
  if (!input.userId) {
    throw new LeaderboardServiceError('unauthorized', 'Sıralama skoru için oturum gerekli.');
  }

  const { error } = await supabase
    .from('leaderboard_score_events')
    .insert({
      user_id: input.userId,
      score_delta: scoreDelta,
      category_id: input.categoryId,
      difficulty_star: Math.trunc(input.difficultyStar),
      session_id: input.sessionId,
    });

  if (!error || error.code === '23505') return;
  throw normalizeServiceError(error);
}

export async function fetchMyLeaderboardProfile(
  authenticatedUserId: string,
): Promise<LeaderboardEntry | null> {
  if (!authenticatedUserId) return null;
  const { data, error } = await supabase
    .from('leaderboard_profiles')
    .select('user_id, company_name, avatar_id, avatar_frame_id, career_rank, ranking_score, success_rate, success_count, updated_at')
    .eq('user_id', authenticatedUserId)
    .maybeSingle();

  if (error) throw normalizeServiceError(error);
  return data ? mapLeaderboardRow(data as LeaderboardDatabaseRow) : null;
}

export function getLeaderboardErrorMessage(error: unknown): string {
  return error instanceof LeaderboardServiceError
    ? error.message
    : 'Global sıralama yüklenemedi. Lütfen tekrar deneyin.';
}
