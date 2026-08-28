export const JOKER_PRICES = {
  serverScaleUp: 2_000,
  codeReview: 3_000,
  snapshotBackup: 4_000,
  gitRevert: 5_000,
} as const;

export type JokerId = keyof typeof JOKER_PRICES;
export type JokerInventory = Record<JokerId, number>;

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
): JokerPurchasePlan {
  const price = JOKER_PRICES[jokerId];
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
