import {
  QUESTIONS_PER_TIER,
  type DifficultyStar,
  type GameCategoryId,
} from '../config/gameCategories';

export type CategoryQuestionId = number | string;

export interface CategoryQuestionRow {
  id: CategoryQuestionId;
  rank_level: number | null;
  category_id: string | null;
  difficulty_star: number | null;
  tag: string;
  title: string;
  optimal_text: string;
  acceptable_text: string;
  wrong_text: string;
  fatal_text: string;
}

export interface CategoryQuestion extends Omit<CategoryQuestionRow, 'category_id' | 'difficulty_star'> {
  category_id: GameCategoryId;
  difficulty_star: DifficultyStar;
}

export function isValidCategoryQuestion(
  row: CategoryQuestionRow,
  categoryId: GameCategoryId,
  star: DifficultyStar,
): row is CategoryQuestion {
  if (row.category_id !== categoryId || row.difficulty_star !== star) return false;
  const hasValidId = (typeof row.id === 'number' && Number.isInteger(row.id) && row.id > 0)
    || (typeof row.id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(row.id.trim()));
  if (!hasValidId || typeof row.title !== 'string' || !row.title.trim()) return false;
  const choices = [row.optimal_text, row.acceptable_text, row.wrong_text, row.fatal_text];
  return choices.every((choice) => typeof choice === 'string' && choice.trim().length > 0)
    && new Set(choices.map((choice) => choice.trim())).size === 4;
}

export function filterCategoryQuestions(
  rows: readonly CategoryQuestionRow[],
  categoryId: GameCategoryId,
  star: DifficultyStar,
): CategoryQuestion[] {
  return rows.filter((row) => isValidCategoryQuestion(row, categoryId, star));
}

export function hasEnoughCategoryQuestions(questionCount: number): boolean {
  return Number.isInteger(questionCount) && questionCount >= QUESTIONS_PER_TIER;
}
