const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type LeaderboardProfileDestination =
  | { kind: 'own-profile' }
  | { kind: 'public-profile'; userId: string };

export function getLeaderboardProfileDestination(
  userId: unknown,
  currentUserId: string | null | undefined,
): LeaderboardProfileDestination | null {
  if (typeof userId !== 'string' || !UUID_PATTERN.test(userId)) return null;
  if (userId === currentUserId) return { kind: 'own-profile' };
  return { kind: 'public-profile', userId };
}
