import type { PublicProfile } from './publicProfile';
import type { ArchivedQuestion } from './questionSocial';

export type DirectMessageType = 'text' | 'question_share';
export type UserReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: DirectMessageType;
  body: string | null;
  questionId: string | null;
  createdAt: string;
}
export interface DirectMessageDatabaseRow {
  id?: unknown;
  conversation_id?: unknown;
  sender_id?: unknown;
  message_type?: unknown;
  body?: unknown;
  question_id?: unknown;
  created_at?: unknown;
}

export interface DirectMessageEntry {
  message: DirectMessage;
  question: ArchivedQuestion | null;
}

export interface DirectConversationContext {
  conversationId: string | null;
  canSend: boolean;
  isFriend: boolean;
  blockedByViewer: boolean;
}

export interface DirectConversationContextDatabaseRow {
  conversation_id?: unknown;
  can_send?: unknown;
  is_friend?: unknown;
  blocked_by_viewer?: unknown;
}

export interface DirectConversationSummary {
  conversationId: string;
  otherUserId: string;
  updatedAt: string;
  lastMessage: DirectMessage | null;
  unreadCount: number;
  profile: PublicProfile | null;
}

export interface DirectConversationSummaryDatabaseRow {
  conversation_id?: unknown;
  other_user_id?: unknown;
  conversation_updated_at?: unknown;
  last_message_id?: unknown;
  last_message_sender_id?: unknown;
  last_message_type?: unknown;
  last_message_body?: unknown;
  last_message_question_id?: unknown;
  last_message_created_at?: unknown;
  unread_count?: unknown;
}

export interface DirectMessageCursor {
  createdAt: string;
  id: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDirectMessageUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isUserReportReason(value: unknown): value is UserReportReason {
  return value === 'spam'
    || value === 'harassment'
    || value === 'inappropriate'
    || value === 'other';
}

export function serializeDirectMessage(row: DirectMessageDatabaseRow): DirectMessage | null {
  if (!isDirectMessageUuid(row.id)
    || !isDirectMessageUuid(row.conversation_id)
    || !isDirectMessageUuid(row.sender_id)
    || typeof row.created_at !== 'string') return null;

  if (row.message_type === 'text') {
    if (typeof row.body !== 'string' || row.body.length < 1 || row.body.length > 1000) return null;
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      messageType: 'text',
      body: row.body,
      questionId: null,
      createdAt: row.created_at,
    };
  }

  if (row.message_type === 'question_share'
    && typeof row.question_id === 'string'
    && row.question_id.trim()) {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      messageType: 'question_share',
      body: null,
      questionId: row.question_id.trim(),
      createdAt: row.created_at,
    };
  }

  return null;
}

export function serializeDirectConversationContext(
  row: DirectConversationContextDatabaseRow,
): DirectConversationContext {
  return {
    conversationId: isDirectMessageUuid(row.conversation_id) ? row.conversation_id : null,
    canSend: row.can_send === true,
    isFriend: row.is_friend === true,
    blockedByViewer: row.blocked_by_viewer === true,
  };
}

export function serializeDirectConversationSummary(
  row: DirectConversationSummaryDatabaseRow,
): Omit<DirectConversationSummary, 'profile'> | null {
  if (!isDirectMessageUuid(row.conversation_id) || !isDirectMessageUuid(row.other_user_id)) {
    return null;
  }

  const hasLastMessage = row.last_message_id !== null && row.last_message_id !== undefined;
  const lastMessage = hasLastMessage
    ? serializeDirectMessage({
      id: row.last_message_id,
      conversation_id: row.conversation_id,
      sender_id: row.last_message_sender_id,
      message_type: row.last_message_type,
      body: row.last_message_body,
      question_id: row.last_message_question_id,
      created_at: row.last_message_created_at,
    })
    : null;
  const numericUnread = Number(row.unread_count);

  return {
    conversationId: row.conversation_id,
    otherUserId: row.other_user_id,
    updatedAt: typeof row.conversation_updated_at === 'string' ? row.conversation_updated_at : '',
    lastMessage,
    unreadCount: Number.isFinite(numericUnread) ? Math.max(0, Math.trunc(numericUnread)) : 0,
  };
}

export function compareDirectMessages(left: DirectMessage, right: DirectMessage): number {
  const timestampOrder = left.createdAt.localeCompare(right.createdAt);
  return timestampOrder || left.id.localeCompare(right.id);
}

export function mergeDirectMessageEntries(
  current: DirectMessageEntry[],
  incoming: DirectMessageEntry[],
): DirectMessageEntry[] {
  const byId = new Map(current.map((entry) => [entry.message.id, entry]));
  for (const entry of incoming) byId.set(entry.message.id, entry);
  return [...byId.values()].sort((left, right) => compareDirectMessages(left.message, right.message));
}

export function getDirectMessageCursor(message: DirectMessage): DirectMessageCursor {
  return { createdAt: message.createdAt, id: message.id };
}

export function getDirectMessagePreview(message: DirectMessage | null): string {
  if (!message) return 'Konuşma hazır';
  if (message.messageType === 'question_share') return 'Bir soru paylaştı';
  return message.body ?? '';
}
