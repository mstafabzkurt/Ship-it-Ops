import {
  DEFAULT_AVATAR_FRAME_ID,
  DEFAULT_AVATAR_ID,
  getCosmeticById,
  isCosmeticId,
  type AvatarCosmetic,
  type AvatarCosmeticId,
  type AvatarFrameCosmetic,
  type AvatarFrameCosmeticId,
} from '../config/cosmetics';

export interface ResolvedLeaderboardCosmetics {
  avatar: AvatarCosmetic;
  frame: AvatarFrameCosmetic;
  avatarId: AvatarCosmeticId;
  avatarFrameId: AvatarFrameCosmeticId;
}

export function resolveLeaderboardCosmetics(
  avatarId: unknown,
  avatarFrameId: unknown,
): ResolvedLeaderboardCosmetics {
  const avatarCandidate = isCosmeticId(avatarId) ? getCosmeticById(avatarId) : null;
  const frameCandidate = isCosmeticId(avatarFrameId) ? getCosmeticById(avatarFrameId) : null;
  const safeAvatarId = avatarCandidate?.type === 'avatar'
    ? avatarCandidate.id
    : DEFAULT_AVATAR_ID;
  const safeFrameId = frameCandidate?.type === 'avatar_frame'
    ? frameCandidate.id
    : DEFAULT_AVATAR_FRAME_ID;

  return {
    avatarId: safeAvatarId,
    avatarFrameId: safeFrameId,
    avatar: getCosmeticById(safeAvatarId) as AvatarCosmetic,
    frame: getCosmeticById(safeFrameId) as AvatarFrameCosmetic,
  };
}
