import assert from 'node:assert/strict';
import { serializeDuelHeadToHead, serializeDuelSnapshot, serializeDuelSummary } from '../src/utils/duels';

const first = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
const row = {
  id: '00000000-0000-4000-8000-000000000010', inviter_id: first, invitee_id: second, opponent_id: second,
  status: 'active', created_at: '2026-10-02T12:00:00Z', expires_at: '2026-10-02T12:10:00Z',
  starts_at: '2026-10-02T12:00:05Z', completed_at: null, winner_id: null, forfeited_by: null,
  server_now: '2026-10-02T12:00:10Z', my_score: 0, opponent_score: 0, my_response_ms: 0, opponent_response_ms: 0,
  current_round_index: 0, current_question: {
    round_index: 0, category: 'testing', prompt: 'Question', options: ['A', 'B', 'C', 'D'],
    round_starts_at: '2026-10-02T12:00:05Z', round_ends_at: '2026-10-02T12:00:25Z',
    correct_index: 2, explanation: 'SECRET', question_key: 'private-key',
  },
  my_answer: { round_index: 0, option_index: 1, answered_at: '2026-10-02T12:00:10Z', response_ms: 5000, correct: false },
  results: [{ round_index: 0, correct_index: 2, explanation: 'SECRET' }],
  rounds: [{ correct_index: 2 }], email: 'private@example.test',
};

const snapshot = serializeDuelSnapshot(row);
assert(snapshot);
assert.equal(snapshot.serverNow, row.server_now);
assert.equal(snapshot.startsAt, row.starts_at);
assert.equal(snapshot.results, null, 'Active clients must never deserialize answer keys into results');
assert.equal(snapshot.currentQuestion?.roundIndex, 0);
assert.equal(snapshot.myAnswer?.responseMs, 5000);
assert(!JSON.stringify(snapshot).includes('SECRET'), 'Question serializers must allowlist display-only fields');
assert(!JSON.stringify(snapshot).includes('correct_index'));
assert(!JSON.stringify(snapshot).includes('private-key'));
assert(!JSON.stringify(snapshot).includes('private@example.test'));
assert.equal(serializeDuelSummary({ ...row, status: 'unknown' }), null);
assert.equal(serializeDuelSummary({ ...row, opponent_id: 'invalid' }), null);
assert.equal(serializeDuelSnapshot(null), null);

const result = {
  round_index: 0, category: 'testing', prompt: 'Question', options: ['A', 'B', 'C', 'D'], correct_index: 2,
  explanation: 'Explanation', my_option_index: 2, opponent_option_index: null, my_response_ms: 5000, opponent_response_ms: 20000,
};
for (const status of ['completed', 'forfeited']) {
  const finished = serializeDuelSnapshot({ ...row, status, my_score: 1, winner_id: first, results: [result] });
  assert.equal(finished?.currentQuestion, null);
  assert.equal(finished?.results?.[0].correctIndex, 2);
  assert.equal(finished?.results?.[0].myOptionIndex, 2);
  assert.equal(finished?.results?.[0].opponentOptionIndex, null, 'Missing answers must preserve null rather than become option zero');
}
assert.deepEqual(serializeDuelHeadToHead({ opponent_id: second, wins: 4, losses: 2, draws: 1, total: 7, matches: row }), {
  opponentId: second, wins: 4, losses: 2, draws: 1, total: 7,
});
const resolved = { ...result, resolved_at: '2026-10-02T12:00:09Z', my_points: 96, opponent_points: 0, my_speed_bonus: 16, my_first_bonus: 10 };
const reveal = serializeDuelSnapshot({ ...row, scoring_version: 2, phase: 'reveal', current_question: null, opponent_answered: true, reveal_ends_at: '2026-10-02T12:00:12Z', results: [resolved, { ...resolved, round_index: 1 }] });
assert.equal(reveal?.phase, 'reveal');
assert.equal(reveal?.roundResult?.myPoints, 96);
assert.equal(reveal?.roundResult?.myFirstBonus, 10);
assert.equal(reveal?.opponentAnswered, true);
assert.equal(reveal?.results?.length, 1, 'Future rounds cannot be hydrated during reveal');
const unresolved = serializeDuelSnapshot({ ...row, scoring_version: 2, phase: 'question', results: [resolved] });
assert.deepEqual(unresolved?.results, [], 'Current question answer keys stay hidden until reveal');
assert.equal(unresolved?.roundResult, null);
assert.equal(unresolved?.revealEndsAt, null);
console.log('Duel model privacy and round/result semantics passed.');
