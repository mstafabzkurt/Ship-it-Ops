import { supabase } from '../supabase';
import { isUuid } from '../utils/friends';
import {
  getDirectMessageCursor,
  serializeDirectConversationSummary,
  serializeDirectMessage,
  type DirectConversationSummaryDatabaseRow,
  type DirectMessageDatabaseRow,
} from '../utils/directMessaging';
import {
  ARCHIVED_QUESTION_SELECT,
  mergeReceivedQuestionDeliveries,
  normalizeQuestionId,
  serializeArchivedQuestion,
  serializeQuestionFavorite,
  serializeQuestionShare,
  serializeSharedQuestionPreview,
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
  if (!Array.isArray(data)) throw new QuestionSocialServiceError(unavailableMessage);

  for (const row of data) {
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

async function fetchReceivedDirectQuestionShares(currentUserId: string): Promise<QuestionShare[]> {
  // Both existing RPCs enforce conversation participation. Read every cursor page;
  // a newer text message must not push an older question share out of the inbox.
  const { data: conversationRows, error: conversationError } = await supabase.rpc('list_direct_conversations');
  if (conversationError || !Array.isArray(conversationRows)) throw new QuestionSocialServiceError(unavailableMessage);
  const conversations = conversationRows
    .map((row) => serializeDirectConversationSummary(row as DirectConversationSummaryDatabaseRow))
    .filter((summary): summary is NonNullable<typeof summary> => Boolean(summary));

  const readConversation = async (conversation: (typeof conversations)[number]): Promise<QuestionShare[]> => {
    const received: QuestionShare[] = [];
    let cursor: { createdAt: string; id: string } | null = null;
    while (true) {
      const { data, error } = await supabase.rpc('list_direct_messages', {
        target_conversation_id: conversation.conversationId,
        before_created_at: cursor?.createdAt ?? null,
        before_message_id: cursor?.id ?? null,
        requested_limit: 50,
      });
      if (error || !Array.isArray(data)) throw new QuestionSocialServiceError(unavailableMessage);
      for (const row of data) {
        const message = serializeDirectMessage(row as DirectMessageDatabaseRow);
        if (message?.messageType !== 'question_share' || !message.questionId
          || message.senderId === currentUserId || message.senderId !== conversation.otherUserId) continue;
        received.push({
          id: message.id,
          senderId: message.senderId,
          recipientId: currentUserId,
          questionId: message.questionId,
          createdAt: message.createdAt,
          openedAt: null,
        });
      }
      if (data.length < 50) break;
      const oldest = serializeDirectMessage(data[data.length - 1] as DirectMessageDatabaseRow);
      if (!oldest) throw new QuestionSocialServiceError(unavailableMessage);
      cursor = getDirectMessageCursor(oldest);
    }
    return received;
  };
  const pages: QuestionShare[][] = [];
  for (let start = 0; start < conversations.length; start += 4) {
    pages.push(...await Promise.all(conversations.slice(start, start + 4).map(readConversation)));
  }
  return pages.flat();
}

export async function getQuestionFavoriteState(
  currentUserId: string,
  questionId: unknown,
): Promise<boolean> {
  const normalizedQuestionId = normalizeQuestionId(questionId);
  if (!isUuid(currentUserId)) throw new QuestionSocialServiceError(unavailableMessage);
  if (!normalizedQuestionId) return false;
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
  } else {
    const { error } = await supabase
      .from('question_favorites')
      .delete()
      .eq('user_id', currentUserId)
      .eq('question_id', normalizedQuestionId);
    if (error) throw new QuestionSocialServiceError(mutationMessage);
  }

  const persisted = await getQuestionFavoriteState(currentUserId, normalizedQuestionId)
    .catch(() => { throw new QuestionSocialServiceError(mutationMessage); });
  if (persisted !== favorite) throw new QuestionSocialServiceError(mutationMessage);
  return persisted;
}

export async function listFavoriteQuestions(currentUserId: string): Promise<FavoriteQuestionEntry[]> {
  if (!isUuid(currentUserId)) throw new QuestionSocialServiceError(unavailableMessage);
  const { data, error } = await supabase
    .from('question_favorites')
    .select('question_id, created_at')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });
  if (error) throw new QuestionSocialServiceError(unavailableMessage);
  if (!Array.isArray(data)) throw new QuestionSocialServiceError(unavailableMessage);

  const favorites = data
    .map((row) => serializeQuestionFavorite(row as QuestionFavoriteDatabaseRow))
    .filter((favorite): favorite is QuestionFavorite => Boolean(favorite));
  const questions = await fetchQuestionsById(favorites.map((favorite) => favorite.questionId));
  const entries = favorites
    .map((favorite) => {
      const question = questions.get(favorite.questionId);
      return question ? { favorite, question } : null;
    })
    .filter((entry): entry is FavoriteQuestionEntry => Boolean(entry));
  if (data.length > 0 && entries.length === 0) throw new QuestionSocialServiceError(unavailableMessage);
  return entries;
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
  if (!isUuid(currentUserId)) throw new QuestionSocialServiceError(unavailableMessage);
  const [legacyResult, directShares] = await Promise.all([
    supabase.from('question_shares')
      .select('id, sender_id, recipient_id, question_id, created_at, opened_at')
      .eq('recipient_id', currentUserId)
      .order('created_at', { ascending: false }),
    fetchReceivedDirectQuestionShares(currentUserId),
  ]);
  if (legacyResult.error || !Array.isArray(legacyResult.data)) throw new QuestionSocialServiceError(unavailableMessage);

  const legacyShares = legacyResult.data
    .map((row) => serializeQuestionShare(row as QuestionShareDatabaseRow))
    .filter((share): share is QuestionShare => Boolean(share) && share?.recipientId === currentUserId);
  const deliveries = mergeReceivedQuestionDeliveries(legacyShares, directShares);
  const questionIds = [...new Set(deliveries.map(({ share }) => share.questionId))];
  const questions = new Map<string, SharedQuestionEntry['question']>();
  if (questionIds.length > 0) {
    const { data: questionRows, error: questionError } = await supabase
      .from('game_incidents')
      .select(ARCHIVED_QUESTION_SELECT)
      .in('id', questionIds);
    if (questionError || !Array.isArray(questionRows)) throw new QuestionSocialServiceError(unavailableMessage);
    for (const row of questionRows) {
      const question = serializeArchivedQuestion(row as ArchivedQuestionDatabaseRow)
        ?? serializeSharedQuestionPreview(row as ArchivedQuestionDatabaseRow);
      if (question) questions.set(question.id, question);
    }
  }

  const entries = deliveries
    .map(({ source, share }) => {
      const question = questions.get(share.questionId);
      return question ? { source, share, question, sender: null } as SharedQuestionEntry : null;
    })
    .filter((entry): entry is SharedQuestionEntry => Boolean(entry));
  if (deliveries.length > 0 && entries.length === 0) throw new QuestionSocialServiceError(unavailableMessage);
  return entries;
}

export async function fetchSharedQuestionSenderProfiles(entries: SharedQuestionEntry[]): Promise<Map<string, PublicProfile>> {
  return fetchPublicProfilesById(entries.map((entry) => entry.share.senderId));
}

export async function markQuestionShareOpened(shareId: string): Promise<boolean> {
  if (!isUuid(shareId)) throw new QuestionSocialServiceError(mutationMessage);
  const { data, error } = await supabase.rpc('mark_question_share_opened', { share_id: shareId });
  if (error) throw new QuestionSocialServiceError(mutationMessage);
  return data === true;
}
