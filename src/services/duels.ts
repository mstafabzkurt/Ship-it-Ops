import { supabase } from '../supabase';
import { isUuid } from '../utils/friends';
import { serializeDuelHeadToHead, serializeDuelSnapshot, serializeDuelSummary, type DuelHeadToHead, type DuelSnapshot, type DuelSummary } from '../utils/duels';

export type { DuelAnswer, DuelHeadToHead, DuelQuestion, DuelRoundResult, DuelSnapshot, DuelStatus, DuelSummary } from '../utils/duels';

export class DuelServiceError extends Error {
  readonly code: string;
  constructor(message = 'Düello işlemi tamamlanamadı. Tekrar dene.', code = 'unknown') {
    super(message);
    this.name = 'DuelServiceError';
    this.code = code;
  }
}

function requireId(value: string): void {
  if (!isUuid(value)) throw new DuelServiceError('Geçerli bir düello veya arkadaş seç.', 'invalid_input');
}

async function rpc(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await supabase.rpc(name, args).abortSignal(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
  const { data, error } = response;
  if (error) {
    if (controller.signal.aborted) throw new DuelServiceError('Bağlantı gecikti. Maç durumunu yenileyip tekrar dene.', 'timeout');
    if (error.code === 'PGRST202') throw new DuelServiceError('1v1 Kapışma henüz kullanıma açılmadı. Lütfen daha sonra tekrar dene.', 'unavailable');
    const messages: Record<string, string> = {
      duel_not_found: 'Bu düelloya ulaşılamıyor.',
      duel_blocked: 'Bu arkadaşla düello yapılamıyor.',
      duel_friend_required: 'Düello için arkadaşlık isteği kabul edilmiş olmalı.',
      duel_rate_limit: 'Çok fazla düello daveti gönderdin. Biraz sonra tekrar dene.',
      duel_busy: 'Oyunculardan biri başka bir düelloda. Sonra tekrar dene.',
      duel_round_closed: 'Bu sorunun süresi doldu. Sıradaki soruyu bekle.',
      duel_not_pending: 'Bu davet artık beklemiyor.',
      duel_question_pool_unavailable: 'Düello soruları henüz hazır değil.',
      duel_answer_locked: 'Yanıtın zaten kilitlendi. Maç durumunu yenileyebilirsin.',
      duel_not_active: 'Bu maç şu anda devam etmiyor. Maç durumunu yenileyebilirsin.',
    };
    throw new DuelServiceError(messages[error.message] ?? 'Düello işlemi tamamlanamadı. Tekrar dene.', error.message);
  }
  return data;
}

async function snapshotRpc(name: string, args: Record<string, unknown>): Promise<DuelSnapshot> {
  const snapshot = serializeDuelSnapshot(await rpc(name, args));
  if (!snapshot) throw new DuelServiceError();
  return snapshot;
}

export function createDuel(opponentId: string): Promise<DuelSnapshot> {
  requireId(opponentId);
  return snapshotRpc('create_friend_duel', { opponent_id: opponentId });
}

export async function listDuels(): Promise<DuelSummary[]> {
  const data = await rpc('list_friend_duels');
  if (!Array.isArray(data)) throw new DuelServiceError();
  return data.map(serializeDuelSummary).filter((duel): duel is DuelSummary => duel !== null);
}

export function getDuel(matchId: string): Promise<DuelSnapshot> {
  requireId(matchId);
  return snapshotRpc('get_friend_duel', { match_id: matchId });
}

function respondDuel(matchId: string, action: 'accept' | 'decline' | 'cancel'): Promise<DuelSnapshot> {
  requireId(matchId);
  return snapshotRpc('respond_friend_duel', { match_id: matchId, response_action: action });
}

export const acceptDuel = (matchId: string): Promise<DuelSnapshot> => respondDuel(matchId, 'accept');
export const declineDuel = (matchId: string): Promise<DuelSnapshot> => respondDuel(matchId, 'decline');
export const cancelDuel = (matchId: string): Promise<DuelSnapshot> => respondDuel(matchId, 'cancel');

export function submitDuelAnswer(matchId: string, roundIndex: number, optionIndex: number): Promise<DuelSnapshot> {
  requireId(matchId);
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex > 6 || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) throw new DuelServiceError('Geçerli bir cevap seç.', 'invalid_input');
  return snapshotRpc('answer_friend_duel', { match_id: matchId, round_index: roundIndex, option_index: optionIndex });
}

export function forfeitDuel(matchId: string): Promise<DuelSnapshot> {
  requireId(matchId);
  return snapshotRpc('forfeit_friend_duel', { match_id: matchId });
}

export async function getDuelHeadToHead(opponentId: string): Promise<DuelHeadToHead> {
  requireId(opponentId);
  const stats = serializeDuelHeadToHead(await rpc('get_friend_duel_head_to_head', { opponent_id: opponentId }));
  if (!stats) throw new DuelServiceError();
  return stats;
}
