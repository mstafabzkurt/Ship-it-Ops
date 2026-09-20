// Run through the real service with a small in-memory Supabase boundary.
const assert = require('node:assert/strict');

const viewer = '00000000-0000-4000-8000-000000000001';
const sender = '00000000-0000-4000-8000-000000000002';
const other = '00000000-0000-4000-8000-000000000003';
const questionId = 'Web_Programming-1_01';
const questionRows = new Map([[questionId, {
  id: questionId, category_id: 'web_programming', difficulty_star: 2, tag: 'HTTP',
  title: 'Which response is safe?', optimal_text: 'A', acceptable_text: 'B', wrong_text: 'C', fatal_text: 'D',
}]]);
const favoriteRows = [];
const shareRows = [
  { id: '00000000-0000-4000-8000-000000000010', sender_id: sender, recipient_id: viewer, question_id: questionId, created_at: '2026-09-20T10:00:00Z', opened_at: null },
  { id: '00000000-0000-4000-8000-000000000011', sender_id: sender, recipient_id: viewer, question_id: 'missing_question', created_at: '2026-09-20T09:00:00Z', opened_at: null },
  { id: '00000000-0000-4000-8000-000000000012', sender_id: viewer, recipient_id: other, question_id: questionId, created_at: '2026-09-20T08:00:00Z', opened_at: null },
  { id: '00000000-0000-4000-8000-000000000013', sender_id: other, recipient_id: viewer, question_id: questionId, created_at: '2026-09-20T07:00:00Z', opened_at: null },
];
const profiles = new Map();
const faults = { write: false, silentWrite: false, favoriteRead: false, questionRead: false, senderRead: false };

class Query {
  constructor(table) { this.table = table; this.operation = 'select'; this.filters = []; }
  select() { return this; }
  eq(column, value) { this.filters.push((row) => row[column] === value); return this; }
  in(column, values) { this.filters.push((row) => values.includes(row[column])); return this; }
  order(column, options) { this.orderBy = { column, ascending: options.ascending }; return this; }
  upsert(row) { this.operation = 'upsert'; this.row = row; return this; }
  delete() { this.operation = 'delete'; return this; }
  maybeSingle() { return Promise.resolve(this.execute(true)); }
  then(resolve, reject) { return Promise.resolve(this.execute(false)).then(resolve, reject); }
  execute(single) {
    if (this.table === 'question_favorites' && this.operation === 'upsert') {
      if (faults.write) return { data: null, error: { message: 'write failed' } };
      if (!faults.silentWrite && !favoriteRows.some((row) => row.user_id === this.row.user_id && row.question_id === this.row.question_id)) {
        favoriteRows.push({ ...this.row, created_at: '2026-09-20T10:00:00Z' });
      }
      return { data: null, error: null };
    }
    if (this.table === 'question_favorites' && this.operation === 'delete') {
      if (faults.write) return { data: null, error: { message: 'delete failed' } };
      for (let index = favoriteRows.length - 1; index >= 0; index -= 1) {
        if (this.filters.every((filter) => filter(favoriteRows[index]))) favoriteRows.splice(index, 1);
      }
      return { data: null, error: null };
    }
    if (this.table === 'question_favorites' && faults.favoriteRead) return { data: null, error: { message: 'read failed' } };
    if (this.table === 'game_incidents' && faults.questionRead) return { data: null, error: { message: 'question read failed' } };
    if (this.table === 'public_profiles' && faults.senderRead) return { data: null, error: { message: 'profile read failed' } };
    const rows = this.table === 'question_favorites' ? favoriteRows
      : this.table === 'question_shares' ? shareRows
        : this.table === 'game_incidents' ? [...questionRows.values()]
          : this.table === 'public_profiles' ? [...profiles.values()] : [];
    let data = rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.orderBy) data = data.sort((a, b) => this.orderBy.ascending
      ? String(a[this.orderBy.column]).localeCompare(String(b[this.orderBy.column]))
      : String(b[this.orderBy.column]).localeCompare(String(a[this.orderBy.column])));
    return { data: single ? data[0] ?? null : data, error: null };
  }
}

const supabasePath = require.resolve('../src/supabase.ts');
require.cache[supabasePath] = { id: supabasePath, filename: supabasePath, loaded: true, exports: { supabase: { from: (table) => new Query(table) } } };
const {
  getQuestionFavoriteState, setQuestionFavorite, listFavoriteQuestions,
  listReceivedQuestionShares, fetchSharedQuestionSenderProfiles,
} = require('../src/services/questionSocial.ts');

(async () => {
  assert.equal(await setQuestionFavorite(viewer, questionId, true), true, 'Gameplay favorite must be confirmed by readback');
  assert.equal(await getQuestionFavoriteState(viewer, questionId), true, 'Favorite must survive a fresh lookup');
  assert.equal((await listFavoriteQuestions(viewer))[0].question.id, questionId, 'Saved text ID must resolve to game_incidents');
  assert.equal((await listFavoriteQuestions(other)).length, 0, 'Favorites must be owner scoped');
  assert.equal(await setQuestionFavorite(viewer, questionId, false), false, 'Unfavorite must confirm deletion');
  assert.equal((await listFavoriteQuestions(viewer)).length, 0, 'Unfavorite must disappear after refetch');

  faults.write = true;
  await assert.rejects(setQuestionFavorite(viewer, questionId, true), /Soru işlemi tamamlanamadı/);
  faults.write = false;
  assert.equal((await listFavoriteQuestions(viewer)).length, 0, 'Failed write must leave persisted state unchanged');
  faults.silentWrite = true;
  await assert.rejects(setQuestionFavorite(viewer, questionId, true), /Soru işlemi tamamlanamadı/, 'A silent no-op must not report success');
  faults.silentWrite = false;

  await setQuestionFavorite(viewer, questionId, true);
  favoriteRows.push({ user_id: viewer, question_id: 'missing_question', created_at: '2026-09-20T09:00:00Z' });
  assert.equal((await listFavoriteQuestions(viewer)).length, 1, 'One missing question must not hide the remaining favorite');
  faults.favoriteRead = true;
  await assert.rejects(listFavoriteQuestions(viewer), /Soru arşivine/);
  faults.favoriteRead = false;
  faults.questionRead = true;
  await assert.rejects(listFavoriteQuestions(viewer), /Soru arşivine/, 'Failed question lookup must not become an empty state');
  faults.questionRead = false;

  const inbox = await listReceivedQuestionShares(viewer);
  assert.equal(inbox.length, 2, 'Recipient shares must resolve to questions while missing questions are skipped');
  assert.equal(inbox[0].question.id, questionId);
  assert.equal(inbox[0].sender, null, 'Question content must arrive without sender enrichment');
  assert.equal((await listReceivedQuestionShares(other)).length, 1);
  assert.equal((await listReceivedQuestionShares(sender)).length, 0, 'Sender must not read a recipient inbox');
  faults.senderRead = true;
  await assert.rejects(fetchSharedQuestionSenderProfiles(inbox), /Soru arşivine/);
  assert.equal(inbox[0].question.id, questionId, 'Sender lookup failure must not remove primary content');
  faults.senderRead = false;
  assert.equal((await fetchSharedQuestionSenderProfiles(inbox)).size, 0, 'Missing public profile must leave the question visible');
  profiles.set(sender, { user_id: sender, company_name: 'Sender Inc.', career_rank: 'Operator' });
  const senders = await fetchSharedQuestionSenderProfiles(inbox);
  assert.equal(senders.get(sender)?.companyName, 'Sender Inc.');
  assert.equal(senders.has(other), false, 'One missing sender profile must not discard a valid question');

  await assert.rejects(listFavoriteQuestions('invalid-user'), /Soru arşivine/, 'Invalid auth must not look like an empty archive');
  await assert.rejects(listReceivedQuestionShares('invalid-user'), /Soru arşivine/, 'Invalid auth must not look like an empty inbox');
  console.log('Question favorite persistence and shared inbox service invariants passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
