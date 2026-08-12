export type EvaluationTier = 'optimal' | 'acceptable' | 'wrong' | 'fatal';

export interface EvaluationReward {
  reputationDelta: number;
  budgetDelta: number;
  feedback: string;
  isPositive: boolean;
}

/** Fixed evaluation rewards. Question rows contain only prompt and option text. */
export const EVALUATION_REWARDS: Record<EvaluationTier, EvaluationReward> = {
  optimal: { reputationDelta: 15, budgetDelta: 2_000, feedback: 'Optimal müdahale. Kriz hızla ve doğru şekilde kontrol altına alındı.', isPositive: true },
  acceptable: { reputationDelta: 5, budgetDelta: 750, feedback: 'Kabul edilebilir müdahale. Durum kontrol altında.', isPositive: true },
  wrong: { reputationDelta: -5, budgetDelta: -750, feedback: 'Yanlış müdahale. Krizin etkisi arttı.', isPositive: false },
  fatal: { reputationDelta: -15, budgetDelta: -2_000, feedback: 'Kritik hata. Müdahale krizi daha da kötüleştirdi.', isPositive: false },
};
