import type { AchievementId } from '../config/achievements';
import { clampBudget } from './budget';

export interface BadgeRewardCandidate {
  id: AchievementId;
  earned: boolean;
  budgetReward: number;
}

export interface BadgeRewardGrantPlan {
  budget: number;
  claimedBadgeRewardIds: AchievementId[];
  unseenBadgeIds: AchievementId[];
  newlyRewardedBadgeIds: AchievementId[];
  budgetRewardTotal: number;
}

const uniqueIds = (ids: readonly AchievementId[]): AchievementId[] => [...new Set(ids)];

/**
 * Plans badge payouts from explicit claim state. Visual/new state is output only
 * and never participates in deciding whether money is granted.
 */
export function planBadgeRewardGrants({
  badges,
  claimedBadgeRewardIds,
  unseenBadgeIds,
  budget,
}: {
  badges: readonly BadgeRewardCandidate[];
  claimedBadgeRewardIds: readonly AchievementId[];
  unseenBadgeIds: readonly AchievementId[];
  budget: number;
}): BadgeRewardGrantPlan {
  const claimed = new Set(claimedBadgeRewardIds);
  const newlyRewarded = badges.filter((badge) => badge.earned && !claimed.has(badge.id));
  const newlyRewardedBadgeIds = newlyRewarded.map((badge) => badge.id);
  const budgetRewardTotal = newlyRewarded.reduce((total, badge) => total + badge.budgetReward, 0);

  return {
    budget: clampBudget(budget + budgetRewardTotal),
    claimedBadgeRewardIds: uniqueIds([...claimedBadgeRewardIds, ...newlyRewardedBadgeIds]),
    unseenBadgeIds: uniqueIds([...unseenBadgeIds, ...newlyRewardedBadgeIds]),
    newlyRewardedBadgeIds,
    budgetRewardTotal,
  };
}
