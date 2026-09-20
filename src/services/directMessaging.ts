import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '../supabase';
import {
  isDirectMessageUuid,
  isUserReportReason,
  serializeDirectConversationContext,
  serializeDirectConversationSummary,
  serializeDirectMessage,
  type DirectConversationContext,
  type DirectConversationContextDatabaseRow,
  type DirectConversationSummary,
  type DirectConversationSummaryDatabaseRow,
  type DirectMessage,
  type DirectMessageCursor,
  type DirectMessageDatabaseRow,
  type DirectMessageEntry,
  type UserReportReason,
} from '../utils/directMessaging';
import {
  PUBLIC_PROFILE_SELECT,
  serializePublicProfile,
  type PublicProfile,
  type PublicProfileDatabaseRow,
} from '../utils/publicProfile';
import {
  ARCHIVED_QUESTION_SELECT,
  normalizeQuestionId,
  serializeArchivedQuestion,
  type ArchivedQuestion,
  type ArchivedQuestionDatabaseRow,
} from '../utils/questionSocial';

const unavailableMessage = 'Mesajlara şu anda ulaşılamıyor. Tekrar dene.';
const mutationMessage = 'Mesaj işlemi tamamlanamadı. Tekrar dene.';

export class DirectMessagingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DirectMessagingServiceError';
  }
}
function firstRow(data: unknown): Record<string, unknown> | null {
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === 'object' ? row as Record<string, unknown> : null;
}

function parseRpcMessage(data: unknown): DirectMessage {
  const row = firstRow(data);
  const message = row ? serializeDirectMessage(row as DirectMessageDatabaseRow) : null;
  if (!message) throw new DirectMessagingServiceError(mutationMessage);
  return message;
}

function mutationErrorMessage(error: { message?: string } | null): string {
  const message = error?.message ?? '';
  if (message.includes('rate limit')) return 'Çok hızlı mesaj gönderiyorsun. Kısa bir süre bekleyip tekrar dene.';
  if (message.includes('accepted friendship')) return 'Artık arkadaş değilsiniz. Yeni mesaj gönderemezsin.';
  if (message.includes('not available for this user pair')) return 'Bu kullanıcıyla şu anda mesajlaşamazsın.';
  return mutationMessage;
}

async function fetchProfilesById(userIds: string[]): Promise<Map<string, PublicProfile>> {
  const uniqueIds = [...new Set(userIds.filter(isDirectMessageUuid))];
  const profiles = new Map<string, PublicProfile>();
  if (uniqueIds.length === 0) return profiles;
  const { data, error } = await supabase
    .from('public_profiles')
    .select(PUBLIC_PROFILE_SELECT)
    .in('user_id', uniqueIds);
  if (error) throw new DirectMessagingServiceError(unavailableMessage);
  for (const row of Array.isArray(data) ? data : []) {
    const profile = serializePublicProfile(row as PublicProfileDatabaseRow);
    if (profile) profiles.set(profile.userId, profile);
  }
  return profiles;
}

async function fetchQuestionsById(questionIds: string[]): Promise<Map<string, ArchivedQuestion>> {
  const uniqueIds = [...new Set(questionIds.map(normalizeQuestionId).filter((id): id is string => Boolean(id)))];
  const questions = new Map<string, ArchivedQuestion>();
  if (uniqueIds.length === 0) return questions;
  const { data, error } = await supabase
    .from('game_incidents')
    .select(ARCHIVED_QUESTION_SELECT)
    .in('id', uniqueIds);
  if (error) throw new DirectMessagingServiceError(unavailableMessage);
  for (const row of Array.isArray(data) ? data : []) {
    const question = serializeArchivedQuestion(row as ArchivedQuestionDatabaseRow);
    if (question) questions.set(question.id, question);
  }
  return questions;
}

async function attachQuestions(messages: DirectMessage[]): Promise<DirectMessageEntry[]> {
  const questions = await fetchQuestionsById(messages
    .map((message) => message.questionId)
    .filter((id): id is string => Boolean(id)));
  return messages.map((message) => ({
    message,
    question: message.questionId ? questions.get(message.questionId) ?? null : null,
  }));
}

export async function getDirectConversationContext(
  targetUserId: string,
): Promise<DirectConversationContext> {
  if (!isDirectMessageUuid(targetUserId)) throw new DirectMessagingServiceError(unavailableMessage);
  const { data, error } = await supabase.rpc('get_direct_conversation_context', {
    target_user_id: targetUserId,
  });
  if (error) throw new DirectMessagingServiceError(unavailableMessage);
  return serializeDirectConversationContext((firstRow(data) ?? {}) as DirectConversationContextDatabaseRow);
}

export async function openDirectConversation(targetUserId: string): Promise<DirectConversationContext> {
  const context = await getDirectConversationContext(targetUserId);
  if (context.conversationId || !context.canSend) return context;
  const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
    target_user_id: targetUserId,
  });
  if (error || !isDirectMessageUuid(data)) {
    throw new DirectMessagingServiceError(mutationErrorMessage(error));
  }
  return { ...context, conversationId: data };
}

export async function listDirectConversations(): Promise<DirectConversationSummary[]> {
  const { data, error } = await supabase.rpc('list_direct_conversations');
  if (error) throw new DirectMessagingServiceError(unavailableMessage);
  const summaries = (Array.isArray(data) ? data : [])
    .map((row) => serializeDirectConversationSummary(row as DirectConversationSummaryDatabaseRow))
    .filter((summary): summary is Omit<DirectConversationSummary, 'profile'> => Boolean(summary));
  const profiles = await fetchProfilesById(summaries.map((summary) => summary.otherUserId));
  return summaries.map((summary) => ({
    ...summary,
    profile: profiles.get(summary.otherUserId) ?? null,
  }));
}

export async function getDirectMessageUnreadTotal(): Promise<number> {
  const { data, error } = await supabase.rpc('get_direct_message_unread_total');
  if (error) throw new DirectMessagingServiceError(unavailableMessage);
  const value = Number(data);
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export async function listDirectMessages(
  conversationId: string,
  cursor: DirectMessageCursor | null = null,
  limit = 40,
): Promise<DirectMessageEntry[]> {
  if (!isDirectMessageUuid(conversationId)) throw new DirectMessagingServiceError(unavailableMessage);
  const { data, error } = await supabase.rpc('list_direct_messages', {
    target_conversation_id: conversationId,
    before_created_at: cursor?.createdAt ?? null,
    before_message_id: cursor?.id ?? null,
    requested_limit: Math.min(50, Math.max(1, Math.trunc(limit))),
  });
  if (error) throw new DirectMessagingServiceError(unavailableMessage);
  const messages = (Array.isArray(data) ? data : [])
    .map((row) => serializeDirectMessage(row as DirectMessageDatabaseRow))
    .filter((message): message is DirectMessage => Boolean(message));
  return attachQuestions(messages.reverse());
}

export async function sendDirectMessage(targetUserId: string, body: string): Promise<DirectMessageEntry> {
  const normalizedBody = body.trim();
  if (!isDirectMessageUuid(targetUserId) || normalizedBody.length < 1 || normalizedBody.length > 1000) {
    throw new DirectMessagingServiceError('Mesaj 1–1000 karakter arasında olmalı.');
  }
  const { data, error } = await supabase.rpc('send_direct_message', {
    target_user_id: targetUserId,
    message_body: normalizedBody,
  });
  if (error) throw new DirectMessagingServiceError(mutationErrorMessage(error));
  return { message: parseRpcMessage(data), question: null };
}

export async function sendQuestionToDirectMessage(
  targetUserId: string,
  questionId: unknown,
): Promise<DirectMessageEntry> {
  const normalizedQuestionId = normalizeQuestionId(questionId);
  if (!isDirectMessageUuid(targetUserId) || !normalizedQuestionId) {
    throw new DirectMessagingServiceError(mutationMessage);
  }
  const { data, error } = await supabase.rpc('send_question_to_direct_message', {
    target_user_id: targetUserId,
    shared_question_id: normalizedQuestionId,
  });
  if (error) throw new DirectMessagingServiceError(mutationErrorMessage(error));
  const message = parseRpcMessage(data);
  const questions = await fetchQuestionsById([normalizedQuestionId]);
  return { message, question: questions.get(normalizedQuestionId) ?? null };
}

export async function markConversationRead(conversationId: string): Promise<boolean> {
  if (!isDirectMessageUuid(conversationId)) return false;
  const { data, error } = await supabase.rpc('mark_conversation_read', {
    target_conversation_id: conversationId,
  });
  if (error) throw new DirectMessagingServiceError(mutationMessage);
  return data === true;
}

export async function blockDirectMessageUser(targetUserId: string): Promise<boolean> {
  if (!isDirectMessageUuid(targetUserId)) throw new DirectMessagingServiceError(mutationMessage);
  const { data, error } = await supabase.rpc('block_user', { target_user_id: targetUserId });
  if (error) throw new DirectMessagingServiceError(mutationMessage);
  return data === true;
}

export async function unblockDirectMessageUser(targetUserId: string): Promise<boolean> {
  if (!isDirectMessageUuid(targetUserId)) throw new DirectMessagingServiceError(mutationMessage);
  const { data, error } = await supabase.rpc('unblock_user', { target_user_id: targetUserId });
  if (error) throw new DirectMessagingServiceError(mutationMessage);
  return data === true;
}

export async function reportDirectMessageUser(options: {
  targetUserId: string;
  reason: UserReportReason;
  details?: string;
  conversationId?: string | null;
  messageId?: string | null;
}): Promise<string> {
  const details = options.details?.trim() ?? '';
  if (!isDirectMessageUuid(options.targetUserId)
    || !isUserReportReason(options.reason)
    || details.length > 500) throw new DirectMessagingServiceError(mutationMessage);
  const { data, error } = await supabase.rpc('report_user_or_message', {
    target_user_id: options.targetUserId,
    report_reason: options.reason,
    report_details: details || null,
    target_conversation_id: options.conversationId ?? null,
    target_message_id: options.messageId ?? null,
  });
  if (error || !isDirectMessageUuid(data)) throw new DirectMessagingServiceError(mutationMessage);
  return data;
}

export function subscribeToDirectMessages(
  conversationId: string,
  onMessage: (entry: DirectMessageEntry) => void,
  onStatus?: (status: string) => void,
): () => void {
  if (!isDirectMessageUuid(conversationId)) return () => undefined;
  let active = true;
  const channel: RealtimeChannel = supabase
    .channel(`direct-messages:${conversationId}:${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const message = serializeDirectMessage(payload.new as DirectMessageDatabaseRow);
        if (!message || !active) return;
        void attachQuestions([message]).then(([entry]) => {
          if (active && entry) onMessage(entry);
        }).catch(() => {
          if (active) onMessage({ message, question: null });
        });
      },
    )
    .subscribe((status) => onStatus?.(status));

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

/** One account-level invalidation channel. Postgres Changes applies the
 * direct_messages participant SELECT policy before delivering INSERT rows. */
export function subscribeToIncomingDirectMessages(
  userId: string,
  onIncoming: () => void,
  onStatus?: (status: string) => void,
): () => void {
  if (!isDirectMessageUuid(userId)) return () => undefined;
  let active = true;
  const channel: RealtimeChannel = supabase
    .channel(`direct-messages-unread:${userId}:${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'direct_messages' },
      (payload) => {
        if (!active || payload.new.sender_id === userId) return;
        onIncoming();
      },
    )
    .subscribe((status) => {
      if (active) onStatus?.(status);
    });

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}
