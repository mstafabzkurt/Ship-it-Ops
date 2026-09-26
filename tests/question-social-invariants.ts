import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  normalizeQuestionId,
  mergeReceivedQuestionDeliveries,
  serializeArchivedQuestion,
  serializeQuestionFavorite,
  serializeQuestionShare,
  serializeSharedQuestionPreview,
} from '../src/utils/questionSocial';

const root = process.cwd();
const migration = readFileSync(resolve(root, 'supabase/migrations/20260917190000_create_question_favorites_and_shares.sql'), 'utf8');
const blockFixMigration = readFileSync(
  resolve(root, 'supabase/migrations/20260926130000_prevent_blocked_question_shares.sql'),
  'utf8',
);
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
const deliveries = mergeReceivedQuestionDeliveries(
  [serializedShare, { ...serializedShare, id: '00000000-0000-4000-8000-000000000011', createdAt: '2026-09-17T12:05:00.000Z' }],
  [{ ...serializedShare, id: '00000000-0000-4000-8000-000000000012' }, { ...serializedShare, id: '00000000-0000-4000-8000-000000000013', createdAt: '2026-09-17T12:10:00.000Z' }],
);
assert.deepEqual(deliveries.map(({ source, share }) => `${source}:${share.id}`), [
  'direct_message:00000000-0000-4000-8000-000000000013',
  'legacy:00000000-0000-4000-8000-000000000011',
  'direct_message:00000000-0000-4000-8000-000000000012',
], 'Only exact-timestamp cross-source duplicates are removed; separate deliveries remain newest first');
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
assert.deepEqual(serializeSharedQuestionPreview({ id: 'legacy_question', title: 'Legacy question', category_id: null, difficulty_star: null, optimal_text: 'A', acceptable_text: 'B', wrong_text: 'C', fatal_text: 'D' }), {
  id: 'legacy_question', title: 'Legacy question',
}, 'Optional category metadata must not suppress primary shared question content');
assert.equal(serializeSharedQuestionPreview({ id: 'missing_question', title: null }), null, 'Missing primary content cannot render as a question');
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

// The effective standalone-share RPC preserves its contract and rejects a
// block in either direction without exposing which participant created it.
assert.match(blockFixMigration, /create or replace function public\.share_question_with_friend\(\s*target_user_id uuid,\s*shared_question_id text\s*\)/);
assert.match(blockFixMigration, /returns table \(\s*id uuid,\s*sender_id uuid,\s*recipient_id uuid,\s*question_id text,\s*created_at timestamptz,\s*opened_at timestamptz\s*\)/);
assert.match(blockFixMigration, /security definer\s+set search_path = ''/);
assert.match(blockFixMigration, /caller_id uuid := \(select auth\.uid\(\)\)/, 'Sender identity must still come from auth.uid()');
assert.doesNotMatch(blockFixMigration, /share_question_with_friend\([^)]*sender_id/, 'The replacement RPC must not accept a caller-supplied sender');
assert.match(blockFixMigration, /target_user_id is null or target_user_id = caller_id/, 'The replacement RPC must reject self-sharing');
assert.match(blockFixMigration, /from public\.game_incidents as incident[\s\S]*incident\.id = normalized_question_id/, 'The replacement RPC must require a real question');
assert.match(blockFixMigration, /from public\.friend_relationships as relationship[\s\S]*relationship\.pair_low_id = least\(caller_id, target_user_id\)[\s\S]*relationship\.pair_high_id = greatest\(caller_id, target_user_id\)[\s\S]*relationship\.status = 'accepted'/, 'Non-friends must remain ineligible');
assert.match(
  blockFixMigration,
  /from public\.user_blocks as block\s+where \(block\.blocker_id = caller_id and block\.blocked_user_id = target_user_id\)\s+or \(block\.blocker_id = target_user_id and block\.blocked_user_id = caller_id\)/,
  'Either sender-to-recipient or recipient-to-sender blocks must reject standalone sharing',
);
assert.match(
  blockFixMigration,
  /raise exception using errcode = '42501', message = 'Question sharing is not available for this user pair\.'/,
  'Blocked sharing must use a neutral error that does not identify the blocker',
);
assert(
  blockFixMigration.indexOf('from public.user_blocks as block')
    < blockFixMigration.indexOf("now() - interval '5 minutes'"),
  'The block check must run before five-minute duplicate reuse',
);
assert.match(blockFixMigration, /values \(caller_id, target_user_id, normalized_question_id\)/, 'The replacement must insert auth.uid() as sender');
assert.match(blockFixMigration, /now\(\) - interval '5 minutes'/, 'The replacement must preserve duplicate suppression');
assert.match(blockFixMigration, /revoke all on function public\.share_question_with_friend\(uuid, text\)[\s\S]*from public, anon, authenticated;[\s\S]*grant execute on function public\.share_question_with_friend\(uuid, text\) to authenticated;/, 'The replacement RPC must remain authenticated-only');

const canShareStandaloneQuestion = (
  friendshipStatus: 'pending' | 'accepted' | 'rejected',
  senderBlocksRecipient: boolean,
  recipientBlocksSender: boolean,
) => friendshipStatus === 'accepted' && !senderBlocksRecipient && !recipientBlocksSender;
assert(canShareStandaloneQuestion('accepted', false, false), 'Accepted friends without a block can share');
assert(!canShareStandaloneQuestion('accepted', true, false), 'A sender block rejects the share');
assert(!canShareStandaloneQuestion('accepted', false, true), 'A recipient block rejects the share');
assert(canShareStandaloneQuestion('accepted', false, false), 'Removing the block restores sharing while friendship remains accepted');
assert(!canShareStandaloneQuestion('pending', false, false), 'Non-friends remain rejected');

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
assert.match(sharedScreen, /entry\.source === 'legacy' && !entry\.share\.openedAt/, 'Only legacy shares may update opened state');
assert.match(sharedScreen, /item\.source === 'legacy' && !item\.share\.openedAt/, 'DM shares must not invent an unread indicator');
assert.match(sharedScreen, /keyExtractor=\{\(entry\) => `\$\{entry\.source\}:\$\{entry\.share\.id\}`\}/, 'Source-qualified IDs must remain stable list keys');
assert.match(sharedScreen, /status === 'error'[\s\S]*<InboxState status=\{status\} onRetry=\{loadShares\}/, 'Load failures must offer retry rather than the empty state');
assert.match(sharedScreen, /'answerOptions' in item\.question[\s\S]*item\.question\.title/, 'Shares without optional archive metadata must still render their title');
assert.match(favoriteScreen, /questionId: item\.question\.id/, 'Favorite navigation must use the loaded question ID');
assert.match(service, /fetchPublicProfilesById[\s\S]*\.in\('user_id', uniqueIds\)/, 'Sender profiles must be batched');
assert.match(service, /rpc\('list_direct_conversations'\)[\s\S]*rpc\('list_direct_messages'/, 'Inbox must use participant-scoped messaging RPCs');
assert.doesNotMatch(service, /\.from\('direct_messages'\)/, 'Inbox must not add a broad direct message table read');
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
