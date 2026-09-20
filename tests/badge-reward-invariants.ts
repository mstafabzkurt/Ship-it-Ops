import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ACHIEVEMENTS } from '../src/config/achievements';
import { planBadgeRewardGrants } from '../src/utils/badgeRewards';
import { createDefaultCategoryProgress } from '../src/utils/categoryProgress';
import {
  createDefaultPlayerSave,
  normalizePlayerSave,
  PLAYER_SAVE_VERSION,
  selectAuthenticatedSaveSource,
} from '../src/utils/playerSave';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(PLAYER_SAVE_VERSION === 5, 'Completed-session persistence must use player save version 5');
assert(ACHIEVEMENTS.length === 19, 'Badge rewards must extend the existing 19-badge catalog');
assert(new Set(ACHIEVEMENTS.map((badge) => badge.id)).size === ACHIEVEMENTS.length, 'Badge IDs must remain stable and unique');
assert(
  ACHIEVEMENTS.every((badge) => Number.isInteger(badge.budgetReward) && badge.budgetReward > 0),
  'Every badge must define a positive numeric budgetReward',
);
assert(
  ACHIEVEMENTS.every((badge) => badge.budgetReward >= 300 && badge.budgetReward <= 5_000),
  'Badge rewards must stay inside the intended 300-5,000 economy range',
);
assert(ACHIEVEMENTS.find((badge) => badge.id === 'team_lead_rank')?.budgetReward === 2_000, 'Takım Lideri reward must be 2,000');
assert(ACHIEVEMENTS.find((badge) => badge.id === 'cto_rank')?.budgetReward === 5_000, 'CTO reward must be 5,000');

const newlyEarned = ACHIEVEMENTS.map((badge) => ({
  ...badge,
  earned: badge.id === 'first_correct',
}));
const firstGrant = planBadgeRewardGrants({
  badges: newlyEarned,
  claimedBadgeRewardIds: [],
  unseenBadgeIds: [],
  budget: 1_000,
});
assert(firstGrant.budget === 1_300, 'A newly earned badge must add its reward to company budget');
assert(firstGrant.budgetRewardTotal === 300, 'The badge grant summary must report the granted budget');
assert(firstGrant.claimedBadgeRewardIds.join(',') === 'first_correct', 'A paid badge must become claimed');
assert(firstGrant.unseenBadgeIds.join(',') === 'first_correct', 'A newly earned badge must become unseen');

const repeatedGrant = planBadgeRewardGrants({
  badges: newlyEarned,
  claimedBadgeRewardIds: firstGrant.claimedBadgeRewardIds,
  unseenBadgeIds: [],
  budget: firstGrant.budget,
});
assert(repeatedGrant.budget === firstGrant.budget, 'Recalculation must not pay an already-claimed badge twice');
assert(repeatedGrant.budgetRewardTotal === 0, 'Claim state must be the sole exactly-once payout guard');
assert(repeatedGrant.unseenBadgeIds.length === 0, 'A seen claimed badge must not become unseen again during recalculation');

const historicalSave = normalizePlayerSave({
  saveVersion: 3,
  careerXp: 0,
  reputation: 0,
  companyBudget: 8_250,
  correctAnswers: 10,
  wrongAnswers: 0,
  categoryProgress: createDefaultCategoryProgress(),
});
assert(historicalSave.companyBudget === 8_250, 'Migration must not retroactively increase an existing player budget');
assert(historicalSave.claimedBadgeRewardIds.includes('first_session'), 'Historically earned badges must baseline as claimed');
assert(historicalSave.claimedBadgeRewardIds.includes('first_correct'), 'Historical correct-answer badges must baseline as claimed');
assert(historicalSave.unseenBadgeIds.length === 0, 'Historical badges must not create unread notifications');

const currentSave = normalizePlayerSave({
  saveVersion: 4,
  claimedBadgeRewardIds: ['first_correct'],
  unseenBadgeIds: ['first_correct'],
});
assert(currentSave.claimedBadgeRewardIds.join(',') === 'first_correct', 'Current claimed badge IDs must survive normalization');
assert(currentSave.unseenBadgeIds.join(',') === 'first_correct', 'Current unseen badge IDs must survive normalization');
const accountASave = selectAuthenticatedSaveSource(currentSave, null).save;
const accountBSave = selectAuthenticatedSaveSource(createDefaultPlayerSave(), null).save;
assert(accountASave.unseenBadgeIds.join(',') === 'first_correct', 'The matching account must retain its unseen badge state');
assert(accountBSave.unseenBadgeIds.length === 0, 'A different account must not inherit unseen badge state');

const root = process.cwd();
const contextSource = readFileSync(resolve(root, 'src/state/ReputationContext.tsx'), 'utf8');
const careerSource = readFileSync(resolve(root, 'app/(tabs)/reputation.tsx'), 'utf8');
const tabsSource = readFileSync(resolve(root, 'app/(tabs)/_layout.tsx'), 'utf8');
const cardSource = readFileSync(resolve(root, 'src/components/reputation/AchievementCard.tsx'), 'utf8');
const gameSource = readFileSync(resolve(root, 'app/(tabs)/game.tsx'), 'utf8');
const migrationSource = readFileSync(resolve(root, 'supabase/migrations/20260909120000_add_badge_reward_state.sql'), 'utf8');

assert(contextSource.includes('claimedBadgeRewardIdsRef.current'), 'Runtime payout checks must use an immediate claimed-ID ref');
assert(contextSource.includes('planBadgeRewardGrants({'), 'Session progression must run the exactly-once badge reward planner');
assert(contextSource.includes('markBadgesSeen'), 'The context must expose a persisted unseen-state clear action');
assert(careerSource.includes("!isScreenFocused || activeTab !== 'badges'") && careerSource.includes('markBadgesSeen()'), 'Only opening the focused Rozetler view may clear persisted unseen IDs');
assert(careerSource.includes('isNew={newlyViewedBadgeIdSet.has(badge.id)}'), 'New badges must retain a local highlight after unread state clears');
assert(tabsSource.includes("tabBarAccessibilityLabel: hasNewBadge ? 'Kariyer, yeni rozet var'"), 'Bottom Career navigation must announce new badges');
assert(cardSource.includes('Yeni') && cardSource.includes('badge.budgetReward'), 'Badge cards must show new state and permanent reward copy');
assert(gameSource.includes('operationCompletion.badgeBudgetReward'), 'Session completion must show compact badge reward feedback');
assert(gameSource.includes('sessionCommittedRef.current = true'), 'Badge payouts must remain behind the completed-session exactly-once guard');
assert(migrationSource.includes('claimed_badge_reward_ids') && migrationSource.includes('unseen_badge_ids'), 'Cloud save migration must persist both badge state arrays');
assert(!readFileSync(resolve(root, 'src/utils/badgeRewards.ts'), 'utf8').includes('leaderboard'), 'Badge reward planning must remain independent from leaderboard score');

console.log('Badge reward and notification invariants passed.');
