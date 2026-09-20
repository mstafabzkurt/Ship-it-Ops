import { supabase } from '../supabase';
import {
  PUBLIC_PROFILE_RESULT_LIMIT,
  PUBLIC_PROFILE_SELECT,
  normalizePublicProfileQuery,
  normalizePublicProfileResultLimit,
  serializePublicProfile,
  type PublicProfile,
  type PublicProfileDatabaseRow,
} from '../utils/publicProfile';

export class PublicProfileServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicProfileServiceError';
  }
}

const unavailableMessage = 'Şirket profillerine şu anda ulaşılamıyor. Tekrar dene.';

export async function searchPublicProfiles(
  candidate: string,
  currentUserId: string,
  limit = PUBLIC_PROFILE_RESULT_LIMIT,
): Promise<PublicProfile[]> {
  const query = normalizePublicProfileQuery(candidate);
  if (!query) return [];

  const { data, error } = await supabase.rpc('search_public_profiles', {
    search_query: query,
    result_limit: normalizePublicProfileResultLimit(limit),
  });
  if (error) throw new PublicProfileServiceError(unavailableMessage);

  return (Array.isArray(data) ? data : [])
    .map((row) => serializePublicProfile(row as PublicProfileDatabaseRow))
    .filter((profile): profile is PublicProfile => Boolean(profile) && profile?.userId !== currentUserId)
    .slice(0, PUBLIC_PROFILE_RESULT_LIMIT);
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('public_profiles')
    .select(PUBLIC_PROFILE_SELECT)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new PublicProfileServiceError(unavailableMessage);
  return data ? serializePublicProfile(data as PublicProfileDatabaseRow) : null;
}
