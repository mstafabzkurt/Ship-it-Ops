import {
  getGameCategory,
  isGameCategoryId,
  parseDifficultyStar,
  type DifficultyStar,
  type GameCategoryId,
} from '../config/gameCategories';
import type { PublicProfile } from './publicProfile';

export const ARCHIVED_QUESTION_SELECT = 'id, category_id, difficulty_star, tag, title, optimal_text, acceptable_text, wrong_text, fatal_text';

export interface ArchivedQuestion {
  id: string;
  categoryId: GameCategoryId;
  categoryName: string;
  difficultyStar: DifficultyStar;
  tag: string;
  title: string;
  answerOptions: string[];
}

export interface ArchivedQuestionDatabaseRow {
  id?: unknown;
  category_id?: unknown;
  difficulty_star?: unknown;
  tag?: unknown;
  title?: unknown;
  optimal_text?: unknown;
  acceptable_text?: unknown;
  wrong_text?: unknown;
  fatal_text?: unknown;
}

export interface QuestionFavorite {
  questionId: string;
  createdAt: string;
}

export interface QuestionFavoriteDatabaseRow {
  question_id?: unknown;
  created_at?: unknown;
}

export interface FavoriteQuestionEntry {
  favorite: QuestionFavorite;
  question: ArchivedQuestion;
}

export interface QuestionShare {
  id: string;
  senderId: string;
  recipientId: string;
  questionId: string;
  createdAt: string;
  openedAt: string | null;
}

export interface QuestionShareDatabaseRow {
  id?: unknown;
  sender_id?: unknown;
  recipient_id?: unknown;
  question_id?: unknown;
  created_at?: unknown;
  opened_at?: unknown;
}

export interface SharedQuestionEntry {
  source: SharedQuestionSource;
  share: QuestionShare;
  sender: PublicProfile | null;
  question: ArchivedQuestion | SharedQuestionPreview;
}

export type SharedQuestionSource = 'legacy' | 'direct_message';
export interface SharedQuestionDelivery {
  source: SharedQuestionSource;
  share: QuestionShare;
}

/** Prefer the DM record only when two sources have the exact same delivery timestamp. */
export function mergeReceivedQuestionDeliveries(
  legacy: QuestionShare[],
  directMessages: QuestionShare[],
): SharedQuestionDelivery[] {
  const legacyRows = legacy.map((share) => ({ source: 'legacy' as const, share }));
  const directRows = directMessages.map((share) => ({ source: 'direct_message' as const, share }));
  const directTimestamps = new Set(directMessages.flatMap((share) => {
    const time = Date.parse(share.createdAt);
    return Number.isFinite(time) ? [`${share.senderId}:${share.questionId}:${time}`] : [];
  }));
  const unique = new Map<string, SharedQuestionDelivery>();
  for (const delivery of [...legacyRows, ...directRows]) {
    const time = Date.parse(delivery.share.createdAt);
    if (delivery.source === 'legacy' && Number.isFinite(time)
      && directTimestamps.has(`${delivery.share.senderId}:${delivery.share.questionId}:${time}`)) continue;
    unique.set(`${delivery.source}:${delivery.share.id}`, delivery);
  }
  return [...unique.values()].sort((left, right) => {
    const leftTime = Date.parse(left.share.createdAt);
    const rightTime = Date.parse(right.share.createdAt);
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0)
      || right.share.id.localeCompare(left.share.id);
  });
}

/** Enough primary content to show a share whose optional archive metadata is absent. */
export interface SharedQuestionPreview {
  id: string;
  title: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QUESTION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export function normalizeQuestionId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return String(value);
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return QUESTION_ID_PATTERN.test(normalized) ? normalized : null;
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function deterministicAnswerOrder(questionId: string, answers: string[]): string[] {
  const score = (answer: string, index: number) => {
    let hash = index + 17;
    const input = `${questionId}:${answer}`;
    for (let cursor = 0; cursor < input.length; cursor += 1) {
      hash = ((hash * 31) + input.charCodeAt(cursor)) | 0;
    }
    return hash;
  };
  return answers
    .map((answer, index) => ({ answer, score: score(answer, index) }))
    .sort((left, right) => left.score - right.score)
    .map(({ answer }) => answer);
}

function parseAnswerOptions(row: ArchivedQuestionDatabaseRow): string[] | null {
  const answers = [row.optimal_text, row.acceptable_text, row.wrong_text, row.fatal_text]
    .map((answer) => typeof answer === 'string' ? answer.trim() : '')
    .filter(Boolean);
  return answers.length === 4 && new Set(answers).size === 4 ? answers : null;
}

export function serializeArchivedQuestion(
  row: ArchivedQuestionDatabaseRow,
): ArchivedQuestion | null {
  const id = normalizeQuestionId(row.id);
  if (!id || !isGameCategoryId(row.category_id)) return null;
  const difficultyStar = parseDifficultyStar(row.difficulty_star);
  if (!difficultyStar || typeof row.title !== 'string' || !row.title.trim()) return null;

  const answers = parseAnswerOptions(row);
  if (!answers) return null;

  return {
    id,
    categoryId: row.category_id,
    categoryName: getGameCategory(row.category_id).name,
    difficultyStar,
    tag: typeof row.tag === 'string' ? row.tag.trim().slice(0, 80) : '',
    title: row.title.trim(),
    answerOptions: deterministicAnswerOrder(id, answers),
  };
}

export function serializeSharedQuestionPreview(row: ArchivedQuestionDatabaseRow): SharedQuestionPreview | null {
  const id = normalizeQuestionId(row.id);
  return id && typeof row.title === 'string' && row.title.trim() && parseAnswerOptions(row)
    ? { id, title: row.title.trim() }
    : null;
}

export function serializeQuestionFavorite(
  row: QuestionFavoriteDatabaseRow,
): QuestionFavorite | null {
  const questionId = normalizeQuestionId(row.question_id);
  if (!questionId) return null;
  return {
    questionId,
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
  };
}

export function serializeQuestionShare(
  row: QuestionShareDatabaseRow,
): QuestionShare | null {
  const questionId = normalizeQuestionId(row.question_id);
  if (!isUuid(row.id) || !isUuid(row.sender_id) || !isUuid(row.recipient_id) || !questionId) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    questionId,
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    openedAt: typeof row.opened_at === 'string' ? row.opened_at : null,
  };
}
