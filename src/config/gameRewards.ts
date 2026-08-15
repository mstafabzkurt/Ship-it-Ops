export type EvaluationTier = 'optimal' | 'acceptable' | 'wrong' | 'fatal';

export interface EvaluationReward {
  careerXpDelta: number;
  reputationDelta: number;
  budgetDelta: number;
  feedback: string;
  isPositive: boolean;
}

const OUTCOME_BALANCE = {
  success: { careerXpDelta: 100, reputationDelta: 15, budgetDelta: 2_000 },
  partial: { careerXpDelta: 75, reputationDelta: 5, budgetDelta: 500 },
  fail: { careerXpDelta: 50, reputationDelta: -10, budgetDelta: -1_000 },
  timeout: { careerXpDelta: 35, reputationDelta: -15, budgetDelta: -2_000 },
} as const;

/** Fixed evaluation rewards. Question rows contain only prompt and option text. */
export const EVALUATION_REWARDS: Record<EvaluationTier, EvaluationReward> = {
  optimal: { ...OUTCOME_BALANCE.success, feedback: 'Optimal müdahale. Kriz hızla ve doğru şekilde kontrol altına alındı.', isPositive: true },
  acceptable: { ...OUTCOME_BALANCE.partial, feedback: 'Kabul edilebilir müdahale. Durum kontrol altında.', isPositive: true },
  wrong: { ...OUTCOME_BALANCE.fail, feedback: 'Yanlış müdahale. Krizin etkisi arttı.', isPositive: false },
  fatal: { ...OUTCOME_BALANCE.fail, feedback: 'Kritik hata. Müdahale krizi daha da kötüleştirdi.', isPositive: false },
};

export const TIMEOUT_REWARD: EvaluationReward = {
  ...OUTCOME_BALANCE.timeout,
  feedback: 'Kritik hata. Müdahale krizi daha da kötüleştirdi.',
  isPositive: false,
};
