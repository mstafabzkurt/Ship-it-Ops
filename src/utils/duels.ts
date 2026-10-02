import { isUuid } from './friends';

export type DuelStatus = 'pending' | 'active' | 'completed' | 'forfeited' | 'declined' | 'cancelled' | 'expired';

export interface DuelSummary {
  id: string;
  inviterId: string;
  inviteeId: string;
  opponentId: string;
  status: DuelStatus;
  createdAt: string;
  expiresAt: string;
  startsAt: string | null;
  completedAt: string | null;
  winnerId: string | null;
  forfeitedBy: string | null;
  myScore: number;
  opponentScore: number;
  myResponseMs: number;
  opponentResponseMs: number;
  serverNow: string;
}

export interface DuelQuestion {
  roundIndex: number;
  category: string;
  prompt: string;
  options: string[];
  roundStartsAt: string;
  roundEndsAt: string;
}

export interface DuelAnswer {
  roundIndex: number;
  optionIndex: number;
  answeredAt: string;
  responseMs: number;
}

export interface DuelRoundResult {
  roundIndex: number;
  category: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  myOptionIndex: number | null;
  opponentOptionIndex: number | null;
  myResponseMs: number;
  opponentResponseMs: number;
}

export interface DuelSnapshot extends DuelSummary {
  roundCount: 7;
  roundDurationSeconds: 20;
  currentRoundIndex: number | null;
  currentQuestion: DuelQuestion | null;
  myAnswer: DuelAnswer | null;
  results: DuelRoundResult[] | null;
}

export interface DuelHeadToHead {
  opponentId: string;
  wins: number;
  losses: number;
  draws: number;
  total: number;
}

type JsonRecord = Record<string, unknown>;
const statuses: DuelStatus[] = ['pending', 'active', 'completed', 'forfeited', 'declined', 'cancelled', 'expired'];
const record = (value: unknown): JsonRecord | null => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const nullableText = (value: unknown): string | null => typeof value === 'string' ? value : null;
const integer = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
const nullableIndex = (value: unknown): number | null => typeof value === 'number' && Number.isInteger(value) ? value : null;
const options = (value: unknown): string[] => Array.isArray(value) ? value.filter((option): option is string => typeof option === 'string') : [];

/** Explicit allowlists keep future database-only fields out of client models. */
export function serializeDuelSummary(value: unknown): DuelSummary | null {
  const row = record(value);
  if (!row || !isUuid(text(row.id)) || !isUuid(text(row.inviter_id)) || !isUuid(text(row.invitee_id)) || !isUuid(text(row.opponent_id)) || !statuses.includes(row.status as DuelStatus)) return null;
  return {
    id: text(row.id), inviterId: text(row.inviter_id), inviteeId: text(row.invitee_id), opponentId: text(row.opponent_id),
    status: row.status as DuelStatus, createdAt: text(row.created_at), expiresAt: text(row.expires_at),
    startsAt: nullableText(row.starts_at), completedAt: nullableText(row.completed_at), winnerId: nullableText(row.winner_id),
    forfeitedBy: nullableText(row.forfeited_by), myScore: integer(row.my_score), opponentScore: integer(row.opponent_score),
    myResponseMs: integer(row.my_response_ms), opponentResponseMs: integer(row.opponent_response_ms), serverNow: text(row.server_now),
  };
}

export function serializeDuelSnapshot(value: unknown): DuelSnapshot | null {
  const summary = serializeDuelSummary(value);
  const row = record(value);
  if (!summary || !row) return null;
  const question = record(row.current_question);
  const answer = record(row.my_answer);
  const finished = summary.status === 'completed' || summary.status === 'forfeited';
  return {
    ...summary, roundCount: 7, roundDurationSeconds: 20,
    currentRoundIndex: nullableIndex(row.current_round_index),
    currentQuestion: summary.status === 'active' && question ? {
      roundIndex: integer(question.round_index), category: text(question.category), prompt: text(question.prompt),
      options: options(question.options), roundStartsAt: text(question.round_starts_at), roundEndsAt: text(question.round_ends_at),
    } : null,
    myAnswer: answer ? { roundIndex: integer(answer.round_index), optionIndex: integer(answer.option_index), answeredAt: text(answer.answered_at), responseMs: integer(answer.response_ms) } : null,
    results: finished && Array.isArray(row.results) ? row.results.flatMap((value) => {
      const result = record(value);
      return result ? [{
        roundIndex: integer(result.round_index), category: text(result.category), prompt: text(result.prompt),
        options: options(result.options), correctIndex: integer(result.correct_index), explanation: text(result.explanation),
        myOptionIndex: nullableIndex(result.my_option_index), opponentOptionIndex: nullableIndex(result.opponent_option_index),
        myResponseMs: integer(result.my_response_ms), opponentResponseMs: integer(result.opponent_response_ms),
      }] : [];
    }) : null,
  };
}

export function serializeDuelHeadToHead(value: unknown): DuelHeadToHead | null {
  const row = record(value);
  if (!row || !isUuid(text(row.opponent_id))) return null;
  return { opponentId: text(row.opponent_id), wins: integer(row.wins), losses: integer(row.losses), draws: integer(row.draws), total: integer(row.total) };
}
