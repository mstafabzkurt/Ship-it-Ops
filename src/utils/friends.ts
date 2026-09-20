import type { PublicProfile } from './publicProfile';

export type FriendRelationshipStatus = 'pending' | 'accepted' | 'rejected';
export type FriendRelationshipDirection = 'incoming' | 'outgoing' | 'accepted' | 'rejected';

export interface FriendRelationship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendRelationshipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRelationshipDatabaseRow {
  id?: unknown;
  requester_id?: unknown;
  addressee_id?: unknown;
  status?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface FriendConnection {
  relationship: FriendRelationship;
  userId: string;
  profile: PublicProfile | null;
}

export interface SocialProfileStats {
  friendCount: number;
  mutualFriendCount: number;
}

export interface SocialProfileStatsDatabaseRow {
  friend_count?: unknown;
  mutual_friend_count?: unknown;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function serializeFriendRelationship(
  row: FriendRelationshipDatabaseRow,
): FriendRelationship | null {
  const id = typeof row.id === 'string' ? row.id : '';
  const requesterId = typeof row.requester_id === 'string' ? row.requester_id : '';
  const addresseeId = typeof row.addressee_id === 'string' ? row.addressee_id : '';
  const status = row.status;

  if (!isUuid(id) || !isUuid(requesterId) || !isUuid(addresseeId)) return null;
  if (status !== 'pending' && status !== 'accepted' && status !== 'rejected') return null;

  return {
    id,
    requesterId,
    addresseeId,
    status,
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
  };
}

export function getOtherRelationshipUserId(
  relationship: FriendRelationship,
  currentUserId: string,
): string | null {
  if (relationship.requesterId === currentUserId) return relationship.addresseeId;
  if (relationship.addresseeId === currentUserId) return relationship.requesterId;
  return null;
}

export function getFriendRelationshipDirection(
  relationship: FriendRelationship,
  currentUserId: string,
): FriendRelationshipDirection | null {
  if (!getOtherRelationshipUserId(relationship, currentUserId)) return null;
  if (relationship.status === 'accepted') return 'accepted';
  if (relationship.status === 'rejected') return 'rejected';
  return relationship.addresseeId === currentUserId ? 'incoming' : 'outgoing';
}

export function getFriendshipStatusLabel(
  direction: FriendRelationshipDirection | null,
): string | null {
  if (direction === 'incoming') return 'Sana arkadaşlık isteği gönderdi';
  if (direction === 'outgoing') return 'İstek Gönderildi';
  if (direction === 'accepted') return 'Arkadaşsınız';
  return null;
}

function nonNegativeInteger(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
}

export function serializeSocialProfileStats(
  row: SocialProfileStatsDatabaseRow,
): SocialProfileStats {
  return {
    friendCount: nonNegativeInteger(row.friend_count),
    mutualFriendCount: nonNegativeInteger(row.mutual_friend_count),
  };
}

export function createFriendConnection(
  relationship: FriendRelationship,
  currentUserId: string,
  profile: PublicProfile | null,
): FriendConnection | null {
  const userId = getOtherRelationshipUserId(relationship, currentUserId);
  return userId ? { relationship, userId, profile } : null;
}
