import { supabase } from '../supabase';
import {
  createFriendConnection,
  getOtherRelationshipUserId,
  isUuid,
  serializeFriendRelationship,
  serializeSocialProfileStats,
  type FriendConnection,
  type FriendRelationship,
  type FriendRelationshipDatabaseRow,
  type SocialProfileStats,
  type SocialProfileStatsDatabaseRow,
} from '../utils/friends';
import {
  PUBLIC_PROFILE_SELECT,
  serializePublicProfile,
  type PublicProfile,
  type PublicProfileDatabaseRow,
} from '../utils/publicProfile';

const RELATIONSHIP_SELECT = 'id, requester_id, addressee_id, status, created_at, updated_at';
const unavailableMessage = 'Arkadaşlık bilgilerine şu anda ulaşılamıyor. Tekrar dene.';
const mutationMessage = 'Arkadaşlık işlemi tamamlanamadı. Tekrar dene.';

export class FriendServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendServiceError';
  }
}

function parseRelationships(data: unknown): FriendRelationship[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => serializeFriendRelationship(row as FriendRelationshipDatabaseRow))
    .filter((relationship): relationship is FriendRelationship => Boolean(relationship));
}

function parseRpcRelationship(data: unknown): FriendRelationship {
  const row = Array.isArray(data) ? data[0] : data;
  const relationship = row
    ? serializeFriendRelationship(row as FriendRelationshipDatabaseRow)
    : null;
  if (!relationship) throw new FriendServiceError(mutationMessage);
  return relationship;
}

async function attachPublicProfiles(
  relationships: FriendRelationship[],
  currentUserId: string,
): Promise<FriendConnection[]> {
  const otherUserIds = [...new Set(relationships
    .map((relationship) => getOtherRelationshipUserId(relationship, currentUserId))
    .filter((userId): userId is string => Boolean(userId)))];

  const profilesByUserId = new Map<string, PublicProfile>();
  if (otherUserIds.length > 0) {
    const { data, error } = await supabase
      .from('public_profiles')
      .select(PUBLIC_PROFILE_SELECT)
      .in('user_id', otherUserIds);

    if (error) throw new FriendServiceError(unavailableMessage);
    for (const row of Array.isArray(data) ? data : []) {
      const profile = serializePublicProfile(row as PublicProfileDatabaseRow);
      if (profile) profilesByUserId.set(profile.userId, profile);
    }
  }

  return relationships
    .map((relationship) => {
      const otherUserId = getOtherRelationshipUserId(relationship, currentUserId);
      return createFriendConnection(
        relationship,
        currentUserId,
        otherUserId ? profilesByUserId.get(otherUserId) ?? null : null,
      );
    })
    .filter((connection): connection is FriendConnection => Boolean(connection));
}

export async function getRelationshipWithUser(
  userId: string,
  currentUserId: string,
): Promise<FriendRelationship | null> {
  if (!isUuid(userId) || !isUuid(currentUserId) || userId === currentUserId) return null;

  const { data, error } = await supabase
    .from('friend_relationships')
    .select(RELATIONSHIP_SELECT)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .maybeSingle();

  if (error) throw new FriendServiceError(unavailableMessage);
  return data ? serializeFriendRelationship(data as FriendRelationshipDatabaseRow) : null;
}

export async function listFriends(currentUserId: string): Promise<FriendConnection[]> {
  if (!isUuid(currentUserId)) return [];
  const { data, error } = await supabase
    .from('friend_relationships')
    .select(RELATIONSHIP_SELECT)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    .order('updated_at', { ascending: false });
  if (error) throw new FriendServiceError(unavailableMessage);

  const connections = await attachPublicProfiles(parseRelationships(data), currentUserId);
  return connections.sort((left, right) => (
    (left.profile?.companyName ?? '').localeCompare(right.profile?.companyName ?? '', 'tr')
  ));
}

export async function listIncomingRequests(currentUserId: string): Promise<FriendConnection[]> {
  if (!isUuid(currentUserId)) return [];
  const { data, error } = await supabase
    .from('friend_relationships')
    .select(RELATIONSHIP_SELECT)
    .eq('addressee_id', currentUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new FriendServiceError(unavailableMessage);
  return attachPublicProfiles(parseRelationships(data), currentUserId);
}

export async function listOutgoingRequests(currentUserId: string): Promise<FriendConnection[]> {
  if (!isUuid(currentUserId)) return [];
  const { data, error } = await supabase
    .from('friend_relationships')
    .select(RELATIONSHIP_SELECT)
    .eq('requester_id', currentUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new FriendServiceError(unavailableMessage);
  return attachPublicProfiles(parseRelationships(data), currentUserId);
}

export async function countIncomingFriendRequests(currentUserId: string): Promise<number> {
  if (!isUuid(currentUserId)) return 0;
  const { count, error } = await supabase
    .from('friend_relationships')
    .select('id', { count: 'exact', head: true })
    .eq('addressee_id', currentUserId)
    .eq('status', 'pending');
  if (error) throw new FriendServiceError(unavailableMessage);
  return Math.max(0, count ?? 0);
}

export async function getSocialProfileStats(userId: string): Promise<SocialProfileStats> {
  if (!isUuid(userId)) throw new FriendServiceError(unavailableMessage);
  const { data, error } = await supabase.rpc('get_social_profile_stats', {
    target_user_id: userId,
  });
  if (error) throw new FriendServiceError(unavailableMessage);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') throw new FriendServiceError(unavailableMessage);
  return serializeSocialProfileStats(row as SocialProfileStatsDatabaseRow);
}

export async function sendFriendRequest(userId: string): Promise<FriendRelationship> {
  if (!isUuid(userId)) throw new FriendServiceError(mutationMessage);
  const { data, error } = await supabase.rpc('send_friend_request', {
    target_user_id: userId,
  });
  if (error) throw new FriendServiceError(mutationMessage);
  return parseRpcRelationship(data);
}

async function respondFriendRequest(
  requestId: string,
  responseAction: 'accept' | 'reject',
): Promise<FriendRelationship> {
  if (!isUuid(requestId)) throw new FriendServiceError(mutationMessage);
  const { data, error } = await supabase.rpc('respond_friend_request', {
    request_id: requestId,
    response_action: responseAction,
  });
  if (error) throw new FriendServiceError(mutationMessage);
  return parseRpcRelationship(data);
}

export function acceptFriendRequest(requestId: string): Promise<FriendRelationship> {
  return respondFriendRequest(requestId, 'accept');
}

export function rejectFriendRequest(requestId: string): Promise<FriendRelationship> {
  return respondFriendRequest(requestId, 'reject');
}

export async function removeFriend(userId: string): Promise<boolean> {
  if (!isUuid(userId)) throw new FriendServiceError(mutationMessage);
  const { data, error } = await supabase.rpc('remove_friend', {
    friend_user_id: userId,
  });
  if (error) throw new FriendServiceError(mutationMessage);
  return data === true;
}
