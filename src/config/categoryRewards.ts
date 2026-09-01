import type { DifficultyStar } from './gameCategories';
import type { EvaluationReward, EvaluationTier } from './gameRewards';

export type CategoryOutcome = 'success' | 'fail' | 'timeout';

export function getCategoryChoiceOutcome(choice: EvaluationTier): Exclude<CategoryOutcome, 'timeout'> {
  return choice === 'optimal' ? 'success' : 'fail';
}

const REWARDS: Record<DifficultyStar, Record<CategoryOutcome, Omit<EvaluationReward, 'feedback' | 'isPositive'>>> = {
  1: {
    success: { careerXpDelta: 100, reputationDelta: 10, budgetDelta: 300 },
    fail: { careerXpDelta: 25, reputationDelta: -10, budgetDelta: -100 },
    timeout: { careerXpDelta: 15, reputationDelta: -15, budgetDelta: -150 },
  },
  2: {
    success: { careerXpDelta: 125, reputationDelta: 12, budgetDelta: 400 },
    fail: { careerXpDelta: 30, reputationDelta: -10, budgetDelta: -125 },
    timeout: { careerXpDelta: 20, reputationDelta: -15, budgetDelta: -175 },
  },
  3: {
    success: { careerXpDelta: 150, reputationDelta: 15, budgetDelta: 500 },
    fail: { careerXpDelta: 35, reputationDelta: -10, budgetDelta: -150 },
    timeout: { careerXpDelta: 25, reputationDelta: -15, budgetDelta: -200 },
  },
};

const FEEDBACK: Record<CategoryOutcome, string> = {
  success: 'Doğru seçenek onaylandı.',
  fail: 'Doğru cevabı inceleyip sonraki soruya geçebilirsin.',
  timeout: 'Bu soru cevaplanmadığı için yanlış olarak kaydedildi.',
};

export function getCategoryReward(star: DifficultyStar, outcome: CategoryOutcome): EvaluationReward {
  return {
    ...REWARDS[star][outcome],
    feedback: FEEDBACK[outcome],
    isPositive: outcome === 'success',
  };
}
