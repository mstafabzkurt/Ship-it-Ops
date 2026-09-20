import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  normalizeQuestionId,
  serializeArchivedQuestion,
  serializeQuestionFavorite,
  serializeQuestionShare,
} from '../src/utils/questionSocial';

const root = process.cwd();
const migration = readFileSync(resolve(root, 'supabase/migrations/20260917190000_create_question_favorites_and_shares.sql'), 'utf8');
const service = readFileSync(resolve(root, 'src/services/questionSocial.ts'), 'utf8');
const gameScreen = readFileSync(resolve(root, 'app/(tabs)/game.tsx'), 'utf8');
const detailScreen = readFileSync(resolve(root, 'app/question-detail/[questionId].tsx'), 'utf8');
const conversationScreen = readFileSync(resolve(root, 'app/messages/[userId].tsx'), 'utf8');
const sharedScreen = readFileSync(resolve(root, 'app/shared-questions.tsx'), 'utf8');
const favoriteScreen = readFileSync(resolve(root, 'app/favorite-questions.tsx'), 'utf8');
const detailSurface = readFileSync(resolve(root, 'src/components/questions/QuestionDetailSurface.tsx'), 'utf8');
const profileScreen = readFileSync(resolve(root, 'app/(tabs)/profile.tsx'), 'utf8');
const rootLayout = readFileSync(resolve(root, 'app/_layout.tsx'), 'utf8');

const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const shareId = '00000000-0000-4000-8000-000000000010';

assert.equal(normalizeQuestionId('web_programming_1_01'), 'web_programming_1_01');
assert.equal(normalizeQuestionId('Web_Programming-1_01'), 'Web_Programming-1_01', 'Text IDs must retain their case and punctuation');
assert.equal(normalizeQuestionId(42), '42');
assert.equal(normalizeQuestionId(undefined), null);
assert.equal(normalizeQuestionId('../private'), null);
assert.deepEqual(serializeQuestionFavorite({ question_id: 'question_1', created_at: '2026-09-17T12:00:00.000Z' }), {
  questionId: 'question_1',
  createdAt: '2026-09-17T12:00:00.000Z',
});
const serializedShare = serializeQuestionShare({
  id: shareId,
  sender_id: userA,
  recipient_id: userB,
  question_id: 'question_1',
  created_at: '2026-09-17T12:00:00.000Z',
  opened_at: null,
  message: 'private free text',
} as never);
assert(serializedShare);
assert.deepEqual(Object.keys(serializedShare).sort(), ['createdAt', 'id', 'openedAt', 'questionId', 'recipientId', 'senderId'].sort(), 'Share serializers must ignore arbitrary/private columns');
const archived = serializeArchivedQuestion({
  id: 'question_1',
  category_id: 'web_programming',
  difficulty_star: 2,
  tag: 'HTTP',
  title: 'Which response is safe?',
  optimal_text: 'A',
  acceptable_text: 'B',
  wrong_text: 'C',
  fatal_text: 'D',
});
assert(archived && archived.answerOptions.length === 4 && new Set(archived.answerOptions).size === 4);
assert.equal(archived.id, 'question_1');
assert.deepEqual(serializeArchivedQuestion({
  id: 'question_1', category_id: 'web_programming', difficulty_star: 2, tag: 'HTTP',
  title: 'Which response is safe?', optimal_text: 'A', acceptable_text: 'B', wrong_text: 'C', fatal_text: 'D',
})?.answerOptions, archived.answerOptions, 'Answer order must be deterministic');
assert.deepEqual(Object.keys(archived).sort(), ['id', 'categoryId', 'categoryName', 'difficultyStar', 'tag', 'title', 'answerOptions'].sort(), 'Archive data must not expose the answer key');

// Favorites: owner-only references with duplicate prevention and owner delete.
assert.match(migration, /create table public\.question_favorites[\s\S]*user_id uuid not null references auth\.users\(id\)[\s\S]*question_id text not null references public\.game_incidents\(id\)/);
assert.match(migration, /primary key \(user_id, question_id\)/, 'One favorite per account/question must be enforced');
assert.match(migration, /alter table public\.question_favorites enable row level security/);
assert.equal((migration.match(/\(select auth\.uid\(\)\) = user_id/g) ?? []).length, 3, 'Read, add, and remove policies must all be owner-scoped');
assert.match(service, /\.upsert\([\s\S]*?user_id: currentUserId, question_id: normalizedQuestionId[\s\S]*?onConflict: 'user_id,question_id', ignoreDuplicates: true/, 'Duplicate favorite attempts must be idempotent');
assert.match(service, /\.from\('question_favorites'\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\('user_id', currentUserId\)[\s\S]*?\.eq\('question_id', normalizedQuestionId\)/, 'Owners must be able to unfavorite');

// Shares: server-derived sender, accepted friendship, real question, safe reads.
assert.match(migration, /create table public\.question_shares/);
assert.match(migration, /constraint question_shares_distinct_users check \(sender_id <> recipient_id\)/);
assert.match(migration, /caller_id uuid := \(select auth\.uid\(\)\)/);
assert.doesNotMatch(migration, /share_question_with_friend\([^)]*sender_id/, 'The client must never provide a sender ID');
assert.match(migration, /target_user_id is null or target_user_id = caller_id/, 'Self shares must be rejected');
assert.match(migration, /from public\.game_incidents as incident[\s\S]*incident\.id = normalized_question_id/, 'The shared question must exist');
assert.match(migration, /from public\.friend_relationships as relationship[\s\S]*relationship\.pair_low_id = least\(caller_id, target_user_id\)[\s\S]*relationship\.pair_high_id = greatest\(caller_id, target_user_id\)[\s\S]*relationship\.status = 'accepted'/, 'Only accepted canonical friendships may receive shares');
assert.doesNotMatch(migration, /relationship\.status in \('pending'|'rejected'/, 'Pending and rejected relationships must not authorize sharing');
assert.match(migration, /values \(caller_id, target_user_id, normalized_question_id\)/, 'Sender identity must come from auth.uid()');
assert.match(migration, /Recipients can read received question shares[\s\S]*auth\.uid\(\)\) = recipient_id/, 'Only recipients may read inbox shares');
assert.doesNotMatch(migration, /auth\.uid\(\)\) = sender_id/, 'Opened state must not become a sender-visible read receipt');
assert.doesNotMatch(migration, /grant (insert|update|delete).*question_shares.*authenticated/i, 'Share mutations must remain RPC-only');
assert.match(migration, /share\.recipient_id = caller_id/, 'Only the recipient may mark a share opened');
assert.match(migration, /now\(\) - interval '5 minutes'/, 'Rapid duplicate shares must be idempotent');

const favoriteColumns = migration.match(/create table public\.question_favorites \(([\s\S]*?)\);/)?.[1] ?? '';
const shareColumns = migration.match(/create table public\.question_shares \(([\s\S]*?)\);/)?.[1] ?? '';
for (const columns of [favoriteColumns, shareColumns]) {
  assert.doesNotMatch(columns, /title|question_text|optimal_text|message|content/, 'Favorite/share records must not duplicate question or message content');
}

// Batching, routes, archive safety, and in-game control placement.
assert.match(service, /fetchQuestionsById[\s\S]*\.in\('id', uniqueIds\)/, 'Question records must be batched');
assert.match(service, /fetchArchivedQuestion\(questionId: unknown\)[\s\S]*normalizeQuestionId\(questionId\)[\s\S]*\.from\('game_incidents'\)[\s\S]*\.eq\('id', normalizedQuestionId\)[\s\S]*\.maybeSingle\(\)/, 'Detail must look up the original text ID from game_incidents');
assert.match(detailScreen, /fetchArchivedQuestion\(questionId\)[\s\S]*setQuestion\(loadedQuestion\);[\s\S]*setStatus\(loadedQuestion \? 'ready' : 'missing'\)/, 'Question lookup alone must decide whether detail is ready or missing');
assert.match(detailScreen, /fetchArchivedQuestion\(questionId\)[\s\S]*\.catch\(\(\) => \{[\s\S]*setStatus\('error'\)/, 'Question query errors must show the safe error state');
assert.match(detailScreen, /getQuestionFavoriteState\(user\.id, questionId\)[\s\S]*\.catch\(\(\) => undefined\)/, 'Favorite query errors must not hide the question');
assert.doesNotMatch(detailScreen, /Promise\.all(?:Settled)?\(/, 'Question loading must not wait for favorite state');
assert.match(detailScreen, /favoritePending=\{favoritePending \|\| favoriteLoading\}/, 'Favorite action must wait until its initial state is known');
assert.doesNotMatch(detailScreen, /\.from\('game_incidents'\)/, 'Detail must use the shared question service instead of a second loader');
for (const screen of [conversationScreen, sharedScreen, favoriteScreen]) {
  assert.match(screen, /pathname: '\/question-detail\/\[questionId\]',\s*params: \{ questionId: /, 'Every archive entry point must pass the questionId route parameter');
}
assert.match(conversationScreen, /questionId: item\.message\.questionId/, 'DM navigation must use the message question reference');
assert.match(sharedScreen, /questionId: entry\.question\.id/, 'Inbox navigation must use the loaded question ID');
assert.match(favoriteScreen, /questionId: item\.question\.id/, 'Favorite navigation must use the loaded question ID');
assert.match(service, /fetchPublicProfilesById[\s\S]*\.in\('user_id', uniqueIds\)/, 'Sender profiles must be batched');
assert.match(service, /supabase\.rpc\('share_question_with_friend'/);
assert.match(service, /supabase\.rpc\('mark_question_share_opened'/);
assert.match(gameScreen, /Soruyu favorilere ekle/);
assert.match(gameScreen, /Soruyu favorilerden çıkar/);
assert.match(gameScreen, /QuestionShareSheet/);
assert.match(gameScreen, /if \(!isAnswered\) stopTimer\(\)/, 'Opening the friend picker must pause an active question timer');
assert.match(gameScreen, /if \(!isAnswered && timeLeftRef\.current > 0\) startTimer\(false\)/, 'Closing the picker must resume without resetting the timer');
assert.doesNotMatch(detailScreen, /useReputation|commitGameSession|setSelectedChoice|question_answered/, 'Opening an archive detail must not mutate an active game session');
assert.match(detailSurface, /doğru cevabı işaretlemez/, 'Archive detail must explicitly avoid answer spoilers');
assert.match(profileScreen, /router\.push\('\/favorite-questions'\)/);
assert.match(profileScreen, /router\.push\('\/shared-questions'\)/);
for (const route of ['favorite-questions', 'shared-questions', 'question-detail/[questionId]']) {
  assert.equal(rootLayout.includes(`<Stack.Screen name="${route}" />`), true, `Missing protected route: ${route}`);
}

console.log('Question favorite, sharing, inbox, security, and archive invariants passed.');
