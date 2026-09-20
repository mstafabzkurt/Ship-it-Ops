import { supabase } from '../supabase';
import { isUuid } from '../utils/friends';
import {
  ARCHIVED_QUESTION_SELECT,
  normalizeQuestionId,
  serializeArchivedQuestion,
  serializeQuestionFavorite,
  serializeQuestionShare,
  type ArchivedQuestion,
  type ArchivedQuestionDatabaseRow,
  type FavoriteQuestionEntry,
  type QuestionFavorite,
  type QuestionFavoriteDatabaseRow,
  type QuestionShare,
  type QuestionShareDatabaseRow,
  type SharedQuestionEntry,
} from '../utils/questionSocial';
import {
  PUBLIC_PROFILE_SELECT,
  serializePublicProfile,
  type PublicProfile,
  type PublicProfileDatabaseRow,
} from '../utils/publicProfile';

const unavailableMessage = 'Soru arşivine şu anda ulaşılamıyor. Tekrar dene.';
const mutationMessage = 'Soru işlemi tamamlanamadı. Tekrar dene.';

export class QuestionSocialServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuestionSocialServiceError';
  }
}

function parseRpcShare(data: unknown): QuestionShare {
  const row = Array.isArray(data) ? data[0] : data;
  const share = row ? serializeQuestionShare(row as QuestionShareDatabaseRow) : null;
  if (!share) throw new QuestionSocialServiceError(mutationMessage);
  return share;
}

async function fetchQuestionsById(questionIds: string[]): Promise<Map<string, ArchivedQuestion>> {
  const uniqueIds = [...new Set(questionIds)];
  const result = new Map<string, ArchivedQuestion>();
  if (uniqueIds.length === 0) return result;

  const { data, error } = await supabase
    .from('game_incidents')
    .select(ARCHIVED_QUESTION_SELECT)
    .in('id', uniqueIds);
  if (error) throw new QuestionSocialServiceError(unavailableMessage);

  for (const row of Array.isArray(data) ? data : []) {
    const question = serializeArchivedQuestion(row as ArchivedQuestionDatabaseRow);
    if (question) result.set(question.id, question);
  }
  return result;
}

async function fetchPublicProfilesById(userIds: string[]): Promise<Map<string, PublicProfile>> {
  const uniqueIds = [...new Set(userIds.filter(isUuid))];
  const result = new Map<string, PublicProfile>();
  if (uniqueIds.length === 0) return result;

  const { data, error } = await supabase
    .from('public_profiles')
    .select(PUBLIC_PROFILE_SELECT)
    .in('user_id', uniqueIds);
  if (error) throw new QuestionSocialServiceError(unavailableMessage);

  for (const row of Array.isArray(data) ? data : []) {
    const profile = serializePublicProfile(row as PublicProfileDatabaseRow);
    if (profile) result.set(profile.userId, profile);
  }
  return result;
}

export async function getQuestionFavoriteState(
  currentUserId: string,
  questionId: unknown,
): Promise<boolean> {
  const normalizedQuestionId = normalizeQuestionId(questionId);
  if (!isUuid(currentUserId) || !normalizedQuestionId) return false;
  const { data, error } = await supabase
    .from('question_favorites')
    .select('question_id')
    .eq('user_id', currentUserId)
    .eq('question_id', normalizedQuestionId)
    .maybeSingle();
  if (error) throw new QuestionSocialServiceError(unavailableMessage);
  return Boolean(data);
}

export async function setQuestionFavorite(
  currentUserId: string,
  questionId: unknown,
  favorite: boolean,
): Promise<boolean> {
  const normalizedQuestionId = normalizeQuestionId(questionId);
  if (!isUuid(currentUserId) || !normalizedQuestionId) {
    throw new QuestionSocialServiceError(mutationMessage);
  }

  if (favorite) {
    const { error } = await supabase
      .from('question_favorites')
      .upsert(
        { user_id: currentUserId, question_id: normalizedQuestionId },
        { onConflict: 'user_id,question_id', ignoreDuplicates: true },
      );
    if (error) throw new QuestionSocialServiceError(mutationMessage);
    return true;
  }

  const { error } = await supabase
    .from('question_favorites')
    .delete()
    .eq('user_id', currentUserId)
    .eq('question_id', normalizedQuestionId);
  if (error) throw new QuestionSocialServiceError(mutationMessage);
  return false;
}

export async function listFavoriteQuestions(currentUserId: string): Promise<FavoriteQuestionEntry[]> {
  if (!isUuid(currentUserId)) return [];
  const { data, error } = await supabase
    .from('question_favorites')
    .select('question_id, created_at')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });
  if (error) throw new QuestionSocialServiceError(unavailableMessage);

  const favorites = (Array.isArray(data) ? data : [])
    .map((row) => serializeQuestionFavorite(row as QuestionFavoriteDatabaseRow))
    .filter((favorite): favorite is QuestionFavorite => Boolean(favorite));
  const questions = await fetchQuestionsById(favorites.map((favorite) => favorite.questionId));
  return favorites
    .map((favorite) => {
      const question = questions.get(favorite.questionId);
      return question ? { favorite, question } : null;
    })
    .filter((entry): entry is FavoriteQuestionEntry => Boolean(entry));
}

export async function fetchArchivedQuestion(questionId: unknown): Promise<ArchivedQuestion | null> {
  const normalizedQuestionId = normalizeQuestionId(questionId);
  if (!normalizedQuestionId) return null;
  const { data, error } = await supabase
    .from('game_incidents')
    .select(ARCHIVED_QUESTION_SELECT)
    .eq('id', normalizedQuestionId)
    .maybeSingle();
  if (error) throw new QuestionSocialServiceError(unavailableMessage);
  return data ? serializeArchivedQuestion(data as ArchivedQuestionDatabaseRow) : null;
}

export async function shareQuestionWithFriend(
  targetUserId: string,
  questionId: unknown,
): Promise<QuestionShare> {
  const normalizedQuestionId = normalizeQuestionId(questionId);
  if (!isUuid(targetUserId) || !normalizedQuestionId) {
    throw new QuestionSocialServiceError(mutationMessage);
  }
  const { data, error } = await supabase.rpc('share_question_with_friend', {
    target_user_id: targetUserId,
    shared_question_id: normalizedQuestionId,
  });
  if (error) throw new QuestionSocialServiceError(mutationMessage);
  return parseRpcShare(data);
}

export async function listReceivedQuestionShares(currentUserId: string): Promise<SharedQuestionEntry[]> {
  if (!isUuid(currentUserId)) return [];
  const { data, error } = await supabase
    .from('question_shares')
    .select('id, sender_id, recipient_id, question_id, created_at, opened_at')
    .eq('recipient_id', currentUserId)
    .order('created_at', { ascending: false });
  if (error) throw new QuestionSocialServiceError(unavailableMessage);

  const shares = (Array.isArray(data) ? data : [])
    .map((row) => serializeQuestionShare(row as QuestionShareDatabaseRow))
    .filter((share): share is QuestionShare => Boolean(share));
  const [questions, senders] = await Promise.all([
    fetchQuestionsById(shares.map((share) => share.questionId)),
    fetchPublicProfilesById(shares.map((share) => share.senderId)),
  ]);

  return shares
    .map((share) => {
      const question = questions.get(share.questionId);
      return question ? { share, question, sender: senders.get(share.senderId) ?? null } : null;
    })
    .filter((entry): entry is SharedQuestionEntry => Boolean(entry));
}

export async function markQuestionShareOpened(shareId: string): Promise<boolean> {
  if (!isUuid(shareId)) throw new QuestionSocialServiceError(mutationMessage);
  const { data, error } = await supabase.rpc('mark_question_share_opened', { share_id: shareId });
  if (error) throw new QuestionSocialServiceError(mutationMessage);
  return data === true;
}
