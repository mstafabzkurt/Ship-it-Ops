import type { RankTier } from './progression';

export const JOKER_BASE_PRICES = {
  serverScaleUp: 200,
  codeReview: 250,
  snapshotBackup: 300,
  gitRevert: 400,
} as const;

export type JokerId = keyof typeof JOKER_BASE_PRICES;
export type JokerInventory = Record<JokerId, number>;

export const JOKER_RANK_MULTIPLIERS: Record<RankTier, number> = {
  junior: 1,
  engineer: 1.2,
  senior: 1.4,
  lead: 1.6,
  manager: 1.8,
  director: 2,
  cto: 2.2,
};

export function getJokerPrice(jokerId: JokerId, rankTier: RankTier): number {
  return Math.round((JOKER_BASE_PRICES[jokerId] * JOKER_RANK_MULTIPLIERS[rankTier]) / 10) * 10;
}

export type JokerPurchasePlan =
  | { status: 'insufficient_funds' }
  | { status: 'ok'; budget: number; inventory: JokerInventory };

export const JOKER_STORE_ORDER: readonly JokerId[] = [
  'serverScaleUp',
  'codeReview',
  'snapshotBackup',
  'gitRevert',
];

export function planJokerPurchase(
  budget: number,
  inventory: JokerInventory,
  jokerId: JokerId,
  rankTier: RankTier,
): JokerPurchasePlan {
  const price = getJokerPrice(jokerId, rankTier);
  if (budget < price) return { status: 'insufficient_funds' };

  return {
    status: 'ok',
    budget: budget - price,
    inventory: {
      ...inventory,
      [jokerId]: inventory[jokerId] + 1,
    },
  };
}
