import type { CategoryQuestionId } from './categoryQuestions';

export interface SessionReputationResult {
  questionId: CategoryQuestionId;
  reputationDelta: number;
}

export function deriveSessionReputation(results: readonly SessionReputationResult[]): number {
  return results.reduce((total, result) => total + result.reputationDelta, 0);
}

export function upsertSessionResult<T extends SessionReputationResult>(
  results: readonly T[],
  result: T,
): T[] {
  const existingIndex = results.findIndex((entry) => entry.questionId === result.questionId);
  if (existingIndex < 0) return [...results, result];
  return results.map((entry, index) => (index === existingIndex ? result : entry));
}

export function removeSessionResult<T extends SessionReputationResult>(
  results: readonly T[],
  questionId: CategoryQuestionId,
): T[] {
  return results.filter((result) => result.questionId !== questionId);
}
